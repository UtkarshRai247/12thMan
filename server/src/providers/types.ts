/**
 * Provider-agnostic types for fixtures and enrichment.
 * Never use provider IDs as primary keys; internal IDs are UUIDs.
 */

export type ProviderType = 'API_FOOTBALL' | 'FOTMOB' | 'SOFASCORE';

export interface NormalizedFixture {
  internalFixtureId: string;
  kickoffAt: Date;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  teams: { home: string; away: string };
  score: { home: number | null; away: number | null };
  competition: string | null;
  season: string | null;
}

export interface NormalizedEnrichmentSummary {
  xg?: { home?: number; away?: number };
  shots?: { home?: number; away?: number };
  possession?: { home?: number; away?: number };
  momentumSummary?: string | null;
  hasShotmap?: boolean;
  lastUpdatedAt?: string; // ISO
}
