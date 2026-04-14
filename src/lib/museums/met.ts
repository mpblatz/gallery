import type { MuseumAdapter, FeedResult } from './types';
import { makeArtwork } from './types';
import { getColorName } from '../colorUtils';
import { getCached, setCache } from '../cache';

const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const BATCH_SIZE = 12;
const PAGE_SIZE = 24;
const OBJECT_CACHE_TTL = 30 * 60 * 1000; // 30 min — Met objects don't change

// The Met search returns only IDs — we batch-fetch details
async function fetchObject(id: number, signal?: AbortSignal) {
  const cacheKey = `met-obj-${id}`;
  const cached = getCached<ReturnType<typeof makeArtwork> | null>(cacheKey);
  if (cached !== null) return cached;

  const res = await fetch(`${BASE}/objects/${id}`, { signal });
  if (!res.ok) return null;
  const r = await res.json();
  if (!r.primaryImageSmall && !r.primaryImage) return null;
  const artwork = makeArtwork('met', {
    id: r.objectID,
    title: r.title || 'Untitled',
    imageUrl: r.primaryImageSmall || r.primaryImage,
    artist_display: r.artistDisplayName || null,
    artist_title: r.artistDisplayName || null,
    date_display: r.objectDate || null,
    date_start: r.objectBeginDate ?? null,
    date_end: r.objectEndDate ?? null,
    medium_display: r.medium || null,
    dimensions: r.dimensions || null,
    is_public_domain: r.isPublicDomain ?? false,
    department_title: r.department || null,
    artwork_type_title: r.objectName || null,
    place_of_origin: r.country || r.culture || null,
    classification_titles: r.classification ? [r.classification] : [],
    sourceUrl: r.objectURL || `https://www.metmuseum.org/art/collection/search/${r.objectID}`,
  });
  setCache(cacheKey, artwork, OBJECT_CACHE_TTL);
  return artwork;
}

async function fetchBatch(ids: number[], signal?: AbortSignal) {
  const results = await Promise.allSettled(ids.map((id) => fetchObject(id, signal)));
  return results
    .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchObject>>>> =>
      r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}

async function searchIds(params: URLSearchParams, signal?: AbortSignal): Promise<number[]> {
  params.set('hasImages', 'true');
  const res = await fetch(`${BASE}/search?${params}`, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  return json.objectIDs || [];
}

async function idsToFeed(allIds: number[], page: number, signal?: AbortSignal): Promise<FeedResult> {
  const start = (page - 1) * PAGE_SIZE;
  const pageIds = allIds.slice(start, start + PAGE_SIZE);

  // Fetch both batches in parallel
  const [batch1, batch2] = await Promise.all([
    fetchBatch(pageIds.slice(0, BATCH_SIZE), signal),
    pageIds.length > BATCH_SIZE ? fetchBatch(pageIds.slice(BATCH_SIZE), signal) : Promise.resolve([]),
  ]);

  return {
    artworks: [...batch1, ...batch2],
    hasMore: start + PAGE_SIZE < allIds.length,
    nextPage: page + 1,
  };
}

// Cache search IDs to avoid re-searching on pagination
let cachedIds: number[] = [];
let cachedKey = '';

const TYPE_MAP: Record<string, string> = {
  painting: 'Paintings',
  sculpture: 'Sculpture',
  photograph: 'Photographs',
  print: 'Prints',
  drawing: 'Drawings',
  textile: 'Textiles',
  ceramic: 'Ceramics',
};

export const metAdapter: MuseumAdapter = {
  id: 'met',
  name: 'The Metropolitan Museum of Art',
  shortName: 'Met',
  async searchFeatured(page, signal?) {
    const key = 'featured';
    if (cachedKey !== key) {
      const params = new URLSearchParams({ q: 'highlight', isHighlight: 'true', hasImages: 'true' });
      cachedIds = await searchIds(params, signal);
      cachedKey = key;
    }
    return idsToFeed(cachedIds, page, signal);
  },

  async searchByDate(startYear, endYear, page, signal?) {
    const key = `date-${startYear}-${endYear}`;
    if (cachedKey !== key) {
      const params = new URLSearchParams({ q: '*', dateBegin: String(startYear), dateEnd: String(endYear), hasImages: 'true' });
      cachedIds = await searchIds(params, signal);
      cachedKey = key;
    }
    return idsToFeed(cachedIds, page, signal);
  },

  async searchByColor(hue, _tolerance, page, signal?) {
    const colorName = getColorName(hue);
    const key = `color-${colorName}`;
    if (cachedKey !== key) {
      const params = new URLSearchParams({ q: colorName, hasImages: 'true' });
      cachedIds = await searchIds(params, signal);
      cachedKey = key;
    }
    return idsToFeed(cachedIds, page, signal);
  },

  async searchByType(type, page, signal?) {
    const mapped = TYPE_MAP[type];
    if (!mapped) return { artworks: [], hasMore: false, nextPage: page };
    const key = `type-${type}`;
    if (cachedKey !== key) {
      // Met doesn't have a direct type filter on search, use department or query
      const params = new URLSearchParams({ q: mapped, hasImages: 'true' });
      cachedIds = await searchIds(params, signal);
      cachedKey = key;
    }
    return idsToFeed(cachedIds, page, signal);
  },

  async searchCombined(filters, page, signal?) {
    const parts: string[] = [];
    const params = new URLSearchParams();
    params.set('hasImages', 'true');

    if (filters.artType !== 'all') {
      const mapped = TYPE_MAP[filters.artType];
      if (mapped) parts.push(mapped);
    }

    if (filters.timeRange) {
      params.set('dateBegin', String(filters.timeRange.startYear));
      params.set('dateEnd', String(filters.timeRange.endYear));
    }

    if (filters.colorHue !== null) {
      parts.push(getColorName(filters.colorHue));
    }

    params.set('q', parts.length > 0 ? parts.join(' ') : '*');

    const key = `combined-${params.toString()}`;
    if (cachedKey !== key) {
      cachedIds = await searchIds(params, signal);
      cachedKey = key;
    }
    return idsToFeed(cachedIds, page, signal);
  },
};
