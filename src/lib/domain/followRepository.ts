/**
 * Follow Repository
 * Handles local list of followed user IDs
 */

import { storage, STORAGE_KEYS } from '../storage/storage';

class FollowRepository {
  /**
   * Get list of followed user IDs
   */
  async getFollowing(): Promise<string[]> {
    const list = await storage.get<string[]>(STORAGE_KEYS.FOLLOWING);
    return list ?? [];
  }

  /**
   * Follow a user by ID
   */
  async follow(userId: string): Promise<void> {
    const list = await this.getFollowing();
    if (list.includes(userId)) return;
    await storage.set(STORAGE_KEYS.FOLLOWING, [...list, userId]);
  }

  /**
   * Unfollow a user by ID
   */
  async unfollow(userId: string): Promise<void> {
    const list = await this.getFollowing();
    const next = list.filter((id) => id !== userId);
    if (next.length === list.length) return;
    await storage.set(STORAGE_KEYS.FOLLOWING, next);
  }

  /**
   * Check if current user follows the given user ID
   */
  async isFollowing(userId: string): Promise<boolean> {
    const list = await this.getFollowing();
    return list.includes(userId);
  }
}

export const followRepository = new FollowRepository();
