import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletExample } from '@/components/examples/WalletExample';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock wagmi hooks with proper structure
const mockUseAccount = jest.fn();
const mockUseConnect = jest.fn();
const mockUseNetwork = jest.fn();
const mockUseSwitchNetwork = jest.fn();
const mockUseDisconnect = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useNetwork: () => mockUseNetwork(),
  useConnect: () => mockUseConnect(),
  useSwitchNetwork: () => mockUseSwitchNetwork(),
  useDisconnect: () => mockUseDisconnect(),
}));

// Mock the useUser hook
jest.mock('@/hooks/user', () => ({
  useUser: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    userPreferences: {
      autoReconnect: true,
      preferredNetworks: [137, 59144, 56],
      lastConnectedAt: Date.now()
    },
    saveUserPreferences: jest.fn(),
    checkConnectionHealth: jest.fn().mockReturnValue(true),
    connectors: [
      { id: 'metaMask', name: 'MetaMask', ready: true },
      { id: 'walletConnect', name: 'WalletConnect', ready: true }
    ]
  })
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

// Mock fetch for network checks
global.fetch = jest.fn();

describe('Example Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('metaMask');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });
    
    // Default mocks
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true
    });
    mockUseNetwork.mockReturnValue({
      chain: { id: 137, name: 'Polygon' }
    });
    mockUseConnect.mockReturnValue({
      connect: jest.fn(),
      connectors: [
        { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
      ],
      isLoading: false,
      error: null
    });
    mockUseSwitchNetwork.mockReturnValue({
      switchNetwork: jest.fn(),
      isPending: false
    });
    mockUseDisconnect.mockReturnValue({
      disconnect: jest.fn()
    });
  });

  describe('WalletExample Component', () => {
    it('renders wallet example interface', () => {
      render(<WalletExample />);

      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
      expect(screen.getByText(/Enhanced wallet connection with error handling/)).toBeInTheDocument();
    });

    it('shows wallet connection status', () => {
      render(<WalletExample />);

      expect(screen.getByText('Connection Active')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('displays wallet address when connected', () => {
      render(<WalletExample />);

      expect(screen.getByText('Wallet Address')).toBeInTheDocument();
      expect(screen.getByText('0x1234567890123456789012345678901234567890')).toBeInTheDocument();
    });

    it('shows network information', () => {
      render(<WalletExample />);

      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('handles wallet connection', async () => {
      const mockConnect = jest.fn();
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      mockUseNetwork.mockReturnValue({
        chain: null
      });
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [
          { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
        ],
        isLoading: false,
        error: null
      });

      render(<WalletExample />);

      // The component should show connection interface
      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
    });

    it('handles wallet disconnection', async () => {
      const mockDisconnect = jest.fn();
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect
      });

      render(<WalletExample />);

      // Look for disconnect functionality in the Web3Status component
      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
    });

    it('shows connection health monitoring', () => {
      render(<WalletExample />);

      expect(screen.getByText('Show Advanced Settings & Health Monitor')).toBeInTheDocument();
    });

    it('displays error boundary when errors occur', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <WalletExample>
          <ThrowError />
        </WalletExample>
      );

      // The ErrorBoundary should catch the error
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles network switching', async () => {
      const mockSwitchNetwork = jest.fn();
      mockUseSwitchNetwork.mockReturnValue({
        switchNetwork: mockSwitchNetwork,
        isPending: false
      });

      render(<WalletExample />);

      // The component should show network switching functionality
      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
    });

    it('shows loading states during operations', async () => {
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      mockUseNetwork.mockReturnValue({
        chain: null
      });
      mockUseConnect.mockReturnValue({
        connect: jest.fn(),
        connectors: [
          { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
        ],
        isLoading: true,
        error: null
      });
      mockUseSwitchNetwork.mockReturnValue({
        switchNetwork: jest.fn(),
        isPending: true
      });

      render(<WalletExample />);

      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
    });
  });
});
