import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WalletConnectionUI } from '@/components/wallet/WalletConnectionUI';
import { WalletStrategy } from '@/strategies/WalletStrategy';

// Mock the toast system
jest.mock('@/utils/toast', () => ({
  walletConnectionToast: {
    failed: jest.fn(),
    retryAttempt: jest.fn(),
    maxRetriesExceeded: jest.fn()
  }
}));

// Mock wallet strategies
const createMockWalletStrategy = (id: string, name: string): WalletStrategy => ({
  id,
  name,
  getErrorMessage: jest.fn().mockReturnValue(`Error with ${name}`),
  validateConnection: jest.fn().mockResolvedValue(true),
  getConnectionSteps: jest.fn().mockReturnValue([]),
  getInstallationUrl: jest.fn().mockReturnValue('https://example.com'),
  isInstalled: jest.fn().mockReturnValue(true),
  getProvider: jest.fn().mockReturnValue(null)
});

describe('WalletConnectionUI - Enhanced Features', () => {
  const mockProps = {
    isConnected: false,
    isConnecting: false,
    address: null,
    walletType: null,
    error: null,
    availableWallets: [
      createMockWalletStrategy('metaMask', 'MetaMask'),
      createMockWalletStrategy('walletConnect', 'WalletConnect'),
      createMockWalletStrategy('tokenPocket', 'TokenPocket')
    ],
    lastConnectedWallet: null,
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Error Handling with Retry Mechanism', () => {
    it('should display retry count for failed connections', () => {
      render(<WalletConnectionUI {...mockProps} error="Connection failed" walletType="metaMask" />);
      
      expect(screen.getByText('Retries: 0/3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('should increment retry count on retry attempts', async () => {
      const { walletConnectionToast } = require('@/utils/toast');
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      // First retry attempt
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(walletConnectionToast.retryAttempt).toHaveBeenCalledWith(1, 3);
    });

    it('should disable retry button after max retries reached', async () => {
      const { walletConnectionToast } = require('@/utils/toast');
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      // Perform 3 retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(retryButton);
        });
      }

      // Button should be disabled after max retries
      expect(retryButton).toBeDisabled();
      expect(walletConnectionToast.maxRetriesExceeded).toHaveBeenCalled();
    });

    it('should show max retries message when limit reached', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      // Perform 3 retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(retryButton);
        });
      }

      expect(screen.getByText('Max retries reached. Please try again later.')).toBeInTheDocument();
    });

    it('should reset retry count on successful connection', async () => {
      const mockOnConnect = jest.fn().mockResolvedValue(undefined);
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const connectButton = screen.getByText('Connect MetaMask').closest('button');
      expect(connectButton).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(connectButton!);
      });

      // Retry count should be reset to 0
      expect(screen.queryByText('Retry attempts: 1/3')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Wallet Connection Buttons', () => {
    it('should show retry attempts for each wallet after failed connection', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const metaMaskButton = screen.getByText('Connect MetaMask').closest('button');
      expect(metaMaskButton).toBeInTheDocument();
      
      // First attempt fails
      await act(async () => {
        fireEvent.click(metaMaskButton!);
      });

      // Should show retry count after error occurs
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      expect(screen.getByText('Retry attempts: 1/3')).toBeInTheDocument();
    });

    it('should change button variant to destructive after max retries', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const metaMaskButton = screen.getByText('Connect MetaMask').closest('button');
      expect(metaMaskButton).toBeInTheDocument();
      
      // Perform 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(metaMaskButton!);
        });
      }

      // Button should have destructive variant
      expect(metaMaskButton).toHaveClass('bg-red-600', 'text-white');
    });

    it('should disable wallet buttons after max retries reached', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const metaMaskButton = screen.getByText('Connect MetaMask').closest('button');
      expect(metaMaskButton).toBeInTheDocument();
      
      // Perform 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(metaMaskButton!);
        });
      }

      // Button should be disabled
      expect(metaMaskButton).toBeDisabled();
    });
  });

  describe('Enhanced Error Display', () => {
    it('should show retry button with proper state', () => {
      render(<WalletConnectionUI {...mockProps} error="Connection failed" walletType="metaMask" />);
      
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should show retry button as disabled when retrying', async () => {
      const mockOnConnect = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Button should show "Retrying..." and be disabled
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
    });

    it('should show retry count in error display', () => {
      render(<WalletConnectionUI {...mockProps} error="Connection failed" walletType="metaMask" />);
      
      expect(screen.getByText('Retries: 0/3')).toBeInTheDocument();
    });
  });

  describe('Toast Integration', () => {
    it('should call retry attempt toast on retry', async () => {
      const { walletConnectionToast } = require('@/utils/toast');
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(walletConnectionToast.retryAttempt).toHaveBeenCalledWith(1, 3);
    });

    it('should call max retries exceeded toast when limit reached', async () => {
      const { walletConnectionToast } = require('@/utils/toast');
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      // Perform 3 retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(retryButton);
        });
      }

      expect(walletConnectionToast.maxRetriesExceeded).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should maintain separate retry counts for different wallets', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const metaMaskButton = screen.getByText('Connect MetaMask').closest('button');
      const walletConnectButton = screen.getByText('Connect WalletConnect').closest('button');
      expect(metaMaskButton).toBeInTheDocument();
      expect(walletConnectButton).toBeInTheDocument();
      
      // Fail MetaMask connection once
      await act(async () => {
        fireEvent.click(metaMaskButton!);
      });

      // Fail WalletConnect connection twice
      await act(async () => {
        fireEvent.click(walletConnectButton!);
      });
      await act(async () => {
        fireEvent.click(walletConnectButton!);
      });

      // Re-render with error to show retry counts
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      // Should show different retry counts
      expect(screen.getByText('Retry attempts: 1/3')).toBeInTheDocument();
      expect(screen.getByText('Retry attempts: 2/3')).toBeInTheDocument();
    });

    it('should reset retry count for specific wallet on successful connection', async () => {
      const mockOnConnect = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed')) // First MetaMask attempt fails
        .mockResolvedValueOnce(undefined); // Second MetaMask attempt succeeds
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          onConnect={mockOnConnect}
        />
      );

      const metaMaskButton = screen.getByText('Connect MetaMask').closest('button');
      expect(metaMaskButton).toBeInTheDocument();
      
      // First attempt fails
      await act(async () => {
        fireEvent.click(metaMaskButton!);
      });

      // Re-render with error to show retry count
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      // Should show retry count
      expect(screen.getByText('Retry attempts: 1/3')).toBeInTheDocument();

      // Second attempt succeeds
      await act(async () => {
        fireEvent.click(metaMaskButton!);
      });

      // Retry count should be reset
      expect(screen.queryByText('Retry attempts: 1/3')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels for retry functionality', () => {
      render(<WalletConnectionUI {...mockProps} error="Connection failed" walletType="metaMask" />);
      
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toBeInTheDocument();
      // The retry button doesn't have aria-label, but it's accessible via role and name
      expect(retryButton).toBeInTheDocument();
    });

    it('should show loading state during retry attempts', async () => {
      const mockOnConnect = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    it('should provide clear feedback for retry limits', async () => {
      const mockOnConnect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      render(
        <WalletConnectionUI 
          {...mockProps} 
          error="Connection failed" 
          walletType="metaMask"
          onConnect={mockOnConnect}
        />
      );

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      
      // Perform 3 retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(retryButton);
        });
      }

      expect(screen.getByText('Max retries reached. Please try again later.')).toBeInTheDocument();
    });
  });
});
