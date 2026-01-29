/**
 * Domain Models
 * Core business entities for 12thMan
 */

export type TakeStatus = 'queued' | 'syncing' | 'posted' | 'failed';

export interface LocalUser {
  userId: string; // Stable UUID
  userName: string;
  userClub: string;
  createdAt: string; // ISO string
}

export interface RatingDraft {
  fixtureId: number;
  matchRating: number | null;
  motmPlayerId: number | null;
  text: string;
  updatedAt: string; // ISO string
}

export interface Take {
  // Internal ID (client-side, UUID)
  id: string;
  // Client ID for idempotency (stable UUID, never changes)
  clientId: string;
  // Provider ID (server-side ID, only set after successful sync)
  providerId?: string;
  
  // Thread reply: if set, this take is a reply to another take
  parentTakeId?: string;
  
  // User info (placeholder for now)
  userId: string;
  userName: string;
  userClub: string;
  
  // Match data
  fixtureId: number;
  matchRating: number; // 1-10
  motmPlayerId?: number;
  text: string;
  
  // Reactions
  reactions: {
    cheer: number;
    boo: number;
    shout: number;
  };
  
  // Status and sync info
  status: TakeStatus;
  retryCount: number;
  lastAttemptAt?: string; // ISO string
  errorMessage?: string;
  
  // Timestamps
  createdAt: string; // ISO string
  syncedAt?: string; // ISO string
}
