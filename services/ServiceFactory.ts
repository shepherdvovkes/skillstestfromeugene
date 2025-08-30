import { IWalletService } from './interfaces/IWalletService';
import { INetworkService } from './interfaces/INetworkService';
import { IStorageService } from './interfaces/IStorageService';
import { IErrorHandler } from './interfaces/IErrorHandler';
import { WagmiWalletService } from './implementations/WagmiWalletService';
import { NetworkService } from './implementations/NetworkService';
import { BrowserStorageService } from './implementations/BrowserStorageService';
import { WalletErrorHandler } from './implementations/WalletErrorHandler';

export interface ServiceFactoryConfig {
  storage?: Storage;
  enableLogging?: boolean;
}

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor(private config: ServiceFactoryConfig = {}) {}

  static getInstance(config?: ServiceFactoryConfig): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(config);
    }
    return ServiceFactory.instance;
  }

  createStorageService(): IStorageService {
    const key = 'storageService';
    if (!this.services.has(key)) {
      const storage = this.config.storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
      this.services.set(key, new BrowserStorageService(storage));
    }
    return this.services.get(key);
  }

  createErrorHandler(): IErrorHandler {
    const key = 'errorHandler';
    if (!this.services.has(key)) {
      this.services.set(key, new WalletErrorHandler());
    }
    return this.services.get(key);
  }

  createWalletService(): IWalletService {
    const key = 'walletService';
    if (!this.services.has(key)) {
      const storageService = this.createStorageService();
      const errorHandler = this.createErrorHandler();
      
      this.services.set(key, new WagmiWalletService(
        storageService,
        errorHandler,
        {
          useAccount: () => ({}),
          useConnect: () => ({}),
          useDisconnect: () => ({})
        }
      ));
    }
    return this.services.get(key);
  }

  createNetworkService(): INetworkService {
    const key = 'networkService';
    if (!this.services.has(key)) {
      const errorHandler = this.createErrorHandler();
      
      this.services.set(key, new NetworkService(
        errorHandler,
        {
          useNetwork: () => ({}),
          useSwitchNetwork: () => ({})
        }
      ));
    }
    return this.services.get(key);
  }

  createAllServices() {
    return {
      walletService: this.createWalletService(),
      networkService: this.createNetworkService(),
      storageService: this.createStorageService(),
      errorHandler: this.createErrorHandler()
    };
  }

  reset(): void {
    this.services.clear();
  }

  getService<T>(key: string): T | undefined {
    return this.services.get(key);
  }

  hasService(key: string): boolean {
    return this.services.has(key);
  }
}

export const serviceFactory = ServiceFactory.getInstance();
