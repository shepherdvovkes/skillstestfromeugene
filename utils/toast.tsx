import { toast, ToastOptions } from 'react-hot-toast';
import { APP_CONFIG } from '@/config/constants';

const walletToastStyles: ToastOptions = {
  duration: APP_CONFIG.UI.TOAST_DURATION,
  position: APP_CONFIG.UI.TOAST_POSITION,
  style: {
    background: APP_CONFIG.UI.COLORS.BACKGROUND,
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

const errorToastStyles: ToastOptions = {
  ...walletToastStyles,
  style: {
    ...walletToastStyles.style,
    background: APP_CONFIG.UI.COLORS.ERROR,
    border: `1px solid ${APP_CONFIG.UI.COLORS.BORDER_ERROR}`,
  },
};

const successToastStyles: ToastOptions = {
  ...walletToastStyles,
  style: {
    ...walletToastStyles.style,
    background: APP_CONFIG.UI.COLORS.SUCCESS,
    border: `1px solid ${APP_CONFIG.UI.COLORS.BORDER_SUCCESS}`,
  },
};

const warningToastStyles: ToastOptions = {
  ...walletToastStyles,
  style: {
    ...walletToastStyles.style,
    background: APP_CONFIG.UI.COLORS.WARNING,
    border: `1px solid ${APP_CONFIG.UI.COLORS.BORDER_WARNING}`,
  },
};

const infoToastStyles: ToastOptions = {
  ...walletToastStyles,
  style: {
    ...walletToastStyles.style,
    background: APP_CONFIG.UI.COLORS.INFO || '#3B82F6',
    border: `1px solid ${APP_CONFIG.UI.COLORS.BORDER_INFO || '#1D4ED8'}`,
  },
};

export const walletToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...successToastStyles,
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...errorToastStyles,
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      ...warningToastStyles,
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      ...infoToastStyles,
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...walletToastStyles,
      ...options,
    });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

export const walletConnectionToast = {
  connected: (walletName: string) => {
    return walletToast.success(`Successfully connected to ${walletName}`);
  },

  failed: (walletType: string, error?: string) => {
    const message = `Connection failed: ${error || 'Unknown error'}`;
    return walletToast.error(message);
  },

  disconnected: () => {
    return walletToast.info('Wallet disconnected');
  },

  networkSwitched: (networkName: string) => {
    return walletToast.success(`Switched to ${networkName} network`);
  },

  networkSwitchFailed: (error?: string) => {
    return walletToast.error(`Failed to switch network: ${error || 'Unknown error'}`);
  },

  unsupportedNetwork: (networkName: string) => {
    return walletToast.warning(`Connected to unsupported network: ${networkName}. Please switch to a supported network.`);
  },

  autoReconnected: (walletName: string) => {
    return walletToast.success(`Auto-reconnected to ${walletName}`);
  },

  connectionStale: () => {
    return walletToast.warning('Connection may be stale. Please reconnect if needed.');
  },

  retryAttempt: (attempt: number, maxAttempts: number) => {
    return walletToast.info(`Retrying connection... (${attempt}/${maxAttempts})`);
  },

  maxRetriesExceeded: () => {
    return walletToast.error('Maximum retry attempts exceeded. Please try connecting manually.');
  },
};

export const networkToast = {
  validationFailed: (networkName: string) => {
    return walletToast.error(`Network validation failed for ${networkName}`);
  },

  notSupported: (networkName: string) => {
    return walletToast.warning(`${networkName} is not supported. Please switch to a supported network.`);
  },

  switching: (networkName: string) => {
    return walletToast.loading(`Switching to ${networkName}...`);
  },

  switchSuccess: (networkName: string) => {
    return walletToast.success(`Successfully switched to ${networkName}`);
  },

  switchError: (networkName: string, error?: string) => {
    return walletToast.error(`Failed to switch to ${networkName}: ${error || 'Unknown error'}`);
  },
};

export const preferenceToast = {
  autoReconnectEnabled: () => {
    return walletToast.success('Auto-reconnect enabled');
  },

  autoReconnectDisabled: () => {
    return walletToast.info('Auto-reconnect disabled');
  },

  saved: () => {
    return walletToast.success('Preferences saved');
  },

  reset: () => {
    return walletToast.info('Preferences reset to default');
  },
};

export { toast as default };
