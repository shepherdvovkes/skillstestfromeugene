import React from 'react';
import { useNetworkManagement } from '@/hooks/useNetworkManagement';
import { useNetworkService } from '@/contexts/ServiceContext';
import { NetworkStatusUI } from './NetworkStatusUI';

export interface NetworkStatusManagerProps {
  onNetworkChange?: (networkId: number) => void;
}

export const NetworkStatusManager: React.FC<NetworkStatusManagerProps> = ({
  onNetworkChange
}) => {
  const {
    currentNetwork,
    isSwitching,
    supportedNetworks,
    error,
    switchNetwork,
    validateNetwork,
    getNetworkStatus
  } = useNetworkManagement();

  const networkService = useNetworkService();

  React.useEffect(() => {
    if (currentNetwork) {
      onNetworkChange?.(currentNetwork.id);
    }
  }, [currentNetwork, onNetworkChange]);

  const handleSwitchNetwork = async (networkId: number) => {
    await switchNetwork(networkId);
  };

  const handleValidateNetwork = async (networkId: number) => {
    return await validateNetwork(networkId);
  };

  return (
    <NetworkStatusUI
      currentNetwork={currentNetwork}
      isSwitching={isSwitching}
      supportedNetworks={supportedNetworks}
      error={error}
      onSwitchNetwork={handleSwitchNetwork}
      onValidateNetwork={handleValidateNetwork}
      getNetworkStatus={getNetworkStatus}
    />
  );
};
