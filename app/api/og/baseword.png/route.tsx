import { Resvg } from '@resvg/resvg-js';
import { buildBaseWordsSvg } from '@/lib/basewords';

/**
 * PNG-rasterized BaseWord image — used as og:image / twitter:image
 * on the /baseword/[tokenId] landing page so Twitter (which does not
 * unfurl SVG og images) can show a card with the actual on-chain
 * artwork.
 *
 * Same input shape as /api/og/baseword.svg (text, bg, words query
 * params); we generate the on-chain SVG via buildBaseWordsSvg and
 * rasterize at 1200x1200 with @resvg/resvg-js. Resvg falls back to
 * the host's system fonts (Liberation Sans on the Vercel function
 * environment) which is metric-compatible with Helvetica, so the
 * output is much closer to the on-chain rendering than the previous
 * Satori/Inter pipeline.
 *
 * Node runtime is required — @resvg/resvg-js ships native bindings
 * that do not work on Edge.
 */
export const runtime = 'nodejs';

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  const t = raw.trim();
  if (!HEX_RE.test(t)) return fallback;
  return t.startsWith('#') ? t : `#${t}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const textColor = normalizeHex(searchParams.get('text'), '#0052FF');
  const bgColor = normalizeHex(searchParams.get('bg'), '#FFFFFF');
  const wordsRaw = searchParams.get('words') ?? '';
  const words = wordsRaw
    .split(',')
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  const svg = buildBaseWordsSvg(words, { textColor, bgColor });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // Resvg's default font discovery — falls back to the host's
      // system sans-serif when "Helvetica, sans-serif" is not present.
      // On Vercel functions this resolves to Liberation Sans, which
      // matches Helvetica metrics closely.
      defaultFontFamily: 'Helvetica',
      loadSystemFonts: true,
    },
  });
  const png = resvg.render().asPng();
  // resvg returns a Node Buffer; wrap in Uint8Array so it satisfies
  // the Response BodyInit signature TypeScript expects.
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
