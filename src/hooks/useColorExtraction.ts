import { useState, useEffect, useRef } from 'react';
import { extractPalette } from '../lib/colorUtils';

export function useColorExtraction(imageUrl: string | null) {
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!imageUrl) {
      setPalette([]);
      return;
    }

    const cached = cache.current.get(imageUrl);
    if (cached) {
      setPalette(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);

    extractPalette(imageUrl)
      .then((colors) => {
        if (!cancelled) {
          cache.current.set(imageUrl, colors);
          setPalette(colors);
        }
      })
      .catch(() => {
        if (!cancelled) setPalette([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [imageUrl]);

  return { palette, loading };
}
