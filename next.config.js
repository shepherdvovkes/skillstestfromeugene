/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable development features in production
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Ensure proper production optimization
  experimental: {
    // optimizeCss: true, // Requires critters module
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  env: {
    // NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
              "style-src 'self' 'unsafe-inline' https: http:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https: http: wss: ws:",
              "frame-src 'self' https: http:",
              "font-src 'self' data: https: http:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "media-src 'self' https: http:",
              "worker-src 'self' blob:"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Disable hot reload in production
    if (!dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
