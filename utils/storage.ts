import { APP_CONFIG } from '@/config/constants';
import { storageLogger } from './logger';

// Storage interface for better abstraction
interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// Browser storage implementation
class BrowserStorage implements StorageInterface {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getItem(key: string): string | null {
    try {
      const value = this.storage.getItem(key);
      storageLogger.storageOperation('get', key, true);
      return value;
    } catch (error) {
      storageLogger.storageOperation('get', key, false, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
      storageLogger.storageOperation('set', key, true);
    } catch (error) {
      storageLogger.storageOperation('set', key, false, error);
      throw error;
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
      storageLogger.storageOperation('remove', key, true);
    } catch (error) {
      storageLogger.storageOperation('remove', key, false, error);
      throw error;
    }
  }

  clear(): void {
    try {
      this.storage.clear();
      storageLogger.storageOperation('clear', 'all', true);
    } catch (error) {
      storageLogger.storageOperation('clear', 'all', false, error);
      throw error;
    }
  }
}

// Memory storage fallback for SSR
class MemoryStorage implements StorageInterface {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// Storage factory
const createStorage = (): StorageInterface => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return new BrowserStorage(window.localStorage);
  }
  return new MemoryStorage();
};

// Global storage instance
const storage = createStorage();

// Type-safe storage operations
export class WalletStorage {
  private storage: StorageInterface;

  constructor(storageImpl: StorageInterface = storage) {
    this.storage = storageImpl;
  }

  // Connection state operations
  getConnectionState(): any | null {
    const data = this.storage.getItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_STATE);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      storageLogger.error('Failed to parse connection state', error);
      return null;
    }
  }

  setConnectionState(state: any): void {
    try {
      const serialized = JSON.stringify(state);
      this.storage.setItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_STATE, serialized);
    } catch (error) {
      storageLogger.error('Failed to save connection state', error);
      throw error;
    }
  }

  clearConnectionState(): void {
    this.storage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_STATE);
    this.storage.removeItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET);
    this.storage.removeItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
  }

  // User preferences operations
  getUserPreferences(): any | null {
    const data = this.storage.getItem(APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      storageLogger.error('Failed to parse user preferences', error);
      return null;
    }
  }

  setUserPreferences(preferences: any): void {
    try {
      const serialized = JSON.stringify(preferences);
      this.storage.setItem(APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES, serialized);
    } catch (error) {
      storageLogger.error('Failed to save user preferences', error);
      throw error;
    }
  }

  // Wallet operations
  getLastConnectedWallet(): string | null {
    return this.storage.getItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET);
  }

  setLastConnectedWallet(walletType: string): void {
    this.storage.setItem(APP_CONFIG.STORAGE_KEYS.LAST_CONNECTED_WALLET, walletType);
  }

  // Connection timing operations
  getConnectionStartTime(): number | null {
    const data = this.storage.getItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME);
    return data ? parseInt(data, 10) : null;
  }

  setConnectionStartTime(timestamp: number): void {
    this.storage.setItem(APP_CONFIG.STORAGE_KEYS.CONNECTION_START_TIME, timestamp.toString());
  }

  // Generic operations
  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  // Utility methods
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getStorageSize(): number {
    // This method is not implemented for the current storage interface
    // as it requires access to the underlying storage implementation
    return 0;
  }
}

// Export default instance
export const walletStorage = new WalletStorage();

// Export types and classes for testing
export { BrowserStorage, MemoryStorage };
export type { StorageInterface };
