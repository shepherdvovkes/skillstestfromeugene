#!/bin/bash

# Setup SSL certificates with Let's Encrypt
# This script requires certbot to be installed

set -e

DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@example.com"}

echo "Setting up SSL certificates for domain: $DOMAIN"
echo "Email: $EMAIL"

# Create SSL directory
mkdir -p ssl

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Certbot is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install certbot
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y certbot
    else
        echo "Please install certbot manually for your OS"
        exit 1
    fi
fi

# Generate self-signed certificate for localhost (for development)
if [ "$DOMAIN" = "localhost" ]; then
    echo "Generating self-signed certificate for localhost..."
    
    # Generate private key
    openssl genrsa -out ssl/privkey.pem 2048
    
    # Generate certificate signing request
    openssl req -new -key ssl/privkey.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Generate self-signed certificate
    openssl x509 -req -in ssl/cert.csr -signkey ssl/privkey.pem -out ssl/fullchain.pem -days 365
    
    # Create chain.pem (same as fullchain.pem for self-signed)
    cp ssl/fullchain.pem ssl/chain.pem
    
    echo "Self-signed certificate generated successfully!"
    echo "Note: You'll need to accept the security warning in your browser for localhost"
else
    echo "Generating Let's Encrypt certificate for domain: $DOMAIN"
    
    # Stop any running servers on ports 80 and 443
    sudo pkill -f "node.*server.js" || true
    sudo pkill -f "next.*dev" || true
    
    # Generate certificate using certbot
    sudo certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
    
    # Copy certificates to ssl directory
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/chain.pem ssl/
    
    # Set proper permissions
    sudo chown $USER:$USER ssl/*
    chmod 600 ssl/privkey.pem
    chmod 644 ssl/fullchain.pem ssl/chain.pem
    
    echo "Let's Encrypt certificate generated successfully!"
fi

echo "SSL setup complete!"
echo "You can now run: npm run start:prod"
