import { useEffect } from 'react';
import type { Artwork } from '../../types/artwork';
import { getImageUrl } from '../../lib/api';
import { hslToHex } from '../../lib/colorUtils';
import { useColorExtraction } from '../../hooks/useColorExtraction';
import { LoadingSpinner } from '../LoadingSpinner';
import { PaletteExport } from './PaletteExport';

interface Props {
  artwork: Artwork;
  onClose: () => void;
}

export function ArtworkColorDetail({ artwork, onClose }: Props) {
  const imageUrl = artwork.image_id ? getImageUrl(artwork.image_id, 400) : null;
  const { palette, loading: extracting } = useColorExtraction(imageUrl);

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

  const apiColor = artwork.color
    ? hslToHex(artwork.color.h, artwork.color.s, artwork.color.l)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 transition-colors cursor-pointer"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--text-faint)',
            boxShadow: 'var(--shadow)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {artwork.image_id && (
            <div className="md:w-1/2 shrink-0 flex items-center justify-center p-4" style={{ background: '#f0f0f0' }}>
              <img
                src={getImageUrl(artwork.image_id, 843)}
                alt={artwork.thumbnail?.alt_text || artwork.title}
                className="max-h-[60vh] max-w-full object-contain"
                style={{ borderRadius: '8px' }}
              />
            </div>
          )}

          <div className="p-5 md:w-1/2 min-w-0 space-y-4">
            <div>
              <h2 className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {artwork.title}
              </h2>
              {artwork.artist_display && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {artwork.artist_display}
                </p>
              )}
              {artwork.date_display && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {artwork.date_display}
                </p>
              )}
            </div>

            {apiColor && (
              <div>
                <h3 className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-faint)' }}>
                  Dominant Color
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="shrink-0"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: apiColor,
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{apiColor}</span>
                  {artwork.colorfulness != null && (
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      Vibrancy: {artwork.colorfulness.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
                Extracted Palette
              </h3>
              {extracting && <LoadingSpinner />}
              {!extracting && palette.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {palette.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="shrink-0"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow)',
                            backgroundColor: color,
                          }}
                          title={color}
                        />
                        <span className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                  <PaletteExport colors={palette} />
                </>
              )}
              {!extracting && palette.length === 0 && !artwork.image_id && (
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No image available for extraction</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
