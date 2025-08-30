export interface Network {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface NetworkSwitchResult {
  success: boolean;
  error?: string;
  networkId?: number;
}

export interface INetworkService {
  // Network operations
  getCurrentNetwork(): Network | null;
  switchNetwork(networkId: number): Promise<NetworkSwitchResult>;
  
  // Network validation
  getSupportedNetworks(): Network[];
  isNetworkSupported(networkId: number): boolean;
  validateNetwork(networkId: number): Promise<boolean>;
  
  // Network status
  getNetworkStatus(networkId: number): {
    isSupported: boolean;
    name: string;
    status: 'supported' | 'unsupported';
  };
  
  // Network health
  checkNetworkHealth(networkId: number): Promise<{
    isHealthy: boolean;
    latency: number;
    error?: string;
  }>;
}
