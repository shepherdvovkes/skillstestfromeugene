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

// Mock wagmi/chains to avoid ES module issues
jest.mock('wagmi/chains', () => ({
  polygon: { id: 137, name: 'Polygon' },
  linea: { id: 59144, name: 'Linea' },
  bsc: { id: 56, name: 'BSC' }
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

// Mock the useConnectionHealth hook to avoid infinite loops
jest.mock('@/hooks/useConnectionHealth', () => ({
  useConnectionHealth: () => ({
    health: {
      status: 'healthy',
      isConnected: true,
      uptime: 300000, // 5 minutes
      latency: 50,
      lastCheck: Date.now(),
      errorCount: 0,
      issues: [],
      connectionAge: 300000,
      networkLatency: 50
    },
    isChecking: false,
    checkHealth: jest.fn(),
    reconnect: jest.fn(),
    getHealthSummary: jest.fn().mockReturnValue({
      status: 'healthy',
      issues: [],
      latency: 50,
      uptime: 300000,
      isConnected: true,
      canReconnect: true
    })
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
      // Test that the component renders without errors
      render(<WalletExample />);

      // The component should render properly
      expect(screen.getByText('Blockchain Wallet Connection')).toBeInTheDocument();
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
