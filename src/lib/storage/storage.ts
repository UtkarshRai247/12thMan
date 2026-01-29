/**
 * Typed Storage Layer
 * Wrapper around AsyncStorage with type safety and versioning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { runMigrations, STORAGE_VERSION_KEY, STORAGE_VERSION } from './migrations';

// Storage keys
export const STORAGE_KEYS = {
  TAKES: '@12thman:takes',
  RATING_DRAFTS: '@12thman:rating_drafts',
  SYNC_FAILURE_SIMULATION: '@12thman:sync_failure_simulation',
  USER: '@12thman:user',
  SYNC_LOG: '@12thman:sync_log',
  FOLLOWING: '@12thman:following',
} as const;

class Storage {
  /**
   * Initialize storage and run migrations
   */
  async init(): Promise<void> {
    const getVersion = async () => {
      const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    };

    const setVersion = async (version: number) => {
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, version.toString());
    };

    await runMigrations(getVersion, setVersion);
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all storage (for dev/testing)
   */
  async clear(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      // Filter to only our app's keys
      const appKeys = keys.filter((key) => key.startsWith('@12thman:'));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple items at once
   */
  async multiGet<T>(keys: string[]): Promise<[string, T | null][]> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      return items.map(([key, value]) => [
        key,
        value ? (JSON.parse(value) as T) : null,
      ]) as [string, T | null][];
    } catch (error) {
      console.error('Error multi-getting:', error);
      return keys.map((key) => [key, null] as [string, T | null]);
    }
  }

  /**
   * Set multiple items at once
   */
  async multiSet<T>(items: [string, T][]): Promise<void> {
    try {
      const serialized = items.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(serialized);
    } catch (error) {
      console.error('Error multi-setting:', error);
      throw error;
    }
  }
}

export const storage = new Storage();

// Initialize on import
storage.init().catch((error) => {
  console.error('Storage initialization failed:', error);
});
