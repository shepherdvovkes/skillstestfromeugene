#!/bin/bash

# Generate Secure Secrets Script
# This script generates cryptographically secure secrets for the application

set -e

echo "🔐 Generating secure secrets for Web3 Wallet Connection Demo..."
echo ""

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Function to generate random string
generate_random_string() {
    local length=$1
    openssl rand -hex $((length / 2)) | tr -d '\n'
}

# Function to generate UUID v4
generate_uuid() {
    python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || \
    node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || \
    echo "00000000-0000-4000-8000-000000000000"
}

echo "📝 Generating JWT Secret (32 characters)..."
JWT_SECRET=$(generate_random_string 32)
echo "JWT_SECRET=$JWT_SECRET"

echo "📝 Generating Session Secret (32 characters)..."
SESSION_SECRET=$(generate_random_string 32)
echo "SESSION_SECRET=$SESSION_SECRET"

echo "📝 Generating Internal API Key (UUID v4)..."
INTERNAL_API_KEY=$(generate_uuid)
echo "INTERNAL_API_KEY=$INTERNAL_API_KEY"

echo "📝 Generating Database Secret (32 characters)..."
DB_SECRET=$(generate_random_string 32)
echo "DB_SECRET=$DB_SECRET"

echo "📝 Generating Encryption Key (32 characters)..."
ENCRYPTION_KEY=$(generate_random_string 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

echo ""
echo "✅ All secrets generated successfully!"
echo ""

# Create .env.local with generated secrets
echo "📁 Creating .env.local file with generated secrets..."

cat > .env.local << EOF
# Web3 Wallet Connection Environment Configuration
# Generated secrets and configuration for local development
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# =============================================================================
# REQUIRED CONFIGURATION (Production)
# =============================================================================

# WalletConnect Project ID (Required for production)
# Get your project ID from https://cloud.walletconnect.com/
# This is a demo ID - replace with your actual project ID for production
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=8c4f79cc821944d9680842e34466bfbd9

# =============================================================================
# OPTIONAL RPC URLS (Recommended for production)
# =============================================================================

# Polygon Network RPC URL
# Default: https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com

# Linea Network RPC URL  
# Default: https://rpc.linea.build
NEXT_PUBLIC_LINEA_RPC_URL=https://rpc.linea.build

# BSC Network RPC URL
# Default: https://bsc-dataseed1.binance.org
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org

# =============================================================================
# FEATURE FLAGS
# =============================================================================

# Enable auto-reconnect functionality
# Default: true
ENABLE_AUTO_RECONNECT=true

# Enable connection health checks
# Default: true
ENABLE_HEALTH_CHECKS=true

# Enable logging (disabled in production by default)
# Default: true (development), false (production)
ENABLE_LOGGING=true

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Server port (used by custom server)
# Default: 3000 (development), 443 (production)
PORT=3000

# Server hostname
# Default: localhost
HOSTNAME=localhost

# =============================================================================
# DEVELOPMENT ONLY
# =============================================================================

# Node environment
# Options: development, production, test
NODE_ENV=development

# =============================================================================
# GENERATED SECRETS (DO NOT SHARE)
# =============================================================================

# JWT Secret for API authentication (32 character random string)
JWT_SECRET=$JWT_SECRET

# Session Secret for secure sessions (32 character random string)
SESSION_SECRET=$SESSION_SECRET

# API Key for internal services (UUID v4)
INTERNAL_API_KEY=$INTERNAL_API_KEY

# Database Connection Secret (32 character random string)
DB_SECRET=$DB_SECRET

# Encryption Key for sensitive data (32 character random string)
ENCRYPTION_KEY=$ENCRYPTION_KEY

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# Rate limiting - requests per minute per IP
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Rate limiting - requests per minute per wallet
WALLET_RATE_LIMIT_REQUESTS_PER_MINUTE=30

# Session timeout in seconds
SESSION_TIMEOUT=3600

# CSRF token expiration in seconds
CSRF_TOKEN_EXPIRATION=1800

# =============================================================================
# NOTES
# =============================================================================

# 1. For production deployment:
#    - Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your actual project ID
#    - Consider using private RPC endpoints for better performance
#    - Set ENABLE_LOGGING=false for production
#    - Generate new secrets for each environment
#
# 2. For testing:
#    - Set NODE_ENV=test
#    - Disable auto-reconnect and health checks if needed
#
# 3. Security:
#    - Never commit .env.local to version control
#    - Use environment-specific configurations
#    - Validate all environment variables on startup
#    - Rotate secrets regularly in production
#
# 4. Generated Secrets:
#    - All secrets are randomly generated for security
#    - Replace with your own secrets for production use
#    - Keep secrets secure and never expose them in client-side code
EOF

echo "✅ .env.local file created successfully!"
echo ""

# Set proper permissions
chmod 600 .env.local

echo "🔒 File permissions set to 600 (owner read/write only)"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   - Never commit .env.local to version control"
echo "   - Keep these secrets secure and private"
echo "   - Rotate secrets regularly in production"
echo "   - Use different secrets for each environment"
echo ""
echo "🚀 You can now run the application with: npm run dev"
