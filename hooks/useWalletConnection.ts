import { useState, useCallback, useEffect } from 'react';
import { useWalletService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { walletRegistry } from '@/strategies/WalletStrategy';
import { useWagmiWalletService } from './useWagmiWalletService';
import { APP_CONFIG } from '@/config/constants';
import { walletConnectionToast } from '@/utils/toast';

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  walletType: string | null;
  error: string | null;
  connectionTime: number | null;
  lastActivity: number | null;
}

export interface WalletConnectionActions {
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
  refreshConnection: () => Promise<void>;
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
    error: null,
    connectionTime: null,
    lastActivity: null
  });

  // Load connection state from storage on mount
  useEffect(() => {
    const loadConnectionState = async () => {
      try {
        const lastConnectedWallet = walletService.getLastConnectedWallet();
        if (lastConnectedWallet) {
          // Try to auto-reconnect if connection was made within last 24 hours
          const connectionStartTime = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
          if (connectionStartTime) {
            const connectionAge = Date.now() - parseInt(connectionStartTime);
            if (connectionAge < APP_CONFIG.TIMEOUTS.MAX_CONNECTION_AGE) {
              // Auto-reconnect attempt
              try {
                setState(prev => ({ ...prev, isConnecting: true }));
                await connect(lastConnectedWallet);
                walletConnectionToast.autoReconnected(lastConnectedWallet);
              } catch (error) {
                console.warn('Auto-reconnect failed:', error);
                // Clear stale connection data
                localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
              }
            } else {
              // Clear stale connection data
              localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load connection state:', error);
      }
    };

    loadConnectionState();
  }, [walletService]);

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
            walletType: wagmiWalletService.getLastConnectedWallet() || 'unknown',
            connectionTime: prev.connectionTime || Date.now(),
            lastActivity: Date.now()
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
        const now = Date.now();
        
        // Save connection state to localStorage
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME, now.toString());
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          address: account?.address || null,
          walletType,
          error: null,
          connectionTime: now,
          lastActivity: now
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
      
      // Clear connection state from localStorage
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
      
      setState({
        isConnected: false,
        isConnecting: false,
        address: null,
        walletType: null,
        error: null,
        connectionTime: null,
        lastActivity: null
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

  const refreshConnection = useCallback(async () => {
    if (state.isConnected && state.walletType) {
      try {
        const account = await walletService.getAccount();
        if (account?.address) {
          setState(prev => ({
            ...prev,
            address: account.address,
            lastActivity: Date.now()
          }));
        } else {
          // Connection lost, try to reconnect
          await retryConnection();
        }
      } catch (error) {
        console.warn('Connection refresh failed:', error);
        // Try to reconnect
        await retryConnection();
      }
    }
  }, [state.isConnected, state.walletType, walletService, retryConnection]);

  // Update last activity on user interaction
  useEffect(() => {
    if (state.isConnected) {
      const updateActivity = () => {
        setState(prev => ({ ...prev, lastActivity: Date.now() }));
      };

      // Update activity on user interactions
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, updateActivity);
        });
      };
    }
  }, [state.isConnected]);

  return {
    ...state,
    connect,
    disconnect,
    retryConnection,
    refreshConnection
  };
};
