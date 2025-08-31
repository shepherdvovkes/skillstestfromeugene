// Wallet-related type definitions
export interface Account {
  address: string;
  walletType: string;
  isConnected: boolean;
}

export interface WalletCapabilities {
  supportsMetaMask: boolean;
  supportsWalletConnect: boolean;
  supportsTokenPocket: boolean;
  supportsBitgetWallet: boolean;
  supportsParticleNetwork: boolean;
  supportsPolygon: boolean;
  supportsLinea: boolean;
  supportsBSC: boolean;
  supportsEthereum: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  walletType: string | null;
  error: string | null;
  connectionTime: number | null;
  lastActivity: number | null;
}

// MetaMask ethereum object type declaration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      chainId?: string;
      selectedAddress?: string;
    };
  }
}
