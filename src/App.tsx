import { useState, useCallback } from 'react';
import type { MuseumId, ArtType, Artwork } from './types/artwork';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { FilterBar } from './components/FilterBar';
import { QuizModal } from './components/QuizModal';
import { ArtworkModal } from './components/ArtworkModal';
import { useMultiMuseumFeed } from './hooks/useMultiMuseumFeed';
import { adapters } from './lib/museums/registry';

function App() {
  const [museum, setMuseum] = useState<MuseumId | 'all'>('all');
  const [artType, setArtType] = useState<ArtType>('all');
  const [year, setYear] = useState<number | null>(null);
  const [colorHue, setColorHue] = useState<number | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [surpriseArtwork, setSurpriseArtwork] = useState<Artwork | null>(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  const feed = useMultiMuseumFeed({ museum, artType, year, colorHue });

  const handleSurprise = useCallback(async () => {
    // Use existing feed data if available to avoid an extra API call
    if (feed.artworks.length > 0) {
      const artwork = feed.artworks[Math.floor(Math.random() * feed.artworks.length)];
      setSurpriseArtwork(artwork);
      return;
    }

    setSurpriseLoading(true);
    try {
      const adapter = adapters[Math.floor(Math.random() * adapters.length)];
      const result = await adapter.searchFeatured(1);
      if (result.artworks.length > 0) {
        const artwork = result.artworks[Math.floor(Math.random() * result.artworks.length)];
        setSurpriseArtwork(artwork);
      }
    } catch {
      // silently fail
    } finally {
      setSurpriseLoading(false);
    }
  }, [feed.artworks]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <InfiniteCanvas
        artworks={feed.artworks}
        loading={feed.loading}
        error={feed.error}
        hasMore={feed.hasMore}
        loadMore={feed.loadMore}
      />

      <a
        href="https://mblatz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-6 left-6 z-40 text-sm font-semibold tracking-tight"
        style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
      >
        mblatz
      </a>

      {/* Top-right buttons */}
      <div className="fixed top-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={handleSurprise}
          disabled={surpriseLoading}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          {surpriseLoading ? '...' : 'Surprise Me'}
        </button>
        <button
          onClick={() => setQuizOpen(true)}
          className="px-3 py-1.5 text-[11px] font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          Quiz
        </button>
      </div>

      <FilterBar
        museum={museum}
        onMuseumChange={setMuseum}
        artType={artType}
        onArtTypeChange={setArtType}
        year={year}
        onYearChange={setYear}
        colorHue={colorHue}
        onColorHueChange={setColorHue}
      />

      {quizOpen && <QuizModal onClose={() => setQuizOpen(false)} />}

      {surpriseArtwork && (
        <ArtworkModal
          artwork={surpriseArtwork}
          loading={false}
          onClose={() => setSurpriseArtwork(null)}
        />
      )}
    </div>
  );
}

export default App;
