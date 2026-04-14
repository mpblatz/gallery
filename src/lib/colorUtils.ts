export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getColorName(hue: number): string {
  const names: [number, string][] = [
    [15, 'Red'],
    [45, 'Orange'],
    [75, 'Yellow'],
    [150, 'Green'],
    [195, 'Cyan'],
    [255, 'Blue'],
    [285, 'Purple'],
    [330, 'Pink'],
    [360, 'Red'],
  ];
  for (const [limit, name] of names) {
    if (hue <= limit) return name;
  }
  return 'Red';
}

export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
}

export function normalizeHex(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return `#${h}`;
}

// Perceptual color distance using weighted Euclidean in RGB
// Weights approximate human sensitivity (red-green more than blue)
function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const rAvg = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  // Low-cost approximation of CIE color difference
  return Math.sqrt(
    (2 + rAvg / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rAvg) / 256) * db * db,
  );
}

const MERGE_THRESHOLD = 80; // colors closer than this are merged

// Median-cut color quantization from canvas pixel data
// Over-extracts then merges similar colors to find only truly distinct ones
export async function extractPalette(imageUrl: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });

  const size = 100;
  const canvas = document.createElement('canvas');
  const aspect = img.width / img.height;
  canvas.width = aspect >= 1 ? size : Math.round(size * aspect);
  canvas.height = aspect >= 1 ? Math.round(size / aspect) : size;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels: [number, number, number][] = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    const a = imageData.data[i + 3];
    if (a < 128) continue;
    pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
  }

  // Over-extract: depth 4 = up to 16 buckets, then merge similar ones
  const buckets = medianCut(pixels, 8);

  // Compute average color and population for each bucket
  const candidates = buckets
    .filter((b) => b.length > 0)
    .map((bucket) => {
      const sum = bucket.reduce(
        (acc, px) => [acc[0] + px[0], acc[1] + px[1], acc[2] + px[2]],
        [0, 0, 0],
      );
      const n = bucket.length;
      return {
        rgb: [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)] as [number, number, number],
        population: n,
      };
    })
    .sort((a, b) => b.population - a.population);

  // Merge similar colors: keep a color only if it's distinct from all already-kept colors
  const distinct: { rgb: [number, number, number]; population: number }[] = [];
  for (const candidate of candidates) {
    const tooClose = distinct.some(
      (kept) => colorDistance(candidate.rgb, kept.rgb) < MERGE_THRESHOLD,
    );
    if (!tooClose) {
      distinct.push(candidate);
    }
  }

  return distinct.map((c) => rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]));
}

function medianCut(
  pixels: [number, number, number][],
  depth: number,
): [number, number, number][][] {
  if (depth <= 1 || pixels.length === 0) return [pixels];

  // Find the channel with the widest range
  let maxRange = 0;
  let splitChannel = 0;
  for (let ch = 0; ch < 3; ch++) {
    const values = pixels.map((p) => p[ch]);
    const range = Math.max(...values) - Math.min(...values);
    if (range > maxRange) {
      maxRange = range;
      splitChannel = ch;
    }
  }

  pixels.sort((a, b) => a[splitChannel] - b[splitChannel]);
  const mid = Math.floor(pixels.length / 2);

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
