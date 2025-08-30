// Production Configuration
const { env } = require('./environment');

module.exports = {
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
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_POLYGON_RPC_URL: env.NEXT_PUBLIC_POLYGON_RPC_URL,
    NEXT_PUBLIC_LINEA_RPC_URL: env.NEXT_PUBLIC_LINEA_RPC_URL,
    NEXT_PUBLIC_BSC_RPC_URL: env.NEXT_PUBLIC_BSC_RPC_URL,
    ENABLE_AUTO_RECONNECT: env.ENABLE_AUTO_RECONNECT,
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
