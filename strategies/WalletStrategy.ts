export interface WalletStrategy {
  id: string;
  name: string;
  getErrorMessage(error: any): string;
  validateConnection(provider: any): boolean;
  getConnectionSteps(): string[];
  getInstallationUrl(): string;
  isInstalled(): boolean;
  getProvider(): any;
}

export class MetaMaskStrategy implements WalletStrategy {
  id = 'metaMask';
  name = 'MetaMask';

  getErrorMessage(error: any): string {
    if (error?.code === -32002) {
      return 'MetaMask is already processing a request. Please wait.';
    }
    if (error?.code === -32003) {
      return 'MetaMask is locked. Please unlock your wallet.';
    }
    if (error?.code === -32601) {
      return 'MetaMask method not found. Please update MetaMask.';
    }
    return 'MetaMask connection failed. Please check if MetaMask is installed and unlocked.';
  }

  validateConnection(provider: any): boolean {
    return provider && typeof provider.request === 'function';
  }

  getConnectionSteps(): string[] {
    return [
      'Install MetaMask extension',
      'Create or import a wallet',
      'Connect to the website',
      'Approve the connection request'
    ];
  }

  getInstallationUrl(): string {
    return 'https://metamask.io/download/';
  }

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  getProvider(): any {
    return typeof window !== 'undefined' ? (window as any).ethereum : null;
  }
}

export class WalletConnectStrategy implements WalletStrategy {
  id = 'walletConnect';
  name = 'WalletConnect';

  getErrorMessage(error: any): string {
    if (error?.code === 'USER_REJECTED') {
      return 'Connection was rejected by the user.';
    }
    if (error?.code === 'SESSION_EXPIRED') {
      return 'Session expired. Please try connecting again.';
    }
    return 'WalletConnect connection failed. Please try again.';
  }

  validateConnection(provider: any): boolean {
    return provider && typeof provider.request === 'function';
  }

  getConnectionSteps(): string[] {
    return [
      'Scan QR code with your mobile wallet',
      'Approve the connection in your wallet',
      'Wait for connection confirmation'
    ];
  }

  getInstallationUrl(): string {
    return 'https://walletconnect.com/';
  }

  isInstalled(): boolean {
    return true;
  }

  getProvider(): any {
    return null;
  }
}

export class TokenPocketStrategy implements WalletStrategy {
  id = 'tokenPocket';
  name = 'TokenPocket';

  getErrorMessage(error: any): string {
    if (error?.code === 'USER_REJECTED') {
      return 'Connection was rejected by the user.';
    }
    return 'TokenPocket connection failed. Please check if TokenPocket is installed and unlocked.';
  }

  validateConnection(provider: any): boolean {
    return provider && typeof provider.request === 'function';
  }

  getConnectionSteps(): string[] {
    return [
      'Install TokenPocket app',
      'Create or import a wallet',
      'Connect to the website',
      'Approve the connection request'
    ];
  }

  getInstallationUrl(): string {
    return 'https://www.tokenpocket.pro/';
  }

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).tokenpocket;
  }

  getProvider(): any {
    return typeof window !== 'undefined' ? (window as any).tokenpocket : null;
  }
}

export class BitgetWalletStrategy implements WalletStrategy {
  id = 'bitgetWallet';
  name = 'Bitget Wallet';

  getErrorMessage(error: any): string {
    if (error?.code === 'USER_REJECTED') {
      return 'Connection was rejected by the user.';
    }
    return 'Bitget Wallet connection failed. Please check if Bitget Wallet is installed and unlocked.';
  }

  validateConnection(provider: any): boolean {
    return provider && typeof provider.request === 'function';
  }

  getConnectionSteps(): string[] {
    return [
      'Install Bitget Wallet extension',
      'Create or import a wallet',
      'Connect to the website',
      'Approve the connection request'
    ];
  }

  getInstallationUrl(): string {
    return 'https://web3.bitget.com/';
  }

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).bitkeep;
  }

  getProvider(): any {
    return typeof window !== 'undefined' ? (window as any).bitkeep : null;
  }
}

export class WalletRegistry {
  private strategies: Map<string, WalletStrategy> = new Map();

  constructor() {
    this.register(new MetaMaskStrategy());
    this.register(new WalletConnectStrategy());
    this.register(new TokenPocketStrategy());
    this.register(new BitgetWalletStrategy());
  }

  register(strategy: WalletStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  getStrategy(id: string): WalletStrategy | undefined {
    return this.strategies.get(id);
  }

  getAllStrategies(): WalletStrategy[] {
    return Array.from(this.strategies.values());
  }

  getAvailableStrategies(): WalletStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.isInstalled());
  }

  getStrategyByName(name: string): WalletStrategy | undefined {
    return this.getAllStrategies().find(strategy => strategy.name === name);
  }
}

export const walletRegistry = new WalletRegistry();
