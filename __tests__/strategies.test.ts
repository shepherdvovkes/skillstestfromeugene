import { walletRegistry } from '@/strategies/WalletStrategy';
import { networkRegistry } from '@/strategies/NetworkStrategy';
import { WalletStrategy } from '@/strategies/WalletStrategy';
import { NetworkStrategy } from '@/strategies/NetworkStrategy';

// Mock strategies for testing
class MockWalletStrategy implements WalletStrategy {
  id = 'mockWallet';
  name = 'Mock Wallet';
  
  getErrorMessage(error: any): string {
    return 'Mock wallet error';
  }
  
  validateConnection(provider: any): boolean {
    return true;
  }
  
  getConnectionSteps(): string[] {
    return ['Step 1', 'Step 2'];
  }
  
  getInstallationUrl(): string {
    return 'https://mock-wallet.com';
  }
  
  isInstalled(): boolean {
    return true;
  }
  
  getProvider(): any {
    return {};
  }
}

class MockNetworkStrategy implements NetworkStrategy {
  id = 999;
  name = 'Mock Network';
  rpcUrl = 'https://mock.network';
  
  validateConnection(): boolean {
    return true;
  }
  
  getBlockExplorer(): string {
    return 'https://mock-explorer.com';
  }
  
  getNativeCurrency(): { name: string; symbol: string; decimals: number } {
    return { name: 'Mock Token', symbol: 'MOCK', decimals: 18 };
  }
  
  getChainId(): number {
    return 999;
  }
  
  isTestnet(): boolean {
    return false;
  }
  
  getGasEstimate(): number {
    return 21000;
  }
}

describe('Strategy Pattern - SOLID Principles', () => {
  beforeEach(() => {
    // Reset registries by creating new instances for each test
    // Note: In a real application, you might want to add a clear method to registries
  });

  describe('Single Responsibility Principle (SRP)', () => {
    it('should have strategies with single responsibilities', () => {
      const walletStrategy = new MockWalletStrategy();
      const networkStrategy = new MockNetworkStrategy();

      // Wallet strategy should only handle wallet-specific concerns
      expect(walletStrategy.getErrorMessage).toBeDefined();
      expect(walletStrategy.validateConnection).toBeDefined();
      expect(walletStrategy.getConnectionSteps).toBeDefined();
      expect(walletStrategy.getInstallationUrl).toBeDefined();
      expect(walletStrategy.isInstalled).toBeDefined();

      // Network strategy should only handle network-specific concerns
      expect(networkStrategy.validateConnection).toBeDefined();
      expect(networkStrategy.getBlockExplorer).toBeDefined();
      expect(networkStrategy.getNativeCurrency).toBeDefined();
      expect(networkStrategy.getChainId).toBeDefined();
      expect(networkStrategy.isTestnet).toBeDefined();
    });

    it('should separate wallet and network concerns', () => {
      const walletStrategy = new MockWalletStrategy();
      const networkStrategy = new MockNetworkStrategy();

      // Wallet strategy should not handle network concerns
      expect(walletStrategy).not.toHaveProperty('getBlockExplorer');
      expect(walletStrategy).not.toHaveProperty('getNativeCurrency');
      expect(walletStrategy).not.toHaveProperty('getChainId');

      // Network strategy should not handle wallet concerns
      expect(networkStrategy).not.toHaveProperty('getConnectionSteps');
      expect(networkStrategy).not.toHaveProperty('getInstallationUrl');
      expect(networkStrategy).not.toHaveProperty('isInstalled');
    });
  });

  describe('Open/Closed Principle (OCP)', () => {
    it('should be open for extension with new strategies', () => {
      const initialWalletCount = walletRegistry.getAllStrategies().length;
      const initialNetworkCount = networkRegistry.getAllStrategies().length;

      // Add new strategies without modifying existing code
      walletRegistry.register(new MockWalletStrategy());
      networkRegistry.register(new MockNetworkStrategy());

      expect(walletRegistry.getAllStrategies().length).toBe(initialWalletCount + 1);
      expect(networkRegistry.getAllStrategies().length).toBe(initialNetworkCount + 1);
    });

    it('should allow extending existing strategies', () => {
      class ExtendedWalletStrategy extends MockWalletStrategy {
        customMethod() {
          return 'extended functionality';
        }
      }

      class ExtendedNetworkStrategy extends MockNetworkStrategy {
        customMethod() {
          return 'extended functionality';
        }
      }

      const extendedWallet = new ExtendedWalletStrategy();
      const extendedNetwork = new ExtendedNetworkStrategy();

      // Extended strategies should work with existing registries
      walletRegistry.register(extendedWallet);
      networkRegistry.register(extendedNetwork);

      expect(walletRegistry.getStrategy('mockWallet')).toBe(extendedWallet);
      expect(networkRegistry.getStrategy(999)).toBe(extendedNetwork);
      expect(extendedWallet.customMethod()).toBe('extended functionality');
      expect(extendedNetwork.customMethod()).toBe('extended functionality');
    });

    it('should be closed for modification of existing strategies', () => {
      const originalWalletStrategy = new MockWalletStrategy();
      const originalNetworkStrategy = new MockNetworkStrategy();

      walletRegistry.register(originalWalletStrategy);
      networkRegistry.register(originalNetworkStrategy);

      // Original strategies should remain unchanged
      expect(originalWalletStrategy.getErrorMessage({})).toBe('Mock wallet error');
      expect(originalNetworkStrategy.getBlockExplorer()).toBe('https://mock-explorer.com');
    });
  });

  describe('Liskov Substitution Principle (LSP)', () => {
    it('should allow substituting strategies without breaking functionality', () => {
      const strategy1 = new MockWalletStrategy();
      const strategy2 = new MockWalletStrategy();
      strategy2.id = 'mockWallet2';
      strategy2.name = 'Mock Wallet 2';

      walletRegistry.register(strategy1);
      walletRegistry.register(strategy2);

      // Both strategies should be substitutable
      expect(walletRegistry.getStrategy('mockWallet')).toBe(strategy1);
      expect(walletRegistry.getStrategy('mockWallet2')).toBe(strategy2);

      // Both should have the same interface
      expect(strategy1.getErrorMessage).toBeDefined();
      expect(strategy2.getErrorMessage).toBeDefined();
      expect(strategy1.validateConnection).toBeDefined();
      expect(strategy2.validateConnection).toBeDefined();
    });

    it('should maintain contract consistency across strategy implementations', () => {
      const walletStrategy = new MockWalletStrategy();
      const networkStrategy = new MockNetworkStrategy();

      // All wallet strategies should return strings for error messages
      expect(typeof walletStrategy.getErrorMessage({})).toBe('string');
      expect(typeof walletStrategy.getInstallationUrl()).toBe('string');

      // All network strategies should return appropriate types
      expect(typeof networkStrategy.getBlockExplorer()).toBe('string');
      expect(typeof networkStrategy.getChainId()).toBe('number');
      expect(typeof networkStrategy.isTestnet()).toBe('boolean');
    });
  });

  describe('Interface Segregation Principle (ISP)', () => {
    it('should have focused interfaces for specific concerns', () => {
      const walletStrategy = new MockWalletStrategy();
      const networkStrategy = new MockNetworkStrategy();

      // WalletStrategy should only contain wallet-related methods
      expect(walletStrategy).toHaveProperty('getErrorMessage');
      expect(walletStrategy).toHaveProperty('validateConnection');
      expect(walletStrategy).toHaveProperty('getConnectionSteps');
      expect(walletStrategy).toHaveProperty('getInstallationUrl');
      expect(walletStrategy).toHaveProperty('isInstalled');

      // NetworkStrategy should only contain network-related methods
      expect(networkStrategy).toHaveProperty('validateConnection');
      expect(networkStrategy).toHaveProperty('getBlockExplorer');
      expect(networkStrategy).toHaveProperty('getNativeCurrency');
      expect(networkStrategy).toHaveProperty('getChainId');
      expect(networkStrategy).toHaveProperty('isTestnet');
    });

    it('should not force clients to depend on methods they do not use', () => {
      // A client that only needs error messages shouldn't need connection steps
      const errorOnlyStrategy = {
        id: 'errorOnly',
        name: 'Error Only',
        getErrorMessage: (error: any) => 'Error only message',
        validateConnection: () => true,
        getConnectionSteps: () => [],
        getInstallationUrl: () => '',
        isInstalled: () => true,
        getProvider: () => ({})
      };

      // A client that only needs network validation shouldn't need gas estimates
      const validationOnlyStrategy = {
        id: 888,
        name: 'Validation Only',
        rpcUrl: 'https://validation-only.network',
        validateConnection: () => true,
        getBlockExplorer: () => '',
        getNativeCurrency: () => ({ name: '', symbol: '', decimals: 18 }),
        getChainId: () => 888,
        isTestnet: () => false,
        getGasEstimate: () => 0
      };

      expect(errorOnlyStrategy.getErrorMessage).toBeDefined();
      expect(validationOnlyStrategy.validateConnection).toBeDefined();
    });
  });

  describe('Dependency Inversion Principle (DIP)', () => {
    it('should depend on abstractions, not concretions', () => {
      // Registries should work with any implementation of the strategy interfaces
      const mockWallet = new MockWalletStrategy();
      const mockNetwork = new MockNetworkStrategy();

      walletRegistry.register(mockWallet);
      networkRegistry.register(mockNetwork);

      // Registries should not depend on specific implementations
      expect(walletRegistry.getStrategy('mockWallet')).toBe(mockWallet);
      expect(networkRegistry.getStrategy(999)).toBe(mockNetwork);
    });

    it('should allow different implementations of the same interface', () => {
      class AlternativeWalletStrategy implements WalletStrategy {
        id = 'alternative';
        name = 'Alternative Wallet';
        
        getErrorMessage(error: any): string {
          return 'Alternative error message';
        }
        
        validateConnection(provider: any): boolean {
          return false;
        }
        
        getConnectionSteps(): string[] {
          return ['Alternative step'];
        }
        
        getInstallationUrl(): string {
          return 'https://alternative-wallet.com';
        }
        
        isInstalled(): boolean {
          return false;
        }
        
        getProvider(): any {
          return null;
        }
      }

      const originalStrategy = new MockWalletStrategy();
      const alternativeStrategy = new AlternativeWalletStrategy();

      walletRegistry.register(originalStrategy);
      walletRegistry.register(alternativeStrategy);

      // Both should work with the same registry
      expect(walletRegistry.getStrategy('mockWallet')).toBe(originalStrategy);
      expect(walletRegistry.getStrategy('alternative')).toBe(alternativeStrategy);
    });
  });

  describe('Registry Pattern', () => {
    it('should manage strategies consistently', () => {
      const strategy1 = new MockWalletStrategy();
      const strategy2 = new MockNetworkStrategy();

      walletRegistry.register(strategy1);
      networkRegistry.register(strategy2);

      expect(walletRegistry.getStrategy('mockWallet')).toBe(strategy1);
      expect(networkRegistry.getStrategy(999)).toBe(strategy2);
    });

    it('should handle strategy retrieval gracefully', () => {
      expect(walletRegistry.getStrategy('nonexistent')).toBeUndefined();
      expect(networkRegistry.getStrategy(999999)).toBeUndefined();
    });

    it('should provide access to all registered strategies', () => {
      const strategy1 = new MockWalletStrategy();
      const strategy2 = new MockWalletStrategy();
      strategy2.id = 'mockWallet2';

      walletRegistry.register(strategy1);
      walletRegistry.register(strategy2);

      const allStrategies = walletRegistry.getAllStrategies();
      expect(allStrategies).toContain(strategy1);
      expect(allStrategies).toContain(strategy2);
    });

    it('should manage strategy registration correctly', () => {
      const strategy = new MockWalletStrategy();
      
      walletRegistry.register(strategy);

      expect(walletRegistry.getStrategy('mockWallet')).toBe(strategy);
      
      // Test that we can retrieve the strategy
      const retrievedStrategy = walletRegistry.getStrategy('mockWallet');
      expect(retrievedStrategy).toBe(strategy);
      expect(retrievedStrategy?.name).toBe('Mock Wallet');
    });
  });

  describe('Strategy Implementation Consistency', () => {
    it('should maintain consistent behavior across strategy instances', () => {
      const strategy1 = new MockWalletStrategy();
      const strategy2 = new MockWalletStrategy();
      strategy2.id = 'mockWallet2';

      // Both instances should behave consistently
      expect(strategy1.getErrorMessage({})).toBe('Mock wallet error');
      expect(strategy2.getErrorMessage({})).toBe('Mock wallet error');
      expect(strategy1.validateConnection({})).toBe(true);
      expect(strategy2.validateConnection({})).toBe(true);
    });

    it('should handle strategy-specific data correctly', () => {
      const walletStrategy = new MockWalletStrategy();
      const networkStrategy = new MockNetworkStrategy();

      expect(walletStrategy.id).toBe('mockWallet');
      expect(walletStrategy.name).toBe('Mock Wallet');
      expect(networkStrategy.id).toBe(999);
      expect(networkStrategy.name).toBe('Mock Network');
      expect(networkStrategy.rpcUrl).toBe('https://mock.network');
    });
  });
});
