import { useMemo } from 'react';
import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { useServiceContext } from '@/contexts/ServiceContext';
import { IWagmiAdapter } from '@/services/implementations/WagmiWalletService';

export const useWagmiWalletService = () => {
  const { walletService } = useServiceContext();
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, isLoading, error: connectError, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

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
        // Check if already connected before attempting to connect
        if (isConnected) {
          console.log('Already connected, skipping connection attempt');
          return { success: true };
        }
        
        return await connectAsync({ connector });
      } catch (error) {
        console.error('Connection error:', error);
        
        // Handle ConnectorAlreadyConnectedError specifically
        if (error instanceof Error && error.message.includes('already connected')) {
          console.log('Connector already connected, returning success');
          return { success: true };
        }
        
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
      return connectors;
    }
  }), [address, isConnected, connector, connectAsync, isLoading, connectError, disconnectAsync, connectors]);

  if (walletService && 'updateAdapter' in walletService) {
    (walletService as any).updateAdapter(wagmiAdapter);
  }

  return walletService;
};
