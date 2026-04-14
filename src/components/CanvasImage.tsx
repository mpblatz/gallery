import { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types/artwork';
import { adapters } from '../lib/museums/registry';

interface Props {
  artwork: Artwork;
  onClick: (artwork: Artwork) => void;
}

export function CanvasImage({ artwork, onClick }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const lqip = artwork.thumbnail?.lqip;
  const imgSrc = artwork.imageUrl;
  const museum = adapters.find((a) => a.id === artwork.source);

  // Preload images 2 screen-heights ahead
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !imgSrc) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 200% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [imgSrc]);

  if (!imgSrc) return null;

  return (
    <button
      ref={containerRef}
      onClick={() => onClick(artwork)}
      className="masonry-item group relative w-full overflow-hidden cursor-pointer block"
      style={{
        borderRadius: '4px',
        background: '#0a0a0a',
      }}
    >
      <div
        className="w-full"
        style={{
          backgroundImage: lqip ? `url(${lqip})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {inView && (
          <img
            src={imgSrc}
            alt={artwork.thumbnail?.alt_text || artwork.title}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className="w-full block transition-opacity duration-500"
            style={{
              opacity: loaded ? 1 : 0,
              borderRadius: '4px',
            }}
          />
        )}
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          borderRadius: '4px',
        }}
      >
        {museum && (
          <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider mb-1">
            {museum.shortName}
          </span>
        )}
        <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">
          {artwork.title}
        </h3>
        {artwork.artist_display && (
          <p className="text-[11px] text-white/70 mt-0.5 truncate">
            {artwork.artist_display}
          </p>
        )}
        {artwork.date_display && (
          <p className="text-[10px] text-white/50 mt-0.5">
            {artwork.date_display}
          </p>
        )}
      </div>
    </button>
  );
}
