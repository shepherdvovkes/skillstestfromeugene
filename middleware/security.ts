import { NextRequest, NextResponse } from 'next/server';
import { SecurityUtils, networkRateLimiter, walletRateLimiter } from '@/utils/security';

// Security middleware for protecting against various attacks
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: ws:",
    "font-src 'self' data: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Rate limiting
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const identifier = `${clientIP}:${userAgent}`;
  
  // Check rate limits
  if (!networkRateLimiter(identifier)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  // Validate request path
  const path = request.nextUrl.pathname;
  if (path.includes('..') || path.includes('//')) {
    return new NextResponse('Invalid Request', { status: 400 });
  }
  
  // Validate query parameters
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    if (SecurityUtils.sanitizeInput(value) !== value) {
      return new NextResponse('Invalid Query Parameter', { status: 400 });
    }
  }
  
  // Validate request headers
  const contentType = request.headers.get('content-type');
  if (contentType && !contentType.includes('application/json') && 
      !contentType.includes('text/plain') && 
      !contentType.includes('multipart/form-data')) {
    return new NextResponse('Invalid Content Type', { status: 400 });
  }
  
  return response;
}

// Wallet-specific security middleware
export function walletSecurityMiddleware(request: NextRequest) {
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const identifier = `${clientIP}:${userAgent}`;
  
  // Stricter rate limiting for wallet operations
  if (!walletRateLimiter(identifier)) {
    return new NextResponse('Wallet Rate Limit Exceeded', { status: 429 });
  }
  
  // Validate wallet-related requests
  if (request.method === 'POST') {
    try {
      const body = request.body;
      if (body) {
        // Additional validation for wallet operations
        const clonedRequest = request.clone();
        clonedRequest.json().then((data) => {
          if (data && typeof data === 'object') {
            // Validate wallet address if present
            if (data.address && !SecurityUtils.validateWalletAddress(data.address)) {
              console.warn('Invalid wallet address detected:', data.address);
            }
            
            // Validate chain ID if present
            if (data.chainId && !SecurityUtils.validateChainId(data.chainId)) {
              console.warn('Invalid chain ID detected:', data.chainId);
            }
          }
        }).catch(() => {
          // Ignore parsing errors for non-JSON requests
        });
      }
    } catch (error) {
      console.warn('Wallet security validation failed:', error);
    }
  }
  
  return NextResponse.next();
}

// API route security middleware
export function apiSecurityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add API-specific security headers
  response.headers.set('X-API-Version', '1.0');
  response.headers.set('X-Request-ID', SecurityUtils.generateSecureToken(16));
  
  // Validate API key if required
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && !isValidApiKey(apiKey)) {
    return new NextResponse('Invalid API Key', { status: 401 });
  }
  
  return response;
}

// Helper function to validate API keys
function isValidApiKey(apiKey: string): boolean {
  // In production, this should validate against a secure database
  // For demo purposes, we'll use a simple format check
  return apiKey.length >= 32 && /^[a-zA-Z0-9-_]+$/.test(apiKey);
}

// Export combined security middleware
export function combinedSecurityMiddleware(request: NextRequest) {
  // Apply all security checks
  const baseResponse = securityMiddleware(request);
  if (baseResponse.status !== 200) return baseResponse;
  
  // Apply wallet-specific security for wallet routes
  if (request.nextUrl.pathname.startsWith('/api/wallet') || 
      request.nextUrl.pathname.startsWith('/api/connect')) {
    const walletResponse = walletSecurityMiddleware(request);
    if (walletResponse.status !== 200) return walletResponse;
  }
  
  // Apply API security for all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return apiSecurityMiddleware(request);
  }
  
  return baseResponse;
}
