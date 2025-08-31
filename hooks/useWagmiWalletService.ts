import { useMemo } from 'react';
import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { useServiceContext } from '@/contexts/ServiceContext';
import { IWagmiAdapter } from '@/services/implementations/WagmiWalletService';

// React hook that creates a wagmi adapter and injects it into the wallet service
export const useWagmiWalletService = () => {
  const { walletService } = useServiceContext();
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, isLoading, error: connectError } = useConnect();
  const { disconnectAsync } = useDisconnect();

  // Create the wagmi adapter using React hooks
  const wagmiAdapter: IWagmiAdapter = useMemo(() => ({
    getAccount: () => ({
      address,
      isConnected,
      connector: connector ? { id: connector.id } : undefined
    }),
    
    getConnectionState: () => ({
      isConnecting: isLoading,
      error: connectError
    }),
    
    connect: async (connector: Connector) => {
      try {
        return await connectAsync({ connector });
      } catch (error) {
        console.error('Connection error:', error);
        throw error;
      }
    },
    
    disconnect: async () => {
      try {
        await disconnectAsync();
      } catch (error) {
        console.error('Disconnection error:', error);
        throw error;
      }
    },
    
    getConnectors: () => {
      // This would need to be injected from the wagmi config
      // For now, we'll return an empty array
      return [];
    }
  }), [address, isConnected, connector, connectAsync, isLoading, connectError, disconnectAsync]);

  // Update the wallet service with the current wagmi adapter
  if (walletService && 'updateAdapter' in walletService) {
    (walletService as any).updateAdapter(wagmiAdapter);
  }

  return walletService;
};
