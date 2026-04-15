import { useState, useCallback } from 'react';
import type { MuseumId, ArtType, Artwork } from './types/artwork';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { FilterBar } from './components/FilterBar';
import { QuizModal } from './components/QuizModal';
import { ArtworkModal } from './components/ArtworkModal';
import { AppMenu, type AppView } from './components/AppMenu';
import { GalleryView } from './components/GalleryView';
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
  const [publicDomain, setPublicDomain] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [view, setView] = useState<AppView>({ kind: 'feed' });

  const feed = useMultiMuseumFeed({ museum, artType, year, colorHue, publicDomain, keywords: keywords || null });

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
      {view.kind === 'feed' ? (
        <>
          <InfiniteCanvas
            artworks={feed.artworks}
            loading={feed.loading}
            error={feed.error}
            hasMore={feed.hasMore}
            loadMore={feed.loadMore}
          />
          <FilterBar
            museum={museum}
            onMuseumChange={setMuseum}
            artType={artType}
            onArtTypeChange={setArtType}
            year={year}
            onYearChange={setYear}
            colorHue={colorHue}
            onColorHueChange={setColorHue}
            publicDomain={publicDomain}
            onPublicDomainChange={setPublicDomain}
            keywords={keywords}
            onKeywordsChange={setKeywords}
          />
        </>
      ) : (
        <GalleryView
          view={view}
          onBack={() => setView({ kind: 'feed' })}
        />
      )}

      <a
        href="https://mblatz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-6 left-6 z-40 text-sm font-semibold tracking-tight"
        style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
      >
        mblatz
      </a>

      <AppMenu
        onSurprise={handleSurprise}
        surpriseLoading={surpriseLoading}
        onQuiz={() => setQuizOpen(true)}
        view={view}
        onViewChange={setView}
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
