/**
 * Sync Service
 * Handles syncing queued takes to the server (simulated)
 * Includes mutex, backoff, batching, and sync logging
 */

import { takeRepository } from '../domain/takeRepository';
import { storage, STORAGE_KEYS } from '../storage/storage';
import { Take } from '../domain/types';

export interface SyncLog {
  startedAt: string;
  endedAt?: string;
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false; // Mutex lock
  private readonly MAX_BATCH_SIZE = 10;
  private readonly MAX_RETRIES = 3;
  private readonly BASE_BACKOFF_MS = 5000; // 5 seconds

  /**
   * Calculate backoff delay for a take
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: min(2^retryCount * 5s, 5min)
    const delay = Math.min(
      Math.pow(2, retryCount) * this.BASE_BACKOFF_MS,
      5 * 60 * 1000 // 5 minutes max
    );
    return delay;
  }

  /**
   * Check if a take should be synced (respects backoff)
   */
  private shouldSyncTake(take: Take): boolean {
    if (!take.lastAttemptAt) {
      return true; // Never attempted
    }

    const lastAttempt = new Date(take.lastAttemptAt).getTime();
    const delay = this.calculateBackoffDelay(take.retryCount);
    const now = Date.now();

    return now - lastAttempt >= delay;
  }
  /**
   * Check if sync failure simulation is enabled
   */
  async isFailureSimulationEnabled(): Promise<boolean> {
    const enabled = await storage.get<boolean>(STORAGE_KEYS.SYNC_FAILURE_SIMULATION);
    return enabled === true;
  }

  /**
   * Toggle sync failure simulation
   */
  async toggleFailureSimulation(): Promise<boolean> {
    const current = await this.isFailureSimulationEnabled();
    await storage.set(STORAGE_KEYS.SYNC_FAILURE_SIMULATION, !current);
    return !current;
  }

  /**
   * Sync a single take
   */
  async syncTake(take: Take): Promise<{ success: boolean; error?: string }> {
    // Update status to syncing
    await takeRepository.updateStatus(take.id, 'syncing');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Check if failure simulation is enabled
    const shouldFail = await this.isFailureSimulationEnabled();
    
    if (shouldFail) {
      const error = 'Simulated sync failure';
      await takeRepository.updateStatus(take.id, 'failed', error);
      await takeRepository.incrementRetry(take.id);
      return { success: false, error };
    }

    // Simulate success - in real app, this would call the API
    // For now, we just mark it as posted
    const providerId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await takeRepository.update(take.id, {
      status: 'posted',
      providerId,
      syncedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Get sync log
   */
  async getSyncLog(): Promise<SyncLog | null> {
    return storage.get<SyncLog>(STORAGE_KEYS.SYNC_LOG);
  }

  /**
   * Save sync log
   */
  private async saveSyncLog(log: SyncLog): Promise<void> {
    await storage.set(STORAGE_KEYS.SYNC_LOG, log);
  }

  /**
   * Sync all queued takes (with mutex, backoff, batching)
   */
  async syncAll(): Promise<{ synced: number; failed: number; skipped: number; errors: string[] }> {
    // Mutex: prevent concurrent syncs
    if (this.isSyncing) {
      return { synced: 0, failed: 0, skipped: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    const log: SyncLog = {
      startedAt: new Date().toISOString(),
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const queuedTakes = await takeRepository.getByStatus('queued');
      const syncingTakes = await takeRepository.getByStatus('syncing');
      const allTakes = [...queuedTakes, ...syncingTakes];

      // Filter by backoff
      const takesToSync = allTakes.filter((take) => {
        if (this.shouldSyncTake(take)) {
          return true;
        } else {
          log.skipped++;
          return false;
        }
      });

      // Batch: limit to MAX_BATCH_SIZE
      const batchedTakes = takesToSync.slice(0, this.MAX_BATCH_SIZE);
      log.attempted = batchedTakes.length;

      if (batchedTakes.length === 0) {
        log.endedAt = new Date().toISOString();
        await this.saveSyncLog(log);
        return { synced: 0, failed: 0, skipped: log.skipped, errors: [] };
      }

      // Sync takes
      const results = await Promise.allSettled(
        batchedTakes.map((take) => this.syncTake(take))
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          log.succeeded++;
        } else {
          log.failed++;
          const error = result.status === 'fulfilled'
            ? result.value.error
            : result.reason?.message || 'Unknown error';
          if (error) {
            log.errors.push(error);
          }
        }
      });

      log.endedAt = new Date().toISOString();
      await this.saveSyncLog(log);

      return {
        synced: log.succeeded,
        failed: log.failed,
        skipped: log.skipped,
        errors: log.errors,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Retry failed takes (up to max retries, respects backoff)
   */
  async retryFailed(): Promise<{ synced: number; failed: number; skipped: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, skipped: 0 };
    }

    this.isSyncing = true;
    try {
      const failedTakes = await takeRepository.getByStatus('failed');
      const retryableTakes = failedTakes.filter(
        (take) => take.retryCount < this.MAX_RETRIES && this.shouldSyncTake(take)
      );

      if (retryableTakes.length === 0) {
        return { synced: 0, failed: 0, skipped: 0 };
      }

      const results = await Promise.allSettled(
        retryableTakes.map((take) => this.syncTake(take))
      );

      const synced = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = results.length - synced;
      const skipped = failedTakes.length - retryableTakes.length;

      return { synced, failed, skipped };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Check if sync is currently running
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
