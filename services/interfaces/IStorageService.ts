export interface IStorageService {
  // Basic operations
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  
  // JSON operations
  getJSON<T>(key: string): T | null;
  setJSON<T>(key: string, value: T): void;
  
  // Utility operations
  hasItem(key: string): boolean;
  getKeys(): string[];
  getSize(): number;
  
  // Storage availability
  isAvailable(): boolean;
  
  // Batch operations
  getMultiple(keys: string[]): Record<string, string | null>;
  setMultiple(items: Record<string, string>): void;
  removeMultiple(keys: string[]): void;
}
