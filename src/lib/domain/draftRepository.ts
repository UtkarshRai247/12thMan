/**
 * Draft Repository
 * Handles RatingDraft persistence
 */

import { storage, STORAGE_KEYS } from '../storage/storage';
import { RatingDraft } from './types';

class DraftRepository {
  /**
   * Get current draft
   */
  async getDraft(): Promise<RatingDraft | null> {
    return storage.get<RatingDraft>(STORAGE_KEYS.RATING_DRAFTS);
  }

  /**
   * Save draft (merges with existing)
   */
  async saveDraft(partialDraft: Partial<RatingDraft>): Promise<RatingDraft> {
    const existing = await this.getDraft();
    
    const draft: RatingDraft = {
      fixtureId: partialDraft.fixtureId ?? existing?.fixtureId ?? 0,
      matchRating: partialDraft.matchRating ?? existing?.matchRating ?? null,
      motmPlayerId: partialDraft.motmPlayerId ?? existing?.motmPlayerId ?? null,
      text: partialDraft.text ?? existing?.text ?? '',
      updatedAt: new Date().toISOString(),
    };

    await storage.set(STORAGE_KEYS.RATING_DRAFTS, draft);
    return draft;
  }

  /**
   * Clear draft
   */
  async clearDraft(): Promise<void> {
    await storage.remove(STORAGE_KEYS.RATING_DRAFTS);
  }
}

export const draftRepository = new DraftRepository();
