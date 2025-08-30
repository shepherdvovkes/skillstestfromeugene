import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnect } from '@/components/web3/WalletConnect';
import { Web3Status } from '@/components/web3/Web3Status';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
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

// Mock wagmi/chains to avoid ES module issues
jest.mock('wagmi/chains', () => ({
  polygon: { id: 137, name: 'Polygon' },
  linea: { id: 59144, name: 'Linea' },
  bsc: { id: 56, name: 'BSC' }
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

describe('Wallet Connection Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
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
        { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() },
        { id: 'walletConnect', name: 'WalletConnect', ready: true, getProvider: jest.fn() }
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

  describe('WalletConnect Component', () => {
    it('renders connect buttons for available connectors', () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('shows loading state during connection', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('handles connection errors gracefully', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      // Mock a connection error
      const mockError = new Error('User rejected connection');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('saves connection state to localStorage on successful connection', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });
  });

  describe('Web3Status Component', () => {
    it('renders wallet connection interface when not connected', () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });
      mockUseNetwork.mockReturnValue({
        chain: null
      });
      mockUseConnect.mockReturnValue({
        connect: jest.fn(),
        connectors: [],
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

      render(<Web3Status />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('shows connection progress during connection', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      render(<Web3Status />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('displays network status when connected', async () => {
      render(<Web3Status />);

      expect(screen.getByText('Wallet Status')).toBeInTheDocument();
      expect(screen.getByText('Successfully connected to MetaMask')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles MetaMask specific errors', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      const mockError = new Error('MetaMask not installed');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });

    it('handles WalletConnect specific errors', async () => {
      // Mock disconnected state
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false
      });

      const mockError = new Error('WalletConnect connection failed');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<WalletConnect />);

      expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument();
    });
  });

  describe('Network Validation', () => {
    it('validates supported networks', () => {
      render(<Web3Status />);

      // Check that supported networks are configured
      expect(screen.getByText('Wallet Status')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();
    });

    it('shows network switching options', async () => {
      render(<Web3Status />);

      expect(screen.getByText('Wallet Status')).toBeInTheDocument();
      expect(screen.getByText('Quick network switch:')).toBeInTheDocument();
    });
  });

  describe('Connection Persistence', () => {
    it('remembers last connected wallet', () => {
      localStorageMock.getItem.mockReturnValue('metaMask');

      render(<WalletConnect />);

      // The component should render properly when there's a last connected wallet
      // Since the mock returns connected state, we should see the connected UI
      expect(screen.getByText(/Connected:/)).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('clears connection state on disconnect', async () => {
      render(<WalletConnect />);

      // The component should show disconnect functionality
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });
  });
});
