import { useState, useCallback, useEffect } from 'react';
import { useWalletService } from '@/contexts/ServiceContext';
import { useErrorHandler } from '@/contexts/ServiceContext';
import { walletRegistry } from '@/strategies/WalletStrategy';
import { useWagmiWalletService } from './useWagmiWalletService';
import { APP_CONFIG } from '@/config/constants';
import { walletConnectionToast } from '@/utils/toast';

// Function to add chain to MetaMask
const addChainToMetaMask = async (networkId: number) => {
  const network = Object.values(APP_CONFIG.NETWORKS).find(n => n.id === networkId);
  if (!network) {
    throw new Error(`Network ${networkId} not found in configuration`);
  }

  const chainParams = {
    chainId: `0x${networkId.toString(16)}`,
    chainName: network.name,
    nativeCurrency: {
      name: network.name === 'BSC' ? 'BNB' : 
            network.name === 'Polygon' ? 'MATIC' : 
            network.name === 'Ethereum' ? 'ETH' : 'ETH',
      symbol: network.name === 'BSC' ? 'BNB' : 
              network.name === 'Polygon' ? 'MATIC' : 
              network.name === 'Ethereum' ? 'ETH' : 'ETH',
      decimals: 18,
    },
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [
      network.name === 'BSC' ? 'https://bscscan.com' :
      network.name === 'Polygon' ? 'https://polygonscan.com' :
      network.name === 'Linea' ? 'https://lineascan.build' :
      network.name === 'Ethereum' ? 'https://etherscan.io' :
      'https://etherscan.io'
    ],
  };

  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [chainParams],
      });
      return true;
    } else {
      throw new Error('MetaMask not available');
    }
  } catch (error) {
    console.error('Failed to add chain to MetaMask:', error);
    throw error;
  }
};

// Function to switch network
const switchNetwork = async (networkId: number) => {
  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Try to switch network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
    }
  } catch (error: any) {
    // If chain is not added, add it first
    if (error.code === 4902) {
      await addChainToMetaMask(networkId);
      // Try switching again
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
    } else {
      throw error;
    }
  }
};

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
  setPreferredNetwork: (networkId: number) => void;
  getPreferredNetwork: () => number | null;
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

  // Load connection state on mount
  useEffect(() => {
    const loadConnectionState = async () => {
      try {
        // Check if there's a stored connection
        const lastConnectedWallet = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET);
        const connectionStartTime = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
        
        if (lastConnectedWallet && connectionStartTime) {
          const connectionAge = Date.now() - parseInt(connectionStartTime);
          if (connectionAge < APP_CONFIG.TIMEOUTS.MAX_CONNECTION_AGE) {
            // Check if already connected before attempting auto-reconnect
            const isCurrentlyConnected = wagmiWalletService.isConnected();
            if (!isCurrentlyConnected && !state.isConnecting) {
              // Auto-reconnect attempt
              try {
                setState(prev => ({ ...prev, isConnecting: true }));
                // Use walletService directly instead of connect function to avoid circular dependency
                const result = await walletService.connect(lastConnectedWallet);
                if (result.success) {
                  const account = await walletService.getAccount();
                  const now = Date.now();
                  
                  setState(prev => ({
                    ...prev,
                    isConnected: true,
                    isConnecting: false,
                    address: account?.address || null,
                    walletType: account?.walletType || lastConnectedWallet,
                    error: null,
                    connectionTime: now,
                    lastActivity: now
                  }));
                  
                  walletConnectionToast.autoReconnected(lastConnectedWallet);
                } else {
                  throw new Error(result.error || 'Auto-reconnect failed');
                }
              } catch (error) {
                console.warn('Auto-reconnect failed:', error);
                // Clear stale connection data
                localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
                setState(prev => ({ ...prev, isConnecting: false }));
              }
            }
          } else {
            // Clear stale connection data
            localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
          }
        }
      } catch (error) {
        console.warn('Failed to load connection state:', error);
      }
    };

    loadConnectionState();
  }, [walletService, wagmiWalletService, state.isConnecting]);

  // Sync state with wagmi wallet service on mount and when it changes
  useEffect(() => {
    const syncState = async () => {
      try {
        const isConnected = wagmiWalletService.isConnected();
        const currentAccount = await wagmiWalletService.getAccount();
        
        // Only update state if there's a meaningful change
        if (isConnected !== state.isConnected || 
            currentAccount?.address !== state.address ||
            currentAccount?.walletType !== state.walletType) {
          
          setState(prev => ({
            ...prev,
            isConnected,
            address: currentAccount?.address || null,
            walletType: currentAccount?.walletType || 'unknown',
            connectionTime: prev.connectionTime || Date.now(),
            lastActivity: Date.now(),
            error: null // Clear any previous errors when connected
          }));
        }
      } catch (error) {
        console.error('Failed to sync wallet state:', error);
      }
    };

    // Only sync if not currently connecting to avoid conflicts
    if (!state.isConnecting) {
      syncState();
    }
  }, [wagmiWalletService, state.isConnected, state.address, state.walletType, state.isConnecting]);

  const connect = useCallback(async (walletType: string) => {
    // Check if already connected to prevent multiple connection attempts
    if (state.isConnected && state.walletType === walletType) {
      console.log(`Already connected to ${walletType}`);
      return;
    }

    // Check if currently connecting to prevent race conditions
    if (state.isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const strategy = walletRegistry.getStrategy(walletType);
      if (!strategy) {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      if (!strategy.isInstalled()) {
        throw new Error(`${strategy.name} is not installed. Please install it first.`);
      }

      // Check if wagmi is already connected
      const wagmiConnected = wagmiWalletService.isConnected();
      if (wagmiConnected) {
        // If already connected, just sync the state
        const account = await walletService.getAccount();
        const now = Date.now();
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          address: account?.address || null,
          walletType: account?.walletType || walletType,
          error: null,
          connectionTime: now,
          lastActivity: now
        }));
        return;
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

        // Auto-switch to Ethereum network after successful connection
        try {
          const currentChainId = await getCurrentChainId();
          if (currentChainId !== 1) {
            console.log('Auto-switching to Ethereum network after connection...');
            await switchNetwork(1);
            localStorage.setItem('preferredNetwork', '1');
            console.log('Successfully switched to Ethereum network');
          }
        } catch (networkError) {
          console.warn('Failed to auto-switch to Ethereum after connection:', networkError);
          // Don't fail the connection if network switching fails
        }
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      // Handle ConnectorAlreadyConnectedError specifically
      if (error instanceof Error && error.message.includes('already connected')) {
        console.log('Wallet already connected, syncing state...');
        try {
          const account = await walletService.getAccount();
          const now = Date.now();
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            address: account?.address || null,
            walletType: account?.walletType || walletType,
            error: null,
            connectionTime: now,
            lastActivity: now
          }));
          return;
        } catch (syncError) {
          console.error('Failed to sync wallet state:', syncError);
        }
      }

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
  }, [walletService, errorHandler, state.isConnected, state.isConnecting, state.walletType, wagmiWalletService]);

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
    try {
      const account = await walletService.getAccount();
      const now = Date.now();
      
      setState(prev => ({
        ...prev,
        address: account?.address || null,
        walletType: account?.walletType || null,
        lastActivity: now
      }));
    } catch (error) {
      console.error('Failed to refresh connection:', error);
    }
  }, [walletService]);

  const setPreferredNetwork = useCallback((networkId: number) => {
    localStorage.setItem('preferredNetwork', networkId.toString());
  }, []);

  const getPreferredNetwork = useCallback((): number | null => {
    const preferred = localStorage.getItem('preferredNetwork');
    return preferred ? parseInt(preferred) : null;
  }, []);

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

  // Auto-switch to Ethereum network after successful connection
  useEffect(() => {
    const autoSwitchToEthereum = async () => {
      try {
        // Only auto-switch if we're connected and not already on Ethereum
        if (state.isConnected && !state.isConnecting) {
          const currentChainId = await getCurrentChainId();
          
          // If not on Ethereum (chain ID 1), switch to it
          if (currentChainId !== 1) {
            console.log('Auto-switching to Ethereum network...');
            
            await switchNetwork(1); // Ethereum chain ID
            
            // Save the preferred network to localStorage
            localStorage.setItem('preferredNetwork', '1');
            
            console.log('Successfully switched to Ethereum network');
          }
        }
      } catch (error) {
        console.warn('Failed to auto-switch to Ethereum:', error);
      }
    };

    // Auto-switch when wallet connects
    if (state.isConnected && !state.isConnecting) {
      autoSwitchToEthereum();
    }
  }, [state.isConnected, state.isConnecting]);

  // Auto-switch to preferred network on page load if already connected
  useEffect(() => {
    const loadPreferredNetwork = async () => {
      try {
        // Check if user is already connected
        const isConnected = wagmiWalletService.isConnected();
        if (isConnected) {
          const preferredNetwork = localStorage.getItem('preferredNetwork');
          const currentChainId = await getCurrentChainId();
          
          // If we have a preferred network and we're not on it, switch to it
          if (preferredNetwork && currentChainId !== parseInt(preferredNetwork)) {
            console.log(`Auto-switching to preferred network: ${preferredNetwork}`);
            await switchNetwork(parseInt(preferredNetwork));
          }
        }
      } catch (error) {
        console.warn('Failed to load preferred network:', error);
      }
    };

    // Run on mount
    loadPreferredNetwork();
  }, [wagmiWalletService]);

  // Helper function to get current chain ID
  const getCurrentChainId = async (): Promise<number | null> => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return parseInt(chainId, 16);
      }
      return null;
    } catch (error) {
      console.error('Failed to get current chain ID:', error);
      return null;
    }
  };

  return {
    ...state,
    connect,
    disconnect,
    retryConnection,
    refreshConnection,
    setPreferredNetwork,
    getPreferredNetwork
  };
};
