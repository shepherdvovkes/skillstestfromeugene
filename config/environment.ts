// Environment configuration with validation
interface EnvironmentConfig {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOSTNAME: string;
  
  // WalletConnect configuration
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;
  
  // RPC URLs
  NEXT_PUBLIC_POLYGON_RPC_URL: string;
  NEXT_PUBLIC_LINEA_RPC_URL: string;
  NEXT_PUBLIC_BSC_RPC_URL: string;
  
  // Feature flags
  ENABLE_AUTO_RECONNECT: boolean;
  ENABLE_HEALTH_CHECKS: boolean;
  ENABLE_LOGGING: boolean;
}

// Environment validation
const validateEnvironment = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOSTNAME: process.env.HOSTNAME || 'localhost',
    
    // WalletConnect - required for production
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    
    // RPC URLs with fallbacks
    NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    NEXT_PUBLIC_LINEA_RPC_URL: process.env.NEXT_PUBLIC_LINEA_RPC_URL || 'https://rpc.linea.build',
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    
    // Feature flags
    ENABLE_AUTO_RECONNECT: process.env.ENABLE_AUTO_RECONNECT !== 'false',
    ENABLE_HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  };

  // Validation
  if (config.NODE_ENV === 'production') {
    if (config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID === 'demo-project-id') {
      console.warn('⚠️  Using demo WalletConnect project ID in production. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.');
    }
    
    if (!process.env.NEXT_PUBLIC_POLYGON_RPC_URL) {
      console.warn('⚠️  Using fallback Polygon RPC URL in production. Please set NEXT_PUBLIC_POLYGON_RPC_URL.');
    }
    
    if (!process.env.NEXT_PUBLIC_LINEA_RPC_URL) {
      console.warn('⚠️  Using fallback Linea RPC URL in production. Please set NEXT_PUBLIC_LINEA_RPC_URL.');
    }
    
    if (!process.env.NEXT_PUBLIC_BSC_RPC_URL) {
      console.warn('⚠️  Using fallback BSC RPC URL in production. Please set NEXT_PUBLIC_BSC_RPC_URL.');
    }
  }

  return config;
};

// Export validated environment configuration
export const env = validateEnvironment();

// Helper functions
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isTest = (): boolean => env.NODE_ENV === 'test';

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const baseConfig = {
    enableLogging: env.ENABLE_LOGGING,
    enableAutoReconnect: env.ENABLE_AUTO_RECONNECT,
    enableHealthChecks: env.ENABLE_HEALTH_CHECKS,
  };

  switch (env.NODE_ENV) {
    case 'production':
      return {
        ...baseConfig,
        enableLogging: false, // Disable logging in production by default
        enableAutoReconnect: true,
        enableHealthChecks: true,
      };
    case 'development':
      return {
        ...baseConfig,
        enableLogging: true,
        enableAutoReconnect: true,
        enableHealthChecks: true,
      };
    case 'test':
      return {
        ...baseConfig,
        enableLogging: false,
        enableAutoReconnect: false,
        enableHealthChecks: false,
      };
    default:
      return baseConfig;
  }
};
