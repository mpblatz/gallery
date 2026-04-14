import { useState, useEffect, useCallback } from 'react';
import type { Artwork, ApiResponse } from '../types/artwork';
import { PAGE_SIZE } from '../lib/api';

const BASE_URL = 'https://api.artic.edu/api/v1';

const FIELDS = [
  'id', 'title', 'image_id', 'thumbnail',
  'artist_display', 'artist_title', 'date_display',
  'date_start', 'date_end', 'artwork_type_title',
  'color', 'colorfulness',
].join(',');

async function fetchFeatured(page: number): Promise<ApiResponse<Artwork>> {
  const body = {
    query: {
      bool: {
        must: [
          { exists: { field: 'image_id' } },
          { term: { is_boosted: true } },
        ],
      },
    },
    sort: [{ timestamp: 'desc' }],
    fields: FIELDS,
    limit: PAGE_SIZE,
    from: (page - 1) * PAGE_SIZE,
  };

  const res = await fetch(`${BASE_URL}/artworks/search`, {
    method: 'POST',
    headers: {
      'AIC-User-Agent': 'Artic (educational project)',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useDefaultFeed() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFeatured(1)
      .then((res) => {
        setArtworks(res.data);
        setTotalPages(Math.min(res.pagination.total_pages, 40));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    setLoading(true);

    fetchFeatured(next)
      .then((res) => {
        setArtworks((prev) => [...prev, ...res.data]);
        setTotalPages(Math.min(res.pagination.total_pages, 40));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => setLoading(false));
  }, [loading, page, totalPages]);

  return {
    artworks,
    loading,
    error,
    hasMore: page < totalPages,
    loadMore,
  };
}
