import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { polygon, linea, bsc } from 'wagmi/chains';
import { networkToast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { ClientOnlyWalletConnect } from './ClientOnlyWalletConnect';
import { ManualReconnect } from './ManualReconnect';
import { APP_CONFIG } from '@/config/constants';
import { networkLogger } from '@/utils/logger';

// Supported networks configuration
const supportedNetworks = [
  { ...polygon, name: APP_CONFIG.NETWORKS.POLYGON.name },
  { ...linea, name: APP_CONFIG.NETWORKS.LINEA.name },
  { ...bsc, name: APP_CONFIG.NETWORKS.BSC.name }
];

// Network status indicators
const getNetworkStatus = (chainId: number | undefined) => {
  const network = supportedNetworks.find(network => network.id === chainId);
  return {
    isSupported: !!network,
    name: network?.name || 'Unsupported Network',
    status: network ? 'supported' : 'unsupported'
  };
};

interface Web3StatusProps {
  className?: string;
}

export const Web3Status: React.FC<Web3StatusProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitching } = useSwitchNetwork();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Network validation
  const networkStatus = getNetworkStatus(chain?.id);
  const isNetworkSupported = networkStatus.isSupported;

  // Loading state management
  useEffect(() => {
    if (isConnecting) {
      // Simulate connection progress
      const interval = setInterval(() => {
        setConnectionProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setConnectionProgress(0);
    }
  }, [isConnecting]);

  // Handle connection state changes
  const handleConnectionChange = (connected: boolean) => {
    setIsConnecting(false);
    setConnectionProgress(connected ? 100 : 0);
  };

  // Handle network switching
  const handleNetworkSwitch = async (targetChainId: number) => {
    if (!switchNetwork) {
      networkToast.switchError('Network', 'Network switching not supported');
      return;
    }

    const targetNetwork = supportedNetworks.find(n => n.id === targetChainId);

    try {
      await switchNetwork(targetChainId);
      networkToast.switchSuccess(targetNetwork?.name || 'Network');
    } catch (error) {
      networkToast.switchError(targetNetwork?.name || 'Network', String(error));
      networkLogger.error('Network switch error', error);
    }
  };

  // Show network warning if connected to unsupported network
  useEffect(() => {
    if (isConnected && !isNetworkSupported) {
      networkToast.notSupported(chain?.name || 'Unknown Network');
    }
  }, [isConnected, isNetworkSupported, chain?.name]);

  // Show loading state during hydration
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

  // Show disconnected state
  if (!isConnected) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" id="wallet-connect-title">Connect Wallet</h3>
          <div className="text-sm text-gray-500" aria-live="polite">
            {isConnecting && `Connecting... ${connectionProgress}%`}
          </div>
        </div>
        
        {isConnecting && (
          <div className="mb-4">
            <div 
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-labelledby="wallet-connect-title"
            >
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${connectionProgress}%` }}
              />
            </div>
          </div>
        )}

        <ManualReconnect onConnectionChange={handleConnectionChange} />
        <ClientOnlyWalletConnect onConnectionChange={handleConnectionChange} />
      </div>
    );
  }

  // Show connected state
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Wallet Status</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-2 py-1 rounded ${
            networkStatus.status === 'supported' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {networkStatus.name}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Successfully connected to MetaMask</span>
          </div>
          <span className="text-xs text-gray-600">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>

        {/* Network Status */}
        <div className={`p-3 rounded-lg ${
          isNetworkSupported ? 'bg-blue-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Network</span>
            <span className={`text-xs px-2 py-1 rounded ${
              isNetworkSupported 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isNetworkSupported ? 'Supported' : 'Unsupported'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {chain?.name} (ID: {chain?.id})
          </p>
        </div>

        {/* Network Switching */}
        {!isNetworkSupported && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              Switch to a supported network:
            </p>
            <div className="flex flex-wrap gap-2">
              {supportedNetworks.map((network) => (
                <Button
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  disabled={isSwitching}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {isSwitching ? 'Switching...' : network.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Network Switch */}
        {isNetworkSupported && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">Quick network switch:</p>
            <div className="flex flex-wrap gap-2">
              {supportedNetworks
                .filter(network => network.id !== chain?.id)
                .map((network) => (
                  <Button
                    key={network.id}
                    onClick={() => handleNetworkSwitch(network.id)}
                    disabled={isSwitching}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {isSwitching ? 'Switching...' : network.name}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Disconnect Button */}
        <div className="pt-2">
          <ClientOnlyWalletConnect onConnectionChange={handleConnectionChange} />
        </div>
      </div>
    </div>
  );
};
