import React, { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { walletConnectionToast } from '@/utils/toast';
import { APP_CONFIG } from '@/config/constants';
import { walletStorage } from '@/utils/storage';
import { walletLogger } from '@/utils/logger';

interface ManualReconnectProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const ManualReconnect: React.FC<ManualReconnectProps> = ({ onConnectionChange }) => {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const [lastConnectedWallet, setLastConnectedWallet] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Load last connected wallet from storage
  useEffect(() => {
    const savedWallet = walletStorage.getLastConnectedWallet();
    if (savedWallet) {
      setLastConnectedWallet(savedWallet);
    }
  }, []);

  const handleManualReconnect = async () => {
    if (!lastConnectedWallet || isConnected) return;

    const connector = connectors.find(c => c.id === lastConnectedWallet);
    if (!connector || !connector.ready) {
      walletConnectionToast.failed(lastConnectedWallet, 'Wallet not available');
      return;
    }

    setIsReconnecting(true);
    try {
      await connect({ connector });
      walletConnectionToast.connected(connector.name);
      onConnectionChange?.(true);
    } catch (error) {
      walletConnectionToast.failed(lastConnectedWallet, String(error));
      walletLogger.error('Manual reconnect error', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Only show if user was previously connected and is now disconnected
  if (!lastConnectedWallet || isConnected) {
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <p className="text-sm text-blue-800 mb-2">
        Reconnect to your previous wallet:
      </p>
      <Button
        onClick={handleManualReconnect}
        disabled={isReconnecting}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        {isReconnecting ? 'Reconnecting...' : `Reconnect ${lastConnectedWallet}`}
      </Button>
    </div>
  );
};
