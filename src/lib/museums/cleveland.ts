import type { ArtType } from '../../types/artwork';
import type { MuseumAdapter, FeedResult, SearchFilters } from './types';
import { makeArtwork } from './types';
import { getColorName } from '../colorUtils';

const BASE = 'https://openaccess-api.clevelandart.org/api/artworks/';
const PAGE_SIZE = 24;

const TYPE_MAP: Record<string, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  photograph: 'Photograph',
  print: 'Print',
  drawing: 'Drawing',
  textile: 'Textile',
  ceramic: 'Ceramic',
};

function toArtwork(r: Record<string, unknown>) {
  const images = r.images as { web?: { url?: string } } | null;
  const creators = r.creators as Array<{ description?: string }> | null;
  const imageUrl = images?.web?.url || null;

  return makeArtwork('cleveland', {
    id: r.id as number,
    title: (r.title as string) || 'Untitled',
    imageUrl,
    artist_display: creators?.[0]?.description || null,
    artist_title: creators?.[0]?.description || null,
    date_display: (r.creation_date as string) || null,
    date_start: (r.creation_date_earliest as number) ?? null,
    date_end: (r.creation_date_latest as number) ?? null,
    medium_display: (r.technique as string) || null,
    dimensions: (r.measurements as string) || null,
    department_title: (r.department as string) || null,
    artwork_type_title: (r.type as string) || null,
    place_of_origin: (r.culture as string[])?.[0] || null,
    sourceUrl: (r.url as string) || null,
  });
}

async function query(params: URLSearchParams, page: number, signal?: AbortSignal): Promise<FeedResult> {
  params.set('has_image', '1');
  params.set('limit', String(PAGE_SIZE));
  params.set('skip', String((page - 1) * PAGE_SIZE));

  const res = await fetch(`${BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`Cleveland API error: ${res.status}`);
  const json = await res.json();
  const data = (json.data || []) as Record<string, unknown>[];
  const info = json.info as { total?: number } | undefined;
  const total = info?.total ?? 0;

  return {
    artworks: data.map(toArtwork).filter((a) => a.imageUrl),
    hasMore: page * PAGE_SIZE < total,
    nextPage: page + 1,
  };
}

export const clevelandAdapter: MuseumAdapter = {
  id: 'cleveland',
  name: 'Cleveland Museum of Art',
  shortName: 'CMA',
  async searchFeatured(page, signal?) {
    return query(new URLSearchParams(), page, signal);
  },

  async searchByDate(startYear, endYear, page, signal?) {
    return query(new URLSearchParams({
      created_after: String(startYear),
      created_before: String(endYear),
    }), page, signal);
  },

  async searchByColor(hue, _tolerance, page, signal?) {
    const colorName = getColorName(hue);
    return query(new URLSearchParams({ q: colorName }), page, signal);
  },

  async searchByType(type, page, signal?) {
    const mapped = TYPE_MAP[type];
    if (!mapped) return { artworks: [], hasMore: false, nextPage: page };
    return query(new URLSearchParams({ type: mapped }), page, signal);
  },

  async searchCombined(filters, page, signal?) {
    const params = new URLSearchParams();

    if (filters.colorHue !== null) {
      params.set('q', getColorName(filters.colorHue));
    }

    if (filters.artType !== 'all') {
      const mapped = TYPE_MAP[filters.artType];
      if (mapped) params.set('type', mapped);
    }

    if (filters.timeRange) {
      params.set('created_after', String(filters.timeRange.startYear));
      params.set('created_before', String(filters.timeRange.endYear));
    }

    return query(params, page, signal);
  },
};
