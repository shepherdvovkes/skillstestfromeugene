import { IStorageService } from '../interfaces/IStorageService';
import { storageLogger } from '@/utils/logger';

export class BrowserStorageService implements IStorageService {
  private storage: Storage;

  constructor(storage: Storage = window.localStorage) {
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

  getJSON<T>(key: string): T | null {
    try {
      const data = this.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      storageLogger.error('Failed to parse JSON from storage', error);
      return null;
    }
  }

  setJSON<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.setItem(key, serialized);
    } catch (error) {
      storageLogger.error('Failed to serialize JSON to storage', error);
      throw error;
    }
  }

  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  getKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      storageLogger.error('Failed to get storage keys', error);
      return [];
    }
  }

  getSize(): number {
    try {
      let size = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          size += this.storage.getItem(key)?.length || 0;
        }
      }
      return size;
    } catch (error) {
      storageLogger.error('Failed to calculate storage size', error);
      return 0;
    }
  }

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      this.setItem(testKey, 'test');
      this.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getMultiple(keys: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    keys.forEach(key => {
      result[key] = this.getItem(key);
    });
    return result;
  }

  setMultiple(items: Record<string, string>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value);
    });
  }

  removeMultiple(keys: string[]): void {
    keys.forEach(key => {
      this.removeItem(key);
    });
  }
}
