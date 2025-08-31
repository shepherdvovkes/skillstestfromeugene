import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { IWalletService, Account, WalletConnectionResult } from '../interfaces/IWalletService';
import { IStorageService } from '../interfaces/IStorageService';
import { IErrorHandler, ErrorContext } from '../interfaces/IErrorHandler';
import { APP_CONFIG } from '@/config/constants';
import { walletConnectionToast } from '@/utils/toast';

// Interface for wagmi adapter to follow Dependency Inversion Principle
export interface IWagmiAdapter {
  getAccount(): { address?: string; isConnected: boolean; connector?: { id: string } };
  getConnectionState(): { isConnecting: boolean; error: any };
  connect(connector: Connector): Promise<any>;
  disconnect(): Promise<void>;
  getConnectors(): Connector[];
}

export class WagmiWalletService implements IWalletService {
  private storageService: IStorageService;
  private errorHandler: IErrorHandler;
  private wagmiAdapter: IWagmiAdapter;

  constructor(
    storageService: IStorageService,
    errorHandler: IErrorHandler,
    wagmiAdapter: IWagmiAdapter
  ) {
    this.storageService = storageService;
    this.errorHandler = errorHandler;
    this.wagmiAdapter = wagmiAdapter;
  }

  async connect(connectorId: string): Promise<WalletConnectionResult> {
    const context: ErrorContext = {
      component: 'WagmiWalletService',
      action: 'connect',
      walletType: connectorId,
      timestamp: Date.now()
    };

    try {
      // Find the appropriate connector
      const connectors = this.wagmiAdapter.getConnectors();
      const connector = connectors.find(c => c.id === connectorId);
      
      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      // Attempt to connect using the adapter
      const result = await this.wagmiAdapter.connect(connector);
      
      if (result) {
        this.saveLastConnectedWallet(connectorId);
        walletConnectionToast.connected(connectorId);
        
        return {
          success: true,
          walletType: connectorId
        };
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      const errorResult = this.errorHandler.handle(error, context);
      return {
        success: false,
        error: errorResult.message
      };
    }
  }

  async disconnect(): Promise<void> {
    const context: ErrorContext = {
      component: 'WagmiWalletService',
      action: 'disconnect',
      timestamp: Date.now()
    };

    try {
      // Use the adapter to disconnect
      await this.wagmiAdapter.disconnect();
      
      this.clearConnectionState();
      walletConnectionToast.disconnected();
    } catch (error) {
      this.errorHandler.handle(error, context);
    }
  }

  async getAccount(): Promise<Account | null> {
    try {
      // Use the adapter to get account information
      const { address, isConnected, connector } = this.wagmiAdapter.getAccount();
      
      if (!isConnected || !address) {
        return null;
      }

      const walletType = connector?.id || this.getLastConnectedWallet() || 'unknown';
      
      return {
        address,
        walletType,
        isConnected: true
      };
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'getAccount',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return null;
    }
  }

  isConnected(): boolean {
    try {
      // Use the adapter to check connection status
      const { isConnected } = this.wagmiAdapter.getAccount();
      return isConnected;
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'isConnected',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return false;
    }
  }

  getConnectors(): Connector[] {
    try {
      return this.wagmiAdapter.getConnectors();
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'getConnectors',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return [];
    }
  }

  getAvailableConnectors(): Connector[] {
    try {
      const connectors = this.getConnectors();
      return connectors.filter(connector => connector.ready);
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'getAvailableConnectors',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return [];
    }
  }

  getConnectionState(): { isConnecting: boolean; error: any } {
    try {
      // Use the adapter to get connection state
      return this.wagmiAdapter.getConnectionState();
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'getConnectionState',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return {
        isConnecting: false,
        error: null
      };
    }
  }

  saveLastConnectedWallet(walletType: string): void {
    try {
      this.storageService.setItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET, walletType);
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'saveLastConnectedWallet',
        walletType,
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
    }
  }

  getLastConnectedWallet(): string | null {
    try {
      return this.storageService.getItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET);
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'getLastConnectedWallet',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return null;
    }
  }

  clearConnectionState(): void {
    try {
      this.storageService.removeItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET);
      this.storageService.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_STATE);
      this.storageService.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
    } catch (error) {
      const context: ErrorContext = {
        component: 'WagmiWalletService',
        action: 'clearConnectionState',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
    }
  }

  // Method to update the wagmi adapter (for React integration)
  updateAdapter(adapter: IWagmiAdapter): void {
    this.wagmiAdapter = adapter;
  }
}
