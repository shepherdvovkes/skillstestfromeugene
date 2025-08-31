// Production Configuration
// TypeScript configuration with proper type definitions

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  HOSTNAME: string;
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;
  NEXT_PUBLIC_POLYGON_RPC_URL: string;
  NEXT_PUBLIC_LINEA_RPC_URL: string;
  NEXT_PUBLIC_BSC_RPC_URL: string;
  REOWN_API_KEY: string;
  ENABLE_HEALTH_CHECKS: boolean;
  ENABLE_LOGGING: boolean;
}

interface SSLConfig {
  enabled: boolean;
  keyPath: string;
  certPath: string;
  caPath: string;
}

interface SecurityConfig {
  cspEnabled: boolean;
  hstsEnabled: boolean;
  xssProtection: boolean;
  contentTypeOptions: boolean;
}

interface ProductionConfig {
  port: number;
  hostname: string;
  ssl: SSLConfig;
  env: EnvironmentConfig;
  security: SecurityConfig;
}

// Use environment variables directly since we can't import TypeScript in CommonJS
const env: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '443', 10),
  HOSTNAME: process.env.HOSTNAME || 'localhost',
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9',
  NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
  NEXT_PUBLIC_LINEA_RPC_URL: process.env.NEXT_PUBLIC_LINEA_RPC_URL || 'https://rpc.linea.build',
  NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
  REOWN_API_KEY: process.env.REOWN_API_KEY || 'dc2aafa0-e5be-4535-bfc5-67097368d69c',
  ENABLE_HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS !== 'false',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false'
};

const config: ProductionConfig = {
  // Server configuration
  port: env.PORT,
  hostname: env.HOSTNAME,
  
  // SSL configuration
  ssl: {
    enabled: true,
    keyPath: './ssl/privkey.pem',
    certPath: './ssl/fullchain.pem',
    caPath: './ssl/chain.pem'
  },
  
  // Environment variables (validated)
  env: {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    HOSTNAME: env.HOSTNAME,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_POLYGON_RPC_URL: env.NEXT_PUBLIC_POLYGON_RPC_URL,
    NEXT_PUBLIC_LINEA_RPC_URL: env.NEXT_PUBLIC_LINEA_RPC_URL,
    NEXT_PUBLIC_BSC_RPC_URL: env.NEXT_PUBLIC_BSC_RPC_URL,
    REOWN_API_KEY: env.REOWN_API_KEY,
    ENABLE_HEALTH_CHECKS: env.ENABLE_HEALTH_CHECKS,
    ENABLE_LOGGING: env.ENABLE_LOGGING
  },
  
  // Security settings
  security: {
    cspEnabled: true,
    hstsEnabled: true,
    xssProtection: true,
    contentTypeOptions: true
  }
};

export default config;
