// Application Constants
export const APP_CONFIG = {
  // Network Configuration
  NETWORKS: {
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    },
    POLYGON: {
      id: 137,
      name: 'Polygon',
      rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'
    },
    LINEA: {
      id: 59144,
      name: 'Linea',
      rpcUrl: process.env.NEXT_PUBLIC_LINEA_RPC_URL || 'https://rpc.linea.build'
    },
    BSC: {
      id: 56,
      name: 'BSC',
      rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
    }
  },
  
  // Default Network IDs (for backward compatibility)
  DEFAULT_NETWORK_IDS: [1, 137, 59144, 56] as number[],
  
  // Timeout Configuration
  TIMEOUTS: {
    BUTTON_LOADING: 30000, // 30 seconds
    CONNECTION_CHECK: 60000, // 60 seconds
    MAX_LATENCY: 2000, // 2 seconds
    WALLET_HEALTH_CHECK: 3000, // 3 seconds
    ACCOUNT_REQUEST: 2000, // 2 seconds
    NETWORK_HEALTH_CHECK: 3000, // 3 seconds
    BLOCK_NUMBER_REQUEST: 2000, // 2 seconds
    HEALTH_CHECK: 8000, // 8 seconds
    SAFETY_TIMEOUT: 15000, // 15 seconds
    CONNECTION_AGE_THRESHOLD: 20000, // 20 seconds
    CHECK_INTERVAL: 5000, // 5 seconds
    MAX_CONNECTION_AGE: 24 * 60 * 60 * 1000, // 24 hours
    TOAST_DURATION: 4000, // 4 seconds
    RECONNECT_DELAY: 1000, // 1 second
  },
  
  // UI Configuration
  UI: {
    TOAST_POSITION: 'top-right' as const,
    TOAST_DURATION: 4000,
    COLORS: {
      BACKGROUND: '#363636',
      ERROR: '#dc2626',
      SUCCESS: '#059669',
      WARNING: '#d97706',
      INFO: '#3B82F6',
      BORDER_ERROR: '#ef4444',
      BORDER_SUCCESS: '#10b981',
      BORDER_WARNING: '#f59e0b',
      BORDER_INFO: '#1D4ED8'
    }
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    LAST_CONNECTED_WALLET: 'lastConnectedWallet',
    CONNECTION_STATE: 'walletConnectionState',
    USER_PREFERENCES: 'userWalletPreferences',
    CONNECTION_START_TIME: 'connectionStartTime'
  },
  
  // Error Codes
  ERROR_CODES: {
    METAMASK_PENDING_REQUEST: -32002
  },
  
  // Health Check Configuration
  HEALTH_CHECK: {
    DEFAULT_CHECK_INTERVAL: 60000, // 60 seconds
    MAX_LATENCY: 2000, // 2 seconds
    MAX_ERROR_COUNT: 3,
    AUTO_RECONNECT: true,
    HEALTH_THRESHOLD: 80, // percentage
    MAX_RECONNECT_ATTEMPTS: 3
  }
} as const;

// Type definitions for better type safety
export type NetworkId = typeof APP_CONFIG.NETWORKS[keyof typeof APP_CONFIG.NETWORKS]['id'];
export type NetworkName = typeof APP_CONFIG.NETWORKS[keyof typeof APP_CONFIG.NETWORKS]['name'];

// Helper functions
export const getNetworkById = (id: number) => {
  return Object.values(APP_CONFIG.NETWORKS).find(network => network.id === id);
};

export const getNetworkByName = (name: string) => {
  return Object.values(APP_CONFIG.NETWORKS).find(network => network.name === name);
};

export const isSupportedNetwork = (id: number): boolean => {
  return APP_CONFIG.DEFAULT_NETWORK_IDS.includes(id);
};
