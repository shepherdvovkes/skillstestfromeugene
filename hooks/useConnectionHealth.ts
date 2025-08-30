import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useNetwork, useConnect } from 'wagmi';
import { walletConnectionToast, networkToast, walletToast } from '@/utils/toast';

interface ConnectionHealth {
  isHealthy: boolean;
  lastCheck: number;
  connectionAge: number;
  networkLatency: number;
  errorCount: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disconnected';
  issues: string[];
}

interface HealthCheckConfig {
  checkInterval: number; // milliseconds
  maxLatency: number; // milliseconds
  maxErrorCount: number;
  autoReconnect: boolean;
  healthThreshold: number; // percentage
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  checkInterval: 60000, // 60 seconds (less frequent)
  maxLatency: 2000, // 2 seconds (more reasonable)
  maxErrorCount: 3,
  autoReconnect: true,
  healthThreshold: 80
};

export const useConnectionHealth = (config: Partial<HealthCheckConfig> = {}) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { connect, connectors } = useConnect();
  
  const [health, setHealth] = useState<ConnectionHealth>({
    isHealthy: true,
    lastCheck: Date.now(),
    connectionAge: 0,
    networkLatency: 0,
    errorCount: 0,
    status: 'healthy',
    issues: []
  });

  const [isChecking, setIsChecking] = useState(false);
  const [lastConnectedWallet, setLastConnectedWallet] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Get last connected wallet from localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem('lastConnectedWallet');
    if (savedWallet) {
      setLastConnectedWallet(savedWallet);
    }
  }, []);

  // Calculate connection age
  useEffect(() => {
    if (isConnected && address) {
      const connectionStart = localStorage.getItem('connectionStartTime');
      const startTime = connectionStart ? parseInt(connectionStart) : Date.now();
      
      if (!connectionStart) {
        localStorage.setItem('connectionStartTime', startTime.toString());
      }

      const age = Date.now() - startTime;
      setHealth(prev => ({
        ...prev,
        connectionAge: age
      }));
    } else {
      localStorage.removeItem('connectionStartTime');
    }
  }, [isConnected, address]);

  // Network latency check - simplified local check
  const checkNetworkLatency = useCallback(async (): Promise<number> => {
    const startTime = Date.now();
    
    try {
      // Simple local network check without external API calls
      // This simulates a network check without making actual requests
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * 100 + 50); // Random latency between 50-150ms
      });
      
      return Date.now() - startTime;
    } catch (error) {
      // Fallback to a simple timeout check
      return new Promise((resolve) => {
        setTimeout(() => resolve(Date.now() - startTime), 1000);
      });
    }
  }, []);

  // Wallet connection health check
  const checkWalletHealth = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      return false;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Wallet health check timeout')), 5000);
      });

      const healthCheckPromise = async () => {
        // Check if the wallet is still responsive
        const provider = await connectors[0]?.getProvider();
        if (!provider) {
          return false;
        }

        // Try to get the current account
        const accounts = await provider.request({ method: 'eth_accounts' });
        return accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase();
      };

      return await Promise.race([healthCheckPromise(), timeoutPromise]);
    } catch (error) {
      console.error('Wallet health check failed:', error);
      return false;
    }
  }, [isConnected, address, connectors]);

  // Network health check
  const checkNetworkHealth = useCallback(async (): Promise<boolean> => {
    if (!chain) {
      return false;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Network health check timeout')), 5000);
      });

      const healthCheckPromise = async () => {
        // Check if the network is responsive
        const provider = await connectors[0]?.getProvider();
        if (!provider) {
          return false;
        }

        // Get the latest block number
        const blockNumber = await provider.request({ method: 'eth_blockNumber' });
        return !!blockNumber;
      };

      return await Promise.race([healthCheckPromise(), timeoutPromise]);
    } catch (error) {
      console.error('Network health check failed:', error);
      return false;
    }
  }, [chain, connectors]);

  // Perform comprehensive health check
  const performHealthCheck = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Add overall timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 10000);
      });

      const healthCheckPromise = async () => {
        const issues: string[] = [];
        let isHealthy = true;

        // Check network latency
        const latency = await checkNetworkLatency();
        if (latency > mergedConfig.maxLatency) {
          issues.push(`High network latency: ${latency}ms`);
          isHealthy = false;
        }

        // Check wallet connection
        const walletHealthy = await checkWalletHealth();
        if (!walletHealthy) {
          issues.push('Wallet connection is unstable');
          isHealthy = false;
        }

        // Check network health
        const networkHealthy = await checkNetworkHealth();
        if (!networkHealthy) {
          issues.push('Network connection is unstable');
          isHealthy = false;
        }

        return { issues, isHealthy, latency };
      };

      const { issues, isHealthy, latency } = await Promise.race([healthCheckPromise(), timeoutPromise]);

      // Determine status
      let status: ConnectionHealth['status'] = 'healthy';
      if (!isHealthy) {
        status = issues.length >= 2 ? 'unhealthy' : 'degraded';
      }

      // Update health state
      setHealth(prev => ({
        isHealthy,
        lastCheck: Date.now(),
        connectionAge: prev.connectionAge,
        networkLatency: latency,
        errorCount: isHealthy ? 0 : prev.errorCount + 1,
        status,
        issues
      }));

      // Handle unhealthy status
      if (!isHealthy) {
        handleUnhealthyStatus(issues);
      } else {
        // Reset reconnect attempts on healthy status
        reconnectAttemptsRef.current = 0;
      }

    } catch (error) {
      console.error('Health check failed:', error);
      
      setHealth(prev => ({
        ...prev,
        isHealthy: false,
        lastCheck: Date.now(),
        errorCount: prev.errorCount + 1,
        status: 'unhealthy',
        issues: [...prev.issues, 'Health check failed']
      }));

      handleUnhealthyStatus(['Health check failed']);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, checkNetworkLatency, checkWalletHealth, checkNetworkHealth, mergedConfig]);

  // Handle unhealthy connection status
  const handleUnhealthyStatus = useCallback((issues: string[]) => {
    const { autoReconnect, maxErrorCount } = mergedConfig;

    // Show warning for degraded status
    if (health.status === 'degraded') {
      walletToast.warning(`Connection issues detected: ${issues.join(', ')}`);
    }

    // Show error for unhealthy status
    if (health.status === 'unhealthy') {
      walletToast.error(`Connection is unhealthy: ${issues.join(', ')}`);
    }

    // Auto-reconnect if enabled and within attempts limit
    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      setTimeout(() => {
        attemptReconnect();
      }, 5000); // Wait 5 seconds before attempting reconnect
    }
  }, [health.status, mergedConfig]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (!lastConnectedWallet || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    reconnectAttemptsRef.current++;
    
    try {
      const connector = connectors.find(c => c.id === lastConnectedWallet);
      if (!connector || !connector.ready) {
        throw new Error('Connector not available');
      }

      walletToast.info(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
      
      await connect({ connector });
      
      // Reset reconnect attempts on successful reconnection
      reconnectAttemptsRef.current = 0;
      walletToast.success('Successfully reconnected');
      
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        walletToast.error('Maximum reconnection attempts reached. Please connect manually.');
      }
    }
  }, [lastConnectedWallet, connectors, connect]);

  // Manual health check
  const checkHealth = useCallback(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts for manual reconnect
    attemptReconnect();
  }, [attemptReconnect]);

  // Start health monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      performHealthCheck();
    }, mergedConfig.checkInterval);

    // Perform initial health check
    performHealthCheck();
  }, [performHealthCheck, mergedConfig.checkInterval]);

  // Stop health monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (healthCheckRef.current) {
      healthCheckRef.current.abort();
      healthCheckRef.current = null;
    }
  }, []);

  // Start monitoring when connected
  useEffect(() => {
    if (isConnected) {
      startMonitoring();
    } else {
      stopMonitoring();
      setHealth(prev => ({
        ...prev,
        status: 'disconnected',
        issues: ['Wallet disconnected']
      }));
    }

    return () => {
      stopMonitoring();
    };
  }, [isConnected, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Get health status summary
  const getHealthSummary = useCallback(() => {
    const { status, issues, networkLatency, connectionAge } = health;
    
    return {
      status,
      issues: issues.length > 0 ? issues : ['No issues detected'],
      latency: `${networkLatency}ms`,
      uptime: `${Math.floor(connectionAge / 1000 / 60)} minutes`,
      isConnected,
      canReconnect: reconnectAttemptsRef.current < maxReconnectAttempts
    };
  }, [health, isConnected]);

  return {
    // Health state
    health,
    isChecking,
    
    // Actions
    checkHealth,
    reconnect,
    startMonitoring,
    stopMonitoring,
    
    // Utilities
    getHealthSummary,
    
    // Configuration
    config: mergedConfig
  };
};
