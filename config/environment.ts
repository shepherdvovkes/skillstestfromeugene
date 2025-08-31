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
    ENABLE_HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  };

  // Validation
  if (config.NODE_ENV === 'production') {
    if (config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID === 'demo-project-id') {
      console.warn('⚠️  Using demo WalletConnect project ID in production. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.');
    }
    
    // Only warn about RPC URLs if they're not set and we're using fallbacks
    if (!process.env.NEXT_PUBLIC_POLYGON_RPC_URL && config.NEXT_PUBLIC_POLYGON_RPC_URL === 'https://polygon-rpc.com') {
      console.warn('⚠️  Using fallback Polygon RPC URL in production. Please set NEXT_PUBLIC_POLYGON_RPC_URL.');
    }
    
    if (!process.env.NEXT_PUBLIC_LINEA_RPC_URL && config.NEXT_PUBLIC_LINEA_RPC_URL === 'https://rpc.linea.build') {
      console.warn('⚠️  Using fallback Linea RPC URL in production. Please set NEXT_PUBLIC_LINEA_RPC_URL.');
    }
    
    if (!process.env.NEXT_PUBLIC_BSC_RPC_URL && config.NEXT_PUBLIC_BSC_RPC_URL === 'https://bsc-dataseed1.binance.org') {
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


