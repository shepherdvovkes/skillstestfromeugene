// Logger utility for consistent logging across the application
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: (process.env.NODE_ENV === 'production' ? 'warn' : 'debug') as LogLevel,
      enabled: process.env.NODE_ENV !== 'test',
      prefix: '[WalletApp]',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || '';
    return `${prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message);
      if (error instanceof Error) {
        console.error(formattedMessage, error.message, error.stack, ...args);
      } else {
        console.error(formattedMessage, error, ...args);
      }
    }
  }

  // Wallet-specific logging methods
  walletConnect(walletType: string, success: boolean, error?: any): void {
    if (success) {
      this.info(`Wallet connected successfully: ${walletType}`);
    } else {
      this.error(`Wallet connection failed: ${walletType}`, error);
    }
  }

  walletDisconnect(walletType: string): void {
    this.info(`Wallet disconnected: ${walletType}`);
  }

  networkSwitch(fromNetwork: string, toNetwork: string, success: boolean, error?: any): void {
    if (success) {
      this.info(`Network switched from ${fromNetwork} to ${toNetwork}`);
    } else {
      this.error(`Network switch failed from ${fromNetwork} to ${toNetwork}`, error);
    }
  }

  healthCheck(status: string, details?: any): void {
    this.debug(`Health check: ${status}`, details);
  }

  storageOperation(operation: string, key: string, success: boolean, error?: any): void {
    if (success) {
      this.debug(`Storage ${operation} successful: ${key}`);
    } else {
      this.error(`Storage ${operation} failed: ${key}`, error);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers
export const walletLogger = new Logger({ prefix: '[Wallet]' });
export const networkLogger = new Logger({ prefix: '[Network]' });
export const storageLogger = new Logger({ prefix: '[Storage]' });
export const healthLogger = new Logger({ prefix: '[Health]' });

// Export logger class for custom instances
export { Logger };
export type { LogLevel, LoggerConfig };
