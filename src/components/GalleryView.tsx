import { useState, useEffect } from 'react';
import type { Artwork } from '../types/artwork';
import type { AppView } from './AppMenu';
import { useCollections } from '../hooks/useCollections';
import { CanvasImage } from './CanvasImage';
import { Masonry } from './Masonry';
import { ArtworkModal } from './ArtworkModal';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  view: AppView & { kind: 'favorites' | 'gallery' };
  onBack: () => void;
}

export function GalleryView({ view, onBack }: Props) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const { getFavoriteArtworks, getGalleryArtworks, galleries, removeFromGallery, favorites } = useCollections();

  const galleryName =
    view.kind === 'favorites'
      ? 'Favorites'
      : galleries.find((g) => g.id === view.galleryId)?.name ?? 'Gallery';

  useEffect(() => {
    setLoading(true);
    const load =
      view.kind === 'favorites'
        ? getFavoriteArtworks()
        : getGalleryArtworks(view.galleryId);

    load.then((arts) => {
      setArtworks(arts);
      setLoading(false);
    });
  }, [view, getFavoriteArtworks, getGalleryArtworks, favorites, galleries]);

  const handleRemove = (artwork: Artwork) => {
    if (view.kind === 'gallery') {
      removeFromGallery(view.galleryId, artwork);
    }
  };

  return (
    <>
      <div className="min-h-screen pt-16">
        {/* Header */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <div
            className="flex items-center gap-2 rounded-2xl px-1.5 py-1.5"
            style={{
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={onBack}
              className="px-2 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
            <span className="px-3 py-1.5 text-[11px] font-medium whitespace-nowrap" style={{ color: '#fff' }}>
              {view.kind === 'favorites' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
              {galleryName}
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              {artworks.length}
            </span>
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && artworks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm font-semibold">
              {view.kind === 'favorites' ? 'No favorites yet' : 'This gallery is empty'}
            </p>
            <p className="mt-1 text-xs">
              {view.kind === 'favorites'
                ? 'Heart artworks to add them here'
                : 'Add artworks from the main feed'}
            </p>
          </div>
        )}

        <Masonry>
          {artworks.map((artwork, i) => (
            <div key={`${artwork.source}-${artwork.id}-${i}`} className="relative group">
              <CanvasImage artwork={artwork} onClick={setSelected} />
              {view.kind === 'gallery' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(artwork); }}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 rounded-full p-1 cursor-pointer"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  aria-label="Remove from gallery"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </Masonry>
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
