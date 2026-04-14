import { useTimeMachine } from '../../hooks/useTimeMachine';
import { useArtworkDetail } from '../../hooks/useArtworkDetail';
import { Timeline } from './Timeline';
import { ArtworkGrid } from '../ArtworkGrid';
import { SentinelLoader } from '../SentinelLoader';
import { ArtworkModal } from '../ArtworkModal';
import { LoadingSpinner } from '../LoadingSpinner';

export function TimeMachineView() {
  const tm = useTimeMachine();
  const detail = useArtworkDetail();

  return (
    <>
      <div className="mx-auto max-w-7xl px-4">
        <Timeline year={tm.year} onChange={tm.setYear} />

        <div className="mb-4 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold">{tm.era}</span>
          <span style={{ color: 'var(--text-faint)' }}>
            Showing art from {tm.dateRange.start < 0 ? `${Math.abs(tm.dateRange.start)} BCE` : tm.dateRange.start}
            {' — '}
            {tm.dateRange.end < 0 ? `${Math.abs(tm.dateRange.end)} BCE` : `${tm.dateRange.end} CE`}
          </span>
        </div>

        {tm.error && (
          <div
            className="mb-4 p-4 text-xs"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
            }}
          >
            {tm.error}
          </div>
        )}

        {tm.artworks.length === 0 && !tm.loading && !tm.error && (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-faint)' }}>
            <p className="text-sm font-semibold">No artworks found for this period</p>
            <p className="mt-1 text-xs">Try dragging the timeline to a different era</p>
          </div>
        )}

        {tm.artworks.length === 0 && tm.loading && <LoadingSpinner />}

        <ArtworkGrid artworks={tm.artworks} onSelect={detail.open} />

        <SentinelLoader
          onVisible={tm.loadMore}
          hasMore={tm.hasMore}
          loading={tm.loading && tm.artworks.length > 0}
        />
      </div>

      {detail.isOpen && (
        <ArtworkModal
          artwork={detail.artwork}
          loading={detail.loading}
          onClose={detail.close}
        />
      )}
    </>
  );
}
