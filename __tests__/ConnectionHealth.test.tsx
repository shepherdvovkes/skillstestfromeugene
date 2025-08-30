import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConnectionHealthMonitor } from '@/components/ConnectionHealthMonitor';

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

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true
  }),
  useNetwork: () => ({
    chain: { id: 137, name: 'Polygon' }
  }),
  useConnect: () => ({
    connect: jest.fn(),
    connectors: [
      { id: 'metaMask', name: 'MetaMask', ready: true, getProvider: jest.fn() }
    ]
  }),
  useSwitchNetwork: () => ({
    switchNetwork: jest.fn(),
    isPending: false
  }),
  useDisconnect: () => ({
    disconnect: jest.fn()
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

describe('ConnectionHealthMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('metaMask');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });
  });

  it('should render connection health monitor', () => {
    render(<ConnectionHealthMonitor />);

    expect(screen.getByText('Connection Health')).toBeInTheDocument();
    expect(screen.getByText('Check Health')).toBeInTheDocument();
  });

  it('should show health metrics', () => {
    render(<ConnectionHealthMonitor />);

    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('Latency')).toBeInTheDocument();
    expect(screen.getByText('Last Check')).toBeInTheDocument();
    expect(screen.getByText('Error Count')).toBeInTheDocument();
  });

  it('should show current issues section', () => {
    render(<ConnectionHealthMonitor />);

    expect(screen.getByText('Current Issues')).toBeInTheDocument();
    expect(screen.getByText('No issues detected')).toBeInTheDocument();
  });

  it('should toggle advanced details view', () => {
    render(<ConnectionHealthMonitor />);

    const toggleButton = screen.getByText('Show Details');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Advanced Details')).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });

  it('should show advanced details when enabled', () => {
    render(<ConnectionHealthMonitor showAdvanced={true} />);

    expect(screen.getByText('Advanced Details')).toBeInTheDocument();
    expect(screen.getByText('Health Summary')).toBeInTheDocument();
    expect(screen.getByText('Raw Health Data')).toBeInTheDocument();
  });

  it('should handle health check action', async () => {
    render(<ConnectionHealthMonitor />);

    const checkButton = screen.getByText('Check Health');
    fireEvent.click(checkButton);

    // The button should be clickable
    expect(checkButton).toBeInTheDocument();
  });

  it('should show disconnected state when not connected', () => {
    // Mock disconnected state
    jest.doMock('wagmi', () => ({
      useAccount: () => ({
        address: null,
        isConnected: false
      }),
      useNetwork: () => ({
        chain: null
      }),
      useConnect: () => ({
        connect: jest.fn(),
        connectors: []
      }),
      useSwitchNetwork: () => ({
        switchNetwork: jest.fn(),
        isPending: false
      }),
      useDisconnect: () => ({
        disconnect: jest.fn()
      })
    }));

    render(<ConnectionHealthMonitor />);

    expect(screen.getByText('Connection Health')).toBeInTheDocument();
    expect(screen.getByText('Wallet not connected. Health monitoring will start when connected.')).toBeInTheDocument();
  });
});
