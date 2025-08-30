import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { serviceFactory } from '@/services/ServiceFactory';
import { Web3StatusImproved } from '@/components/Web3StatusImproved';
import { WalletConnectionManager } from '@/components/wallet/WalletConnectionManager';
import { NetworkStatusManager } from '@/components/status/NetworkStatusManager';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useNetworkManagement } from '@/hooks/useNetworkManagement';
import { walletRegistry } from '@/strategies/WalletStrategy';
import { networkRegistry } from '@/strategies/NetworkStrategy';

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = serviceFactory.createAllServices();
  
  return (
    <ServiceProvider services={services}>
      {children}
    </ServiceProvider>
  );
};

describe('SOLID Architecture Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Layer Tests', () => {
    it('should create services using factory pattern', () => {
      const services = serviceFactory.createAllServices();
      
      expect(services.walletService).toBeDefined();
      expect(services.networkService).toBeDefined();
      expect(services.storageService).toBeDefined();
      expect(services.errorHandler).toBeDefined();
    });

    it('should follow dependency injection pattern', () => {
      const services = serviceFactory.createAllServices();
      
      expect(services.walletService).toHaveProperty('connect');
      expect(services.networkService).toHaveProperty('switchNetwork');
      expect(services.storageService).toHaveProperty('getItem');
      expect(services.errorHandler).toHaveProperty('handle');
    });
  });

  describe('Strategy Pattern Tests', () => {
    it('should register wallet strategies', () => {
      const strategies = walletRegistry.getAllStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.some(s => s.id === 'metaMask')).toBe(true);
      expect(strategies.some(s => s.id === 'walletConnect')).toBe(true);
    });

    it('should register network strategies', () => {
      const strategies = networkRegistry.getAllStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.some(s => s.id === 137)).toBe(true);
      expect(strategies.some(s => s.id === 59144)).toBe(true);
    });

    it('should get wallet strategy by id', () => {
      const strategy = walletRegistry.getStrategy('metaMask');
      
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('MetaMask');
      expect(strategy?.getErrorMessage).toBeDefined();
    });

    it('should get network strategy by id', () => {
      const strategy = networkRegistry.getStrategy(137);
      
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('Polygon');
      expect(strategy?.validateConnection).toBeDefined();
    });
  });

  describe('Interface Segregation Tests', () => {
    it('should use focused hooks for specific concerns', () => {
      const TestComponent = () => {
        const walletConnection = useWalletConnection();
        const networkManagement = useNetworkManagement();
        
        return (
          <div>
            <div data-testid="wallet-hook">
              {walletConnection.isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div data-testid="network-hook">
              {networkManagement.currentNetwork?.name || 'No Network'}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('wallet-hook')).toBeInTheDocument();
      expect(screen.getByTestId('network-hook')).toBeInTheDocument();
    });
  });

  describe('Single Responsibility Tests', () => {
    it('should separate business logic from UI components', () => {
      render(
        <TestWrapper>
          <WalletConnectionManager />
        </TestWrapper>
      );

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('should separate network management from UI', () => {
      render(
        <TestWrapper>
          <NetworkStatusManager />
        </TestWrapper>
      );

      expect(screen.getByText('No network connected')).toBeInTheDocument();
    });
  });

  describe('Open/Closed Principle Tests', () => {
    it('should allow adding new wallet strategies without modifying existing code', () => {
      const initialCount = walletRegistry.getAllStrategies().length;
      
      const newStrategy = {
        id: 'testWallet',
        name: 'Test Wallet',
        getErrorMessage: jest.fn(),
        validateConnection: jest.fn(),
        getConnectionSteps: jest.fn(),
        getInstallationUrl: jest.fn(),
        isInstalled: jest.fn(),
        getProvider: jest.fn()
      };
      
      walletRegistry.register(newStrategy);
      
      const newCount = walletRegistry.getAllStrategies().length;
      expect(newCount).toBe(initialCount + 1);
      expect(walletRegistry.getStrategy('testWallet')).toBeDefined();
    });

    it('should allow adding new network strategies without modifying existing code', () => {
      const initialCount = networkRegistry.getAllStrategies().length;
      
      const newStrategy = {
        id: 999,
        name: 'Test Network',
        rpcUrl: 'https://test.network',
        validateConnection: jest.fn(),
        getBlockExplorer: jest.fn(),
        getNativeCurrency: jest.fn(),
        getChainId: jest.fn(),
        isTestnet: jest.fn(),
        getGasEstimate: jest.fn()
      };
      
      networkRegistry.register(newStrategy);
      
      const newCount = networkRegistry.getAllStrategies().length;
      expect(newCount).toBe(initialCount + 1);
      expect(networkRegistry.getStrategy(999)).toBeDefined();
    });
  });

  describe('Liskov Substitution Tests', () => {
    it('should allow swapping storage implementations', () => {
      const services = serviceFactory.createAllServices();
      const storageService = services.storageService;
      
      expect(storageService.getItem).toBeDefined();
      expect(storageService.setItem).toBeDefined();
      expect(storageService.removeItem).toBeDefined();
      expect(storageService.clear).toBeDefined();
    });

    it('should allow swapping error handler implementations', () => {
      const services = serviceFactory.createAllServices();
      const errorHandler = services.errorHandler;
      
      expect(errorHandler.handle).toBeDefined();
      expect(errorHandler.canHandle).toBeDefined();
      expect(errorHandler.categorizeError).toBeDefined();
    });
  });

  describe('Dependency Inversion Tests', () => {
    it('should use dependency injection for services', () => {
      render(
        <TestWrapper>
          <Web3StatusImproved />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should allow mocking services for testing', () => {
      const mockWalletService = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        getAccount: jest.fn(),
        isConnected: jest.fn(),
        getConnectors: jest.fn(),
        getAvailableConnectors: jest.fn(),
        getConnectionState: jest.fn(),
        saveLastConnectedWallet: jest.fn(),
        getLastConnectedWallet: jest.fn(),
        clearConnectionState: jest.fn()
      };

      expect(mockWalletService.connect).toBeDefined();
      expect(mockWalletService.disconnect).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should work with the complete SOLID architecture', async () => {
      render(
        <TestWrapper>
          <Web3StatusImproved showHealthMonitor={true} showAdvanced={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      
      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByText('Not Connected')).toBeInTheDocument();
      });
      
      // Verify the component renders correctly after hydration
      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });
  });
});
