import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  const mockToastSuccess = jest.fn();
  const mockToastError = jest.fn();
  const mockToastLoading = jest.fn();
  const mockToastDismiss = jest.fn();

  return {
    toast: Object.assign(mockToast, {
      success: mockToastSuccess,
      error: mockToastError,
      loading: mockToastLoading,
      dismiss: mockToastDismiss,
    }),
  };
});

import { walletToast, walletConnectionToast, networkToast, preferenceToast } from '@/utils/toast';

describe('Toast Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('walletToast', () => {
    it('shows success toast with default options', () => {
      const { toast } = require('react-hot-toast');
      walletToast.success('Success message');

      expect(toast.success).toHaveBeenCalledWith('Success message', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#059669',
          color: '#fff',
        }),
      });
    });

    it('shows success toast with custom options', () => {
      const { toast } = require('react-hot-toast');
      const customOptions = {
        duration: 5000,
        position: 'bottom-left' as const,
      };

      walletToast.success('Custom success message', customOptions);

      expect(toast.success).toHaveBeenCalledWith('Custom success message', {
        duration: 5000,
        position: 'bottom-left',
        style: expect.objectContaining({
          background: '#059669',
        }),
      });
    });

    it('shows error toast with default options', () => {
      const { toast } = require('react-hot-toast');
      walletToast.error('Error message');

      expect(toast.error).toHaveBeenCalledWith('Error message', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#dc2626',
          color: '#fff',
        }),
      });
    });

    it('shows warning toast with default options', () => {
      const { toast } = require('react-hot-toast');
      walletToast.warning('Warning message');

      expect(toast).toHaveBeenCalledWith('Warning message', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#d97706',
          color: '#fff',
        }),
      });
    });

    it('shows info toast with default options', () => {
      const { toast } = require('react-hot-toast');
      walletToast.info('Info message');

      expect(toast).toHaveBeenCalledWith('Info message', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#363636',
          color: '#fff',
        }),
      });
    });

    it('shows loading toast', () => {
      const { toast } = require('react-hot-toast');
      walletToast.loading('Loading message');

      expect(toast.loading).toHaveBeenCalledWith('Loading message', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#363636',
          color: '#fff',
        }),
      });
    });

    it('dismisses specific toast', () => {
      const { toast } = require('react-hot-toast');
      walletToast.dismiss('toast-id');

      expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    it('dismisses all toasts', () => {
      const { toast } = require('react-hot-toast');
      walletToast.dismissAll();

      expect(toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('walletConnectionToast', () => {
    it('shows connection success', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.connected('MetaMask');

      expect(toast.success).toHaveBeenCalledWith('Successfully connected to MetaMask', expect.any(Object));
    });

    it('shows connection failed for MetaMask', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.failed('meta_mask');

      expect(toast.error).toHaveBeenCalledWith(
        'MetaMask connection failed. Please check if MetaMask is installed and unlocked.',
        expect.any(Object)
      );
    });

    it('shows connection failed for WalletConnect', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.failed('wallet_connect');

      expect(toast.error).toHaveBeenCalledWith(
        'WalletConnect connection failed. Please try again.',
        expect.any(Object)
      );
    });

    it('shows disconnection message', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.disconnected();

      expect(toast).toHaveBeenCalledWith('Wallet disconnected', expect.any(Object));
    });

    it('shows network switched message', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.networkSwitched('Polygon');

      expect(toast.success).toHaveBeenCalledWith('Switched to Polygon network', expect.any(Object));
    });

    it('shows unsupported network warning', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.unsupportedNetwork('Testnet');

      expect(toast).toHaveBeenCalledWith(
        'Connected to unsupported network: Testnet. Please switch to a supported network.',
        expect.any(Object)
      );
    });

    it('shows auto-reconnect message', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.autoReconnected('MetaMask');

      expect(toast.success).toHaveBeenCalledWith('Auto-reconnected to MetaMask', expect.any(Object));
    });

    it('shows retry attempt message', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.retryAttempt(2, 3);

      expect(toast).toHaveBeenCalledWith('Retrying connection... (2/3)', expect.any(Object));
    });

    it('shows max retries exceeded message', () => {
      const { toast } = require('react-hot-toast');
      walletConnectionToast.maxRetriesExceeded();

      expect(toast.error).toHaveBeenCalledWith(
        'Maximum retry attempts exceeded. Please try connecting manually.',
        expect.any(Object)
      );
    });
  });

  describe('networkToast', () => {
    it('shows network validation failed', () => {
      const { toast } = require('react-hot-toast');
      networkToast.validationFailed('Polygon');

      expect(toast.error).toHaveBeenCalledWith('Network validation failed for Polygon', expect.any(Object));
    });

    it('shows network not supported', () => {
      const { toast } = require('react-hot-toast');
      networkToast.notSupported('Testnet');

      expect(toast).toHaveBeenCalledWith('Testnet is not supported. Please switch to a supported network.', expect.any(Object));
    });

    it('shows network switching', () => {
      const { toast } = require('react-hot-toast');
      networkToast.switching('Polygon');

      expect(toast.loading).toHaveBeenCalledWith('Switching to Polygon...', expect.any(Object));
    });

    it('shows network switch success', () => {
      const { toast } = require('react-hot-toast');
      networkToast.switchSuccess('Polygon');

      expect(toast.success).toHaveBeenCalledWith('Successfully switched to Polygon', expect.any(Object));
    });
  });

  describe('preferenceToast', () => {
    it('shows auto-reconnect enabled', () => {
      const { toast } = require('react-hot-toast');
      preferenceToast.autoReconnectEnabled();

      expect(toast.success).toHaveBeenCalledWith('Auto-reconnect enabled', expect.any(Object));
    });

    it('shows auto-reconnect disabled', () => {
      const { toast } = require('react-hot-toast');
      preferenceToast.autoReconnectDisabled();

      expect(toast).toHaveBeenCalledWith('Auto-reconnect disabled', expect.any(Object));
    });

    it('shows preferences saved', () => {
      const { toast } = require('react-hot-toast');
      preferenceToast.saved();

      expect(toast.success).toHaveBeenCalledWith('Preferences saved', expect.any(Object));
    });

    it('shows preferences reset', () => {
      const { toast } = require('react-hot-toast');
      preferenceToast.reset();

      expect(toast).toHaveBeenCalledWith('Preferences reset to default', expect.any(Object));
    });
  });
});

