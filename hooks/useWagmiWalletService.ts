import { useMemo } from 'react';
import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { useServiceContext } from '@/contexts/ServiceContext';
import { IWagmiAdapter } from '@/services/implementations/WagmiWalletService';

export const useWagmiWalletService = () => {
  const { walletService } = useServiceContext();
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, isLoading, error: connectError } = useConnect();
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
      return [];
    }
  }), [address, isConnected, connector, connectAsync, isLoading, connectError, disconnectAsync]);

  if (walletService && 'updateAdapter' in walletService) {
    (walletService as any).updateAdapter(wagmiAdapter);
  }

  return walletService;
};
