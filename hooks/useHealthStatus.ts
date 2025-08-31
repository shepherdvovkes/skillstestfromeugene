import { useState, useEffect } from 'react';
import { useWalletService } from '@/contexts/ServiceContext';
import { useNetworkService } from '@/contexts/ServiceContext';
import { env } from '@/config/environment';

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  connectionAge: number;
  networkLatency: number;
  errorCount: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disconnected';
  issues: string[];
}

export const useHealthStatus = (): HealthStatus => {
  const walletService = useWalletService();
  const networkService = useNetworkService();
  
  const [health, setHealth] = useState<HealthStatus>({
    isHealthy: true,
    lastCheck: Date.now(),
    connectionAge: 0,
    networkLatency: 0,
    errorCount: 0,
    status: 'healthy',
    issues: []
  });

  useEffect(() => {
    const updateHealth = () => {
      const isConnected = walletService.isConnected();
      const currentNetwork = networkService.getCurrentNetwork();
      
      const issues: string[] = [];
      let isHealthy = true;

      if (!isConnected) {
        issues.push('Wallet disconnected');
        isHealthy = false;
      }

      if (currentNetwork && !networkService.isNetworkSupported(currentNetwork.id)) {
        issues.push(`Unsupported network: ${currentNetwork.name}`);
        isHealthy = false;
      }

      let status: HealthStatus['status'] = 'healthy';
      if (!isHealthy) {
        status = issues.length >= 2 ? 'unhealthy' : 'degraded';
      }
      if (!isConnected) {
        status = 'disconnected';
      }

      setHealth(prev => ({
        ...prev,
        isHealthy,
        lastCheck: Date.now(),
        status,
        issues
      }));
    };

    updateHealth();

    // Only run health checks if enabled
    if (!env.ENABLE_HEALTH_CHECKS) {
      return;
    }

    const interval = setInterval(updateHealth, 30000);

    return () => clearInterval(interval);
  }, [walletService, networkService]);

  return health;
};
