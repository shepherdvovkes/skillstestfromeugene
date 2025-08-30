import { IErrorHandler, ErrorContext, ErrorResult } from '../interfaces/IErrorHandler';
import { APP_CONFIG } from '@/config/constants';
import { walletConnectionToast, networkToast } from '@/utils/toast';
import { walletLogger } from '@/utils/logger';

export class WalletErrorHandler implements IErrorHandler {
  handle(error: any, context: ErrorContext): ErrorResult {
    const categorization = this.categorizeError(error);
    const recoveryAction = this.getRecoveryAction(error);
    
    this.logError(error, context);
    
    switch (categorization.type) {
      case 'connection':
        return this.handleConnectionError(error, context);
      case 'network':
        return this.handleNetworkError(error, context);
      case 'wallet':
        return this.handleWalletError(error, context);
      case 'storage':
        return this.handleStorageError(error, context);
      default:
        return this.handleUnknownError(error, context);
    }
  }

  canHandle(error: any): boolean {
    return true;
  }

  categorizeError(error: any): {
    type: 'connection' | 'network' | 'wallet' | 'storage' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userFriendly: boolean;
  } {
    if (error?.code === APP_CONFIG.ERROR_CODES.METAMASK_PENDING_REQUEST) {
      return {
        type: 'wallet',
        severity: 'low',
        userFriendly: true
      };
    }

    if (error?.code === -32603 || error?.message?.includes('network')) {
      return {
        type: 'network',
        severity: 'medium',
        userFriendly: true
      };
    }

    if (error?.code === -32002 || error?.message?.includes('connection')) {
      return {
        type: 'connection',
        severity: 'medium',
        userFriendly: true
      };
    }

    if (error?.name === 'QuotaExceededError' || error?.message?.includes('storage')) {
      return {
        type: 'storage',
        severity: 'high',
        userFriendly: true
      };
    }

    if (error?.code === -32601 || error?.code === -32700) {
      return {
        type: 'wallet',
        severity: 'critical',
        userFriendly: false
      };
    }

    return {
      type: 'unknown',
      severity: 'medium',
      userFriendly: false
    };
  }

  getRecoveryAction(error: any): {
    action: 'retry' | 'reconnect' | 'switch_network' | 'clear_storage' | 'none';
    delay?: number;
    maxAttempts?: number;
  } {
    const categorization = this.categorizeError(error);

    switch (categorization.type) {
      case 'connection':
        return {
          action: 'reconnect',
          delay: 2000,
          maxAttempts: 3
        };
      case 'network':
        return {
          action: 'switch_network',
          delay: 1000,
          maxAttempts: 2
        };
      case 'storage':
        return {
          action: 'clear_storage',
          delay: 0,
          maxAttempts: 1
        };
      case 'wallet':
        if (categorization.severity === 'low') {
          return {
            action: 'retry',
            delay: 1000,
            maxAttempts: 2
          };
        }
        return {
          action: 'reconnect',
          delay: 3000,
          maxAttempts: 1
        };
      default:
        return {
          action: 'none'
        };
    }
  }

  logError(error: any, context: ErrorContext): void {
    walletLogger.error(`Error in ${context.component} during ${context.action}`, {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }

  private handleConnectionError(error: any, context: ErrorContext): ErrorResult {
    const message = this.getUserFriendlyMessage(error, 'connection');
    walletConnectionToast.failed(context.walletType || 'wallet', message);
    
    return {
      handled: true,
      message,
      shouldRetry: true,
      retryDelay: 2000
    };
  }

  private handleNetworkError(error: any, context: ErrorContext): ErrorResult {
    const message = this.getUserFriendlyMessage(error, 'network');
    networkToast.switchError('Network', message);
    
    return {
      handled: true,
      message,
      shouldRetry: true,
      retryDelay: 1000
    };
  }

  private handleWalletError(error: any, context: ErrorContext): ErrorResult {
    if (error?.code === APP_CONFIG.ERROR_CODES.METAMASK_PENDING_REQUEST) {
      walletLogger.warn(`MetaMask is already processing a request. Please wait.`);
      return {
        handled: true,
        message: 'MetaMask is already processing a request. Please wait.',
        shouldRetry: false
      };
    }

    const message = this.getUserFriendlyMessage(error, 'wallet');
    walletConnectionToast.failed(context.walletType || 'wallet', message);
    
    return {
      handled: true,
      message,
      shouldRetry: error?.code !== APP_CONFIG.ERROR_CODES.METAMASK_PENDING_REQUEST,
      retryDelay: 1000
    };
  }

  private handleStorageError(error: any, context: ErrorContext): ErrorResult {
    const message = 'Storage error occurred. Please check your browser settings.';
    
    return {
      handled: true,
      message,
      shouldRetry: false
    };
  }

  private handleUnknownError(error: any, context: ErrorContext): ErrorResult {
    const message = 'An unexpected error occurred. Please try again.';
    
    return {
      handled: true,
      message,
      shouldRetry: false
    };
  }

  private getUserFriendlyMessage(error: any, type: string): string {
    const messages = {
      connection: {
        'meta_mask': 'MetaMask connection failed. Please check if MetaMask is installed and unlocked.',
        'token_pocket': 'TokenPocket connection failed. Please check if TokenPocket is installed and unlocked.',
        'bitget_wallet': 'Bitget Wallet connection failed. Please check if Bitget Wallet is installed and unlocked.',
        'particle_network': 'Particle Network connection failed. Please try again.',
        'wallet_connect': 'WalletConnect connection failed. Please try again.',
        default: 'Connection failed. Please try again.'
      },
      network: {
        default: 'Network error occurred. Please check your connection and try again.'
      },
      wallet: {
        default: 'Wallet error occurred. Please try again.'
      }
    };

    const typeMessages = messages[type as keyof typeof messages];
    if (!typeMessages) {
      return messages.connection.default;
    }

    return typeMessages.default || 'An error occurred. Please try again.';
  }
}
