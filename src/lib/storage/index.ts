import { LocalGalleryStorage } from './localStorage';
import type { GalleryStorage } from './types';

export const storage: GalleryStorage = new LocalGalleryStorage();
export type { ArtworkKey, Gallery, GalleryStorage, StorageState } from './types';
export { toArtworkKey } from './types';
