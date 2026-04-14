import type { Artwork, ApiResponse, ColorSearchParams } from '../types/artwork';

const BASE_URL = 'https://api.artic.edu/api/v1';
const IIIF_URL = 'https://www.artic.edu/iiif/2';
export const PAGE_SIZE = 24;

const HEADERS = {
  'AIC-User-Agent': 'Artic (educational project)',
  'Content-Type': 'application/json',
};

const FIELDS_GRID = [
  'id', 'title', 'image_id', 'thumbnail',
  'artist_display', 'artist_title', 'date_display',
  'date_start', 'date_end', 'artwork_type_title',
  'color', 'colorfulness',
].join(',');

const FIELDS_DETAIL = [
  'id', 'title', 'image_id', 'thumbnail',
  'artist_display', 'artist_title', 'date_display',
  'date_start', 'date_end', 'medium_display',
  'dimensions', 'is_public_domain', 'is_boosted', 'style_titles',
  'classification_titles', 'department_title',
  'place_of_origin', 'artwork_type_title',
  'color', 'colorfulness',
].join(',');

const FIELDS_QUIZ = [
  'id', 'title', 'image_id', 'thumbnail',
  'artist_display', 'artist_title', 'date_display',
  'date_start', 'date_end', 'department_title',
  'artwork_type_title', 'is_boosted',
].join(',');

export function getImageUrl(imageId: string, width: number): string {
  return `${IIIF_URL}/${imageId}/full/${width},/0/default.jpg`;
}

export async function fetchArtworkDetail(id: number): Promise<Artwork> {
  const res = await fetch(
    `${BASE_URL}/artworks/${id}?fields=${FIELDS_DETAIL}`,
    { headers: HEADERS },
  );

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// --- Time Machine ---

export async function searchByDateRange(
  startYear: number,
  endYear: number,
  page: number,
): Promise<ApiResponse<Artwork>> {
  const body = {
    query: {
      bool: {
        must: [
          { exists: { field: 'image_id' } },
          { range: { date_start: { gte: startYear, lte: endYear } } },
        ],
      },
    },
    sort: [{ is_boosted: 'desc' }, { date_start: 'asc' }],
    fields: FIELDS_GRID,
    limit: PAGE_SIZE,
    from: (page - 1) * PAGE_SIZE,
  };

  const res = await fetch(`${BASE_URL}/artworks/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// --- Art Quiz ---

export async function fetchBoostedArtworks(
  count: number,
  excludeIds: number[] = [],
  dateRange?: { start: number; end: number },
): Promise<Artwork[]> {
  const must: Record<string, unknown>[] = [
    { exists: { field: 'image_id' } },
    { term: { is_boosted: true } },
    { exists: { field: 'artist_title' } },
    { exists: { field: 'date_start' } },
  ];

  if (dateRange) {
    must.push({ range: { date_start: { gte: dateRange.start, lte: dateRange.end } } });
  }

  const mustNot: Record<string, unknown>[] = [];
  if (excludeIds.length) {
    mustNot.push({ terms: { id: excludeIds } });
  }

  // Smaller random offset when filtering by period (fewer results)
  const maxOffset = dateRange ? 10 : 40;

  const body = {
    query: { bool: { must, must_not: mustNot } },
    fields: FIELDS_QUIZ,
    limit: count,
    from: Math.floor(Math.random() * maxOffset) * count,
  };

  const res = await fetch(`${BASE_URL}/artworks/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json: ApiResponse<Artwork> = await res.json();
  return json.data.filter((a) => a.image_id && a.artist_title && a.date_start != null);
}

// --- Color Palette ---

export async function searchByColor(
  params: ColorSearchParams,
  page: number,
): Promise<ApiResponse<Artwork>> {
  const { hue, hueTolerance, minColorfulness } = params;

  const must: Record<string, unknown>[] = [
    { exists: { field: 'image_id' } },
    { exists: { field: 'color' } },
  ];

  const low = hue - hueTolerance;
  const high = hue + hueTolerance;

  if (low < 0) {
    must.push({
      bool: {
        should: [
          { range: { 'color.h': { gte: 0, lte: high } } },
          { range: { 'color.h': { gte: 360 + low, lte: 360 } } },
        ],
        minimum_should_match: 1,
      },
    });
  } else if (high > 360) {
    must.push({
      bool: {
        should: [
          { range: { 'color.h': { gte: low, lte: 360 } } },
          { range: { 'color.h': { gte: 0, lte: high - 360 } } },
        ],
        minimum_should_match: 1,
      },
    });
  } else {
    must.push({ range: { 'color.h': { gte: low, lte: high } } });
  }

  if (minColorfulness > 0) {
    must.push({ range: { colorfulness: { gte: minColorfulness } } });
  }

  const body = {
    query: { bool: { must } },
    sort: [{ colorfulness: 'desc' }],
    fields: FIELDS_GRID,
    limit: PAGE_SIZE,
    from: (page - 1) * PAGE_SIZE,
  };

  const res = await fetch(`${BASE_URL}/artworks/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
