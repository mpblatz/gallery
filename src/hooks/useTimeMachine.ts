import { useState, useEffect, useCallback, useRef } from 'react';
import type { Artwork } from '../types/artwork';
import { searchByDateRange } from '../lib/api';
import { useDebounce } from './useDebounce';

const ERA_MAP: [number, number, string][] = [
  [-3000, -500, 'Ancient World'],
  [-500, 500, 'Classical Antiquity'],
  [500, 1400, 'Medieval'],
  [1400, 1600, 'Renaissance'],
  [1600, 1780, 'Baroque & Rococo'],
  [1780, 1850, 'Neoclassicism & Romanticism'],
  [1850, 1910, 'Impressionism'],
  [1910, 1970, 'Modern Art'],
  [1970, 2000, 'Contemporary Art'],
  [2000, 2030, '21st Century'],
];

export function getEraName(year: number): string {
  for (const [start, end, name] of ERA_MAP) {
    if (year >= start && year < end) return name;
  }
  return year < -3000 ? 'Prehistoric' : '21st Century';
}

// Piecewise linear: ancient gets 15%, medieval 15%, modern 70%
const BREAKPOINTS: [number, number][] = [
  [-3000, 0],
  [500, 0.15],
  [1400, 0.30],
  [2025, 1.0],
];

export function yearToFraction(year: number): number {
  if (year <= BREAKPOINTS[0][0]) return 0;
  if (year >= BREAKPOINTS[BREAKPOINTS.length - 1][0]) return 1;

  for (let i = 1; i < BREAKPOINTS.length; i++) {
    const [y0, f0] = BREAKPOINTS[i - 1];
    const [y1, f1] = BREAKPOINTS[i];
    if (year <= y1) {
      return f0 + ((year - y0) / (y1 - y0)) * (f1 - f0);
    }
  }
  return 1;
}

export function fractionToYear(frac: number): number {
  if (frac <= 0) return BREAKPOINTS[0][0];
  if (frac >= 1) return BREAKPOINTS[BREAKPOINTS.length - 1][0];

  for (let i = 1; i < BREAKPOINTS.length; i++) {
    const [y0, f0] = BREAKPOINTS[i - 1];
    const [y1, f1] = BREAKPOINTS[i];
    if (frac <= f1) {
      return Math.round(y0 + ((frac - f0) / (f1 - f0)) * (y1 - y0));
    }
  }
  return BREAKPOINTS[BREAKPOINTS.length - 1][0];
}

// Adaptive date range window
function getDateWindow(year: number): number {
  if (year < 500) return 100;
  if (year < 1400) return 50;
  if (year < 1800) return 25;
  return 10;
}

export function useTimeMachine() {
  const [year, setYear] = useState(1875);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(0);

  const debouncedYear = useDebounce(year, 300);

  const window = getDateWindow(debouncedYear);
  const startYear = debouncedYear - window;
  const endYear = debouncedYear + window;

  useEffect(() => {
    const id = ++abortRef.current;
    setPage(1);
    setLoading(true);
    setError(null);

    searchByDateRange(startYear, endYear, 1)
      .then((res) => {
        if (id !== abortRef.current) return;
        setArtworks(res.data);
        setTotalPages(Math.min(res.pagination.total_pages, 40));
      })
      .catch((e) => {
        if (id !== abortRef.current) return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => {
        if (id === abortRef.current) setLoading(false);
      });
  }, [startYear, endYear]);

  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    setLoading(true);

    searchByDateRange(startYear, endYear, next)
      .then((res) => {
        setArtworks((prev) => [...prev, ...res.data]);
        setTotalPages(Math.min(res.pagination.total_pages, 40));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [loading, page, totalPages, startYear, endYear]);

  return {
    year,
    setYear,
    era: getEraName(debouncedYear),
    dateRange: { start: startYear, end: endYear },
    artworks,
    loading,
    error,
    hasMore: page < totalPages,
    loadMore,
  };
}
