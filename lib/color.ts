import type { UserColor } from './alchemy';

export type HueBucket =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'gray';

/** Tone sorts: light/dark by luminance, vivid/muted by saturation */
export type Tone = 'all' | 'light' | 'dark' | 'vivid' | 'muted';
export type Age = 'new' | 'old';
export type HueFilter = 'all' | HueBucket;

export interface ColorFilters {
  tone: Tone;
  hue: HueFilter;
  age: Age;
}

export const DEFAULT_FILTERS: ColorFilters = {
  tone: 'all',
  hue: 'all',
  age: 'new',
};

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, l: 0 };
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

export function hueBucket(h: number, s: number): HueBucket {
  if (s < 0.15) return 'gray';
  if (h < 20 || h >= 340) return 'red';
  if (h < 45) return 'orange';
  if (h < 65) return 'yellow';
  if (h < 165) return 'green';
  if (h < 200) return 'cyan';
  if (h < 250) return 'blue';
  return 'purple';
}

export interface EnrichedColor extends UserColor {
  hsl: Hsl;
  bucket: HueBucket;
  /**
   * Numeric tokenId — used for age sorting. BaseColors is ERC721A so
   * tokenIds are sequential: higher id = minted later = newer.
   */
  mintOrder: number;
}

export function enrichColors(colors: UserColor[]): EnrichedColor[] {
  return colors.map((c) => {
    const hsl = hexToHsl(c.color);
    return {
      ...c,
      hsl,
      bucket: hueBucket(hsl.h, hsl.s),
      mintOrder: Number(c.tokenId) || 0,
    };
  });
}

export function applyFilters(
  enriched: EnrichedColor[],
  filters: ColorFilters
): EnrichedColor[] {
  let out = enriched.filter((c) => {
    if (filters.hue !== 'all' && c.bucket !== filters.hue) return false;
    return true;
  });

  // Tone sorts ALL colors — does NOT filter them out.
  // Light/dark sort by luminance, vivid/muted sort by saturation.
  if (filters.tone === 'light') out = out.slice().sort((a, b) => b.hsl.l - a.hsl.l);
  if (filters.tone === 'dark')  out = out.slice().sort((a, b) => a.hsl.l - b.hsl.l);
  if (filters.tone === 'vivid') out = out.slice().sort((a, b) => b.hsl.s - a.hsl.s);
  if (filters.tone === 'muted') out = out.slice().sort((a, b) => a.hsl.s - b.hsl.s);

  // Age sorts by tokenId (= mint order in ERC721A). Higher id = newer.
  // Only applied when tone is 'all' (otherwise tone sort takes precedence).
  if (filters.tone === 'all') {
    if (filters.age === 'new') out = out.slice().sort((a, b) => b.mintOrder - a.mintOrder);
    if (filters.age === 'old') out = out.slice().sort((a, b) => a.mintOrder - b.mintOrder);
  }

  return out;
}
