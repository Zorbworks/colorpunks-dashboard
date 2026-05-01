import { ImageResponse } from 'next/og';

/**
 * On-the-fly PNG renderer for BaseWord shares.
 *
 * Receives `words`, `text`, and `bg` query params and returns a
 * 1200x1200 image visually matching the on-chain SVG (Helvetica
 * semibold, words stacked centered with the same 40/50/60 percent
 * vertical layout the contract uses for one, two, or three words).
 *
 * Used as og:image / twitter:image on /baseword/[tokenId] so
 * Farcaster + Twitter unfurl shared casts/tweets with the actual
 * BaseWord artwork rather than an OpenSea card.
 */
export const runtime = 'edge';

const VIEW = 1200; // OG render size — 2x the on-chain 600px viewBox.
const FONT_SIZE = (46 / 600) * VIEW; // 92, matching contract scale.

const LINE_Y_PCT: Record<number, string[]> = {
  1: ['50%'],
  2: ['45%', '55%'],
  3: ['40%', '50%', '60%'],
};

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  const t = raw.trim();
  if (!HEX_RE.test(t)) return fallback;
  return t.startsWith('#') ? t : `#${t}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = normalizeHex(searchParams.get('text'), '#0052FF');
  const bg = normalizeHex(searchParams.get('bg'), '#FFFFFF');
  const wordsRaw = searchParams.get('words') ?? '';
  const words = wordsRaw
    .split(',')
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length > 0)
    .slice(0, 3);

  const positions = LINE_Y_PCT[words.length] ?? LINE_Y_PCT[3];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: bg,
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* One absolutely-positioned line per word — y%/50% centring
            matches the contract's <text dy=".3em" y="..."/> layout
            byte-for-byte rather than relying on flex centring. */}
        {words.map((word, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: positions[i],
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: text,
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            {word}
          </div>
        ))}
      </div>
    ),
    {
      width: VIEW,
      height: VIEW,
    }
  );
}
