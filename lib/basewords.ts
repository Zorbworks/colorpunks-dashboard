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
// Canvas size matches the on-chain buildSVG() (600x600). Anything we
// render client-side must be byte-for-byte equivalent to the contract
// output so the canvas preview and grid thumbnails line up.
const VIEW = 600;
export const BASEWORDS_FONT_SIZE = 46; // matches the contract's font-size
// Percentage of viewBox width used for font-size — for the live editor
// preview and anywhere else we size text by container width.
export const BASEWORDS_FONT_SIZE_CQW = (BASEWORDS_FONT_SIZE / VIEW) * 100;

/** Y positions (as percentages) per word count — mirrors the contract's
 *  layout so 1, 2, or 3 words are vertically centred the same way. */
const LINE_Y_PCT: Record<number, string[]> = {
  1: ['50%'],
  2: ['45%', '55%'],
  3: ['40%', '50%', '60%'],
};

/**
 * Build an SVG string preview of the given words, matching the on-chain
 * `buildSVG()` output exactly (Helvetica semibold 46 in a 600×600 canvas,
 * lines at 40/50/60 %, dy=.3em baseline correction).
 * Accepts up to 3 words. Empty/blank words are stripped. If textColor /
 * bgColor are omitted, the default BaseWords palette is used.
 */
export function buildBaseWordsSvg(
  words: string[],
  options?: { textColor?: string; bgColor?: string }
): string {
  const fg = options?.textColor || FG;
  const bg = options?.bgColor || BG;
  const cleaned = words
    .map((w) => (w ?? '').trim().toUpperCase())
    .filter((w) => w.length > 0)
    .slice(0, 3);

  if (cleaned.length === 0) {
    return `<svg width="${VIEW}" height="${VIEW}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bg}"/></svg>`;
  }

  const ys = LINE_Y_PCT[cleaned.length] ?? LINE_Y_PCT[3];
  const lines = cleaned
    .map(
      (word, i) =>
        `<text x="50%" y="${ys[i]}" ` +
        `font-family="Helvetica, sans-serif" font-weight="600" ` +
        `font-size="${BASEWORDS_FONT_SIZE}" fill="${fg}" text-anchor="middle" dy=".3em">${escapeXml(word)}</text>`
    )
    .join('');

  return (
    `<svg width="${VIEW}" height="${VIEW}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    lines +
    `</svg>`
  );
}

/** Encode SVG as a data URI for use in <img src> or <canvas drawImage>. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Render an SVG string to a PNG Blob via a hidden <canvas>.
 *
 * Runs entirely client-side and uses the browser's font engine, so
 * the BaseWord renders with whichever Helvetica install the user
 * has (perfect on macOS, system fallback elsewhere). Used by both
 * the share modal's DOWNLOAD action and the Farcaster share path
 * which uploads the resulting blob to IPFS.
 *
 * Resolves with a square PNG of the requested edge size; rejects if
 * the SVG fails to load or canvas blob extraction fails.
 */
export function renderSvgToPng(svg: string, size = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const objectUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((png) => {
        if (!png) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        resolve(png);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('SVG image failed to load'));
    };
    img.src = objectUrl;
  });
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
