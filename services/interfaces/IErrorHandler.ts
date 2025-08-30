export interface ErrorContext {
  component: string;
  action: string;
  walletType?: string;
  networkId?: number;
  timestamp: number;
}

export interface ErrorResult {
  handled: boolean;
  message: string;
  shouldRetry: boolean;
  retryDelay?: number;
}

export interface IErrorHandler {
  // Error handling
  handle(error: any, context: ErrorContext): ErrorResult;
  canHandle(error: any): boolean;
  
  // Error categorization
  categorizeError(error: any): {
    type: 'connection' | 'network' | 'wallet' | 'storage' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userFriendly: boolean;
  };
  
  // Error recovery
  getRecoveryAction(error: any): {
    action: 'retry' | 'reconnect' | 'switch_network' | 'clear_storage' | 'none';
    delay?: number;
    maxAttempts?: number;
  };
  
  // Error logging
  logError(error: any, context: ErrorContext): void;
}
