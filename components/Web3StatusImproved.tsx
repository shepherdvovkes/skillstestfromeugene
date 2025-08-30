import React, { useState, useEffect } from 'react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useNetworkManagement } from '@/hooks/useNetworkManagement';
import { useHealthStatus } from '@/hooks/useHealthStatus';
import { WalletConnectionManager } from '@/components/wallet/WalletConnectionManager';
import { NetworkStatusManager } from '@/components/status/NetworkStatusManager';
import { ConnectionHealthMonitor } from '@/components/ConnectionHealthMonitor';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface Web3StatusImprovedProps {
  className?: string;
  showHealthMonitor?: boolean;
  showAdvanced?: boolean;
}

export const Web3StatusImproved: React.FC<Web3StatusImprovedProps> = ({
  className = '',
  showHealthMonitor = true,
  showAdvanced = false
}) => {
  const { isConnected, address, walletType } = useWalletConnection();
  const { currentNetwork } = useNetworkManagement();
  const health = useHealthStatus();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Connect Wallet</h3>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
        <div className="w-full h-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" id="wallet-connect-title">
            {isConnected ? 'Wallet Status' : 'Connect Wallet'}
          </h3>
          <div className="text-sm text-gray-500" aria-live="polite">
            {isConnected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  Successfully connected to {walletType}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>

            <NetworkStatusManager />

            {showHealthMonitor && (
              <ConnectionHealthMonitor 
                showAdvanced={showAdvanced}
                className="mt-4"
              />
            )}
          </div>
        )}

        {!isConnected && (
          <div className="space-y-3">
            <WalletConnectionManager />
            
            {showHealthMonitor && (
              <ConnectionHealthMonitor 
                showAdvanced={showAdvanced}
                className="mt-4"
              />
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
