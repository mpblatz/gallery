import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Artwork } from '../types/artwork';
import { storage, toArtworkKey, type ArtworkKey, type Gallery } from '../lib/storage';

interface CollectionsContextValue {
  favorites: Set<ArtworkKey>;
  toggleFavorite: (artwork: Artwork) => void;
  isFavorite: (artwork: Artwork) => boolean;

  galleries: Gallery[];
  createGallery: (name: string) => Promise<Gallery>;
  deleteGallery: (id: string) => void;
  renameGallery: (id: string, name: string) => void;
  addToGallery: (galleryId: string, artwork: Artwork) => void;
  removeFromGallery: (galleryId: string, artwork: Artwork) => void;
  isInGallery: (galleryId: string, artwork: Artwork) => boolean;

  getGalleryArtworks: (galleryId: string) => Promise<Artwork[]>;
  getFavoriteArtworks: () => Promise<Artwork[]>;
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<ArtworkKey>>(new Set());
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([storage.getFavorites(), storage.getGalleries()]).then(
      ([favs, gals]) => {
        setFavorites(new Set(favs));
        setGalleries(gals);
        setReady(true);
      },
    );
  }, []);

  const toggleFavorite = useCallback((artwork: Artwork) => {
    const key = toArtworkKey(artwork);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        storage.removeFavorite(key);
      } else {
        next.add(key);
        storage.addFavorite(key, artwork);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (artwork: Artwork) => favorites.has(toArtworkKey(artwork)),
    [favorites],
  );

  const handleCreateGallery = useCallback(async (name: string) => {
    const gallery = await storage.createGallery(name);
    setGalleries((prev) => [...prev, gallery]);
    return gallery;
  }, []);

  const handleDeleteGallery = useCallback((id: string) => {
    setGalleries((prev) => prev.filter((g) => g.id !== id));
    storage.deleteGallery(id);
  }, []);

  const handleRenameGallery = useCallback((id: string, name: string) => {
    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name, updatedAt: Date.now() } : g)),
    );
    storage.renameGallery(id, name);
  }, []);

  const handleAddToGallery = useCallback((galleryId: string, artwork: Artwork) => {
    const key = toArtworkKey(artwork);
    setGalleries((prev) =>
      prev.map((g) => {
        if (g.id !== galleryId || g.artworkKeys.includes(key)) return g;
        return { ...g, artworkKeys: [key, ...g.artworkKeys], updatedAt: Date.now() };
      }),
    );
    storage.addToGallery(galleryId, key, artwork);
  }, []);

  const handleRemoveFromGallery = useCallback((galleryId: string, artwork: Artwork) => {
    const key = toArtworkKey(artwork);
    setGalleries((prev) =>
      prev.map((g) => {
        if (g.id !== galleryId) return g;
        return { ...g, artworkKeys: g.artworkKeys.filter((k) => k !== key), updatedAt: Date.now() };
      }),
    );
    storage.removeFromGallery(galleryId, key);
  }, []);

  const isInGallery = useCallback(
    (galleryId: string, artwork: Artwork) => {
      const key = toArtworkKey(artwork);
      const gallery = galleries.find((g) => g.id === galleryId);
      return gallery ? gallery.artworkKeys.includes(key) : false;
    },
    [galleries],
  );

  const getGalleryArtworks = useCallback(async (galleryId: string) => {
    const gals = await storage.getGalleries();
    const gallery = gals.find((g) => g.id === galleryId);
    if (!gallery) return [];
    return storage.getArtworks(gallery.artworkKeys);
  }, []);

  const getFavoriteArtworks = useCallback(async () => {
    const favKeys = await storage.getFavorites();
    return storage.getArtworks(favKeys);
  }, []);

  if (!ready) return null;

  return (
    <CollectionsContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        galleries,
        createGallery: handleCreateGallery,
        deleteGallery: handleDeleteGallery,
        renameGallery: handleRenameGallery,
        addToGallery: handleAddToGallery,
        removeFromGallery: handleRemoveFromGallery,
        isInGallery,
        getGalleryArtworks,
        getFavoriteArtworks,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used within CollectionsProvider');
  return ctx;
}
