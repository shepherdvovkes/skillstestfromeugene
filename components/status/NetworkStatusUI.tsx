import React from 'react';
import { Button } from '@/components/ui/button';
import { Network } from '@/services/interfaces/INetworkService';

export interface NetworkStatusUIProps {
  currentNetwork: Network | null;
  isSwitching: boolean;
  supportedNetworks: Network[];
  error: string | null;
  onSwitchNetwork: (networkId: number) => Promise<void>;
  onValidateNetwork: (networkId: number) => Promise<boolean>;
  getNetworkStatus: (networkId: number) => {
    isSupported: boolean;
    name: string;
    status: 'supported' | 'unsupported';
  };
}

export const NetworkStatusUI: React.FC<NetworkStatusUIProps> = ({
  currentNetwork,
  isSwitching,
  supportedNetworks,
  error,
  onSwitchNetwork,
  onValidateNetwork,
  getNetworkStatus
}) => {
  if (!currentNetwork) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">No network connected</p>
      </div>
    );
  }

  const networkStatus = getNetworkStatus(currentNetwork.id);
  const isNetworkSupported = networkStatus.isSupported;

  return (
    <div className="space-y-3">
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
          {currentNetwork.name} (ID: {currentNetwork.id})
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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
                onClick={() => onSwitchNetwork(network.id)}
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
              .filter(network => network.id !== currentNetwork.id)
              .map((network) => (
                <Button
                  key={network.id}
                  onClick={() => onSwitchNetwork(network.id)}
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
    </div>
  );
};
