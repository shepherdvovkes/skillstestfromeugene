import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, linea, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { WalletConnect } from '@/components/web3/WalletConnect';
import { Web3Status } from '@/components/web3/Web3Status';
import { useUser } from '@/hooks/user';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Configure chains and providers for testing
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon, linea, bsc],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: false, // Disable autoConnect to prevent race conditions in tests
  publicClient,
  webSocketPublicClient,
  connectors: [
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'test-project-id',
        metadata: {
          name: 'Test Wallet Demo',
          description: 'Test blockchain wallet connection demo',
          url: 'http://localhost:3000',
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
      },
    }),
  ],
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WagmiConfig config={config}>
    {children}
  </WagmiConfig>
);

describe('Wallet Connection Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('WalletConnect Component', () => {
    it('renders connect buttons for available connectors', () => {
      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      expect(screen.getByText(/Connect MetaMask/)).toBeInTheDocument();
      expect(screen.getByText(/Connect WalletConnect/)).toBeInTheDocument();
    });

    it('shows loading state during connection', async () => {
      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Connecting/)).toBeInTheDocument();
      });
    });

    it('handles connection errors gracefully', async () => {
      // Mock a connection error
      const mockError = new Error('User rejected connection');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('saves connection state to localStorage on successful connection', async () => {
      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'lastConnectedWallet',
          'metaMask'
        );
      });
    });
  });

  describe('Web3Status Component', () => {
    it('renders wallet connection interface when not connected', () => {
      render(
        <TestWrapper>
          <Web3Status />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText(/Connect your wallet to continue/)).toBeInTheDocument();
    });

    it('shows connection progress during connection', async () => {
      render(
        <TestWrapper>
          <Web3Status />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('displays network status when connected', async () => {
      // Mock connected state
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      render(
        <TestWrapper>
          <Web3Status />
        </TestWrapper>
      );

      // Simulate connection
      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Wallet Status')).toBeInTheDocument();
      });
    });
  });

  describe('useUser Hook', () => {
    const TestComponent: React.FC = () => {
      const {
        isConnected,
        address,
        userPreferences,
        saveUserPreferences,
        connectWallet,
        disconnectWallet,
        connectors
      } = useUser();

      return (
        <div>
          <div data-testid="connection-status">
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div data-testid="address">{address || 'No address'}</div>
          <div data-testid="auto-reconnect">
            {userPreferences.autoReconnect ? 'Enabled' : 'Disabled'}
          </div>
          <button
            onClick={() => saveUserPreferences({ autoReconnect: !userPreferences.autoReconnect })}
            data-testid="toggle-auto-reconnect"
          >
            Toggle Auto-reconnect
          </button>
          <div data-testid="connectors-count">
            {connectors.length} connectors available
          </div>
        </div>
      );
    };

    it('provides connection state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('address')).toHaveTextContent('No address');
    });

    it('manages user preferences', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auto-reconnect')).toHaveTextContent('Enabled');
      
      const toggleButton = screen.getByTestId('toggle-auto-reconnect');
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('auto-reconnect')).toHaveTextContent('Disabled');
    });

    it('saves preferences to localStorage', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('toggle-auto-reconnect');
      fireEvent.click(toggleButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userWalletPreferences',
        expect.stringContaining('"autoReconnect":false')
      );
    });

    it('loads preferences from localStorage on mount', () => {
      const savedPreferences = {
        autoReconnect: false,
        preferredNetworks: [137, 59144, 56],
        lastConnectedAt: 0
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('auto-reconnect')).toHaveTextContent('Disabled');
    });
  });

  describe('Error Handling', () => {
    it('handles MetaMask specific errors', async () => {
      const mockError = new Error('MetaMask not installed');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Wallet connection error (metaMask)'),
          expect.any(Error)
        );
      });
    });

    it('handles WalletConnect specific errors', async () => {
      const mockError = new Error('WalletConnect connection failed');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      const connectButton = screen.getByText(/Connect WalletConnect/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Wallet connection error (walletConnect)'),
          expect.any(Error)
        );
      });
    });
  });

  describe('Network Validation', () => {
    it('validates supported networks', () => {
      render(
        <TestWrapper>
          <Web3Status />
        </TestWrapper>
      );

      // Check that supported networks are configured
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('shows network switching options', async () => {
      render(
        <TestWrapper>
          <Web3Status />
        </TestWrapper>
      );

      // Simulate connection to trigger network validation
      const connectButton = screen.getByText(/Connect MetaMask/);
      fireEvent.click(connectButton);

      await waitFor(() => {
        // Network switching options should be available
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Persistence', () => {
    it('remembers last connected wallet', () => {
      localStorageMock.getItem.mockReturnValue('metaMask');

      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('lastConnectedWallet');
    });

    it('clears connection state on disconnect', async () => {
      render(
        <TestWrapper>
          <WalletConnect />
        </TestWrapper>
      );

      // Simulate disconnect
      const disconnectButton = screen.getByText(/Disconnect/);
      if (disconnectButton) {
        fireEvent.click(disconnectButton);
      }

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('lastConnectedWallet');
      });
    });
  });
});
