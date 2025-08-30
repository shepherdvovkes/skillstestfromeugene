import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'react-hot-toast';

// Connection state persistence keys
const STORAGE_KEYS = {
  LAST_CONNECTED_WALLET: 'lastConnectedWallet',
  CONNECTION_STATE: 'walletConnectionState',
  USER_PREFERENCES: 'userWalletPreferences'
} as const;

// User preferences interface
interface UserPreferences {
  autoReconnect: boolean;
  preferredNetworks: number[];
  lastConnectedAt: number;
}

// Connection state interface
interface ConnectionState {
  isConnected: boolean;
  walletType: string | null;
  address: string | null;
  chainId: number | null;
  lastConnectedAt: number | null;
}

export const useUser = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    walletType: null,
    address: null,
    chainId: null,
    lastConnectedAt: null
  });
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    autoReconnect: true,
    preferredNetworks: [137, 59144, 56], // Polygon, Linea, BSC
    lastConnectedAt: 0
  });

  // Load connection state from localStorage
  const loadConnectionState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.CONNECTION_STATE);
      const savedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setConnectionState(parsedState);
      }
      
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        setUserPreferences(parsedPreferences);
      }
    } catch (error) {
      console.error('Error loading connection state:', error);
    }
  }, []);

  // Save connection state to localStorage
  const saveConnectionState = useCallback((state: Partial<ConnectionState>) => {
    try {
      const newState = { ...connectionState, ...state };
      setConnectionState(newState);
      localStorage.setItem(STORAGE_KEYS.CONNECTION_STATE, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving connection state:', error);
    }
  }, [connectionState]);

  // Save user preferences to localStorage
  const saveUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...userPreferences, ...preferences };
      setUserPreferences(newPreferences);
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }, [userPreferences]);

  // Save last connected wallet
  const saveLastConnectedWallet = useCallback((walletType: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED_WALLET, walletType);
      saveConnectionState({ walletType });
    } catch (error) {
      console.error('Error saving last connected wallet:', error);
    }
  }, [saveConnectionState]);

  // Get last connected wallet
  const getLastConnectedWallet = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED_WALLET);
    } catch (error) {
      console.error('Error getting last connected wallet:', error);
      return null;
    }
  }, []);

  // Clear connection state
  const clearConnectionState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONNECTION_STATE);
      localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTED_WALLET);
      setConnectionState({
        isConnected: false,
        walletType: null,
        address: null,
        chainId: null,
        lastConnectedAt: null
      });
    } catch (error) {
      console.error('Error clearing connection state:', error);
    }
  }, []);

  // Auto-reconnect functionality
  const attemptAutoReconnect = useCallback(async () => {
    if (!userPreferences.autoReconnect) return;

    const lastWallet = getLastConnectedWallet();
    if (!lastWallet) return;

    const connector = connectors.find(c => c.id === lastWallet);
    if (!connector || !connector.ready) return;

    try {
      await connect({ connector });
      toast.success(`Auto-reconnected to ${connector.name}`);
    } catch (error) {
      console.error('Auto-reconnect failed:', error);
      // Don't show error toast for auto-reconnect failures
    }
  }, [userPreferences.autoReconnect, getLastConnectedWallet, connectors, connect]);

  // Enhanced connect function with persistence
  const connectWallet = useCallback(async (connector: any) => {
    try {
      await connect({ connector });
      saveLastConnectedWallet(connector.id);
      saveConnectionState({
        isConnected: true,
        walletType: connector.id,
        address: address || null,
        lastConnectedAt: Date.now()
      });
      saveUserPreferences({ lastConnectedAt: Date.now() });
      
      toast.success(`Connected to ${connector.name}`);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Connection failed. Please try again.');
      return false;
    }
  }, [connect, address, saveLastConnectedWallet, saveConnectionState, saveUserPreferences]);

  // Enhanced disconnect function with persistence
  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      clearConnectionState();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Error disconnecting wallet');
    }
  }, [disconnect, clearConnectionState]);

  // Update connection state when account changes
  useEffect(() => {
    if (isConnected && address) {
      saveConnectionState({
        isConnected: true,
        address,
        lastConnectedAt: Date.now()
      });
    } else if (!isConnected) {
      saveConnectionState({
        isConnected: false,
        address: null,
        lastConnectedAt: null
      });
    }
  }, [isConnected, address, saveConnectionState]);

  // Load state on mount
  useEffect(() => {
    loadConnectionState();
  }, [loadConnectionState]);

  // Attempt auto-reconnect on mount if enabled
  useEffect(() => {
    if (userPreferences.autoReconnect && !isConnected) {
      // Delay auto-reconnect to avoid conflicts with manual connection
      const timer = setTimeout(() => {
        attemptAutoReconnect();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userPreferences.autoReconnect, isConnected, attemptAutoReconnect]);

  // Check connection health
  const checkConnectionHealth = useCallback(() => {
    const lastConnected = connectionState.lastConnectedAt;
    if (!lastConnected) return true;

    const timeSinceConnection = Date.now() - lastConnected;
    const maxConnectionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (timeSinceConnection > maxConnectionAge) {
      toast('Connection may be stale. Please reconnect if needed.', {
        icon: '⚠️',
        style: {
          background: '#d97706',
          color: '#fff',
        }
      });
      return false;
    }

    return true;
  }, [connectionState.lastConnectedAt]);

  return {
    // Connection state
    isConnected,
    address,
    connectionState,
    
    // User preferences
    userPreferences,
    
    // Connection functions
    connectWallet,
    disconnectWallet,
    attemptAutoReconnect,
    
    // Persistence functions
    saveConnectionState,
    saveUserPreferences,
    saveLastConnectedWallet,
    getLastConnectedWallet,
    clearConnectionState,
    
    // Utility functions
    checkConnectionHealth,
    
    // Available connectors
    connectors
  };
};
