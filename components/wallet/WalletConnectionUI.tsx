import React from 'react';
import { Button } from '@/components/ui/button';
import { WalletStrategy } from '@/strategies/WalletStrategy';

export interface WalletConnectionUIProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  walletType: string | null;
  error: string | null;
  availableWallets: WalletStrategy[];
  lastConnectedWallet: string | null;
  onConnect: (walletType: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onRetry: () => Promise<void>;
}

export const WalletConnectionUI: React.FC<WalletConnectionUIProps> = ({
  isConnected,
  isConnecting,
  address,
  walletType,
  error,
  availableWallets,
  lastConnectedWallet,
  onConnect,
  onDisconnect,
  onRetry
}) => {
  if (isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <Button
          onClick={onDisconnect}
          variant="outline"
          size="sm"
          disabled={isConnecting}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-600 mb-2">
        Connect your wallet to continue
      </div>
      
      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      )}

      {availableWallets.map((wallet) => (
        <Button
          key={wallet.id}
          onClick={() => onConnect(wallet.id)}
          disabled={isConnecting}
          className="w-full"
          variant="default"
          aria-label={`Connect to ${wallet.name} wallet`}
        >
          {isConnecting ? 'Connecting...' : `Connect ${wallet.name}`}
        </Button>
      ))}

      {isConnecting && (
        <div className="text-xs text-gray-500 text-center">
          Please approve the connection in your wallet
        </div>
      )}

      {availableWallets.length === 0 && (
        <div className="text-sm text-gray-500 text-center">
          No wallets available. Please install a supported wallet.
        </div>
      )}
    </div>
  );
};
