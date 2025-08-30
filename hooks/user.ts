import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'react-hot-toast';
import { APP_CONFIG } from '@/config/constants';
import { walletStorage } from '@/utils/storage';
import { walletLogger } from '@/utils/logger';

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
    preferredNetworks: APP_CONFIG.DEFAULT_NETWORK_IDS,
    lastConnectedAt: 0
  });

  // Load connection state from storage
  const loadConnectionState = useCallback(() => {
    try {
      const savedState = walletStorage.getConnectionState();
      const savedPreferences = walletStorage.getUserPreferences();
      
      if (savedState) {
        setConnectionState(savedState);
      }
      
      if (savedPreferences) {
        setUserPreferences(savedPreferences);
      }
    } catch (error) {
      walletLogger.error('Error loading connection state', error);
    }
  }, []);

  // Save connection state to storage
  const saveConnectionState = useCallback((state: Partial<ConnectionState>) => {
    try {
      const newState = { ...connectionState, ...state };
      setConnectionState(newState);
      walletStorage.setConnectionState(newState);
    } catch (error) {
      walletLogger.error('Error saving connection state', error);
    }
  }, []);

  // Save user preferences to storage
  const saveUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...userPreferences, ...preferences };
      setUserPreferences(newPreferences);
      walletStorage.setUserPreferences(newPreferences);
    } catch (error) {
      walletLogger.error('Error saving user preferences', error);
    }
  }, []);

  // Save last connected wallet
  const saveLastConnectedWallet = useCallback((walletType: string) => {
    try {
      walletStorage.setLastConnectedWallet(walletType);
      // Update connection state directly to avoid infinite loop
      const newState = { ...connectionState, walletType };
      setConnectionState(newState);
      walletStorage.setConnectionState(newState);
    } catch (error) {
      walletLogger.error('Error saving last connected wallet', error);
    }
  }, []);

  // Get last connected wallet
  const getLastConnectedWallet = useCallback(() => {
    try {
      return walletStorage.getLastConnectedWallet();
    } catch (error) {
      walletLogger.error('Error getting last connected wallet', error);
      return null;
    }
  }, []);

  // Clear connection state
  const clearConnectionState = useCallback(() => {
    try {
      walletStorage.clearConnectionState();
      setConnectionState({
        isConnected: false,
        walletType: null,
        address: null,
        chainId: null,
        lastConnectedAt: null
      });
    } catch (error) {
      walletLogger.error('Error clearing connection state', error);
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
      walletLogger.error('Auto-reconnect failed', error);
      // Don't show error toast for auto-reconnect failures
    }
  }, [userPreferences.autoReconnect, getLastConnectedWallet, connectors, connect]);

  // Enhanced connect function with persistence
  const connectWallet = useCallback(async (connector: any) => {
    try {
      await connect({ connector });
      
      // Update all states directly to avoid dependency loops
      const newConnectionState = {
        isConnected: true,
        walletType: connector.id,
        address: address || null,
        lastConnectedAt: Date.now()
      };
      
      const newUserPreferences = { ...userPreferences, lastConnectedAt: Date.now() };
      
      // Update states and storage
      setConnectionState(newConnectionState);
      setUserPreferences(newUserPreferences);
      walletStorage.setConnectionState(newConnectionState);
      walletStorage.setUserPreferences(newUserPreferences);
      walletStorage.setLastConnectedWallet(connector.id);
      
      toast.success(`Connected to ${connector.name}`);
      return true;
    } catch (error) {
      walletLogger.error('Connection failed', error);
      toast.error('Connection failed. Please try again.');
      return false;
    }
  }, [connect, address, userPreferences]);

  // Enhanced disconnect function with persistence
  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      clearConnectionState();
      toast.success('Wallet disconnected');
    } catch (error) {
      walletLogger.error('Disconnect error', error);
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
