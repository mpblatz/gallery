import type { Artwork } from '../types/artwork';
import { getImageUrl } from '../lib/api';

interface Props {
  artwork: Artwork;
  onClick: (id: number) => void;
}

export function ArtworkCard({ artwork, onClick }: Props) {
  const lqip = artwork.thumbnail?.lqip;
  const aspectRatio = artwork.thumbnail
    ? artwork.thumbnail.width / artwork.thumbnail.height
    : 1;

  return (
    <button
      onClick={() => onClick(artwork.id)}
      className="group text-left w-full overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio,
          backgroundColor: '#f0f0f0',
          backgroundImage: lqip ? `url(${lqip})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {artwork.image_id && (
          <img
            src={getImageUrl(artwork.image_id, 400)}
            alt={artwork.thumbnail?.alt_text || artwork.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
          {artwork.title}
        </h3>
        {artwork.artist_display && (
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {artwork.artist_display}
          </p>
        )}
        {artwork.date_display && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {artwork.date_display}
          </p>
        )}
      </div>
    </button>
  );
}
