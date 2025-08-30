import { toast, ToastOptions } from 'react-hot-toast';
import { APP_CONFIG } from '@/config/constants';

// Custom toast styles for wallet notifications
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

// Wallet-specific toast functions
export const walletToast = {
  // Success notifications
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...successToastStyles,
      ...options,
    });
  },

  // Error notifications
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...errorToastStyles,
      ...options,
    });
  },

  // Warning notifications
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...warningToastStyles,
      ...options,
    });
  },

  // Info notifications
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...walletToastStyles,
      ...options,
    });
  },

  // Loading notifications
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...walletToastStyles,
      ...options,
    });
  },

  // Dismiss specific toast
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

// Wallet connection specific notifications
export const walletConnectionToast = {
  // Connection success
  connected: (walletName: string) => {
    return walletToast.success(`Successfully connected to ${walletName}`);
  },

  // Connection failed
  failed: (walletType: string, error?: string) => {
    const messages = {
      'meta_mask': 'MetaMask connection failed. Please check if MetaMask is installed and unlocked.',
      'token_pocket': 'TokenPocket connection failed. Please check if TokenPocket is installed and unlocked.',
      'bitget_wallet': 'Bitget Wallet connection failed. Please check if Bitget Wallet is installed and unlocked.',
      'particle_network': 'Particle Network connection failed. Please try again.',
      'wallet_connect': 'WalletConnect connection failed. Please try again.',
    };

    const message = messages[walletType as keyof typeof messages] || 
                   `Connection failed: ${error || 'Unknown error'}`;
    
    return walletToast.error(message);
  },

  // Disconnected
  disconnected: () => {
    return walletToast.info('Wallet disconnected');
  },

  // Network switched
  networkSwitched: (networkName: string) => {
    return walletToast.success(`Switched to ${networkName} network`);
  },

  // Network switch failed
  networkSwitchFailed: (error?: string) => {
    return walletToast.error(`Failed to switch network: ${error || 'Unknown error'}`);
  },

  // Unsupported network
  unsupportedNetwork: (networkName: string) => {
    return walletToast.warning(`Connected to unsupported network: ${networkName}. Please switch to a supported network.`);
  },

  // Auto-reconnect
  autoReconnected: (walletName: string) => {
    return walletToast.success(`Auto-reconnected to ${walletName}`);
  },

  // Connection stale
  connectionStale: () => {
    return walletToast.warning('Connection may be stale. Please reconnect if needed.');
  },

  // Retry attempt
  retryAttempt: (attempt: number, maxAttempts: number) => {
    return walletToast.info(`Retrying connection... (${attempt}/${maxAttempts})`);
  },

  // Max retries exceeded
  maxRetriesExceeded: () => {
    return walletToast.error('Maximum retry attempts exceeded. Please try connecting manually.');
  },
};

// Network-specific notifications
export const networkToast = {
  // Network validation
  validationFailed: (networkName: string) => {
    return walletToast.error(`Network validation failed for ${networkName}`);
  },

  // Network not supported
  notSupported: (networkName: string) => {
    return walletToast.warning(`${networkName} is not supported. Please switch to a supported network.`);
  },

  // Network switching
  switching: (networkName: string) => {
    return walletToast.loading(`Switching to ${networkName}...`);
  },

  // Network switch success
  switchSuccess: (networkName: string) => {
    return walletToast.success(`Successfully switched to ${networkName}`);
  },

  // Network switch error
  switchError: (networkName: string, error?: string) => {
    return walletToast.error(`Failed to switch to ${networkName}: ${error || 'Unknown error'}`);
  },
};

// User preference notifications
export const preferenceToast = {
  // Auto-reconnect enabled
  autoReconnectEnabled: () => {
    return walletToast.success('Auto-reconnect enabled');
  },

  // Auto-reconnect disabled
  autoReconnectDisabled: () => {
    return walletToast.info('Auto-reconnect disabled');
  },

  // Preferences saved
  saved: () => {
    return walletToast.success('Preferences saved');
  },

  // Preferences reset
  reset: () => {
    return walletToast.info('Preferences reset to default');
  },
};

// Export default toast for backward compatibility
export { toast as default };
