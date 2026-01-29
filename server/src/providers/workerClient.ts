/**
 * Python worker integration. Best-effort; fails silently (log only).
 * Never blocks /fixtures or core endpoints.
 */

import { env } from '../env';
import { fetchJson } from './http';

const TIMEOUT_MS = 8000;

export interface WorkerEnrichmentResponse {
  provider: string;
  kind: string;
  raw: Record<string, unknown>;
  normalizedSummary: Record<string, unknown>;
  ttlSeconds: number;
}

export async function workerEnrichFotmob(
  fotmobMatchId: string
): Promise<WorkerEnrichmentResponse | null> {
  if (!env.ENABLE_WORKER || !env.WORKER_BASE_URL) return null;
  try {
    const url = `${env.WORKER_BASE_URL}/enrich/fotmob/${encodeURIComponent(fotmobMatchId)}`;
    const data = await fetchJson<WorkerEnrichmentResponse>(url, {
      timeoutMs: TIMEOUT_MS,
      maxRetries: 0,
    });
    return data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[worker] fotmob enrich failed (no keys logged):', err instanceof Error ? err.message : 'unknown');
    }
    return null;
  }
}

export async function workerEnrichSofascore(
  sofascoreMatchId: string
): Promise<WorkerEnrichmentResponse | null> {
  if (!env.ENABLE_WORKER || !env.WORKER_BASE_URL) return null;
  try {
    const url = `${env.WORKER_BASE_URL}/enrich/sofascore/${encodeURIComponent(sofascoreMatchId)}`;
    const data = await fetchJson<WorkerEnrichmentResponse>(url, {
      timeoutMs: TIMEOUT_MS,
      maxRetries: 0,
    });
    return data;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[worker] sofascore enrich failed (no keys logged):', err instanceof Error ? err.message : 'unknown');
    }
    return null;
  }
}

export async function workerHealth(): Promise<boolean> {
  if (!env.ENABLE_WORKER || !env.WORKER_BASE_URL) return false;
  try {
    const url = `${env.WORKER_BASE_URL}/health`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}
