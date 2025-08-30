// Production Configuration
module.exports = {
  // Server configuration
  port: process.env.PORT || 443,
  hostname: process.env.HOSTNAME || 'localhost',
  
  // SSL configuration
  ssl: {
    enabled: true,
    keyPath: './ssl/privkey.pem',
    certPath: './ssl/fullchain.pem',
    caPath: './ssl/chain.pem'
  },
  
  // Environment variables
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    NEXT_PUBLIC_LINEA_RPC_URL: process.env.NEXT_PUBLIC_LINEA_RPC_URL || 'https://rpc.linea.build',
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
  },
  
  // Security settings
  security: {
    cspEnabled: true,
    hstsEnabled: true,
    xssProtection: true,
    contentTypeOptions: true
  }
};
