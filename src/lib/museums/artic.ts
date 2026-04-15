import type { Artwork } from '../../types/artwork';
import type { MuseumAdapter, FeedResult } from './types';
import { makeArtwork } from './types';

const BASE_URL = 'https://api.artic.edu/api/v1';
const IIIF_URL = 'https://www.artic.edu/iiif/2';
const PAGE_SIZE = 24;

const HEADERS: Record<string, string> = {
  'AIC-User-Agent': 'Artic (educational project)',
  'Content-Type': 'application/json',
};

const FIELDS = [
  'id', 'title', 'image_id', 'thumbnail',
  'artist_display', 'artist_title', 'date_display',
  'date_start', 'date_end', 'artwork_type_title',
  'color', 'colorfulness', 'is_public_domain',
  'medium_display', 'dimensions', 'department_title',
  'place_of_origin', 'style_titles', 'classification_titles',
  'is_boosted',
].join(',');

const TYPE_MAP: Record<string, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  photograph: 'Photograph',
  print: 'Print',
  drawing: 'Drawing',
  textile: 'Textile',
  ceramic: 'Vessel',
};

function toArtwork(raw: Record<string, unknown>): Artwork {
  const r = raw as Record<string, unknown>;
  const imageId = r.image_id as string | null;
  return makeArtwork('artic', {
    id: r.id as number,
    title: (r.title as string) || 'Untitled',
    image_id: imageId,
    imageUrl: imageId ? `${IIIF_URL}/${imageId}/full/600,/0/default.jpg` : null,
    artist_display: r.artist_display as string | null,
    artist_title: r.artist_title as string | null,
    date_display: r.date_display as string | null,
    date_start: r.date_start as number | null,
    date_end: r.date_end as number | null,
    medium_display: r.medium_display as string | null,
    dimensions: r.dimensions as string | null,
    is_public_domain: (r.is_public_domain as boolean) ?? false,
    is_boosted: (r.is_boosted as boolean) ?? false,
    style_titles: (r.style_titles as string[]) ?? [],
    classification_titles: (r.classification_titles as string[]) ?? [],
    thumbnail: r.thumbnail as Artwork['thumbnail'],
    department_title: r.department_title as string | null,
    place_of_origin: r.place_of_origin as string | null,
    artwork_type_title: r.artwork_type_title as string | null,
    color: r.color as Artwork['color'],
    colorfulness: r.colorfulness as number | null,
    sourceUrl: `https://www.artic.edu/artworks/${r.id}`,
  });
}

async function query(body: Record<string, unknown>, signal?: AbortSignal): Promise<FeedResult> {
  const fullBody = JSON.stringify({ ...body, fields: FIELDS, limit: PAGE_SIZE });
  const res = await fetch(`${BASE_URL}/artworks/search`, {
    method: 'POST',
    headers: HEADERS,
    body: fullBody,
    signal,
  });
  if (!res.ok) throw new Error(`AIC API error: ${res.status}`);
  const json = await res.json();
  const page = json.pagination.current_page;
  const totalPages = Math.min(json.pagination.total_pages, 40);
  return {
    artworks: json.data.map(toArtwork),
    hasMore: page < totalPages,
    nextPage: page + 1,
  };
}

export const articAdapter: MuseumAdapter = {
  id: 'artic',
  name: 'Art Institute of Chicago',
  shortName: 'AIC',
  async searchFeatured(page, signal?) {
    return query({
      query: { bool: { must: [{ exists: { field: 'image_id' } }, { term: { is_boosted: true } }] } },
      sort: [{ timestamp: 'desc' }],
      from: (page - 1) * PAGE_SIZE,
    }, signal);
  },

  async searchByDate(startYear, endYear, page, signal?) {
    return query({
      query: { bool: { must: [{ exists: { field: 'image_id' } }, { range: { date_start: { gte: startYear, lte: endYear } } }] } },
      sort: [{ is_boosted: 'desc' }, { date_start: 'asc' }],
      from: (page - 1) * PAGE_SIZE,
    }, signal);
  },

  async searchByColor(hue, tolerance, page, signal?) {
    const low = hue - tolerance;
    const high = hue + tolerance;
    const must: Record<string, unknown>[] = [
      { exists: { field: 'image_id' } },
      { exists: { field: 'color' } },
    ];

    if (low < 0) {
      must.push({ bool: { should: [{ range: { 'color.h': { gte: 0, lte: high } } }, { range: { 'color.h': { gte: 360 + low, lte: 360 } } }], minimum_should_match: 1 } });
    } else if (high > 360) {
      must.push({ bool: { should: [{ range: { 'color.h': { gte: low, lte: 360 } } }, { range: { 'color.h': { gte: 0, lte: high - 360 } } }], minimum_should_match: 1 } });
    } else {
      must.push({ range: { 'color.h': { gte: low, lte: high } } });
    }

    return query({
      query: { bool: { must } },
      sort: [{ colorfulness: 'desc' }],
      from: (page - 1) * PAGE_SIZE,
    }, signal);
  },

  async searchByType(type, page, signal?) {
    const mapped = TYPE_MAP[type];
    if (!mapped) return { artworks: [], hasMore: false, nextPage: page };
    return query({
      query: { bool: { must: [{ exists: { field: 'image_id' } }, { match: { artwork_type_title: mapped } }] } },
      sort: [{ is_boosted: 'desc' }],
      from: (page - 1) * PAGE_SIZE,
    }, signal);
  },

  async searchCombined(filters, page, signal?) {
    const must: Record<string, unknown>[] = [{ exists: { field: 'image_id' } }];

    if (filters.artType !== 'all') {
      const mapped = TYPE_MAP[filters.artType];
      if (mapped) must.push({ match: { artwork_type_title: mapped } });
    }

    if (filters.timeRange) {
      must.push({ range: { date_start: { gte: filters.timeRange.startYear, lte: filters.timeRange.endYear } } });
    }

    if (filters.colorHue !== null) {
      must.push({ exists: { field: 'color' } });
      const low = filters.colorHue - 25;
      const high = filters.colorHue + 25;
      if (low < 0) {
        must.push({ bool: { should: [{ range: { 'color.h': { gte: 0, lte: high } } }, { range: { 'color.h': { gte: 360 + low, lte: 360 } } }], minimum_should_match: 1 } });
      } else if (high > 360) {
        must.push({ bool: { should: [{ range: { 'color.h': { gte: low, lte: 360 } } }, { range: { 'color.h': { gte: 0, lte: high - 360 } } }], minimum_should_match: 1 } });
      } else {
        must.push({ range: { 'color.h': { gte: low, lte: high } } });
      }
    }

    if (filters.keywords) {
      must.push({
        multi_match: {
          query: filters.keywords,
          fields: ['title^3', 'artist_display^2', 'medium_display', 'description'],
        },
      });
    }

    return query({
      query: { bool: { must } },
      sort: filters.keywords
        ? [{ _score: 'desc' }]
        : filters.colorHue !== null
          ? [{ colorfulness: 'desc' }]
          : [{ is_boosted: 'desc' }],
      from: (page - 1) * PAGE_SIZE,
    }, signal);
  },
};
