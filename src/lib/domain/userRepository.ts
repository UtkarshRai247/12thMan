/**
 * User Repository
 * Handles local user profile persistence
 */

import { v4 as uuidv4 } from 'uuid';
import { storage, STORAGE_KEYS } from '../storage/storage';
import { LocalUser } from './types';

class UserRepository {
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LocalUser | null> {
    return storage.get<LocalUser>(STORAGE_KEYS.USER);
  }

  /**
   * Create or update user
   */
  async saveUser(userData: Omit<LocalUser, 'userId' | 'createdAt'>): Promise<LocalUser> {
    const existing = await this.getCurrentUser();
    
    const user: LocalUser = existing
      ? {
          ...existing,
          ...userData,
        }
      : {
          userId: uuidv4(),
          ...userData,
          createdAt: new Date().toISOString(),
        };

    await storage.set(STORAGE_KEYS.USER, user);
    return user;
  }

  /**
   * Delete user (for testing/reset)
   */
  async deleteUser(): Promise<void> {
    await storage.remove(STORAGE_KEYS.USER);
  }
}

export const userRepository = new UserRepository();
