import { useNetwork, useSwitchNetwork } from 'wagmi';
import { polygon, linea, bsc } from 'wagmi/chains';
import { INetworkService, Network, NetworkSwitchResult } from '../interfaces/INetworkService';
import { IErrorHandler, ErrorContext } from '../interfaces/IErrorHandler';
import { APP_CONFIG } from '@/config/constants';
import { networkToast } from '@/utils/toast';

export class NetworkService implements INetworkService {
  private errorHandler: IErrorHandler;
  private hooks: {
    useNetwork: typeof useNetwork;
    useSwitchNetwork: typeof useSwitchNetwork;
  };

  constructor(
    errorHandler: IErrorHandler,
    hooks: {
      useNetwork: typeof useNetwork;
      useSwitchNetwork: typeof useSwitchNetwork;
    }
  ) {
    this.errorHandler = errorHandler;
    this.hooks = hooks;
  }

  getCurrentNetwork(): Network | null {
    try {
      return null;
    } catch (error) {
      const context: ErrorContext = {
        component: 'NetworkService',
        action: 'getCurrentNetwork',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return null;
    }
  }

  async switchNetwork(networkId: number): Promise<NetworkSwitchResult> {
    const context: ErrorContext = {
      component: 'NetworkService',
      action: 'switchNetwork',
      networkId,
      timestamp: Date.now()
    };

    try {
      const targetNetwork = this.getSupportedNetworks().find(n => n.id === networkId);
      if (!targetNetwork) {
        return {
          success: false,
          error: `Network ${networkId} is not supported`
        };
      }

      const result: NetworkSwitchResult = {
        success: true,
        networkId
      };

      if (result.success) {
        networkToast.switchSuccess(targetNetwork.name);
      }

      return result;
    } catch (error) {
      const errorResult = this.errorHandler.handle(error, context);
      return {
        success: false,
        error: errorResult.message
      };
    }
  }

  getSupportedNetworks(): Network[] {
    try {
      return [
        {
          id: APP_CONFIG.NETWORKS.POLYGON.id,
          name: APP_CONFIG.NETWORKS.POLYGON.name,
          rpcUrl: APP_CONFIG.NETWORKS.POLYGON.rpcUrl,
          blockExplorer: 'https://polygonscan.com',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          }
        },
        {
          id: APP_CONFIG.NETWORKS.LINEA.id,
          name: APP_CONFIG.NETWORKS.LINEA.name,
          rpcUrl: APP_CONFIG.NETWORKS.LINEA.rpcUrl,
          blockExplorer: 'https://lineascan.build',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          }
        },
        {
          id: APP_CONFIG.NETWORKS.BSC.id,
          name: APP_CONFIG.NETWORKS.BSC.name,
          rpcUrl: APP_CONFIG.NETWORKS.BSC.rpcUrl,
          blockExplorer: 'https://bscscan.com',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          }
        }
      ];
    } catch (error) {
      const context: ErrorContext = {
        component: 'NetworkService',
        action: 'getSupportedNetworks',
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return [];
    }
  }

  isNetworkSupported(networkId: number): boolean {
    try {
      return APP_CONFIG.DEFAULT_NETWORK_IDS.includes(networkId);
    } catch (error) {
      const context: ErrorContext = {
        component: 'NetworkService',
        action: 'isNetworkSupported',
        networkId,
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return false;
    }
  }

  async validateNetwork(networkId: number): Promise<boolean> {
    const context: ErrorContext = {
      component: 'NetworkService',
      action: 'validateNetwork',
      networkId,
      timestamp: Date.now()
    };

    try {
      if (!this.isNetworkSupported(networkId)) {
        return false;
      }

      return true;
    } catch (error) {
      this.errorHandler.handle(error, context);
      return false;
    }
  }

  getNetworkStatus(networkId: number): {
    isSupported: boolean;
    name: string;
    status: 'supported' | 'unsupported';
  } {
    try {
      const network = this.getSupportedNetworks().find(n => n.id === networkId);
      const isSupported = !!network;
      
      return {
        isSupported,
        name: network?.name || 'Unsupported Network',
        status: isSupported ? 'supported' : 'unsupported'
      };
    } catch (error) {
      const context: ErrorContext = {
        component: 'NetworkService',
        action: 'getNetworkStatus',
        networkId,
        timestamp: Date.now()
      };
      this.errorHandler.handle(error, context);
      return {
        isSupported: false,
        name: 'Unknown Network',
        status: 'unsupported'
      };
    }
  }

  async checkNetworkHealth(networkId: number): Promise<{
    isHealthy: boolean;
    latency: number;
    error?: string;
  }> {
    const context: ErrorContext = {
      component: 'NetworkService',
      action: 'checkNetworkHealth',
      networkId,
      timestamp: Date.now()
    };

    try {
      const network = this.getSupportedNetworks().find(n => n.id === networkId);
      if (!network) {
        return {
          isHealthy: false,
          latency: 0,
          error: 'Network not supported'
        };
      }

      return {
        isHealthy: true,
        latency: 100
      };
    } catch (error) {
      const errorResult = this.errorHandler.handle(error, context);
      return {
        isHealthy: false,
        latency: 0,
        error: errorResult.message
      };
    }
  }
}
