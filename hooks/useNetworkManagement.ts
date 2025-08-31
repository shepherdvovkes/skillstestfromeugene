import { useState, useCallback, useEffect } from 'react';
import { useNetworkService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { networkRegistry } from '@/strategies/NetworkStrategy';
import { Network } from '@/services/interfaces/INetworkService';
import { APP_CONFIG } from '@/config/constants';

export interface NetworkState {
  currentNetwork: Network | null;
  isSwitching: boolean;
  supportedNetworks: Network[];
  error: string | null;
  isValidating: boolean;
}

export interface NetworkActions {
  switchNetwork: (networkId: number) => Promise<void>;
  validateNetwork: (networkId: number) => Promise<boolean>;
  getNetworkStatus: (networkId: number) => {
    isSupported: boolean;
    name: string;
    status: 'supported' | 'unsupported';
  };
  refreshSupportedNetworks: () => Promise<void>;
}

export const useNetworkManagement = (): NetworkState & NetworkActions => {
  const networkService = useNetworkService();
  const errorHandler = useErrorHandler();
  
  const [state, setState] = useState<NetworkState>({
    currentNetwork: null,
    isSwitching: false,
    supportedNetworks: [],
    error: null,
    isValidating: false
  });

  // Initialize supported networks from registry
  useEffect(() => {
    const initializeNetworks = async () => {
      try {
        const strategies = networkRegistry.getAllStrategies();
        const networks: Network[] = strategies.map(strategy => ({
          id: strategy.id,
          name: strategy.name,
          rpcUrl: strategy.rpcUrl,
          chainId: strategy.getChainId(),
          nativeCurrency: strategy.getNativeCurrency(),
          blockExplorer: strategy.getBlockExplorer(),
          isTestnet: strategy.isTestnet()
        }));

        setState(prev => ({
          ...prev,
          supportedNetworks: networks
        }));
      } catch (error) {
        const errorResult = errorHandler.handle(error, {
          component: 'useNetworkManagement',
          action: 'initializeNetworks',
          timestamp: Date.now()
        });

        setState(prev => ({
          ...prev,
          error: errorResult.message
        }));
      }
    };

    initializeNetworks();
  }, [errorHandler]);

  const switchNetwork = useCallback(async (networkId: number) => {
    setState(prev => ({ ...prev, isSwitching: true, error: null }));

    try {
      const strategy = networkRegistry.getStrategy(networkId);
      if (!strategy) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      const result = await networkService.switchNetwork(networkId);
      
      if (result.success) {
        const network = state.supportedNetworks.find(n => n.id === networkId);
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
  }, [networkService, errorHandler, state.supportedNetworks]);

  const validateNetwork = useCallback(async (networkId: number): Promise<boolean> => {
    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const result = await networkService.validateNetwork(networkId);
      setState(prev => ({ ...prev, isValidating: false }));
      return result;
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useNetworkManagement',
        action: 'validateNetwork',
        networkId,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        isValidating: false,
        error: errorResult.message
      }));
      return false;
    }
  }, [networkService, errorHandler]);

  const getNetworkStatus = useCallback((networkId: number) => {
    // Check if network is in our supported list
    const isSupported = state.supportedNetworks.some(n => n.id === networkId);
    const network = state.supportedNetworks.find(n => n.id === networkId);
    
    return {
      isSupported,
      name: network?.name || `Network ${networkId}`,
      status: isSupported ? 'supported' : 'unsupported'
    };
  }, [state.supportedNetworks]);

  const refreshSupportedNetworks = useCallback(async () => {
    try {
      const strategies = networkRegistry.getAllStrategies();
      const networks: Network[] = strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        rpcUrl: strategy.rpcUrl,
        chainId: strategy.getChainId(),
        nativeCurrency: strategy.getNativeCurrency(),
        blockExplorer: strategy.getBlockExplorer(),
        isTestnet: strategy.isTestnet()
      }));

      setState(prev => ({
        ...prev,
        supportedNetworks: networks,
        error: null
      }));
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useNetworkManagement',
        action: 'refreshSupportedNetworks',
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        error: errorResult.message
      }));
    }
  }, [errorHandler]);

  return {
    ...state,
    switchNetwork,
    validateNetwork,
    getNetworkStatus,
    refreshSupportedNetworks
  };
};
