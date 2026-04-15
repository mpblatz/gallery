import { useEffect, useState } from 'react';
import type { Artwork } from '../types/artwork';
import { adapters } from '../lib/museums/registry';
import { getImageUrl } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';
import { HeartButton } from './HeartButton';
import { GalleryPicker } from './GalleryPicker';

interface Props {
  artwork: Artwork | null;
  loading: boolean;
  onClose: () => void;
}

function getFullSizeUrl(artwork: Artwork): string | null {
  if (artwork.source === 'artic' && artwork.image_id) {
    return getImageUrl(artwork.image_id, 1686);
  }
  return artwork.imageUrl;
}

export function ArtworkModal({ artwork, loading, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expanded) setExpanded(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, expanded]);

  useEffect(() => {
    setExpanded(false);
    setPickerOpen(false);
  }, [artwork]);

  const museum = artwork ? adapters.find((a) => a.id === artwork.source) : null;
  const fullUrl = artwork ? getFullSizeUrl(artwork) : null;

  if (expanded && fullUrl) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.95)', cursor: 'zoom-out' }}
        onClick={() => setExpanded(false)}
      >
        <img
          src={fullUrl}
          alt={artwork?.thumbnail?.alt_text || artwork?.title}
          className="max-w-[95vw] max-h-[95vh] h-auto w-auto"
          style={{ borderRadius: '4px' }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={artwork?.title ?? 'Artwork detail'}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto"
        style={{
          background: '#111',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 transition-colors cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#999',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#999'; }}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && <LoadingSpinner />}

        {artwork && (
          <div className="flex flex-col md:flex-row">
            {fullUrl && (
              <div
                className="md:flex-1 min-w-0 flex items-center justify-center p-4"
                style={{ background: '#0a0a0a' }}
              >
                <img
                  src={fullUrl}
                  alt={artwork.thumbnail?.alt_text || artwork.title}
                  className="max-h-[80vh] max-w-full h-auto w-auto object-contain"
                  style={{ borderRadius: '8px', cursor: 'zoom-in' }}
                  onClick={() => setExpanded(true)}
                />
              </div>
            )}
            <div className="p-6 md:w-72 md:flex-shrink-0 space-y-3 overflow-y-auto max-h-[90vh]">
              {museum && (
                <span
                  className="inline-block px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}
                >
                  {museum.name}
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  {artwork.title}
                </h2>
                <HeartButton artwork={artwork} className="flex-shrink-0 mt-0.5" />
              </div>

              {artwork.artist_display && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {artwork.artist_display}
                </p>
              )}

              <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Detail label="Date" value={artwork.date_display} />
                <Detail label="Medium" value={artwork.medium_display} />
                <Detail label="Dimensions" value={artwork.dimensions} />
                <Detail label="Department" value={artwork.department_title} />
                <Detail label="Place of Origin" value={artwork.place_of_origin} />
                <Detail label="Type" value={artwork.artwork_type_title} />
                {artwork.style_titles.length > 0 && (
                  <Detail label="Styles" value={artwork.style_titles.join(', ')} />
                )}
                {artwork.classification_titles.length > 0 && (
                  <Detail label="Classification" value={artwork.classification_titles.join(', ')} />
                )}
              </div>

              {artwork.is_public_domain && (
                <span
                  className="inline-block px-3 py-1 text-[10px] font-semibold tracking-wide uppercase"
                  style={{
                    background: 'var(--accent-tint)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-tint-border)',
                    borderRadius: '8px',
                  }}
                >
                  Public Domain
                </span>
              )}

              {/* Add to Gallery */}
              <div className="relative">
                <button
                  onClick={() => setPickerOpen((p) => !p)}
                  className="text-[11px] font-medium transition-colors cursor-pointer"
                  style={{ color: 'var(--accent, #6d9fff)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  + Add to Gallery
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-7 z-20">
                    <GalleryPicker artwork={artwork} onClose={() => setPickerOpen(false)} />
                  </div>
                )}
              </div>

              {artwork.sourceUrl && (
                <a
                  href={artwork.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] font-medium mt-2 transition-colors"
                  style={{ color: 'var(--accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  View on museum website &#8599;
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-semibold" style={{ color: 'var(--text-faint)' }}>{label}:</span>{' '}
      <span style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  );
}
