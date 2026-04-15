import { useState } from 'react';
import type { Artwork } from '../types/artwork';
import { CanvasImage } from './CanvasImage';
import { Masonry } from './Masonry';
import { SentinelLoader } from './SentinelLoader';
import { LoadingSpinner } from './LoadingSpinner';
import { ArtworkModal } from './ArtworkModal';

interface Props {
  artworks: Artwork[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function InfiniteCanvas({ artworks, loading, error, hasMore, loadMore }: Props) {
  const [selected, setSelected] = useState<Artwork | null>(null);

  return (
    <>
      <div className="min-h-screen pt-16">
        {error && (
          <div className="p-4 m-4 text-xs" style={{ background: '#1a0000', border: '1px solid #4a0000', borderRadius: '8px', color: '#ff6b6b' }}>
            {error}
          </div>
        )}

        {artworks.length === 0 && loading && <LoadingSpinner />}

        {artworks.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm font-semibold">No artworks found</p>
            <p className="mt-1 text-xs">Try adjusting the filters</p>
          </div>
        )}

        <Masonry>
          {artworks.map((artwork, i) => (
            <CanvasImage
              key={`${artwork.source}-${artwork.id}-${i}`}
              artwork={artwork}
              onClick={setSelected}
            />
          ))}
        </Masonry>

        <SentinelLoader
          onVisible={loadMore}
          hasMore={hasMore}
          loading={loading && artworks.length > 0}
        />
      </div>

      {selected && (
        <ArtworkModal
          artwork={selected}
          loading={false}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
