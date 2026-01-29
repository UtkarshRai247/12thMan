/**
 * HTTP helpers: timeout, retry, user-agent. Never log keys or full URLs with secrets.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RETRIES = 2;
const USER_AGENT = '12thMan-Backend/1.0';

export interface FetchJsonOptions {
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
    ...options.headers,
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as T;
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastError ?? new Error('fetchJson failed');
}

export function measureDuration<T>(label: string): { end: () => number; log: (meta?: Record<string, unknown>) => void } {
  const start = Date.now();
  return {
    end: () => Date.now() - start,
    log: (meta?: Record<string, unknown>) => {
      const durationMs = Date.now() - start;
      const obj = { label, durationMs, ...meta };
      if (process.env.NODE_ENV === 'development') {
        console.debug('[providers]', JSON.stringify(obj));
      }
    },
  };
}
