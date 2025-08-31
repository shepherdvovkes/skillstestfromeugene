import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-hot-toast
import { walletToast, walletConnectionToast, networkToast, preferenceToast } from '@/utils/toast';

jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  const mockToastSuccess = jest.fn();
  const mockToastError = jest.fn();
  const mockToastInfo = jest.fn();
  const mockToastWarning = jest.fn();
  const mockToastLoading = jest.fn();
  const mockToastDismiss = jest.fn();

  return {
    toast: Object.assign(mockToast, {
      success: mockToastSuccess,
      error: mockToastError,
      info: mockToastInfo,
      warning: mockToastWarning,
      loading: mockToastLoading,
      dismiss: mockToastDismiss,
    }),
  };
});

describe('Toast Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('walletToast', () => {
    it('shows success message', () => {
      walletToast.success('Success message');

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Success message', expect.any(Object));
    });

    it('shows error message', () => {
      walletToast.error('Error message');

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith('Error message', expect.any(Object));
    });

    it('shows warning message', () => {
      walletToast.warning('Warning message');

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Warning message', expect.any(Object));
    });

    it('shows info message', () => {
      walletToast.info('Info message');

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Info message', expect.any(Object));
    });

    it('shows loading message', () => {
      walletToast.loading('Loading message');

      expect(jest.requireMock('react-hot-toast').toast.loading).toHaveBeenCalledWith('Loading message', expect.any(Object));
    });

    it('dismisses specific toast', () => {
      walletToast.dismiss('toast-id');

      expect(jest.requireMock('react-hot-toast').toast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    it('dismisses all toasts', () => {
      walletToast.dismissAll();

      expect(jest.requireMock('react-hot-toast').toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('walletConnectionToast', () => {
    it('shows connection success', () => {
      walletConnectionToast.connected('MetaMask');

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Successfully connected to MetaMask', expect.any(Object));
    });

    it('shows connection failed with generic message', () => {
      walletConnectionToast.failed('meta_mask');

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith('Connection failed: Unknown error', expect.any(Object));
    });

    it('shows connection failed with custom error', () => {
      walletConnectionToast.failed('meta_mask', 'Custom error message');

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith('Connection failed: Custom error message', expect.any(Object));
    });

    it('shows disconnection message', () => {
      walletConnectionToast.disconnected();

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Wallet disconnected', expect.any(Object));
    });

    it('shows network switched message', () => {
      walletConnectionToast.networkSwitched('Polygon');

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Switched to Polygon network', expect.any(Object));
    });

    it('shows unsupported network warning', () => {
      walletConnectionToast.unsupportedNetwork('Testnet');

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith(
        'Connected to unsupported network: Testnet. Please switch to a supported network.',
        expect.any(Object)
      );
    });

    it('shows auto-reconnect message', () => {
      walletConnectionToast.autoReconnected('MetaMask');

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Auto-reconnected to MetaMask', expect.any(Object));
    });

    it('shows connection stale warning', () => {
      walletConnectionToast.connectionStale();

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Connection may be stale. Please reconnect if needed.', expect.any(Object));
    });

    it('shows retry attempt message', () => {
      walletConnectionToast.retryAttempt(2, 3);

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Retrying connection... (2/3)', expect.any(Object));
    });

    it('shows max retries exceeded message', () => {
      walletConnectionToast.maxRetriesExceeded();

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith(
        'Maximum retry attempts exceeded. Please try connecting manually.',
        expect.any(Object)
      );
    });
  });

  describe('networkToast', () => {
    it('shows network validation failed', () => {
      networkToast.validationFailed('Polygon');

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith('Network validation failed for Polygon', expect.any(Object));
    });

    it('shows network not supported', () => {
      networkToast.notSupported('Testnet');

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Testnet is not supported. Please switch to a supported network.', expect.any(Object));
    });

    it('shows network switching', () => {
      networkToast.switching('Polygon');

      expect(jest.requireMock('react-hot-toast').toast.loading).toHaveBeenCalledWith('Switching to Polygon...', expect.any(Object));
    });

    it('shows network switch success', () => {
      networkToast.switchSuccess('Polygon');

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Successfully switched to Polygon', expect.any(Object));
    });

    it('shows network switch error', () => {
      networkToast.switchError('Polygon', 'Network error');

      expect(jest.requireMock('react-hot-toast').toast.error).toHaveBeenCalledWith('Failed to switch to Polygon: Network error', expect.any(Object));
    });
  });

  describe('preferenceToast', () => {
    it('shows auto-reconnect enabled', () => {
      preferenceToast.autoReconnectEnabled();

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Auto-reconnect enabled', expect.any(Object));
    });

    it('shows auto-reconnect disabled', () => {
      preferenceToast.autoReconnectDisabled();

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Auto-reconnect disabled', expect.any(Object));
    });

    it('shows preferences saved', () => {
      preferenceToast.saved();

      expect(jest.requireMock('react-hot-toast').toast.success).toHaveBeenCalledWith('Preferences saved', expect.any(Object));
    });

    it('shows preferences reset', () => {
      preferenceToast.reset();

      expect(jest.requireMock('react-hot-toast').toast).toHaveBeenCalledWith('Preferences reset to default', expect.any(Object));
    });
  });
});

