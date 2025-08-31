import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Network } from '@/services/interfaces/INetworkService';
import { networkToast } from '@/utils/toast';

export interface NetworkStatusUIProps {
  currentNetwork: Network | null;
  isSwitching: boolean;
  supportedNetworks: Network[];
  error: string | null;
  isValidating?: boolean;
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
  isValidating = false,
  onSwitchNetwork,
  onValidateNetwork,
  getNetworkStatus
}) => {
  const [validatingNetworks, setValidatingNetworks] = useState<Set<number>>(new Set());
  const [switchProgress, setSwitchProgress] = useState<Record<number, number>>({});

  const handleSwitchNetwork = async (networkId: number) => {
    try {
      const network = supportedNetworks.find(n => n.id === networkId);
      if (network) {
        // Initialize switch progress
        setSwitchProgress(prev => ({ ...prev, [networkId]: 0 }));
        
        // Simulate progress during network switch
        const progressInterval = setInterval(() => {
          setSwitchProgress(prev => {
            const current = prev[networkId] || 0;
            if (current >= 90) return prev;
            return { ...prev, [networkId]: current + Math.random() * 20 };
          });
        }, 200);

        networkToast.switching(network.name);
        await onSwitchNetwork(networkId);
        
        // Complete progress
        setSwitchProgress(prev => ({ ...prev, [networkId]: 100 }));
        clearInterval(progressInterval);
        
        // Reset progress after a delay
        setTimeout(() => {
          setSwitchProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[networkId];
            return newProgress;
          });
        }, 1000);
        
        networkToast.switchSuccess(network.name);
      }
    } catch (error) {
      const network = supportedNetworks.find(n => n.id === networkId);
      networkToast.switchError(network?.name || `Network ${networkId}`, error instanceof Error ? error.message : 'Unknown error');
      
      // Reset progress on error
      setSwitchProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[networkId];
        return newProgress;
      });
    }
  };

  const handleValidateNetwork = async (networkId: number) => {
    try {
      setValidatingNetworks(prev => new Set(prev).add(networkId));
      const isValid = await onValidateNetwork(networkId);
      if (!isValid) {
        const network = supportedNetworks.find(n => n.id === networkId);
        networkToast.validationFailed(network?.name || `Network ${networkId}`);
      }
    } catch (error) {
      const network = supportedNetworks.find(n => n.id === networkId);
      networkToast.validationFailed(network?.name || `Network ${networkId}`);
    } finally {
      setValidatingNetworks(prev => {
        const newSet = new Set(prev);
        newSet.delete(networkId);
        return newSet;
      });
    }
  };

  const validateAllNetworks = async () => {
    const networksToValidate = supportedNetworks.filter(n => n.id !== currentNetwork?.id);
    setValidatingNetworks(new Set(networksToValidate.map(n => n.id)));
    
    try {
      await Promise.all(
        networksToValidate.map(network => onValidateNetwork(network.id))
      );
    } catch (error) {
      console.warn('Some network validations failed:', error);
    } finally {
      setValidatingNetworks(new Set());
    }
  };

  if (!currentNetwork) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">No network connected</p>
      </div>
    );
  }

  const networkStatus = getNetworkStatus(currentNetwork.id);
  const isNetworkSupported = networkStatus.isSupported;

  return (
    <div className="space-y-3">
      {/* Network Status */}
      <div className={`p-3 rounded-lg border ${
        isNetworkSupported ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
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
        
        {/* Network Validation Status */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          {isValidating ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-600">Validating...</span>
            </div>
          ) : (
            <Button
              onClick={() => handleValidateNetwork(currentNetwork.id)}
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2"
            >
              Validate
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Network Switching */}
      {!isNetworkSupported && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            Switch to a supported network:
          </p>
          <div className="flex flex-wrap gap-2">
            {supportedNetworks.map((network) => {
              const isSwitchingThis = isSwitching && switchProgress[network.id] !== undefined;
              const progress = switchProgress[network.id] || 0;
              
              return (
                <div key={network.id} className="relative">
                  <Button
                    onClick={() => handleSwitchNetwork(network.id)}
                    disabled={isSwitching}
                    size="sm"
                    variant="outline"
                    className="text-xs relative overflow-hidden"
                  >
                    {isSwitchingThis ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Switching...
                      </div>
                    ) : (
                      network.name
                    )}
                  </Button>
                  
                  {/* Progress bar overlay */}
                  {isSwitchingThis && progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200 rounded-b">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Network Switch */}
      {isNetworkSupported && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-700">Quick network switch:</p>
            <Button
              onClick={validateAllNetworks}
              size="sm"
              variant="ghost"
              disabled={validatingNetworks.size > 0}
              className="text-xs h-6 px-2"
            >
              {validatingNetworks.size > 0 ? 'Validating...' : 'Validate All'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {supportedNetworks
              .filter(network => network.id !== currentNetwork.id)
              .map((network) => {
                const isSwitchingThis = isSwitching && switchProgress[network.id] !== undefined;
                const isBeingValidated = validatingNetworks.has(network.id);
                const progress = switchProgress[network.id] || 0;
                
                return (
                  <div key={network.id} className="relative">
                    <Button
                      onClick={() => handleSwitchNetwork(network.id)}
                      disabled={isSwitching}
                      size="sm"
                      variant="outline"
                      className="text-xs relative overflow-hidden"
                    >
                      {isSwitchingThis ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          Switching...
                        </div>
                      ) : isBeingValidated ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          Validating...
                        </div>
                      ) : (
                        network.name
                      )}
                    </Button>
                    
                    {/* Progress bar overlay */}
                    {isSwitchingThis && progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200 rounded-b">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Network Health Indicator */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Network Health</span>
          <span className="text-xs text-gray-500">
            {supportedNetworks.length} supported networks
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {supportedNetworks.slice(0, 4).map((network) => {
            const isBeingValidated = validatingNetworks.has(network.id);
            
            return (
              <div
                key={network.id}
                className={`p-2 rounded text-xs relative ${
                  network.id === currentNetwork.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="font-medium flex items-center gap-1">
                  {network.name}
                  {isBeingValidated && (
                    <div className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="text-xs opacity-75">ID: {network.id}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
