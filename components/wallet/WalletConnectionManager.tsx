import React from 'react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useWalletService } from '@/contexts/ServiceContext';
import { walletRegistry } from '@/strategies/WalletStrategy';
import { WalletConnectionUI } from './WalletConnectionUI';

export interface WalletConnectionManagerProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const WalletConnectionManager: React.FC<WalletConnectionManagerProps> = ({
  onConnectionChange
}) => {
  const {
    isConnected,
    isConnecting,
    address,
    walletType,
    error,
    connect,
    disconnect,
    retryConnection
  } = useWalletConnection();

  const walletService = useWalletService();
  const availableConnectors = walletService.getAvailableConnectors();
  const lastConnectedWallet = walletService.getLastConnectedWallet();

  const availableWallets = walletRegistry.getAvailableStrategies();

  React.useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  const handleConnect = async (walletType: string) => {
    await connect(walletType);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleRetry = async () => {
    await retryConnection();
  };

  return (
    <WalletConnectionUI
      isConnected={isConnected}
      isConnecting={isConnecting}
      address={address}
      walletType={walletType}
      error={error}
      availableWallets={availableWallets}
      lastConnectedWallet={lastConnectedWallet}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onRetry={handleRetry}
    />
  );
};
