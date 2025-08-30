import { serviceFactory } from '@/services/ServiceFactory';
import { IWalletService, INetworkService, IStorageService, IErrorHandler } from '@/services/interfaces';
import { WagmiWalletService } from '@/services/implementations/WagmiWalletService';
import { NetworkService } from '@/services/implementations/NetworkService';
import { BrowserStorageService } from '@/services/implementations/BrowserStorageService';
import { WalletErrorHandler } from '@/services/implementations/WalletErrorHandler';

// Mock implementations for testing
class MockWalletService implements IWalletService {
  connect = jest.fn();
  disconnect = jest.fn();
  getAccount = jest.fn();
  isConnected = jest.fn();
  getConnectors = jest.fn();
  getAvailableConnectors = jest.fn();
  getConnectionState = jest.fn();
  saveLastConnectedWallet = jest.fn();
  getLastConnectedWallet = jest.fn();
  clearConnectionState = jest.fn();
}

class MockNetworkService implements INetworkService {
  switchNetwork = jest.fn();
  getCurrentNetwork = jest.fn();
  validateNetwork = jest.fn();
  getSupportedNetworks = jest.fn();
  checkNetworkHealth = jest.fn();
}

class MockStorageService implements IStorageService {
  getItem = jest.fn();
  setItem = jest.fn();
  removeItem = jest.fn();
  clear = jest.fn();
}

class MockErrorHandler implements IErrorHandler {
  handle = jest.fn();
  canHandle = jest.fn();
  categorizeError = jest.fn();
}

describe('Service Layer - SOLID Principles', () => {
  describe('Single Responsibility Principle (SRP)', () => {
    it('should create services with single responsibilities', () => {
      const services = serviceFactory.createAllServices();

      // Each service should have a single, well-defined responsibility
      expect(services.walletService).toBeInstanceOf(WagmiWalletService);
      expect(services.networkService).toBeInstanceOf(NetworkService);
      expect(services.storageService).toBeInstanceOf(BrowserStorageService);
      expect(services.errorHandler).toBeInstanceOf(WalletErrorHandler);
    });

    it('should have focused interfaces for each service', () => {
      const walletService = new MockWalletService();
      const networkService = new MockNetworkService();
      const storageService = new MockStorageService();
      const errorHandler = new MockErrorHandler();

      // Wallet service should only handle wallet operations
      expect(typeof walletService.connect).toBe('function');
      expect(typeof walletService.disconnect).toBe('function');
      expect(typeof walletService.getAccount).toBe('function');

      // Network service should only handle network operations
      expect(typeof networkService.switchNetwork).toBe('function');
      expect(typeof networkService.getCurrentNetwork).toBe('function');
      expect(typeof networkService.validateNetwork).toBe('function');

      // Storage service should only handle storage operations
      expect(typeof storageService.getItem).toBe('function');
      expect(typeof storageService.setItem).toBe('function');
      expect(typeof storageService.removeItem).toBe('function');

      // Error handler should only handle error operations
      expect(typeof errorHandler.handle).toBe('function');
      expect(typeof errorHandler.canHandle).toBe('function');
      expect(typeof errorHandler.categorizeError).toBe('function');
    });
  });

  describe('Open/Closed Principle (OCP)', () => {
    it('should allow extending services without modification', () => {
      const services = serviceFactory.createAllServices();

      // Create extended services
      class ExtendedWalletService extends WagmiWalletService {
        customMethod() {
          return 'extended functionality';
        }
      }

      class ExtendedNetworkService extends NetworkService {
        customMethod() {
          return 'extended functionality';
        }
      }

      const extendedWallet = new ExtendedWalletService();
      const extendedNetwork = new ExtendedNetworkService();

      // Extended services should work with existing interfaces
      expect(extendedWallet).toHaveProperty('connect');
      expect(extendedWallet).toHaveProperty('customMethod');
      expect(extendedNetwork).toHaveProperty('switchNetwork');
      expect(extendedNetwork).toHaveProperty('customMethod');
    });

    it('should support different implementations of the same interface', () => {
      const mockWallet = new MockWalletService();
      const mockNetwork = new MockNetworkService();
      const mockStorage = new MockStorageService();
      const mockErrorHandler = new MockErrorHandler();

      // All implementations should satisfy their respective interfaces
      expect(mockWallet).toHaveProperty('connect');
      expect(mockNetwork).toHaveProperty('switchNetwork');
      expect(mockStorage).toHaveProperty('getItem');
      expect(mockErrorHandler).toHaveProperty('handle');
    });
  });

  describe('Liskov Substitution Principle (LSP)', () => {
    it('should allow substituting implementations without breaking functionality', () => {
      const realServices = serviceFactory.createAllServices();
      const mockServices = {
        walletService: new MockWalletService(),
        networkService: new MockNetworkService(),
        storageService: new MockStorageService(),
        errorHandler: new MockErrorHandler(),
      };

      // Both real and mock services should satisfy their interfaces
      expect(mockServices.walletService).toHaveProperty('connect');
      expect(mockServices.walletService).toHaveProperty('disconnect');
      expect(mockServices.networkService).toHaveProperty('switchNetwork');
      expect(mockServices.storageService).toHaveProperty('getItem');
      expect(mockServices.errorHandler).toHaveProperty('handle');
    });

    it('should maintain contract consistency across implementations', () => {
      const mockWallet = new MockWalletService();
      const mockNetwork = new MockNetworkService();

      // Mock implementations should return expected types
      mockWallet.connect.mockResolvedValue({ success: true });
      mockNetwork.switchNetwork.mockResolvedValue({ success: true });

      expect(mockWallet.connect()).resolves.toHaveProperty('success');
      expect(mockNetwork.switchNetwork()).resolves.toHaveProperty('success');
    });
  });

  describe('Interface Segregation Principle (ISP)', () => {
    it('should have focused interfaces for specific concerns', () => {
      // IWalletService should only contain wallet-related methods
      const walletService: IWalletService = new MockWalletService();
      expect(walletService).toHaveProperty('connect');
      expect(walletService).toHaveProperty('disconnect');
      expect(walletService).toHaveProperty('getAccount');
      expect(walletService).not.toHaveProperty('switchNetwork'); // Network concern

      // INetworkService should only contain network-related methods
      const networkService: INetworkService = new MockNetworkService();
      expect(networkService).toHaveProperty('switchNetwork');
      expect(networkService).toHaveProperty('getCurrentNetwork');
      expect(networkService).toHaveProperty('validateNetwork');
      expect(networkService).not.toHaveProperty('connect'); // Wallet concern

      // IStorageService should only contain storage-related methods
      const storageService: IStorageService = new MockStorageService();
      expect(storageService).toHaveProperty('getItem');
      expect(storageService).toHaveProperty('setItem');
      expect(storageService).toHaveProperty('removeItem');
      expect(storageService).not.toHaveProperty('handle'); // Error handling concern

      // IErrorHandler should only contain error-related methods
      const errorHandler: IErrorHandler = new MockErrorHandler();
      expect(errorHandler).toHaveProperty('handle');
      expect(errorHandler).toHaveProperty('canHandle');
      expect(errorHandler).toHaveProperty('categorizeError');
      expect(errorHandler).not.toHaveProperty('getItem'); // Storage concern
    });

    it('should not force clients to depend on methods they do not use', () => {
      // A component that only needs wallet connection shouldn't need network methods
      const walletOnlyService: IWalletService = new MockWalletService();
      expect(walletOnlyService).toHaveProperty('connect');
      expect(walletOnlyService).toHaveProperty('disconnect');
      expect(walletOnlyService).toHaveProperty('getAccount');

      // A component that only needs storage shouldn't need wallet methods
      const storageOnlyService: IStorageService = new MockStorageService();
      expect(storageOnlyService).toHaveProperty('getItem');
      expect(storageOnlyService).toHaveProperty('setItem');
      expect(storageOnlyService).toHaveProperty('removeItem');
    });
  });

  describe('Dependency Inversion Principle (DIP)', () => {
    it('should depend on abstractions, not concretions', () => {
      const services = serviceFactory.createAllServices();

      // Services should be created through interfaces, not concrete classes
      expect(services.walletService).toBeInstanceOf(WagmiWalletService);
      expect(services.networkService).toBeInstanceOf(NetworkService);
      expect(services.storageService).toBeInstanceOf(BrowserStorageService);
      expect(services.errorHandler).toBeInstanceOf(WalletErrorHandler);

      // But they should also satisfy their interfaces
      expect(services.walletService).toHaveProperty('connect');
      expect(services.networkService).toHaveProperty('switchNetwork');
      expect(services.storageService).toHaveProperty('getItem');
      expect(services.errorHandler).toHaveProperty('handle');
    });

    it('should allow dependency injection of different implementations', () => {
      const mockServices = {
        walletService: new MockWalletService(),
        networkService: new MockNetworkService(),
        storageService: new MockStorageService(),
        errorHandler: new MockErrorHandler(),
      };

      // Mock services should be injectable and work the same way
      expect(mockServices.walletService).toHaveProperty('connect');
      expect(mockServices.networkService).toHaveProperty('switchNetwork');
      expect(mockServices.storageService).toHaveProperty('getItem');
      expect(mockServices.errorHandler).toHaveProperty('handle');
    });

    it('should not depend on external libraries directly', () => {
      const services = serviceFactory.createAllServices();

      // Services should abstract external dependencies
      expect(typeof services.walletService.connect).toBe('function');
      expect(typeof services.networkService.switchNetwork).toBe('function');
      expect(typeof services.storageService.getItem).toBe('function');
      expect(typeof services.errorHandler.handle).toBe('function');

      // The implementation details should be hidden behind interfaces
      expect(services.walletService.connect).toBeDefined();
      expect(services.networkService.switchNetwork).toBeDefined();
      expect(services.storageService.getItem).toBeDefined();
      expect(services.errorHandler.handle).toBeDefined();
    });
  });

  describe('Service Factory Pattern', () => {
    it('should create all services consistently', () => {
      const services1 = serviceFactory.createAllServices();
      const services2 = serviceFactory.createAllServices();

      // Factory should create consistent service instances
      expect(services1.walletService).toBeInstanceOf(WagmiWalletService);
      expect(services1.networkService).toBeInstanceOf(NetworkService);
      expect(services1.storageService).toBeInstanceOf(BrowserStorageService);
      expect(services1.errorHandler).toBeInstanceOf(WalletErrorHandler);

      expect(services2.walletService).toBeInstanceOf(WagmiWalletService);
      expect(services2.networkService).toBeInstanceOf(NetworkService);
      expect(services2.storageService).toBeInstanceOf(BrowserStorageService);
      expect(services2.errorHandler).toBeInstanceOf(WalletErrorHandler);
    });

    it('should allow creating individual services', () => {
      const walletService = serviceFactory.createWalletService();
      const networkService = serviceFactory.createNetworkService();
      const storageService = serviceFactory.createStorageService();
      const errorHandler = serviceFactory.createErrorHandler();

      expect(walletService).toBeInstanceOf(WagmiWalletService);
      expect(networkService).toBeInstanceOf(NetworkService);
      expect(storageService).toBeInstanceOf(BrowserStorageService);
      expect(errorHandler).toBeInstanceOf(WalletErrorHandler);
    });
  });
});
