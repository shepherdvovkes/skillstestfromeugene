import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletStrategy } from '@/strategies/WalletStrategy';
import { walletConnectionToast } from '@/utils/toast';
import { NetworkSwitcher } from '@/components/status/NetworkSwitcher';

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
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [isRetrying, setIsRetrying] = useState(false);
  const MAX_RETRIES = 3;

  // Enhanced error handling for each wallet type with retry mechanism
  const handleWalletError = (error: any, walletType: string) => {
    const errorMessages = {
      'metaMask': 'Please install MetaMask extension or check if it\'s unlocked',
      'tokenPocket': 'Please install TokenPocket or check if it\'s unlocked',
      'bitgetWallet': 'Please install Bitget Wallet or check if it\'s unlocked',
      'particleNetwork': 'Particle Network connection failed. Please try again.',
      'walletConnect': 'WalletConnect connection failed. Please try again.'
    };
    
    const message = errorMessages[walletType as keyof typeof errorMessages] || 'Connection failed. Please try again.';
    
    // Show retry attempt toast if we haven't exceeded max retries
    const currentRetries = retryCount[walletType] || 0;
    if (currentRetries < MAX_RETRIES) {
      walletConnectionToast.retryAttempt(currentRetries + 1, MAX_RETRIES);
    } else {
      walletConnectionToast.maxRetriesExceeded();
    }
    
    walletConnectionToast.failed(walletType, message);
  };

  const handleConnect = async (walletType: string) => {
    try {
      await onConnect(walletType);
      // Reset retry count on successful connection
      setRetryCount(prev => ({ ...prev, [walletType]: 0 }));
    } catch (error) {
      handleWalletError(error, walletType);
    }
  };

  const handleRetry = async (walletType: string) => {
    const currentRetries = retryCount[walletType] || 0;
    
    if (currentRetries >= MAX_RETRIES) {
      walletConnectionToast.maxRetriesExceeded();
      return;
    }

    setIsRetrying(true);
    try {
      // Increment retry count
      setRetryCount(prev => ({ ...prev, [walletType]: currentRetries + 1 }));
      
      // Show retry attempt toast
      walletConnectionToast.retryAttempt(currentRetries + 1, MAX_RETRIES);
      
      await onConnect(walletType);
      
      // Reset retry count on successful connection
      setRetryCount(prev => ({ ...prev, [walletType]: 0 }));
    } catch (error) {
      handleWalletError(error, walletType);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm text-gray-600">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        
        {/* Network Switcher */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500">Current Network</div>
          <NetworkSwitcher />
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
        <div className="text-sm text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex items-center gap-2">
              {walletType && (
                <span className="text-xs text-red-500">
                  Retries: {(retryCount[walletType] || 0)}/{MAX_RETRIES}
                </span>
              )}
              <Button
                onClick={() => walletType ? handleRetry(walletType) : onRetry()}
                variant="ghost"
                size="sm"
                disabled={isRetrying || !!(walletType && (retryCount[walletType] || 0) >= MAX_RETRIES)}
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {availableWallets.map((wallet) => {
        const walletRetryCount = retryCount[wallet.id] || 0;
        const isMaxRetriesReached = walletRetryCount >= MAX_RETRIES;
        
        return (
          <div key={wallet.id} className="space-y-2">
            <Button
              onClick={() => handleConnect(wallet.id)}
              disabled={isConnecting || isMaxRetriesReached}
              className="w-full"
              variant={isMaxRetriesReached ? "destructive" : "default"}
              aria-label={`Connect to ${wallet.name} wallet`}
            >
              {isConnecting ? 'Connecting...' : `Connect ${wallet.name}`}
            </Button>
            
            {walletRetryCount > 0 && (
              <div className="text-xs text-gray-500 text-center">
                Retry attempts: {walletRetryCount}/{MAX_RETRIES}
                {isMaxRetriesReached && (
                  <span className="block text-red-500 font-medium">
                    Max retries reached. Please try again later.
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isConnecting && (
        <div className="text-xs text-gray-500 text-center p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Please approve the connection in your wallet
          </div>
        </div>
      )}

      {availableWallets.length === 0 && (
        <div className="text-sm text-gray-500 text-center p-3 bg-gray-50 rounded border border-gray-200">
          No wallets available. Please install a supported wallet.
        </div>
      )}
    </div>
  );
};
