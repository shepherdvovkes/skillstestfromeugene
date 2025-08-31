import { APP_CONFIG } from '@/config/constants';

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

  static sanitizeJSON<T>(input: string): T | null {
    try {
      const parsed = JSON.parse(input);
      return this.deepSanitize(parsed);
    } catch {
      return null;
    }
  }

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

  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }

  static validateWalletAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }

  static validateChainId(chainId: number): boolean {
    return APP_CONFIG.DEFAULT_NETWORK_IDS.includes(chainId);
  }

  static safeObjectAssign<T extends object>(target: T, source: any): T {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof T] = this.safeObjectAssign({}, value) as T[keyof T];
      } else {
        result[key as keyof T] = value as T[keyof T];
      }
    }
    
    return result;
  }

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
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  static validateRPCRequest(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;
    
    const requiredFields = ['jsonrpc', 'method', 'params', 'id'];
    const hasRequiredFields = requiredFields.every(field => field in payload);
    
    if (!hasRequiredFields) return false;
    
    if (payload.jsonrpc !== '2.0') return false;
    
    const safeMethods = ['eth_blockNumber', 'eth_getBalance', 'eth_getTransactionCount'];
    if (!safeMethods.includes(payload.method)) return false;
    
    if (!Array.isArray(payload.params)) return false;
    
    if (typeof payload.id !== 'number' && typeof payload.id !== 'string') return false;
    
    return true;
  }
}

export const networkRateLimiter = SecurityUtils.createRateLimiter(10, 60000);
export const walletRateLimiter = SecurityUtils.createRateLimiter(5, 60000);
