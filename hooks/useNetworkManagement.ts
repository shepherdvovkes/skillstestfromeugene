import { useState, useCallback } from 'react';
import { useNetworkService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { networkRegistry } from '@/strategies/NetworkStrategy';
import { Network } from '@/services/interfaces/INetworkService';

export interface NetworkState {
  currentNetwork: Network | null;
  isSwitching: boolean;
  supportedNetworks: Network[];
  error: string | null;
}

export interface NetworkActions {
  switchNetwork: (networkId: number) => Promise<void>;
  validateNetwork: (networkId: number) => Promise<boolean>;
  getNetworkStatus: (networkId: number) => {
    isSupported: boolean;
    name: string;
    status: 'supported' | 'unsupported';
  };
}

export const useNetworkManagement = (): NetworkState & NetworkActions => {
  const networkService = useNetworkService();
  const errorHandler = useErrorHandler();
  
  const [state, setState] = useState<NetworkState>({
    currentNetwork: null,
    isSwitching: false,
    supportedNetworks: [],
    error: null
  });

  const switchNetwork = useCallback(async (networkId: number) => {
    setState(prev => ({ ...prev, isSwitching: true, error: null }));

    try {
      const strategy = networkRegistry.getStrategy(networkId);
      if (!strategy) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      const result = await networkService.switchNetwork(networkId);
      
      if (result.success) {
        const network = networkService.getSupportedNetworks().find(n => n.id === networkId);
        setState(prev => ({
          ...prev,
          currentNetwork: network || null,
          isSwitching: false,
          error: null
        }));
      } else {
        throw new Error(result.error || 'Network switch failed');
      }
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useNetworkManagement',
        action: 'switchNetwork',
        networkId,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        isSwitching: false,
        error: errorResult.message
      }));
    }
  }, [networkService, errorHandler]);

  const validateNetwork = useCallback(async (networkId: number): Promise<boolean> => {
    try {
      return await networkService.validateNetwork(networkId);
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useNetworkManagement',
        action: 'validateNetwork',
        networkId,
        timestamp: Date.now()
      });
      return false;
    }
  }, [networkService, errorHandler]);

  const getNetworkStatus = useCallback((networkId: number) => {
    return networkService.getNetworkStatus(networkId);
  }, [networkService]);

  return {
    ...state,
    switchNetwork,
    validateNetwork,
    getNetworkStatus
  };
};
