/**
 * Take Repository
 * Handles persistence and retrieval of Takes
 */

import { v4 as uuidv4 } from 'uuid';
import { storage, STORAGE_KEYS } from '../storage/storage';
import { Take, TakeStatus } from './types';

class TakeRepository {
  /**
   * Get all takes
   */
  async getAll(): Promise<Take[]> {
    const takes = await storage.get<Take[]>(STORAGE_KEYS.TAKES);
    return takes || [];
  }

  /**
   * Get takes by status
   */
  async getByStatus(status: TakeStatus): Promise<Take[]> {
    const allTakes = await this.getAll();
    return allTakes.filter((take) => take.status === status);
  }

  /**
   * Get a take by ID
   */
  async getById(id: string): Promise<Take | null> {
    const allTakes = await this.getAll();
    return allTakes.find((take) => take.id === id) || null;
  }

  /**
   * Get a take by clientId (for idempotency)
   */
  async getByClientId(clientId: string): Promise<Take | null> {
    const allTakes = await this.getAll();
    return allTakes.find((take) => take.clientId === clientId) || null;
  }

  /**
   * Create a new take (queued status). Optional parentTakeId for thread replies.
   */
  async create(
    takeData: Omit<Take, 'id' | 'clientId' | 'status' | 'retryCount' | 'createdAt'> & { parentTakeId?: string }
  ): Promise<Take> {
    const id = uuidv4();
    const clientId = uuidv4(); // Stable client ID for idempotency

    const take: Take = {
      ...takeData,
      id,
      clientId,
      parentTakeId: takeData.parentTakeId,
      status: 'queued',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.save(take);
    return take;
  }

  /**
   * Get all replies to a take (thread replies)
   */
  async getReplies(parentTakeId: string): Promise<Take[]> {
    const allTakes = await this.getAll();
    const replies = allTakes.filter((t) => t.parentTakeId === parentTakeId);
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return replies;
  }

  /**
   * Get only top-level takes (no parent), for feed display
   */
  async getTopLevel(): Promise<Take[]> {
    const allTakes = await this.getAll();
    return allTakes.filter((t) => !t.parentTakeId);
  }

  /**
   * Update a take
   */
  async update(id: string, updates: Partial<Take>): Promise<Take | null> {
    const take = await this.getById(id);
    if (!take) {
      return null;
    }

    const updated: Take = {
      ...take,
      ...updates,
      id, // Ensure ID doesn't change
      clientId: take.clientId, // Ensure clientId never changes
    };

    await this.save(updated);
    return updated;
  }

  /**
   * Update take status
   */
  async updateStatus(id: string, status: TakeStatus, errorMessage?: string): Promise<Take | null> {
    const updates: Partial<Take> = {
      status,
      lastAttemptAt: new Date().toISOString(),
    };

    if (status === 'posted') {
      updates.syncedAt = new Date().toISOString();
      updates.errorMessage = undefined;
    } else if (status === 'failed') {
      updates.errorMessage = errorMessage;
    }

    return this.update(id, updates);
  }

  /**
   * Increment retry count
   */
  async incrementRetry(id: string): Promise<Take | null> {
    const take = await this.getById(id);
    if (!take) {
      return null;
    }

    return this.update(id, {
      retryCount: take.retryCount + 1,
      lastAttemptAt: new Date().toISOString(),
    });
  }

  /**
   * Save a take (internal)
   */
  private async save(take: Take): Promise<void> {
    const allTakes = await this.getAll();
    const index = allTakes.findIndex((t) => t.id === take.id);
    
    if (index >= 0) {
      allTakes[index] = take;
    } else {
      allTakes.push(take);
    }

    // Sort by createdAt (newest first)
    allTakes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    await storage.set(STORAGE_KEYS.TAKES, allTakes);
  }

  /**
   * Delete a take
   */
  async delete(id: string): Promise<boolean> {
    const allTakes = await this.getAll();
    const filtered = allTakes.filter((take) => take.id !== id);
    
    if (filtered.length === allTakes.length) {
      return false; // Not found
    }

    await storage.set(STORAGE_KEYS.TAKES, filtered);
    return true;
  }

  /**
   * Clear all takes (for dev/testing)
   */
  async clearAll(): Promise<void> {
    await storage.remove(STORAGE_KEYS.TAKES);
  }
}

export const takeRepository = new TakeRepository();
