import { APP_CONFIG } from '@/config/constants';
import { SecurityUtils } from '@/utils/security';

export interface Currency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkStrategy {
  id: number;
  name: string;
  rpcUrl: string;
  validateConnection(): Promise<boolean>;
  getBlockExplorer(): string;
  getNativeCurrency(): Currency;
  getChainId(): number;
  isTestnet(): boolean;
  getGasEstimate(): Promise<{
    fast: number;
    standard: number;
    slow: number;
  }>;
}

export class PolygonStrategy implements NetworkStrategy {
  id = 137;
  name = 'Polygon';
  rpcUrl = 'https://polygon-rpc.com';

  async validateConnection(): Promise<boolean> {
    try {
      // Validate RPC URL to prevent open redirect attacks
      if (!SecurityUtils.validateURL(this.rpcUrl)) {
        console.warn(`Invalid RPC URL detected: ${this.rpcUrl}`);
        return false;
      }

      const payload = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: SecurityUtils.generateSecureToken(8)
      };

      // Validate RPC payload
      if (!SecurityUtils.validateRPCRequest(payload)) {
        console.warn('Invalid RPC payload detected');
        return false;
      }

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'WalletConnectionApp/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(APP_CONFIG.TIMEOUTS.NETWORK_HEALTH_CHECK)
      });

      if (!response.ok) {
        console.warn(`RPC response not ok: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object' || !data.result) {
        console.warn('Invalid RPC response structure');
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`RPC validation failed for ${this.name}:`, error);
      return false;
    }
  }

  getBlockExplorer(): string {
    return 'https://polygonscan.com';
  }

  getNativeCurrency(): Currency {
    return {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    };
  }

  getChainId(): number {
    return this.id;
  }

  isTestnet(): boolean {
    return false;
  }

  async getGasEstimate(): Promise<{ fast: number; standard: number; slow: number }> {
    try {
      const gasUrl = 'https://gasstation.polygon.technology/v2';
      
      // Validate gas station URL
      if (!SecurityUtils.validateURL(gasUrl)) {
        throw new Error('Invalid gas station URL');
      }

      const response = await fetch(gasUrl, {
        signal: AbortSignal.timeout(APP_CONFIG.TIMEOUTS.NETWORK_HEALTH_CHECK)
      });
      
      if (!response.ok) {
        throw new Error(`Gas station response not ok: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate and sanitize response data
      const sanitizedData = SecurityUtils.sanitizeJSON<{
        fast: { maxFee: string };
        standard: { maxFee: string };
        safeLow: { maxFee: string };
      }>(data);
      
      if (!sanitizedData || !sanitizedData.fast || !sanitizedData.standard || !sanitizedData.safeLow) {
        throw new Error('Invalid gas station data structure');
      }

      return {
        fast: Math.max(1, parseInt(sanitizedData.fast.maxFee) || 30),
        standard: Math.max(1, parseInt(sanitizedData.standard.maxFee) || 20),
        slow: Math.max(1, parseInt(sanitizedData.safeLow.maxFee) || 10)
      };
    } catch (error) {
      console.warn('Gas estimation failed, using fallback values:', error);
      return {
        fast: 30,
        standard: 20,
        slow: 10
      };
    }
  }
}

export class LineaStrategy implements NetworkStrategy {
  id = 59144;
  name = 'Linea';
  rpcUrl = 'https://rpc.linea.build';

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getBlockExplorer(): string {
    return 'https://lineascan.build';
  }

  getNativeCurrency(): Currency {
    return {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    };
  }

  getChainId(): number {
    return this.id;
  }

  isTestnet(): boolean {
    return false;
  }

  async getGasEstimate(): Promise<{ fast: number; standard: number; slow: number }> {
    return {
      fast: 2,
      standard: 1.5,
      slow: 1
    };
  }
}

export class BSCStrategy implements NetworkStrategy {
  id = 56;
  name = 'BSC';
  rpcUrl = 'https://bsc-dataseed1.binance.org';

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getBlockExplorer(): string {
    return 'https://bscscan.com';
  }

  getNativeCurrency(): Currency {
    return {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    };
  }

  getChainId(): number {
    return this.id;
  }

  isTestnet(): boolean {
    return false;
  }

  async getGasEstimate(): Promise<{ fast: number; standard: number; slow: number }> {
    return {
      fast: 5,
      standard: 3,
      slow: 1
    };
  }
}

export class EthereumStrategy implements NetworkStrategy {
  id = 1;
  name = 'Ethereum';
  rpcUrl = 'https://mainnet.infura.io/v3/your-project-id';

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getBlockExplorer(): string {
    return 'https://etherscan.io';
  }

  getNativeCurrency(): Currency {
    return {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    };
  }

  getChainId(): number {
    return this.id;
  }

  isTestnet(): boolean {
    return false;
  }

  async getGasEstimate(): Promise<{ fast: number; standard: number; slow: number }> {
    try {
      const response = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const data = await response.json();
      return {
        fast: parseInt(data.result.FastGasPrice),
        standard: parseInt(data.result.ProposeGasPrice),
        slow: parseInt(data.result.SafeGasPrice)
      };
    } catch {
      return {
        fast: 50,
        standard: 30,
        slow: 20
      };
    }
  }
}

export class NetworkRegistry {
  private strategies: Map<number, NetworkStrategy> = new Map();

  constructor() {
    this.register(new PolygonStrategy());
    this.register(new LineaStrategy());
    this.register(new BSCStrategy());
    this.register(new EthereumStrategy());
  }

  register(strategy: NetworkStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  getStrategy(id: number): NetworkStrategy | undefined {
    return this.strategies.get(id);
  }

  getAllStrategies(): NetworkStrategy[] {
    return Array.from(this.strategies.values());
  }

  getMainnetStrategies(): NetworkStrategy[] {
    return this.getAllStrategies().filter(strategy => !strategy.isTestnet());
  }

  getTestnetStrategies(): NetworkStrategy[] {
    return this.getAllStrategies().filter(strategy => strategy.isTestnet());
  }

  getStrategyByName(name: string): NetworkStrategy | undefined {
    return this.getAllStrategies().find(strategy => strategy.name === name);
  }

  async validateNetwork(id: number): Promise<boolean> {
    const strategy = this.getStrategy(id);
    if (!strategy) return false;
    return strategy.validateConnection();
  }
}

export const networkRegistry = new NetworkRegistry();
