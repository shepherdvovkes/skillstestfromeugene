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
  const { isConnected, address, walletType, isConnecting } = useWalletConnection();
  const { currentNetwork } = useNetworkManagement();
  const health = useHealthStatus();
  const [isHydrated, setIsHydrated] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Simulate connection progress when connecting
  useEffect(() => {
    if (isConnecting && !isConnected) {
      setConnectionProgress(0);
      const interval = setInterval(() => {
        setConnectionProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until actually connected
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (isConnected) {
      setConnectionProgress(100);
    } else {
      setConnectionProgress(0);
    }
  }, [isConnecting, isConnected]);

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
          <div className="flex items-center gap-4">
            {/* Network Status Indicator */}
            {isConnected && currentNetwork && (
              <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                🌐 {currentNetwork.name}
              </div>
            )}
            <div className="text-sm text-gray-500" aria-live="polite">
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : isConnected ? 'Connected' : 'Not Connected'}
            </div>
          </div>
        </div>

        {isConnecting && !isConnected && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to wallet... Please approve the connection request.</span>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(connectionProgress, 100)}%` }}
              ></div>
            </div>
            
            {/* Progress Percentage */}
            <div className="flex justify-between text-xs text-blue-600">
              <span>Connecting...</span>
              <span>{Math.round(connectionProgress)}%</span>
            </div>
            
            {/* Connection Steps */}
            <div className="mt-3 text-xs text-blue-600">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${connectionProgress > 20 ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                <span>Initializing connection</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${connectionProgress > 50 ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                <span>Requesting wallet approval</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionProgress > 80 ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                <span>Finalizing connection</span>
              </div>
            </div>
          </div>
        )}

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
