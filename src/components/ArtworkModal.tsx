import { useEffect } from 'react';
import type { Artwork } from '../types/artwork';
import { adapters } from '../lib/museums/registry';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  artwork: Artwork | null;
  loading: boolean;
  onClose: () => void;
}

export function ArtworkModal({ artwork, loading, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const museum = artwork ? adapters.find((a) => a.id === artwork.source) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={artwork?.title ?? 'Artwork detail'}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto"
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
            {artwork.imageUrl && (
              <div className="md:w-1/2 flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
                <img
                  src={artwork.imageUrl}
                  alt={artwork.thumbnail?.alt_text || artwork.title}
                  className="max-h-[70vh] w-auto object-contain"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}
            <div className="p-6 md:w-1/2 space-y-3">
              {museum && (
                <span
                  className="inline-block px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' }}
                >
                  {museum.name}
                </span>
              )}

              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {artwork.title}
              </h2>

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
