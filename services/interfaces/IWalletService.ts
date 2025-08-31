import { Connector } from 'wagmi';

export interface Account {
  address: string;
  isConnected: boolean;
  walletType?: string;
}

export interface WalletConnectionResult {
  success: boolean;
  error?: string;
  walletType?: string;
}

export interface IWalletService {
  // Connection operations
  connect(connectorId: string): Promise<WalletConnectionResult>;
  disconnect(): Promise<void>;
  
  // Account operations
  getAccount(): Promise<Account | null>;
  isConnected(): boolean;
  
  // Connector operations
  getConnectors(): Connector[];
  getAvailableConnectors(): Connector[];
  
  // Connection state
  getConnectionState(): {
    isConnecting: boolean;
    error: any;
  };
  
  // Storage operations
  saveLastConnectedWallet(walletType: string): void;
  getLastConnectedWallet(): string | null;
  clearConnectionState(): void;
}
