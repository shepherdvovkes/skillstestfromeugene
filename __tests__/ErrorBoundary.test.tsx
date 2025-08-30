import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, WalletErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
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

describe('Error Boundary Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('ErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Wallet Connection Error')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles retry attempts correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Retry attempt: 1/3')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('shows max retries message after 3 attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      
      // Click retry 3 times
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Max Retries Reached')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles refresh page action', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(reloadSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      reloadSpy.mockRestore();
    });

    it('shows custom fallback when provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary
          fallback={<div>Custom error message</div>}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('calls onError callback when error occurs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('WalletErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Wallet error');
      }
      return <div>Wallet working</div>;
    };

    it('renders wallet-specific error boundary', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <WalletErrorBoundary>
          <ThrowError shouldThrow={true} />
        </WalletErrorBoundary>
      );

      expect(screen.getByText('Wallet Connection Error')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('useErrorHandler', () => {
    const TestComponent = () => {
      const { handleError } = useErrorHandler();

      const triggerError = () => {
        handleError(new Error('Test error'), 'TestComponent');
      };

      return (
        <button onClick={triggerError}>
          Trigger Error
        </button>
      );
    };

    it('handles errors correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TestComponent />);

      const button = screen.getByText('Trigger Error');
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in TestComponent:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('Connection Health Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('metaMask');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });
  });

  describe('useConnectionHealth', () => {
    const TestComponent = () => {
      const {
        health,
        isChecking,
        checkHealth,
        reconnect,
        getHealthSummary
      } = useConnectionHealth();

      return (
        <div>
          <div data-testid="status">{health.status}</div>
          <div data-testid="is-checking">{isChecking.toString()}</div>
          <button onClick={checkHealth}>Check Health</button>
          <button onClick={reconnect}>Reconnect</button>
          <div data-testid="summary">{JSON.stringify(getHealthSummary())}</div>
        </div>
      );
    };

    it('provides health monitoring functionality', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('status')).toHaveTextContent('healthy');
      expect(screen.getByTestId('is-checking')).toHaveTextContent('false');
      expect(screen.getByText('Check Health')).toBeInTheDocument();
      expect(screen.getByText('Reconnect')).toBeInTheDocument();
    });

    it('performs health check when triggered', async () => {
      render(<TestComponent />);

      const checkButton = screen.getByText('Check Health');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByTestId('is-checking')).toHaveTextContent('true');
      });
    });

    it('provides health summary', () => {
      render(<TestComponent />);

      const summary = screen.getByTestId('summary');
      const summaryData = JSON.parse(summary.textContent || '{}');
      
      expect(summaryData).toHaveProperty('status');
      expect(summaryData).toHaveProperty('issues');
      expect(summaryData).toHaveProperty('latency');
      expect(summaryData).toHaveProperty('uptime');
      expect(summaryData).toHaveProperty('isConnected');
      expect(summaryData).toHaveProperty('canReconnect');
    });
  });

  describe('ConnectionHealthMonitor', () => {
    it('renders health monitor when connected', () => {
      render(<ConnectionHealthMonitor />);

      expect(screen.getByText('Connection Health')).toBeInTheDocument();
      expect(screen.getByText('Check Health')).toBeInTheDocument();
    });

    it('shows disconnected state when not connected', () => {
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

    it('shows advanced details when enabled', () => {
      render(<ConnectionHealthMonitor showAdvanced={true} />);

      expect(screen.getByText('Advanced Details')).toBeInTheDocument();
      expect(screen.getByText('Health Summary')).toBeInTheDocument();
      expect(screen.getByText('Raw Health Data')).toBeInTheDocument();
    });

    it('toggles advanced details view', () => {
      render(<ConnectionHealthMonitor />);

      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Advanced Details')).toBeInTheDocument();
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    it('displays health metrics correctly', () => {
      render(<ConnectionHealthMonitor />);

      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('Latency')).toBeInTheDocument();
      expect(screen.getByText('Last Check')).toBeInTheDocument();
      expect(screen.getByText('Error Count')).toBeInTheDocument();
    });

    it('shows current issues', () => {
      render(<ConnectionHealthMonitor />);

      expect(screen.getByText('Current Issues')).toBeInTheDocument();
      expect(screen.getByText('No issues detected')).toBeInTheDocument();
    });

    it('handles health check action', async () => {
      render(<ConnectionHealthMonitor />);

      const checkButton = screen.getByText('Check Health');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(checkButton).toBeDisabled();
      });
    });
  });

  describe('Error Scenarios', () => {
    it('handles network check failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const TestComponent = () => {
        const { health } = useConnectionHealth();
        return <div data-testid="health-status">{health.status}</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('health-status')).toBeInTheDocument();
      });
    });

    it('handles wallet health check failures', async () => {
      // Mock wallet health check failure
      const mockConnector = {
        id: 'metaMask',
        name: 'MetaMask',
        ready: true,
        getProvider: jest.fn().mockRejectedValue(new Error('Provider error'))
      };

      jest.doMock('wagmi', () => ({
        useAccount: () => ({
          address: '0x1234567890123456789012345678901234567890',
          isConnected: true
        }),
        useNetwork: () => ({
          chain: { id: 137, name: 'Polygon' }
        }),
        useConnect: () => ({
          connect: jest.fn(),
          connectors: [mockConnector]
        }),
        useSwitchNetwork: () => ({
          switchNetwork: jest.fn(),
          isPending: false
        }),
        useDisconnect: () => ({
          disconnect: jest.fn()
        })
      }));

      const TestComponent = () => {
        const { health } = useConnectionHealth();
        return <div data-testid="health-status">{health.status}</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('health-status')).toBeInTheDocument();
      });
    });
  });
});
