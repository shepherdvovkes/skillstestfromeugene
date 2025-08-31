export interface WalletError {
  code?: number | string;
  message: string;
  name?: string;
  stack?: string;
  cause?: unknown;
}

export interface NetworkError extends WalletError {
  networkId?: number;
  chainId?: number;
  rpcUrl?: string;
}

export interface ConnectionError extends WalletError {
  walletType?: string;
  connectorId?: string;
  isRetryable?: boolean;
}

export interface StorageError extends WalletError {
  key?: string;
  operation?: 'get' | 'set' | 'remove' | 'clear';
  quotaExceeded?: boolean;
}

export interface ValidationError extends WalletError {
  field?: string;
  value?: unknown;
  expectedType?: string;
  constraint?: string;
}

export type AppError = WalletError | NetworkError | ConnectionError | StorageError | ValidationError;

export enum ErrorCode {
  METAMASK_PENDING_REQUEST = -32002,
  METAMASK_LOCKED = -32003,
  METAMASK_METHOD_NOT_FOUND = -32601,
  
  RPC_INVALID_REQUEST = -32600,
  RPC_METHOD_NOT_FOUND = -32601,
  RPC_INVALID_PARAMS = -32602,
  RPC_INTERNAL_ERROR = -32603,
  
  WALLET_USER_REJECTED = 'USER_REJECTED',
  WALLET_SESSION_EXPIRED = 'SESSION_EXPIRED',
  WALLET_NOT_INSTALLED = 'NOT_INSTALLED',
  
  NETWORK_UNSUPPORTED = 'NETWORK_UNSUPPORTED',
  NETWORK_SWITCH_FAILED = 'NETWORK_SWITCH_FAILED',
  NETWORK_VALIDATION_FAILED = 'NETWORK_VALIDATION_FAILED',
  
  STORAGE_QUOTA_EXCEEDED = 'QuotaExceededError',
  STORAGE_ACCESS_DENIED = 'AccessDeniedError',
  
  UNSUPPORTED_WALLET_TYPE = 'UNSUPPORTED_WALLET_TYPE',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory = 'connection' | 'network' | 'wallet' | 'storage' | 'validation' | 'unknown';

export type RecoveryAction = 'retry' | 'reconnect' | 'switch_network' | 'clear_storage' | 'none';

export interface ErrorContext {
  component: string;
  action: string;
  walletType?: string;
  networkId?: number;
  chainId?: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ErrorResult {
  handled: boolean;
  message: string;
  shouldRetry: boolean;
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoveryAction: RecoveryAction;
  delay?: number;
  maxAttempts?: number;
  errorCode?: ErrorCode;
  userFriendly: boolean;
}

export const isWalletError = (error: unknown): error is WalletError => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return isWalletError(error) && 'networkId' in error;
};

export const isConnectionError = (error: unknown): error is ConnectionError => {
  return isWalletError(error) && 'walletType' in error;
};

export const isStorageError = (error: unknown): error is StorageError => {
  return isWalletError(error) && 'operation' in error;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return isWalletError(error) && 'field' in error;
};

export class ErrorFactory {
  static createWalletError(
    message: string,
    code?: ErrorCode,
    walletType?: string
  ): ConnectionError {
    return {
      code,
      message,
      walletType,
      name: 'WalletError',
      isRetryable: true
    };
  }

  static createNetworkError(
    message: string,
    networkId?: number,
    chainId?: number
  ): NetworkError {
    return {
      message,
      networkId,
      chainId,
      name: 'NetworkError'
    };
  }

  static createStorageError(
    message: string,
    operation: 'get' | 'set' | 'remove' | 'clear',
    key?: string
  ): StorageError {
    return {
      message,
      operation,
      key,
      name: 'StorageError'
    };
  }

  static createValidationError(
    message: string,
    field?: string,
    value?: unknown,
    expectedType?: string
  ): ValidationError {
    return {
      message,
      field,
      value,
      expectedType,
      name: 'ValidationError'
    };
  }
}
