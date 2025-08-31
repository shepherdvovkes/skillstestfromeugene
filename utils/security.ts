import { APP_CONFIG } from '@/config/constants';

// Security utilities for protecting against various attacks
export class SecurityUtils {
  private static readonly SANITIZE_REGEX = /[<>\"'&]/g;
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /vbscript:/gi,
    /data:/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  ];

  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(this.SANITIZE_REGEX, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match] || match;
      })
      .trim();
  }

  /**
   * Validate and sanitize JSON input
   */
  static sanitizeJSON<T>(input: string): T | null {
    try {
      const parsed = JSON.parse(input);
      return this.deepSanitize(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Deep sanitize object properties
   */
  private static deepSanitize<T>(obj: T): T {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj) as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item)) as T;
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeInput(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized as T;
    }
    
    return obj;
  }

  /**
   * Validate URL to prevent open redirect attacks
   */
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['https:', 'http:'];
      const allowedDomains = [
        'polygon-rpc.com',
        'rpc.linea.build',
        'bsc-dataseed1.binance.org',
        'gasstation.polygon.technology',
        'api.etherscan.io'
      ];
      
      return allowedProtocols.includes(parsed.protocol) &&
             allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting utility
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true; // Request allowed
    };
  }

  /**
   * Validate wallet address format
   */
  static validateWalletAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    
    // Ethereum address format: 0x + 40 hex characters
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }

  /**
   * Validate chain ID
   */
  static validateChainId(chainId: number): boolean {
    return APP_CONFIG.DEFAULT_NETWORK_IDS.includes(chainId);
  }

  /**
   * Prevent prototype pollution attacks
   */
  static safeObjectAssign<T extends object>(target: T, source: any): T {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (key === '__proto__' || key === 'constructor') {
        continue; // Skip prototype pollution attempts
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof T] = this.safeObjectAssign({}, value);
      } else {
        result[key as keyof T] = value;
      }
    }
    
    return result;
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  /**
   * Validate RPC request payload
   */
  static validateRPCRequest(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;
    
    const requiredFields = ['jsonrpc', 'method', 'params', 'id'];
    const hasRequiredFields = requiredFields.every(field => field in payload);
    
    if (!hasRequiredFields) return false;
    
    // Validate jsonrpc version
    if (payload.jsonrpc !== '2.0') return false;
    
    // Validate method (only allow safe methods)
    const safeMethods = ['eth_blockNumber', 'eth_getBalance', 'eth_getTransactionCount'];
    if (!safeMethods.includes(payload.method)) return false;
    
    // Validate params (must be array)
    if (!Array.isArray(payload.params)) return false;
    
    // Validate id (must be number or string)
    if (typeof payload.id !== 'number' && typeof payload.id !== 'string') return false;
    
    return true;
  }
}

// Rate limiter instance for network requests
export const networkRateLimiter = SecurityUtils.createRateLimiter(10, 60000); // 10 requests per minute

// Rate limiter for wallet connections
export const walletRateLimiter = SecurityUtils.createRateLimiter(5, 60000); // 5 connections per minute
