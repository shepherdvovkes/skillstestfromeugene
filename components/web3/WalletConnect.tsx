import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { walletConnectionToast } from '@/utils/toast';
import { Button } from '@/components/ui/button';

// Enhanced error handling for each wallet type
const handleWalletError = (error: any, walletType: string) => {
  // Don't show toast for specific MetaMask errors to avoid spam
  if (error?.code === -32002) {
    console.warn(`MetaMask is already processing a request. Please wait.`);
    return;
  }
  
  walletConnectionToast.failed(walletType, error?.message);
  console.error(`Wallet connection error (${walletType}):`, error);
};

interface WalletConnectProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnectionChange }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const connectionAttemptRef = useRef<AbortController | null>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Memoize available connectors to prevent unnecessary re-renders
  const availableConnectors = useMemo(() => {
    if (!isHydrated) return [];
    return connectors.filter(connector => connector.ready);
  }, [connectors, isHydrated]);

  // Handle connection with proper cleanup
  const handleConnect = useCallback(async (connector: any) => {
    const walletType = connector.id;
    
    // Cancel any existing connection attempt
    if (connectionAttemptRef.current) {
      connectionAttemptRef.current.abort();
    }
    
    // Create new abort controller for this connection attempt
    connectionAttemptRef.current = new AbortController();
    
    setIsConnecting(true);
    
    try {
      await connect({ connector });
      
      // Save connection state for persistence
      localStorage.setItem('lastConnectedWallet', walletType);
      
      walletConnectionToast.connected(connector.name);
      onConnectionChange?.(true);
      
    } catch (error) {
      // Only handle error if not aborted
      if (!connectionAttemptRef.current?.signal.aborted) {
        handleWalletError(error, walletType);
      }
    } finally {
      setIsConnecting(false);
      connectionAttemptRef.current = null;
    }
  }, [connect, onConnectionChange]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
    localStorage.removeItem('lastConnectedWallet');
    walletConnectionToast.disconnected();
    onConnectionChange?.(false);
  }, [disconnect, onConnectionChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionAttemptRef.current) {
        connectionAttemptRef.current.abort();
      }
    };
  }, []);

  // Handle connection errors
  useEffect(() => {
    if (error && !isConnecting) {
      const walletType = error.name || 'unknown';
      handleWalletError(error, walletType);
    }
  }, [error, isConnecting]);

  if (isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          disabled={isConnecting}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600 mb-2">
          Connect your wallet to continue
        </div>
        <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-600 mb-2">
        Connect your wallet to continue
      </div>
      {availableConnectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={isConnecting || isLoading}
          className="w-full"
          variant="default"
          aria-label={`Connect to ${connector.name} wallet`}
        >
          {isConnecting ? 'Connecting...' : `Connect ${connector.name}`}
        </Button>
      ))}
      {isConnecting && (
        <div className="text-xs text-gray-500 text-center">
          Please approve the connection in your wallet
        </div>
      )}
    </div>
  );
};
