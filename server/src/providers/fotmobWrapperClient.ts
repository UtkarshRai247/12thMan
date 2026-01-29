/**
 * FotMob wrapper adapter. Best-effort enrichment only.
 * Rate limit, TTL cache (LIVE 60s, FINISHED 24h), circuit breaker (10 min after N errors).
 * Behind ENABLE_FOTMOB flag; never breaks core endpoints.
 */

import { env } from '../env';
import { memoryCache } from './cache';

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_MS = 10 * 60 * 1000; // 10 min

let consecutiveErrors = 0;
let circuitOpenUntil = 0;
let requestCountThisMinute = 0;
let minuteWindowStart = Date.now();

function isEnabled(): boolean {
  return env.ENABLE_FOTMOB === true;
}

function rateLimit(): void {
  if (!isEnabled()) return;
  const now = Date.now();
  if (now - minuteWindowStart >= 60_000) {
    minuteWindowStart = now;
    requestCountThisMinute = 0;
  }
  requestCountThisMinute++;
  if (requestCountThisMinute > env.FOTMOB_REQUESTS_PER_MINUTE) {
    throw new Error('FotMob rate limit exceeded');
  }
}

function circuitBreakerOk(): boolean {
  if (Date.now() < circuitOpenUntil) return false;
  return true;
}

function recordSuccess(): void {
  consecutiveErrors = 0;
}

function recordError(): void {
  consecutiveErrors++;
  if (consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_MS;
  }
}

function cacheKey(matchId: string, kind: string): string {
  return `fotmob:${matchId}:${kind}`;
}

function getTtlSeconds(status: 'LIVE' | 'FINISHED' | 'UNKNOWN'): number {
  if (status === 'LIVE') return env.FOTMOB_TTL_LIVE_SECONDS;
  if (status === 'FINISHED') return env.FOTMOB_TTL_FINISHED_SECONDS;
  return env.FOTMOB_TTL_FINISHED_SECONDS;
}

export async function getMatchDetails(
  fotmobMatchId: string,
  status: 'LIVE' | 'FINISHED' | 'UNKNOWN' = 'UNKNOWN'
): Promise<Record<string, unknown> | null> {
  if (!isEnabled()) return null;
  if (!circuitBreakerOk()) return null;
  rateLimit();

  const key = cacheKey(fotmobMatchId, 'MATCH_DETAILS');
  const cached = memoryCache.get<Record<string, unknown>>(key);
  if (cached) return cached;

  try {
    const Fotmob = (await import('@max-xoo/fotmob')).default;
    const fotmob = new Fotmob();
    const raw = await fotmob.getMatchDetails(fotmobMatchId);
    const result = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : { raw };
    memoryCache.set(key, result, getTtlSeconds(status));
    recordSuccess();
    return result;
  } catch (err) {
    recordError();
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fotmob] getMatchDetails error (no keys logged):', err instanceof Error ? err.message : 'unknown');
    }
    return null;
  }
}

export async function getLineups(
  fotmobMatchId: string,
  status: 'LIVE' | 'FINISHED' | 'UNKNOWN' = 'UNKNOWN'
): Promise<Record<string, unknown> | null> {
  const details = await getMatchDetails(fotmobMatchId, status);
  if (!details) return null;
  const lineups = (details as { lineups?: unknown }).lineups;
  return typeof lineups === 'object' && lineups !== null ? (lineups as Record<string, unknown>) : null;
}

export async function getStats(
  fotmobMatchId: string,
  status: 'LIVE' | 'FINISHED' | 'UNKNOWN' = 'UNKNOWN'
): Promise<Record<string, unknown> | null> {
  const details = await getMatchDetails(fotmobMatchId, status);
  if (!details) return null;
  const stats = (details as { stats?: unknown }).stats;
  return typeof stats === 'object' && stats !== null ? (stats as Record<string, unknown>) : null;
}

export async function getShotmap(fotmobMatchId: string): Promise<Record<string, unknown> | null> {
  if (!isEnabled()) return null;
  const details = await getMatchDetails(fotmobMatchId);
  if (!details) return null;
  const shotmap = (details as { shotmap?: unknown }).shotmap;
  return typeof shotmap === 'object' && shotmap !== null ? (shotmap as Record<string, unknown>) : null;
}
