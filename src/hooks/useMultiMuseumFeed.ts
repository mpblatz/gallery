import { useState, useEffect, useCallback, useRef } from 'react';
import type { Artwork, MuseumId, ArtType } from '../types/artwork';
import { fetchFeed } from '../lib/feedOrchestrator';
import { useDebounce } from './useDebounce';

function getDateWindow(year: number): number {
  if (year < 500) return 100;
  if (year < 1400) return 50;
  if (year < 1800) return 25;
  return 10;
}

export interface FeedFilters {
  museum: MuseumId | 'all';
  artType: ArtType;
  year: number | null;        // null = no time filter
  colorHue: number | null;    // null = no color filter
}

export function useMultiMuseumFeed(filters: FeedFilters) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  const debouncedMuseum = useDebounce(filters.museum, 100);
  const debouncedType = useDebounce(filters.artType, 100);
  const debouncedYear = useDebounce(filters.year, 300);
  const debouncedHue = useDebounce(filters.colorHue, 300);

  const timeRange = debouncedYear !== null
    ? { startYear: debouncedYear - getDateWindow(debouncedYear), endYear: debouncedYear + getDateWindow(debouncedYear) }
    : null;

  const feedRequest = {
    museum: debouncedMuseum,
    artType: debouncedType,
    timeRange,
    colorHue: debouncedHue,
  };

  // Stringify for dependency tracking
  const requestKey = JSON.stringify(feedRequest);

  // Initial load / filter change
  useEffect(() => {
    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setArtworks([]);
    setHasMore(true);

    fetchFeed(feedRequest, false, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setArtworks(res.artworks);
        setHasMore(res.hasMore);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoading(true);

    const controller = new AbortController();

    fetchFeed(feedRequest, true, controller.signal)
      .then((res) => {
        setArtworks((prev) => [...prev, ...res.artworks]);
        setHasMore(res.hasMore);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => {
        setLoading(false);
        loadingMoreRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, requestKey]);

  return { artworks, loading, error, hasMore, loadMore };
}
