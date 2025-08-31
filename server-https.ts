import { createServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { URL } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { SecureContextOptions, SecureVersion } from 'tls';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const httpsPort = parseInt(process.env.HTTPS_PORT || '443', 10); // Use standard HTTPS port
const httpPort = parseInt(process.env.HTTP_PORT || '80', 10); // Use standard HTTP port

// Prepare the Next.js app
const app = next({ dev, hostname, port: httpPort });
const handle = app.getRequestHandler();

// Check if SSL certificates exist
const sslDir = path.join(process.cwd(), 'ssl');
const sslKeyPath = path.join(sslDir, 'privkey.pem');
const sslCertPath = path.join(sslDir, 'fullchain.pem');
const sslCaPath = path.join(sslDir, 'chain.pem');

const sslCertificatesExist = fs.existsSync(sslKeyPath) && 
                             fs.existsSync(sslCertPath) && 
                             fs.existsSync(sslCaPath);

// Helper function to convert WHATWG URL to Next.js compatible format
function createNextUrl(url: string, base: string) {
  try {
    const parsedUrl = new URL(url, base);
    return {
      query: Object.fromEntries(parsedUrl.searchParams),
      pathname: parsedUrl.pathname,
      path: parsedUrl.pathname, // Add missing 'path' property
      href: parsedUrl.href,
      // Add other properties that Next.js expects
      auth: parsedUrl.username || parsedUrl.password ? `${parsedUrl.username}:${parsedUrl.password}` : '',
      slashes: parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:',
      protocol: parsedUrl.protocol,
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      hash: parsedUrl.hash,
      search: parsedUrl.search
    };
  } catch (error) {
    console.error('Error parsing URL:', error);
    // Fallback to basic parsing
    return {
      query: {},
      pathname: url,
      path: url, // Add missing 'path' property
      href: url,
      auth: '',
      slashes: true,
      protocol: base.startsWith('https') ? 'https:' : 'http:',
      host: hostname,
      hostname: hostname,
      port: base.startsWith('https') ? httpsPort.toString() : httpPort.toString(),
      hash: '',
      search: ''
    };
  }
}

app.prepare().then(() => {
  if (sslCertificatesExist) {
    console.log('SSL certificates found. Starting HTTPS server with HTTP redirect...');
    
    // Create HTTPS server with modern SSL configuration
    const httpsOptions: SecureContextOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
      ca: fs.readFileSync(sslCaPath),
      // Modern SSL configuration with proper TypeScript types
      minVersion: 'TLSv1.2' as SecureVersion,
      maxVersion: 'TLSv1.3' as SecureVersion,
      ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305'
      ].join(':'),
      honorCipherOrder: true
    };

    const httpsServer = createServer(httpsOptions, async (req, res) => {
      try {
        // Use modern WHATWG URL API instead of deprecated url.parse
        const nextUrl = createNextUrl(req.url!, `https://${req.headers.host}`);
        
        // Add modern security headers
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        await handle(req, res, nextUrl);
      } catch (err) {
        console.error('HTTPS Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Create HTTP server for redirecting to HTTPS
    const httpServer = createHttpServer((req, res) => {
      try {
        const nextUrl = createNextUrl(req.url!, `http://${req.headers.host}`);
        res.writeHead(301, { Location: `https://${req.headers.host}${nextUrl.pathname}${nextUrl.search || ''}` });
        res.end();
      } catch (err) {
        console.error('HTTP redirect error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Start servers
    httpsServer.listen(httpsPort, () => {
      console.log(`> HTTPS Server ready on https://${hostname}:${httpsPort}`);
      console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`> SSL: Modern TLS 1.2/1.3 with strong ciphers`);
    });

    httpServer.listen(httpPort, () => {
      console.log(`> HTTP redirect server listening on port ${httpPort}`);
      console.log(`> Redirecting all HTTP traffic to HTTPS`);
    });

    // Handle server errors gracefully
    httpsServer.on('error', (err: Error & { code?: string }) => {
      console.error('HTTPS Server error:', err);
      if (err.code === 'EACCES') {
        console.error('Permission denied. Try running with sudo or use ports > 1024');
      }
    });

    httpServer.on('error', (err: Error & { code?: string }) => {
      console.error('HTTP Server error:', err);
      if (err.code === 'EACCES') {
        console.error('Permission denied. Try running with sudo or use ports > 1024');
      }
    });

  } else {
    console.log('SSL certificates not found. Starting HTTP server only...');
    console.log('Expected SSL files:');
    console.log(`  - ${sslKeyPath}`);
    console.log(`  - ${sslCertPath}`);
    console.log(`  - ${sslCaPath}`);
    console.log(`> Note: Running in HTTP mode - SSL certificates not found`);
    
    // Fallback to HTTP server
    const httpServer = createHttpServer(async (req, res) => {
      try {
        const nextUrl = createNextUrl(req.url!, `http://${req.headers.host}`);
        await handle(req, res, nextUrl);
      } catch (err) {
        console.error('HTTP Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    httpServer.listen(httpPort, () => {
      console.log(`> HTTP Server ready on http://${hostname}:${httpPort}`);
      console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    httpServer.on('error', (err: Error & { code?: string }) => {
      console.error('HTTP Server error:', err);
      if (err.code === 'EACCES') {
        console.error('Permission denied. Try running with sudo or use ports > 1024');
      }
    });
  }
}).catch((err: Error) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
