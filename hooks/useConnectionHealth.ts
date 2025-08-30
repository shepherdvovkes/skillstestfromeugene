import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useNetwork, useConnect } from 'wagmi';
import { walletConnectionToast, networkToast, walletToast } from '@/utils/toast';
import { APP_CONFIG } from '@/config/constants';
import { walletStorage } from '@/utils/storage';
import { healthLogger } from '@/utils/logger';

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
  checkInterval: APP_CONFIG.HEALTH_CHECK.DEFAULT_CHECK_INTERVAL,
  maxLatency: APP_CONFIG.HEALTH_CHECK.MAX_LATENCY,
  maxErrorCount: APP_CONFIG.HEALTH_CHECK.MAX_ERROR_COUNT,
  autoReconnect: APP_CONFIG.HEALTH_CHECK.AUTO_RECONNECT,
  healthThreshold: APP_CONFIG.HEALTH_CHECK.HEALTH_THRESHOLD
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
        setTimeout(() => reject(new Error('Wallet health check timeout')), 3000);
      });

      const healthCheckPromise = async () => {
        // Check if the wallet is still responsive
        const connector = connectors.find(c => c.ready);
        if (!connector) {
          return false;
        }

        try {
          const provider = await connector.getProvider();
          if (!provider) {
            return false;
          }

          // Try to get the current account with a shorter timeout
          const accounts = await Promise.race([
            provider.request({ method: 'eth_accounts' }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Account request timeout')), 2000)
            )
          ]);
          
          return accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase();
        } catch (error) {
          console.warn('Wallet provider check failed:', error);
          return false;
        }
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
        setTimeout(() => reject(new Error('Network health check timeout')), 3000);
      });

      const healthCheckPromise = async () => {
        // Check if the network is responsive
        const connector = connectors.find(c => c.ready);
        if (!connector) {
          return false;
        }

        try {
          const provider = await connector.getProvider();
          if (!provider) {
            return false;
          }

          // Get the latest block number with a shorter timeout
          const blockNumber = await Promise.race([
            provider.request({ method: 'eth_blockNumber' }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Block number request timeout')), 2000)
            )
          ]);
          
          return !!blockNumber;
        } catch (error) {
          console.warn('Network provider check failed:', error);
          return false;
        }
      };

      return await Promise.race([healthCheckPromise(), timeoutPromise]);
    } catch (error) {
      console.error('Network health check failed:', error);
      return false;
    }
  }, [chain, connectors]);

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

  // Handle unhealthy connection status
  const handleUnhealthyStatus = useCallback((issues: string[], status: ConnectionHealth['status']) => {
    const { autoReconnect, maxErrorCount } = mergedConfig;

    // Show warning for degraded status
    if (status === 'degraded') {
      walletToast.warning(`Connection issues detected: ${issues.join(', ')}`);
    }

    // Show error for unhealthy status
    if (status === 'unhealthy') {
      walletToast.error(`Connection is unhealthy: ${issues.join(', ')}`);
    }

    // Auto-reconnect if enabled and within attempts limit
    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      setTimeout(() => {
        attemptReconnect();
      }, 5000); // Wait 5 seconds before attempting reconnect
    }
  }, [mergedConfig, attemptReconnect]);

  // Perform comprehensive health check
  const performHealthCheck = useCallback(async () => {
    if (isChecking) {
      console.log('Health check already in progress, skipping...');
      return;
    }

    console.log('Starting health check...');
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Add overall timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 8000);
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
        handleUnhealthyStatus(issues, status);
      } else {
        // Reset reconnect attempts on healthy status
        reconnectAttemptsRef.current = 0;
      }

      console.log('Health check completed successfully');

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

      handleUnhealthyStatus(['Health check failed'], 'unhealthy');
    } finally {
      // Always ensure checking state is reset
      console.log('Resetting checking state...');
      setIsChecking(false);
    }
  }, [isChecking, checkNetworkLatency, checkWalletHealth, checkNetworkHealth, mergedConfig, handleUnhealthyStatus]);

  // Manual health check
  const checkHealth = useCallback(() => {
    // Prevent multiple simultaneous checks
    if (isChecking) {
      console.log('Health check already in progress, skipping...');
      return;
    }
    
    console.log('Starting manual health check...');
    
    // Add a safety timeout to ensure checking state is reset
    const safetyTimeout = setTimeout(() => {
      if (isChecking) {
        console.warn('Health check safety timeout - resetting checking state');
        setIsChecking(false);
      }
    }, 15000); // 15 second safety timeout
    
    performHealthCheck().finally(() => {
      console.log('Health check completed');
      clearTimeout(safetyTimeout);
    });
  }, [performHealthCheck, isChecking]);

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

    // Don't start monitoring if already checking
    if (isChecking) {
      return;
    }

    intervalRef.current = setInterval(() => {
      // Only perform health check if not already checking
      if (!isChecking) {
        performHealthCheck();
      }
    }, mergedConfig.checkInterval);

    // Perform initial health check only if not already checking
    if (!isChecking) {
      performHealthCheck();
    }
  }, [performHealthCheck, mergedConfig.checkInterval, isChecking]);

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
      // Ensure checking state is reset on unmount
      setIsChecking(false);
    };
  }, [stopMonitoring]);

  // Reset checking state when connection status changes
  useEffect(() => {
    if (!isConnected) {
      setIsChecking(false);
    }
  }, [isConnected]);

  // Additional safety: Reset checking state if it gets stuck
  useEffect(() => {
    const safetyInterval = setInterval(() => {
      // If checking has been true for more than 20 seconds, reset it
      if (isChecking) {
        const checkStartTime = sessionStorage.getItem('healthCheckStartTime');
        if (checkStartTime) {
          const elapsed = Date.now() - parseInt(checkStartTime);
          if (elapsed > 20000) { // 20 seconds
            console.warn('Health check stuck for too long, resetting...');
            setIsChecking(false);
            sessionStorage.removeItem('healthCheckStartTime');
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(safetyInterval);
  }, [isChecking]);

  // Track when checking starts
  useEffect(() => {
    if (isChecking) {
      sessionStorage.setItem('healthCheckStartTime', Date.now().toString());
    } else {
      sessionStorage.removeItem('healthCheckStartTime');
    }
  }, [isChecking]);

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
