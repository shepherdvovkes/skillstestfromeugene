import { useAccount, useConnect, useDisconnect, Connector } from 'wagmi';
import { IWalletService, Account, WalletConnectionResult } from '../interfaces/IWalletService';
import { IStorageService } from '../interfaces/IStorageService';
import { IErrorHandler, ErrorContext } from '../interfaces/IErrorHandler';
import { APP_CONFIG } from '@/config/constants';
import { walletConnectionToast } from '@/utils/toast';

export class WagmiWalletService implements IWalletService {
  private storageService: IStorageService;
  private errorHandler: IErrorHandler;
  private hooks: {
    useAccount: typeof useAccount;
    useConnect: typeof useConnect;
    useDisconnect: typeof useDisconnect;
  };

  constructor(
    storageService: IStorageService,
    errorHandler: IErrorHandler,
    hooks: {
      useAccount: typeof useAccount;
      useConnect: typeof useConnect;
      useDisconnect: typeof useDisconnect;
    }
  ) {
    this.storageService = storageService;
    this.errorHandler = errorHandler;
    this.hooks = hooks;
  }

  async connect(connectorId: string): Promise<WalletConnectionResult> {
    const context: ErrorContext = {
      component: 'WagmiWalletService',
      action: 'connect',
      walletType: connectorId,
      timestamp: Date.now()
    };

    try {
      // This would need to be adapted for the hook-based approach
      // For now, we'll return a placeholder implementation
      const result: WalletConnectionResult = {
        success: true,
        walletType: connectorId
      };

      if (result.success) {
        this.saveLastConnectedWallet(connectorId);
        walletConnectionToast.connected(connectorId);
      }

      return result;
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
      // This would need to be adapted for the hook-based approach
      this.clearConnectionState();
      walletConnectionToast.disconnected();
    } catch (error) {
      this.errorHandler.handle(error, context);
    }
  }

  async getAccount(): Promise<Account | null> {
    try {
      // This would need to be adapted for the hook-based approach
      // For now, return null as placeholder
      return null;
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
      // This would need to be adapted for the hook-based approach
      // For now, return false as placeholder
      return false;
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
      // This would need to be adapted for the hook-based approach
      // For now, return empty array as placeholder
      return [];
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
      // This would need to be adapted for the hook-based approach
      // For now, return default state as placeholder
      return {
        isConnecting: false,
        error: null
      };
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
}
