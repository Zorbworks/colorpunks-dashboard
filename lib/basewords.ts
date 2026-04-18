/**
 * Client-side Base Words SVG preview.
 *
 * The canonical SVG comes from the contract's buildSVG() / tokenURI() after
 * mint. This is a preview that approximates the rendered output so users can
 * see what they're about to mint before committing.
 *
 * Rules from the contract / basewords.xyz:
 *   - White background (#FFFFFF), Base-blue text (#0052FF) — default colors
 *   - Helvetica Bold, uppercase, centered
 *   - 1–3 words stacked vertically
 *   - Square canvas
 */

const BG = '#FFFFFF';
const FG = '#0052FF';
const VIEW = 1000; // viewBox size
// Fixed font size in viewBox units. Matches basewords.xyz — size does not
// shrink to fit long words; short and long words render at the same height.
export const BASEWORDS_FONT_SIZE = 95;
// Percentage of viewBox used for font-size in the live editor preview.
export const BASEWORDS_FONT_SIZE_CQW = (BASEWORDS_FONT_SIZE / VIEW) * 100;

/**
 * Build an SVG string preview of the given words.
 * Accepts up to 3 words. Empty/blank words are stripped.
 */
export function buildBaseWordsSvg(words: string[]): string {
  const cleaned = words
    .map((w) => (w ?? '').trim().toUpperCase())
    .filter((w) => w.length > 0);

  if (cleaned.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}"><rect width="${VIEW}" height="${VIEW}" fill="${BG}"/></svg>`;
  }

  const fontSize = BASEWORDS_FONT_SIZE;
  const totalHeight = fontSize * cleaned.length;
  const startY = (VIEW - totalHeight) / 2 + fontSize * 0.78; // baseline offset for first line

  const lines = cleaned
    .map(
      (word, i) =>
        `<text x="${VIEW / 2}" y="${startY + i * fontSize}" ` +
        `font-family="Helvetica, Arial, sans-serif" font-weight="700" ` +
        `font-size="${fontSize}" fill="${FG}" text-anchor="middle">${escapeXml(word)}</text>`
    )
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">` +
    `<rect width="${VIEW}" height="${VIEW}" fill="${BG}"/>` +
    lines +
    `</svg>`
  );
}

/** Encode SVG as a data URI for use in <img src> or <canvas drawImage>. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate a word against the contract's rules:
 *   - A–Z and 0–9 only
 *   - 1–15 characters
 *   - No spaces, punctuation, or lowercase (we uppercase client-side)
 */
export function sanitizeWord(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
}

export function isValidWord(word: string): boolean {
  return /^[A-Z0-9]{1,15}$/.test(word);
}

export const BASEWORDS_MAX_CHARS = 15;
export const BASEWORDS_MAX_WORDS = 3;
export const BASEWORDS_MIN_WORDS = 1;
