export interface ArtworkThumbnail {
  lqip: string;
  width: number;
  height: number;
  alt_text: string | null;
}

export type MuseumId = 'artic' | 'met' | 'cleveland' | 'va' | 'smk';

export type ArtType = 'painting' | 'sculpture' | 'photograph' | 'print' | 'drawing' | 'textile' | 'ceramic' | 'all';

export interface Artwork {
  id: number;
  title: string;
  image_id: string | null;
  artist_display: string | null;
  artist_title: string | null;
  date_display: string | null;
  date_start: number | null;
  date_end: number | null;
  medium_display: string | null;
  dimensions: string | null;
  is_public_domain: boolean;
  is_boosted: boolean;
  style_titles: string[];
  classification_titles: string[];
  thumbnail: ArtworkThumbnail | null;
  department_title: string | null;
  place_of_origin: string | null;
  artwork_type_title: string | null;
  color: {
    h: number;
    l: number;
    s: number;
    percentage: number;
    population: number;
  } | null;
  colorfulness: number | null;
  imageUrl: string | null;
  source: MuseumId;
  sourceUrl?: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

export interface ApiResponse<T> {
  pagination: Pagination;
  data: T[];
  config: { iiif_url: string };
}

export interface ColorSearchParams {
  hue: number;
  hueTolerance: number;
  minColorfulness: number;
}
