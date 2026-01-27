/**
 * In-memory TTL Cache
 * Simple key-value store with expiration
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Set a value in the cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache, returns null if expired or not found
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new Cache();
