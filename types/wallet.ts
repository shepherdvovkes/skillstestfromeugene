export interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isTokenPocket?: boolean;
  isBitgetWallet?: boolean;
  isWalletConnect?: boolean;
  selectedAddress?: string;
  networkVersion?: string;
  chainId?: string;
}

export interface WalletConnection {
  address: string;
  walletType: string;
  isConnected: boolean;
  chainId: number;
  networkId: number;
  connectorId?: string;
  connectionTime: number;
  lastActivity: number;
}

export interface WalletConnector {
  id: string;
  name: string;
  ready: boolean;
  icon?: string;
  description?: string;
  supportedChains: number[];
}

export interface WalletInstallation {
  isInstalled: boolean;
  installationUrl: string;
  browserCompatible: boolean;
  mobileCompatible: boolean;
  extensionCompatible: boolean;
}

export interface WalletCapabilities {
  supportsEthereum: boolean;
  supportsPolygon: boolean;
  supportsBSC: boolean;
  supportsLinea: boolean;
  supportsPersonalSign: boolean;
  supportsTypedSign: boolean;
  supportsTransactionSign: boolean;
}

export interface WalletStrategy {
  id: string;
  name: string;
  getErrorMessage(error: AppError): string;
  validateConnection(provider: WalletProvider): boolean;
  getConnectionSteps(): string[];
  getInstallationUrl(): string;
  isInstalled(): boolean;
  getProvider(): WalletProvider | null;
  getCapabilities(): WalletCapabilities;
  getInstallationInfo(): WalletInstallation;
}

export const isWalletProvider = (provider: unknown): provider is WalletProvider => {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    typeof (provider as WalletProvider).request === 'function' &&
    typeof (provider as WalletProvider).on === 'function' &&
    typeof (provider as WalletProvider).removeListener === 'function'
  );
};

export const isMetaMaskProvider = (provider: WalletProvider): boolean => {
  return provider.isMetaMask === true;
};

export const isTokenPocketProvider = (provider: WalletProvider): boolean => {
  return provider.isTokenPocket === true;
};

export const isBitgetWalletProvider = (provider: WalletProvider): boolean => {
  return provider.isBitgetWallet === true;
};

export const isWalletConnectProvider = (provider: WalletProvider): boolean => {
  return provider.isWalletConnect === true;
};

export class WalletProviderFactory {
  static createProvider(provider: unknown): WalletProvider | null {
    if (!isWalletProvider(provider)) {
      return null;
    }

    const requiredMethods = ['request', 'on', 'removeListener'];
    for (const method of requiredMethods) {
      if (typeof (provider as any)[method] !== 'function') {
        return null;
      }
    }

    return provider as WalletProvider;
  }

  static validateProvider(provider: WalletProvider): boolean {
    try {
      const testRequest = provider.request({ method: 'eth_chainId' });
      if (!(testRequest instanceof Promise)) {
        return false;
      }

      const testListener = () => {};
      provider.on('test', testListener);
      provider.removeListener('test', testListener);

      return true;
    } catch {
      return false;
    }
  }
}

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  walletType: string | null;
  error: string | null;
  chainId: number | null;
  networkId: number | null;
  connectionTime: number | null;
  lastActivity: number | null;
}

export interface WalletConnectionActions {
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  retryConnection: () => Promise<void>;
  switchNetwork: (networkId: number) => Promise<void>;
  refreshConnection: () => Promise<void>;
}

export interface WalletHealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  connectionAge: number;
  errorCount: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disconnected';
  issues: string[];
  recommendations: string[];
}
