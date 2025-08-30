module.exports = {
  apps: [
    {
      name: 'blockchain-wallet-demo',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 443,
        HOSTNAME: 'localhost'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 443,
        HOSTNAME: 'localhost'
      },
      // SSL configuration
      ssl: {
        enabled: true,
        key: './ssl/privkey.pem',
        cert: './ssl/fullchain.pem',
        ca: './ssl/chain.pem'
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Performance
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      // Security
      // uid: process.env.USER, // Requires root access
      // gid: process.env.USER, // Requires root access
      // Monitoring
      pmx: true,
      // Environment variables
      env_file: '.env.production'
    }
  ],

  deploy: {
    production: {
      user: process.env.USER,
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/blockchain-wallet-connection-demo.git',
      path: '/var/www/blockchain-wallet-demo',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
