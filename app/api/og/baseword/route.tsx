import { buildBaseWordsSvg } from '@/lib/basewords';

/**
 * Public on-the-fly BaseWord image for share embeds.
 *
 * Returns the same SVG the on-chain `buildSVG()` function produces,
 * byte-for-byte (Helvetica semibold, 600x600, 40/50/60 percent
 * vertical positioning). Used as the Farcaster `embeds[]` URL and
 * the og:image / twitter:image of the /baseword/[tokenId] landing
 * page, so each share renders the actual on-chain artwork rather
 * than a Satori-rendered approximation in a different font.
 */

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

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Cached aggressively — same params always produce the same SVG.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
