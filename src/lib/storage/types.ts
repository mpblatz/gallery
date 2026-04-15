import type { Artwork, MuseumId } from '../../types/artwork';

export type ArtworkKey = `${MuseumId}:${number}`;

export function toArtworkKey(artwork: Artwork): ArtworkKey {
  return `${artwork.source}:${artwork.id}`;
}

export interface Gallery {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  artworkKeys: ArtworkKey[];
}

export interface StorageState {
  favorites: ArtworkKey[];
  galleries: Gallery[];
  artworks: Record<ArtworkKey, Artwork>;
}

export interface GalleryStorage {
  getFavorites(): Promise<ArtworkKey[]>;
  addFavorite(key: ArtworkKey, artwork: Artwork): Promise<void>;
  removeFavorite(key: ArtworkKey): Promise<void>;
  isFavorite(key: ArtworkKey): Promise<boolean>;

  getGalleries(): Promise<Gallery[]>;
  createGallery(name: string): Promise<Gallery>;
  deleteGallery(id: string): Promise<void>;
  renameGallery(id: string, name: string): Promise<void>;
  addToGallery(galleryId: string, key: ArtworkKey, artwork: Artwork): Promise<void>;
  removeFromGallery(galleryId: string, key: ArtworkKey): Promise<void>;

  getArtwork(key: ArtworkKey): Promise<Artwork | null>;
  getArtworks(keys: ArtworkKey[]): Promise<Artwork[]>;
}
