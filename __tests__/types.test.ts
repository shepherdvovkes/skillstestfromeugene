import { 
  ErrorCode, 
  ErrorFactory, 
  isWalletError, 
  isNetworkError, 
  isConnectionError, 
  isStorageError, 
  isValidationError,
  type AppError,
  type WalletError,
  type NetworkError,
  type ConnectionError,
  type StorageError,
  type ValidationError
} from '@/types/errors';

import {
  WalletProviderFactory,
  isWalletProvider,
  isMetaMaskProvider,
  isTokenPocketProvider,
  isBitgetWalletProvider,
  isWalletConnectProvider,
  type WalletProvider,
  type WalletCapabilities,
  type WalletInstallation
} from '@/types/wallet';

describe('Error Types', () => {
  describe('ErrorCode enum', () => {
    it('should have correct MetaMask error codes', () => {
      expect(ErrorCode.METAMASK_PENDING_REQUEST).toBe(-32002);
      expect(ErrorCode.METAMASK_LOCKED).toBe(-32003);
      expect(ErrorCode.METAMASK_METHOD_NOT_FOUND).toBe(-32601);
    });

    it('should have correct RPC error codes', () => {
      expect(ErrorCode.RPC_INVALID_REQUEST).toBe(-32600);
      expect(ErrorCode.RPC_METHOD_NOT_FOUND).toBe(-32601);
      expect(ErrorCode.RPC_INVALID_PARAMS).toBe(-32602);
      expect(ErrorCode.RPC_INTERNAL_ERROR).toBe(-32603);
    });

    it('should have correct wallet error codes', () => {
      expect(ErrorCode.WALLET_USER_REJECTED).toBe('USER_REJECTED');
      expect(ErrorCode.WALLET_SESSION_EXPIRED).toBe('SESSION_EXPIRED');
      expect(ErrorCode.WALLET_NOT_INSTALLED).toBe('NOT_INSTALLED');
    });
  });

  describe('ErrorFactory', () => {
    it('should create wallet errors correctly', () => {
      const error = ErrorFactory.createWalletError(
        'Connection failed',
        ErrorCode.METAMASK_PENDING_REQUEST,
        'metaMask'
      );

      expect(error.code).toBe(ErrorCode.METAMASK_PENDING_REQUEST);
      expect(error.message).toBe('Connection failed');
      expect(error.walletType).toBe('metaMask');
      expect(error.name).toBe('WalletError');
      expect(error.isRetryable).toBe(true);
    });

    it('should create network errors correctly', () => {
      const error = ErrorFactory.createNetworkError(
        'Network switch failed',
        137,
        137
      );

      expect(error.message).toBe('Network switch failed');
      expect(error.networkId).toBe(137);
      expect(error.chainId).toBe(137);
      expect(error.name).toBe('NetworkError');
    });

    it('should create storage errors correctly', () => {
      const error = ErrorFactory.createStorageError(
        'Storage quota exceeded',
        'set',
        'userPreferences'
      );

      expect(error.message).toBe('Storage quota exceeded');
      expect(error.operation).toBe('set');
      expect(error.key).toBe('userPreferences');
      expect(error.name).toBe('StorageError');
    });

    it('should create validation errors correctly', () => {
      const error = ErrorFactory.createValidationError(
        'Invalid address format',
        'address',
        '0xinvalid',
        '0x + 40 hex characters'
      );

      expect(error.message).toBe('Invalid address format');
      expect(error.field).toBe('address');
      expect(error.value).toBe('0xinvalid');
      expect(error.expectedType).toBe('0x + 40 hex characters');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('Type guards', () => {
    it('should correctly identify wallet errors', () => {
      const walletError: WalletError = {
        code: ErrorCode.METAMASK_PENDING_REQUEST,
        message: 'Test error'
      };

      expect(isWalletError(walletError)).toBe(true);
      expect(isWalletError('not an error')).toBe(false);
      expect(isWalletError(null)).toBe(false);
      expect(isWalletError(undefined)).toBe(false);
    });

    it('should correctly identify network errors', () => {
      const networkError: NetworkError = {
        message: 'Network error',
        networkId: 137
      };

      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError({ message: 'Not a network error' })).toBe(false);
    });

    it('should correctly identify connection errors', () => {
      const connectionError: ConnectionError = {
        message: 'Connection error',
        walletType: 'metaMask'
      };

      expect(isConnectionError(connectionError)).toBe(true);
      expect(isConnectionError({ message: 'Not a connection error' })).toBe(false);
    });

    it('should correctly identify storage errors', () => {
      const storageError: StorageError = {
        message: 'Storage error',
        operation: 'get'
      };

      expect(isStorageError(storageError)).toBe(true);
      expect(isStorageError({ message: 'Not a storage error' })).toBe(false);
    });

    it('should correctly identify validation errors', () => {
      const validationError: ValidationError = {
        message: 'Validation error',
        field: 'address'
      };

      expect(isValidationError(validationError)).toBe(true);
      expect(isValidationError({ message: 'Not a validation error' })).toBe(false);
    });
  });
});

describe('Wallet Types', () => {
  describe('WalletProviderFactory', () => {
    it('should create valid wallet provider', () => {
      const mockProvider = {
        request: jest.fn().mockResolvedValue('0x1'),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true
      };

      const provider = WalletProviderFactory.createProvider(mockProvider);
      expect(provider).toBe(mockProvider);
    });

    it('should reject invalid provider', () => {
      const invalidProvider = {
        request: 'not a function',
        on: jest.fn(),
        removeListener: jest.fn()
      };

      const provider = WalletProviderFactory.createProvider(invalidProvider);
      expect(provider).toBeNull();
    });

    it('should reject provider missing required methods', () => {
      const incompleteProvider = {
        request: jest.fn()
        // Missing on and removeListener methods
      };

      const provider = WalletProviderFactory.createProvider(incompleteProvider);
      expect(provider).toBeNull();
    });

    it('should validate provider functionality', () => {
      const mockProvider: WalletProvider = {
        request: jest.fn().mockResolvedValue('0x1'),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true
      };

      expect(WalletProviderFactory.validateProvider(mockProvider)).toBe(true);
    });

    it('should reject provider with invalid request method', () => {
      const invalidProvider: WalletProvider = {
        request: jest.fn().mockReturnValue('not a promise'),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true
      };

      expect(WalletProviderFactory.validateProvider(invalidProvider)).toBe(false);
    });
  });

  describe('Provider type guards', () => {
    const mockMetaMaskProvider: WalletProvider = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isMetaMask: true
    };

    const mockTokenPocketProvider: WalletProvider = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isTokenPocket: true
    };

    const mockBitgetWalletProvider: WalletProvider = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isBitgetWallet: true
    };

    const mockWalletConnectProvider: WalletProvider = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isWalletConnect: true
    };

    it('should correctly identify MetaMask provider', () => {
      expect(isMetaMaskProvider(mockMetaMaskProvider)).toBe(true);
      expect(isMetaMaskProvider(mockTokenPocketProvider)).toBe(false);
    });

    it('should correctly identify TokenPocket provider', () => {
      expect(isTokenPocketProvider(mockTokenPocketProvider)).toBe(true);
      expect(isTokenPocketProvider(mockMetaMaskProvider)).toBe(false);
    });

    it('should correctly identify Bitget Wallet provider', () => {
      expect(isBitgetWalletProvider(mockBitgetWalletProvider)).toBe(true);
      expect(isBitgetWalletProvider(mockMetaMaskProvider)).toBe(false);
    });

    it('should correctly identify WalletConnect provider', () => {
      expect(isWalletConnectProvider(mockWalletConnectProvider)).toBe(true);
      expect(isWalletConnectProvider(mockMetaMaskProvider)).toBe(false);
    });
  });

  describe('WalletProvider interface', () => {
    it('should have required methods', () => {
      const provider: WalletProvider = {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn()
      };

      expect(typeof provider.request).toBe('function');
      expect(typeof provider.on).toBe('function');
      expect(typeof provider.removeListener).toBe('function');
    });

    it('should support optional properties', () => {
      const provider: WalletProvider = {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true,
        selectedAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        networkVersion: '1',
        chainId: '0x89'
      };

      expect(provider.isMetaMask).toBe(true);
      expect(provider.selectedAddress).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
      expect(provider.networkVersion).toBe('1');
      expect(provider.chainId).toBe('0x89');
    });
  });

  describe('WalletCapabilities interface', () => {
    it('should have all required properties', () => {
      const capabilities: WalletCapabilities = {
        supportsEthereum: true,
        supportsPolygon: true,
        supportsBSC: true,
        supportsLinea: true,
        supportsPersonalSign: true,
        supportsTypedSign: true,
        supportsTransactionSign: true
      };

      expect(capabilities.supportsEthereum).toBe(true);
      expect(capabilities.supportsPolygon).toBe(true);
      expect(capabilities.supportsBSC).toBe(true);
      expect(capabilities.supportsLinea).toBe(true);
      expect(capabilities.supportsPersonalSign).toBe(true);
      expect(capabilities.supportsTypedSign).toBe(true);
      expect(capabilities.supportsTransactionSign).toBe(true);
    });
  });

  describe('WalletInstallation interface', () => {
    it('should have all required properties', () => {
      const installation: WalletInstallation = {
        isInstalled: true,
        installationUrl: 'https://metamask.io/download/',
        browserCompatible: true,
        mobileCompatible: false,
        extensionCompatible: true
      };

      expect(installation.isInstalled).toBe(true);
      expect(installation.installationUrl).toBe('https://metamask.io/download/');
      expect(installation.browserCompatible).toBe(true);
      expect(installation.mobileCompatible).toBe(false);
      expect(installation.extensionCompatible).toBe(true);
    });
  });
});
