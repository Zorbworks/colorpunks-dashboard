/**
 * Client-side Base Words SVG preview.
 *
 * The canonical SVG comes from the contract's buildSVG() / tokenURI() after
 * mint. This is a preview that approximates the rendered output so users can
 * see what they're about to mint before committing.
 *
 * Rules from the contract / basewords.xyz:
 *   - White background (#FFFFFF), blue text (#0E76FD) — default colors
 *   - Helvetica Bold, uppercase, centered
 *   - 1–3 words stacked vertically
 *   - Square canvas
 */

const BG = '#FFFFFF';
const FG = '#0E76FD';
const VIEW = 1000; // viewBox size

/** Returns a font size (in viewBox units) that fits the longest word comfortably. */
function fontSizeForWords(words: string[]): number {
  const longest = Math.max(1, ...words.map((w) => w.length));
  // Helvetica Bold character width is ~0.58 × fontSize.
  // We want the widest word to occupy ~85% of the viewBox width.
  const widthBudget = VIEW * 0.85;
  const byWidth = widthBudget / (longest * 0.58);
  // Also clamp vertically so N stacked lines fit.
  const lineBudget = (VIEW * 0.85) / words.length;
  return Math.floor(Math.min(byWidth, lineBudget));
}

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

  const fontSize = fontSizeForWords(cleaned);
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
