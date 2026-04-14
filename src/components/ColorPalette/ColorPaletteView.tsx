import { useState } from 'react';
import type { Artwork } from '../../types/artwork';
import { useColorSearch } from '../../hooks/useColorSearch';
import { getColorName, hslToHex } from '../../lib/colorUtils';
import { ArtworkGrid } from '../ArtworkGrid';
import { SentinelLoader } from '../SentinelLoader';
import { LoadingSpinner } from '../LoadingSpinner';
import { ColorWheel } from './ColorWheel';
import { HexInput } from './HexInput';
import { ColorSlider } from './ColorSlider';
import { ArtworkColorDetail } from './ArtworkColorDetail';

export function ColorPaletteView() {
  const {
    hue, setHue, minColorfulness, setMinColorfulness,
    artworks, loading, error, hasMore, loadMore, hasSearched,
  } = useColorSearch();

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const colorName = getColorName(hue);
  const hexPreview = hslToHex(hue, 100, 50);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div
          className="p-5 mb-6 space-y-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <ColorWheel hue={hue} onHueChange={setHue} />
          <HexInput hue={hue} onHueChange={setHue} />
          <ColorSlider value={minColorfulness} onChange={setMinColorfulness} hue={hue} />
        </div>

        {hasSearched && (
          <div className="flex items-center gap-2 mb-4">
            <div
              className="shrink-0"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: hexPreview,
                border: '1px solid var(--border)',
              }}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Artworks matching <span className="font-semibold">{colorName}</span> ({hue}°)
              {artworks.length > 0 && !loading && (
                <span style={{ color: 'var(--text-faint)' }}> — {artworks.length} shown</span>
              )}
            </p>
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-4 text-xs"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {artworks.length === 0 && loading && <LoadingSpinner />}

        {artworks.length === 0 && !loading && hasSearched && (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm font-semibold">No artworks found</p>
            <p className="mt-1 text-xs">Try adjusting the hue or lowering the colorfulness filter</p>
          </div>
        )}

        <ArtworkGrid
          artworks={artworks}
          onSelect={(id) => {
            const artwork = artworks.find((a) => a.id === id);
            if (artwork) setSelectedArtwork(artwork);
          }}
        />

        <SentinelLoader
          onVisible={loadMore}
          hasMore={hasMore}
          loading={loading && artworks.length > 0}
        />
      </div>

      {selectedArtwork && (
        <ArtworkColorDetail
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
        />
      )}
    </>
  );
}
