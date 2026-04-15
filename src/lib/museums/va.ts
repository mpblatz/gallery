import type { MuseumAdapter, FeedResult } from './types';
import { makeArtwork } from './types';
import { getColorName } from '../colorUtils';

const BASE = 'https://api.vam.ac.uk/v2/objects/search';
const PAGE_SIZE = 24;

const TYPE_MAP: Record<string, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  photograph: 'Photograph',
  print: 'Print',
  drawing: 'Drawing',
  textile: 'Textile',
  ceramic: 'Ceramics',
};

function toArtwork(r: Record<string, unknown>) {
  const maker = r._primaryMaker as { name?: string } | undefined;
  const images = r._images as {
    _primary_thumbnail?: string;
    _iiif_image_base_url?: string;
  } | undefined;
  const primaryDate = r._primaryDate as string | undefined;

  const iiifBase = images?._iiif_image_base_url;
  const imageUrl = iiifBase ? `${iiifBase}full/!600,600/0/default.jpg` : null;

  const sysNum = r.systemNumber as string;

  return makeArtwork('va', {
    id: sysNum as unknown as number,
    title: (r._primaryTitle as string) || (r.objectType as string) || 'Untitled',
    imageUrl,
    artist_display: maker?.name || null,
    artist_title: maker?.name || null,
    date_display: primaryDate || null,
    artwork_type_title: (r.objectType as string) || null,
    place_of_origin: (r._primaryPlace as string) || null,
    sourceUrl: `https://collections.vam.ac.uk/item/${sysNum}`,
  });
}

async function query(params: URLSearchParams, page: number, signal?: AbortSignal): Promise<FeedResult> {
  params.set('images_exist', 'true');
  params.set('page_size', String(PAGE_SIZE));
  params.set('page', String(page));

  const res = await fetch(`${BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`V&A API error: ${res.status}`);
  const json = await res.json();
  const records = (json.records || []) as Record<string, unknown>[];
  const info = json.info as { pages?: number } | undefined;
  const totalPages = info?.pages ?? 0;

  return {
    artworks: records.map(toArtwork).filter((a) => a.imageUrl),
    hasMore: page < totalPages,
    nextPage: page + 1,
  };
}

export const vaAdapter: MuseumAdapter = {
  id: 'va',
  name: 'Victoria and Albert Museum',
  shortName: 'V&A',
  supports: { color: false },
  async searchFeatured(page, signal?) {
    return query(new URLSearchParams(), page, signal);
  },

  async searchByDate(startYear, endYear, page, signal?) {
    return query(new URLSearchParams({
      year_made_from: String(startYear),
      year_made_to: String(endYear),
    }), page, signal);
  },

  async searchByColor(hue, _tolerance, page, signal?) {
    const colorName = getColorName(hue);
    return query(new URLSearchParams({ q: colorName }), page, signal);
  },

  async searchByType(type, page, signal?) {
    const mapped = TYPE_MAP[type];
    if (!mapped) return { artworks: [], hasMore: false, nextPage: page };
    return query(new URLSearchParams({ kw_object_type: mapped }), page, signal);
  },

  async searchCombined(filters, page, signal?) {
    const params = new URLSearchParams();

    if (filters.keywords) {
      params.set('q', filters.keywords);
    } else if (filters.colorHue !== null) {
      params.set('q', getColorName(filters.colorHue));
    }

    if (filters.artType !== 'all') {
      const mapped = TYPE_MAP[filters.artType];
      if (mapped) params.set('kw_object_type', mapped);
    }

    if (filters.timeRange) {
      params.set('year_made_from', String(filters.timeRange.startYear));
      params.set('year_made_to', String(filters.timeRange.endYear));
    }

    return query(params, page, signal);
  },
};
