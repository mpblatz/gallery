import type { Artwork, MuseumId, ArtType } from '../types/artwork';
import type { SearchFilters } from './museums/types';
import { adapters, getAdapter } from './museums/registry';

export interface FeedRequest {
  museum: MuseumId | 'all';
  artType: ArtType;
  timeRange: { startYear: number; endYear: number } | null;
  colorHue: number | null;
}

export interface FeedResponse {
  artworks: Artwork[];
  hasMore: boolean;
}

// Track per-museum pagination state
interface MuseumPageState {
  page: number;
  exhausted: boolean;
}

let pageStates: Map<MuseumId, MuseumPageState> = new Map();
let lastRequestKey = '';

function requestKey(req: FeedRequest): string {
  return JSON.stringify(req);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchFeed(req: FeedRequest, isLoadMore: boolean, signal?: AbortSignal): Promise<FeedResponse> {
  const key = requestKey(req);

  // Reset pagination on new filter combo
  if (key !== lastRequestKey || !isLoadMore) {
    pageStates = new Map();
    lastRequestKey = key;
  }

  const filters: SearchFilters = {
    artType: req.artType,
    timeRange: req.timeRange,
    colorHue: req.colorHue,
  };

  const hasDateFilter = req.timeRange !== null;

  // Determine which adapters to query
  const activeAdapters = req.museum === 'all'
    ? adapters
    : [getAdapter(req.museum)];

  // Filter out exhausted adapters and adapters that don't support active filters
  const available = activeAdapters.filter((a) => {
    const state = pageStates.get(a.id);
    if (state?.exhausted) return false;
    // Skip adapters that don't support the active date filter
    if (hasDateFilter && a.supports?.dateRange === false) return false;
    return true;
  });

  if (available.length === 0) {
    return { artworks: [], hasMore: false };
  }

  // Fetch from all available adapters in parallel
  const results = await Promise.allSettled(
    available.map(async (adapter) => {
      const state = pageStates.get(adapter.id) || { page: 1, exhausted: false };
      const page = state.page;

      const hasFilters = req.artType !== 'all' || req.timeRange || req.colorHue !== null;
      const result = hasFilters
        ? await adapter.searchCombined(filters, page, signal)
        : await adapter.searchFeatured(page, signal);

      // Update page state
      pageStates.set(adapter.id, {
        page: result.nextPage,
        exhausted: !result.hasMore,
      });

      return result.artworks;
    }),
  );

  // Collect all successful results
  const allArtworks: Artwork[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArtworks.push(...result.value);
    }
  }

  // Interleave results from different museums (shuffle for variety in "all" mode)
  const artworks = req.museum === 'all' ? shuffle(allArtworks) : allArtworks;

  // Check if any museum still has more
  const hasMore = activeAdapters.some((a) => {
    // Adapters skipped for capability reasons are not "exhausted" — just irrelevant
    if (hasDateFilter && a.supports?.dateRange === false) return false;
    const state = pageStates.get(a.id);
    return !state?.exhausted;
  });

  return { artworks, hasMore };
}
