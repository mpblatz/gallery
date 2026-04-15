import type { Artwork } from '../../types/artwork';
import type { ArtworkKey, Gallery, GalleryStorage, StorageState } from './types';

const STORAGE_KEY = 'gallery-storage';

const EMPTY_STATE: StorageState = { favorites: [], galleries: [], artworks: {} };

export class LocalGalleryStorage implements GalleryStorage {
  private read(): StorageState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_STATE;
      return JSON.parse(raw) as StorageState;
    } catch {
      return EMPTY_STATE;
    }
  }

  private write(state: StorageState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async getFavorites(): Promise<ArtworkKey[]> {
    return this.read().favorites;
  }

  async addFavorite(key: ArtworkKey, artwork: Artwork): Promise<void> {
    const state = this.read();
    if (!state.favorites.includes(key)) {
      state.favorites.unshift(key);
    }
    state.artworks[key] = artwork;
    this.write(state);
  }

  async removeFavorite(key: ArtworkKey): Promise<void> {
    const state = this.read();
    state.favorites = state.favorites.filter((k) => k !== key);
    this.write(state);
  }

  async isFavorite(key: ArtworkKey): Promise<boolean> {
    return this.read().favorites.includes(key);
  }

  async getGalleries(): Promise<Gallery[]> {
    return this.read().galleries;
  }

  async createGallery(name: string): Promise<Gallery> {
    const state = this.read();
    const gallery: Gallery = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      artworkKeys: [],
    };
    state.galleries.push(gallery);
    this.write(state);
    return gallery;
  }

  async deleteGallery(id: string): Promise<void> {
    const state = this.read();
    state.galleries = state.galleries.filter((g) => g.id !== id);
    this.write(state);
  }

  async renameGallery(id: string, name: string): Promise<void> {
    const state = this.read();
    const gallery = state.galleries.find((g) => g.id === id);
    if (gallery) {
      gallery.name = name;
      gallery.updatedAt = Date.now();
    }
    this.write(state);
  }

  async addToGallery(galleryId: string, key: ArtworkKey, artwork: Artwork): Promise<void> {
    const state = this.read();
    const gallery = state.galleries.find((g) => g.id === galleryId);
    if (gallery && !gallery.artworkKeys.includes(key)) {
      gallery.artworkKeys.unshift(key);
      gallery.updatedAt = Date.now();
    }
    state.artworks[key] = artwork;
    this.write(state);
  }

  async removeFromGallery(galleryId: string, key: ArtworkKey): Promise<void> {
    const state = this.read();
    const gallery = state.galleries.find((g) => g.id === galleryId);
    if (gallery) {
      gallery.artworkKeys = gallery.artworkKeys.filter((k) => k !== key);
      gallery.updatedAt = Date.now();
    }
    this.write(state);
  }

  async getArtwork(key: ArtworkKey): Promise<Artwork | null> {
    return this.read().artworks[key] ?? null;
  }

  async getArtworks(keys: ArtworkKey[]): Promise<Artwork[]> {
    const { artworks } = this.read();
    return keys.map((k) => artworks[k]).filter(Boolean) as Artwork[];
  }
}
