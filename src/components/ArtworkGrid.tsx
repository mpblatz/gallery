import type { Artwork } from '../types/artwork';
import { ArtworkCard } from './ArtworkCard';

interface Props {
  artworks: Artwork[];
  onSelect: (id: number) => void;
}

export function ArtworkGrid({ artworks, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
