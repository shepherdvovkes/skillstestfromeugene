import { SecurityUtils, networkRateLimiter, walletRateLimiter } from '@/utils/security';

describe('SecurityUtils', () => {
  describe('sanitizeInput', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = SecurityUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should sanitize HTML entities', () => {
      const input = '<div>"test" & \'value\'</div>';
      const sanitized = SecurityUtils.sanitizeInput(input);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("'");
      // Note: & is preserved as &amp; in the output, which is correct HTML encoding
      expect(sanitized).toContain('&amp;');
    });

    it('should handle non-string input', () => {
      expect(SecurityUtils.sanitizeInput(null as any)).toBe('');
      expect(SecurityUtils.sanitizeInput(undefined as any)).toBe('');
      expect(SecurityUtils.sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('validateURL', () => {
    it('should validate allowed URLs', () => {
      expect(SecurityUtils.validateURL('https://polygon-rpc.com')).toBe(true);
      expect(SecurityUtils.validateURL('https://rpc.linea.build')).toBe(true);
      expect(SecurityUtils.validateURL('https://bsc-dataseed1.binance.org')).toBe(true);
    });

    it('should reject malicious URLs', () => {
      expect(SecurityUtils.validateURL('javascript:alert("xss")')).toBe(false);
      expect(SecurityUtils.validateURL('data:text/html,<script>alert("xss")</script>')).toBe(false);
      expect(SecurityUtils.validateURL('https://malicious-site.com')).toBe(false);
      expect(SecurityUtils.validateURL('ftp://evil.com')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(SecurityUtils.validateURL('not-a-url')).toBe(false);
      expect(SecurityUtils.validateURL('')).toBe(false);
    });
  });

  describe('validateWalletAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(SecurityUtils.validateWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')).toBe(true);
      expect(SecurityUtils.validateWalletAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(SecurityUtils.validateWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b')).toBe(false); // too short
      expect(SecurityUtils.validateWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6x')).toBe(false); // too long
      expect(SecurityUtils.validateWalletAddress('742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')).toBe(false); // no 0x
      expect(SecurityUtils.validateWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8bG')).toBe(false); // invalid char
    });

    it('should handle edge cases', () => {
      expect(SecurityUtils.validateWalletAddress('')).toBe(false);
      expect(SecurityUtils.validateWalletAddress(null as any)).toBe(false);
      expect(SecurityUtils.validateWalletAddress(undefined as any)).toBe(false);
    });
  });

  describe('validateChainId', () => {
    it('should validate supported chain IDs', () => {
      expect(SecurityUtils.validateChainId(137)).toBe(true); // Polygon
      expect(SecurityUtils.validateChainId(59144)).toBe(true); // Linea
      expect(SecurityUtils.validateChainId(56)).toBe(true); // BSC
    });

    it('should reject unsupported chain IDs', () => {
      expect(SecurityUtils.validateChainId(1)).toBe(false); // Ethereum (not in default list)
      expect(SecurityUtils.validateChainId(999999)).toBe(false); // Unknown
      expect(SecurityUtils.validateChainId(-1)).toBe(false); // Negative
    });
  });

  describe('validateRPCRequest', () => {
    it('should validate correct RPC requests', () => {
      const validRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };
      expect(SecurityUtils.validateRPCRequest(validRequest)).toBe(true);
    });

    it('should reject malicious RPC requests', () => {
      const maliciousRequest = {
        jsonrpc: '2.0',
        method: 'eth_sendTransaction', // Dangerous method
        params: [],
        id: 1
      };
      expect(SecurityUtils.validateRPCRequest(maliciousRequest)).toBe(false);
    });

    it('should reject invalid RPC requests', () => {
      expect(SecurityUtils.validateRPCRequest(null)).toBe(false);
      expect(SecurityUtils.validateRPCRequest({})).toBe(false);
      expect(SecurityUtils.validateRPCRequest({ jsonrpc: '1.0' })).toBe(false);
    });
  });

  describe('safeObjectAssign', () => {
    it('should prevent prototype pollution', () => {
      const target = { existing: 'value' };
      const source = { '__proto__': { polluted: true } };
      
      const result = SecurityUtils.safeObjectAssign(target, source);
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect(result.existing).toBe('value');
    });

    it('should handle normal object assignment', () => {
      const target = { a: 1 };
      const source = { b: 2, c: 3 };
      
      const result = SecurityUtils.safeObjectAssign(target, source);
      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect(result.c).toBe(3);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      const token16 = SecurityUtils.generateSecureToken(16);
      const token32 = SecurityUtils.generateSecureToken(32);
      
      expect(token16.length).toBe(16);
      expect(token32.length).toBe(32);
    });

    it('should generate unique tokens', () => {
      const token1 = SecurityUtils.generateSecureToken(16);
      const token2 = SecurityUtils.generateSecureToken(16);
      
      expect(token1).not.toBe(token2);
    });

    it('should use only allowed characters', () => {
      const token = SecurityUtils.generateSecureToken(100);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });
});

describe('Rate Limiters', () => {
  describe('networkRateLimiter', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      
      // Should allow first 10 requests
      for (let i = 0; i < 10; i++) {
        expect(networkRateLimiter(identifier)).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      const identifier = 'test-user-2';
      
      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        networkRateLimiter(identifier);
      }
      
      // 11th request should be blocked
      expect(networkRateLimiter(identifier)).toBe(false);
    });
  });

  describe('walletRateLimiter', () => {
    it('should allow wallet connections within limit', () => {
      const identifier = 'test-wallet-user';
      
      // Should allow first 5 connections
      for (let i = 0; i < 5; i++) {
        expect(walletRateLimiter(identifier)).toBe(true);
      }
    });

    it('should block wallet connections over limit', () => {
      const identifier = 'test-wallet-user-2';
      
      // Make 5 connections (at limit)
      for (let i = 0; i < 5; i++) {
        walletRateLimiter(identifier);
      }
      
      // 6th connection should be blocked
      expect(walletRateLimiter(identifier)).toBe(false);
    });
  });
});
