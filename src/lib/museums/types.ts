import type { Artwork, MuseumId, ArtType } from '../../types/artwork';

export interface FeedResult {
  artworks: Artwork[];
  hasMore: boolean;
  nextPage: number;
}

export interface MuseumAdapter {
  id: MuseumId;
  name: string;
  shortName: string;
  supports?: { dateRange?: boolean; color?: boolean };
  searchFeatured(page: number, signal?: AbortSignal): Promise<FeedResult>;
  searchByDate(startYear: number, endYear: number, page: number, signal?: AbortSignal): Promise<FeedResult>;
  searchByColor(hue: number, tolerance: number, page: number, signal?: AbortSignal): Promise<FeedResult>;
  searchByType(type: ArtType, page: number, signal?: AbortSignal): Promise<FeedResult>;
  searchCombined(filters: SearchFilters, page: number, signal?: AbortSignal): Promise<FeedResult>;
}

export interface SearchFilters {
  artType: ArtType;
  timeRange: { startYear: number; endYear: number } | null;
  colorHue: number | null;
  keywords: string | null;
}

/** Helper to create a blank Artwork with defaults for the non-universal fields */
export function makeArtwork(source: MuseumId, overrides: Partial<Artwork> & { id: number; title: string; imageUrl: string | null }): Artwork {
  return {
    image_id: null,
    artist_display: null,
    artist_title: null,
    date_display: null,
    date_start: null,
    date_end: null,
    medium_display: null,
    dimensions: null,
    is_public_domain: false,
    is_boosted: false,
    style_titles: [],
    classification_titles: [],
    thumbnail: null,
    department_title: null,
    place_of_origin: null,
    artwork_type_title: null,
    color: null,
    colorfulness: null,
    source,
    ...overrides,
  };
}
