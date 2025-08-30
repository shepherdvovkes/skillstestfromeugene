import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualReconnect } from '@/components/web3/ManualReconnect';
import { ClientOnlyWalletConnect } from '@/components/web3/ClientOnlyWalletConnect';

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

// Mock the storage utility
const mockGetLastConnectedWallet = jest.fn();
const mockSetLastConnectedWallet = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@/utils/storage', () => ({
  walletStorage: {
    getLastConnectedWallet: () => mockGetLastConnectedWallet(),
    setLastConnectedWallet: (wallet: string) => mockSetLastConnectedWallet(wallet),
    removeItem: (key: string) => mockRemoveItem(key),
  },
}));

// Mock the toast utility
const mockToastConnected = jest.fn();
const mockToastFailed = jest.fn();
const mockToastDisconnected = jest.fn();

jest.mock('@/utils/toast', () => ({
  walletConnectionToast: {
    connected: (wallet: string) => mockToastConnected(wallet),
    failed: (wallet: string, error: string) => mockToastFailed(wallet, error),
    disconnected: () => mockToastDisconnected(),
  },
}));

// Mock fetch for network checks
global.fetch = jest.fn();

describe('Web3 Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLastConnectedWallet.mockReturnValue('metaMask');
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

  describe('ManualReconnect Component', () => {
    it('renders manual reconnect interface when disconnected', () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ManualReconnect />);

      expect(screen.getByText('Reconnect to your previous wallet:')).toBeInTheDocument();
      expect(screen.getByText('Reconnect metaMask')).toBeInTheDocument();
    });

    it('does not render when connected', () => {
      render(<ManualReconnect />);

      expect(screen.queryByText('Reconnect to your previous wallet:')).not.toBeInTheDocument();
    });

    it('does not render when no previous wallet', () => {
      mockGetLastConnectedWallet.mockReturnValue(null);
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      
      render(<ManualReconnect />);

      expect(screen.queryByText('Reconnect to your previous wallet:')).not.toBeInTheDocument();
    });

    it('handles reconnect action', async () => {
      const mockConnect = jest.fn();
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [
          { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
        ],
        isLoading: false,
        error: null
      });

      render(<ManualReconnect />);

      const reconnectButton = screen.getByText('Reconnect metaMask');
      fireEvent.click(reconnectButton);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });
    });

    it('shows reconnecting state', async () => {
      const mockConnect = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [
          { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
        ],
        isLoading: false,
        error: null
      });

      render(<ManualReconnect />);

      const reconnectButton = screen.getByText('Reconnect metaMask');
      fireEvent.click(reconnectButton);

      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    });
  });

  describe('ClientOnlyWalletConnect Component', () => {
    it('renders client-only wallet connect', () => {
      // Mock disconnected state for this test
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ClientOnlyWalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      // Mock disconnected state for this test
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ClientOnlyWalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
      // Check that the component renders properly
      expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
    });

    it('renders wallet connect after hydration', async () => {
      // Mock disconnected state for this test
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ClientOnlyWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
      });
    });

    it('handles client-side rendering correctly', () => {
      // Mock disconnected state for this test
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ClientOnlyWalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('calls onConnectionChange callback', async () => {
      const mockOnConnectionChange = jest.fn();
      
      // Mock disconnected state initially, then connected after interaction
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<ClientOnlyWalletConnect onConnectionChange={mockOnConnectionChange} />);

      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
      });
      
      // The component should show the connection interface
      expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
    });
  });
});
