import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { IWagmiAdapter } from './WagmiWalletService';

// Pure adapter interface implementation
export interface IWagmiAdapterPure {
  getAccount: () => {
    address: string | undefined;
    isConnected: boolean;
    connector: { id: string } | undefined;
  };
  getConnectionState: () => {
    isConnecting: boolean;
    error: any;
  };
  connect: (connector: Connector) => Promise<any>;
  disconnect: () => Promise<void>;
  getConnectors: () => Connector[];
}

// React hook-based adapter that implements IWagmiAdapter
export const useWagmiAdapter = (): IWagmiAdapter => {
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, isLoading, error: connectError } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const adapter: IWagmiAdapterPure = {
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
  };

  return {
    ...adapter,
    // Additional methods specific to the hook implementation can go here
  };
};

// Mock adapter for testing purposes - follows single responsibility
export class MockWagmiAdapter implements IWagmiAdapter {
  private mockState = {
    isConnected: false,
    address: '',
    connector: { id: 'metamask' },
    isConnecting: false,
    error: null
  };

  getAccount() {
    return {
      address: this.mockState.address,
      isConnected: this.mockState.isConnected,
      connector: this.mockState.connector
    };
  }

  getConnectionState() {
    return {
      isConnecting: this.mockState.isConnecting,
      error: this.mockState.error
    };
  }

  async connect(connector: Connector) {
    this.mockState.isConnecting = true;
    this.mockState.error = null;
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.mockState.isConnected = true;
    this.mockState.address = '0x1234567890123456789012345678901234567890';
    this.mockState.isConnecting = false;
    
    return { success: true };
  }

  async disconnect() {
    this.mockState.isConnected = false;
    this.mockState.address = '';
    this.mockState.connector = { id: '' };
  }

  getConnectors() {
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        ready: true
      } as Connector
    ];
  }

  // Method to simulate MetaMask connection for testing
  simulateMetaMaskConnection() {
    this.mockState.isConnected = true;
    this.mockState.address = '0x1234567890123456789012345678901234567890';
    this.mockState.connector = { id: 'metamask' };
  }
}
