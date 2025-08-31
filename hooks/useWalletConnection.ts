import { useState, useCallback, useEffect } from 'react';
import { useWalletService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { walletRegistry } from '@/strategies/WalletStrategy';
import { useWagmiWalletService } from './useWagmiWalletService';

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  walletType: string | null;
  error: string | null;
}

export interface WalletConnectionActions {
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

export const useWalletConnection = (): WalletConnectionState & WalletConnectionActions => {
  const walletService = useWalletService();
  const wagmiWalletService = useWagmiWalletService();
  const errorHandler = useErrorHandler();
  
  const [state, setState] = useState<WalletConnectionState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    walletType: null,
    error: null
  });

  // Sync state with wagmi wallet service on mount and when it changes
  useEffect(() => {
    const syncState = async () => {
      try {
        const isConnected = wagmiWalletService.isConnected();
        if (isConnected) {
          const account = await wagmiWalletService.getAccount();
          setState(prev => ({
            ...prev,
            isConnected: true,
            address: account?.address || null,
            walletType: wagmiWalletService.getLastConnectedWallet() || 'unknown'
          }));
        }
      } catch (error) {
        console.error('Failed to sync wallet state:', error);
      }
    };

    syncState();
  }, [wagmiWalletService]);

  const connect = useCallback(async (walletType: string) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const strategy = walletRegistry.getStrategy(walletType);
      if (!strategy) {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      if (!strategy.isInstalled()) {
        throw new Error(`${strategy.name} is not installed. Please install it first.`);
      }

      const result = await walletService.connect(walletType);
      
      if (result.success) {
        const account = await walletService.getAccount();
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          address: account?.address || null,
          walletType,
          error: null
        }));
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useWalletConnection',
        action: 'connect',
        walletType,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorResult.message
      }));
    }
  }, [walletService, errorHandler]);

  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnect();
      setState({
        isConnected: false,
        isConnecting: false,
        address: null,
        walletType: null,
        error: null
      });
    } catch (error) {
      const errorResult = errorHandler.handle(error, {
        component: 'useWalletConnection',
        action: 'disconnect',
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        error: errorResult.message
      }));
    }
  }, [walletService, errorHandler]);

  const retryConnection = useCallback(async () => {
    if (state.walletType) {
      await connect(state.walletType);
    }
  }, [connect, state.walletType]);

  return {
    ...state,
    connect,
    disconnect,
    retryConnection
  };
};
