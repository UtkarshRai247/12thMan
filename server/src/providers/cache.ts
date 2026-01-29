/**
 * In-memory TTL cache for dev. Interface can be swapped for Redis later.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export interface CacheAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds: number): void;
}

export const memoryCache: CacheAdapter = {
  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  set<T>(key: string, value: T, ttlSeconds: number): void {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },
};
