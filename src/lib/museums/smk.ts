import type { MuseumAdapter, FeedResult } from './types';
import { makeArtwork } from './types';
import { getColorName } from '../colorUtils';

const BASE = 'https://api.smk.dk/api/v1/art/search/';
const PAGE_SIZE = 24;

// SMK uses English object names when lang=en
const TYPE_MAP: Record<string, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  photograph: 'Photography',
  print: 'Print',
  drawing: 'Drawing',
};

function toArtwork(r: Record<string, unknown>) {
  const titles = r.titles as Array<{ title: string }> | undefined;
  const title = titles?.[0]?.title || 'Untitled';

  const production = r.production as Array<{
    creator?: string;
  }> | undefined;
  const artist = production?.[0]?.creator || null;

  const prodDates = r.production_date as Array<{
    period?: string;
    start?: string;
    end?: string;
  }> | undefined;

  let startYear: number | null = null;
  let endYear: number | null = null;
  if (prodDates?.[0]?.start) {
    const parsed = new Date(prodDates[0].start).getFullYear();
    if (!isNaN(parsed)) startYear = parsed;
  }
  if (prodDates?.[0]?.end) {
    const parsed = new Date(prodDates[0].end).getFullYear();
    if (!isNaN(parsed)) endYear = parsed;
  }
  const period = prodDates?.[0]?.period || null;

  const imgUrl = (r.image_thumbnail as string) || null;
  const frontendUrl = (r.frontend_url as string) || null;
  const objectNumber = r.object_number as string | undefined;

  const id = objectNumber
    ? parseInt(objectNumber.replace(/\D/g, '')) || Math.floor(Math.random() * 1e9)
    : Math.floor(Math.random() * 1e9);

  return makeArtwork('smk', {
    id,
    title,
    imageUrl: imgUrl,
    artist_display: artist,
    artist_title: artist,
    date_display: period || (startYear ? String(startYear) : null),
    date_start: startYear,
    date_end: endYear,
    artwork_type_title: (r.object_names as Array<{ name: string }>)?.[0]?.name || null,
    is_public_domain: (r.public_domain as boolean) ?? false,
    sourceUrl: frontendUrl || undefined,
  });
}

async function query(keys: string, filterParts: string[], page: number, signal?: AbortSignal): Promise<FeedResult> {
  const params = new URLSearchParams();
  params.set('keys', keys);
  params.set('rows', String(PAGE_SIZE));
  params.set('offset', String((page - 1) * PAGE_SIZE));
  params.set('lang', 'en');

  if (filterParts.length > 0) {
    params.set('filters', filterParts.map((f) => `[${f}]`).join(','));
  }

  const res = await fetch(`${BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`SMK API error: ${res.status}`);
  const json = await res.json();
  const items = (json.items || []) as Record<string, unknown>[];
  const found = (json.found as number) || 0;

  return {
    artworks: items.map(toArtwork).filter((a) => a.imageUrl),
    hasMore: page * PAGE_SIZE < found,
    nextPage: page + 1,
  };
}

export const smkAdapter: MuseumAdapter = {
  id: 'smk',
  name: 'SMK — National Gallery of Denmark',
  shortName: 'SMK',
  supports: { dateRange: false },
  async searchFeatured(page, signal?) {
    return query('*', ['has_image:true'], page, signal);
  },

  async searchByDate(_startYear, _endYear, page, signal?) {
    return query('*', ['has_image:true'], page, signal);
  },

  async searchByColor(hue, _tolerance, page, signal?) {
    const colorName = getColorName(hue);
    return query(colorName, ['has_image:true'], page, signal);
  },

  async searchByType(type, page, signal?) {
    const mapped = TYPE_MAP[type];
    if (!mapped) return { artworks: [], hasMore: false, nextPage: page };
    return query('*', ['has_image:true', `object_names:${mapped}`], page, signal);
  },

  async searchCombined(filters, page, signal?) {
    const filterParts = ['has_image:true'];
    const keys = filters.colorHue !== null ? getColorName(filters.colorHue) : '*';

    if (filters.artType !== 'all') {
      const mapped = TYPE_MAP[filters.artType];
      if (mapped) filterParts.push(`object_names:${mapped}`);
    }

    return query(keys, filterParts, page, signal);
  },
};
