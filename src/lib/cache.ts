const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, { data, expiry: Date.now() + ttl });
}

/** Cached fetch — returns JSON. Skips cache if signal is provided and already aborted. */
export async function cachedFetch<T>(
  url: string,
  init?: RequestInit,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const cacheKey = init?.method === 'POST'
    ? `POST:${url}:${init.body}`
    : url;

  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: T = await res.json();
  setCache(cacheKey, data, ttl);
  return data;
}
