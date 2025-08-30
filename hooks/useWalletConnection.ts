import { useState, useCallback } from 'react';
import { useWalletService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { walletRegistry } from '@/strategies/WalletStrategy';

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
  const errorHandler = useErrorHandler();
  
  const [state, setState] = useState<WalletConnectionState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    walletType: null,
    error: null
  });

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
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
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
