import type { Artwork } from '../types/artwork';
import { useCollections } from '../hooks/useCollections';

interface Props {
  artwork: Artwork;
  className?: string;
}

export function HeartButton({ artwork, className = '' }: Props) {
  const { isFavorite, toggleFavorite } = useCollections();
  const favorited = isFavorite(artwork);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(artwork);
      }}
      className={`transition-all duration-200 cursor-pointer ${className}`}
      style={{ color: favorited ? '#ef4444' : 'rgba(255,255,255,0.7)' }}
      onMouseEnter={(e) => {
        if (!favorited) e.currentTarget.style.color = '#ef4444';
      }}
      onMouseLeave={(e) => {
        if (!favorited) e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
      }}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={favorited ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
    </button>
  );
}
