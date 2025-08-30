const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const config = require('./config/production');

const dev = process.env.NODE_ENV !== 'production';
const hostname = config.env.hostname || 'localhost';
const port = config.env.port || 443;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL certificate paths
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, config.ssl.keyPath)),
  cert: fs.readFileSync(path.join(__dirname, config.ssl.certPath)),
  ca: fs.readFileSync(path.join(__dirname, config.ssl.caPath)),
};

app.prepare().then(() => {
  // Create HTTPS server
  const httpsServer = createServer(sslOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Add security headers
      if (config.security.hstsEnabled) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      if (config.security.xssProtection) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
      if (config.security.contentTypeOptions) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create HTTP server for redirecting to HTTPS
  const httpServer = createHttpServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  });

  // Start servers
  httpsServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Production server ready on https://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  httpServer.listen(80, (err) => {
    if (err) {
      console.warn('> Could not start HTTP redirect server on port 80 (requires sudo)');
      console.warn('> Users will need to access the site directly via HTTPS');
    } else {
      console.log(`> HTTP redirect server listening on port 80`);
    }
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
