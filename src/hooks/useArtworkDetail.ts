import { useState, useEffect } from 'react';
import type { Artwork } from '../types/artwork';
import { fetchArtworkDetail } from '../lib/api';

export function useArtworkDetail() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedId === null) {
      setArtwork(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchArtworkDetail(selectedId)
      .then((data) => {
        if (!cancelled) setArtwork(data);
      })
      .catch(() => {
        if (!cancelled) setArtwork(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  return {
    artwork,
    loading,
    isOpen: selectedId !== null,
    open: (id: number) => setSelectedId(id),
    close: () => setSelectedId(null),
  };
}
