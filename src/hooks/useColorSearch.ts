import { useState, useEffect, useCallback } from 'react';
import type { Artwork } from '../types/artwork';
import { searchByColor, PAGE_SIZE } from '../lib/api';
import { useDebounce } from './useDebounce';

export function useColorSearch() {
  const [hue, setHue] = useState(0);
  const [hueTolerance] = useState(15);
  const [minColorfulness, setMinColorfulness] = useState(0);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedHue = useDebounce(hue, 300);
  const debouncedColorfulness = useDebounce(minColorfulness, 300);

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchByColor(
        { hue: debouncedHue, hueTolerance, minColorfulness: debouncedColorfulness },
        p,
      );
      setArtworks((prev) => replace ? res.data : [...prev, ...res.data]);
      setTotalPages(Math.min(
        res.pagination.total_pages,
        Math.ceil(10000 / PAGE_SIZE),
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [debouncedHue, hueTolerance, debouncedColorfulness]);

  useEffect(() => {
    setHasSearched(true);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHue, debouncedColorfulness]);

  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  }, [loading, page, totalPages, fetchPage]);

  return {
    hue,
    setHue,
    minColorfulness,
    setMinColorfulness,
    artworks,
    loading,
    error,
    hasMore: page < totalPages,
    loadMore,
    hasSearched,
  };
}
