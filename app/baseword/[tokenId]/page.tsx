import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: { tokenId: string };
  searchParams: { text?: string; bg?: string; words?: string };
}

/**
 * Per-BaseWord share landing page — exists purely to give Twitter (and
 * any other URL-unfurler) a public page whose <head> declares an
 * og:image / twitter:image pointing at the matching PNG render of the
 * BaseWord. Farcaster does not need this page; it embeds the image
 * directly via embeds[] on the compose URL.
 */
export function generateMetadata({
  params,
  searchParams,
}: Props): Metadata {
  const tokenId = params.tokenId;
  const ogQs = new URLSearchParams();
  if (searchParams.text) ogQs.set('text', searchParams.text);
  if (searchParams.bg) ogQs.set('bg', searchParams.bg);
  if (searchParams.words) ogQs.set('words', searchParams.words);
  const ogImage = `/api/og/baseword?${ogQs.toString()}`;

  const words = (searchParams.words ?? '')
    .split(',')
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length > 0);
  const headline = words.length
    ? words.join(' ')
    : `BaseWord #${tokenId}`;
  const description = words.length
    ? `${words.join(' / ')} — minted on Base`
    : `BaseWord #${tokenId} — minted on Base`;
  const fullTitle = `${headline} — BaseWord #${tokenId}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 1200, alt: headline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export default function BaseWordSharePage({
  params,
  searchParams,
}: Props) {
  const tokenId = params.tokenId;
  const words = (searchParams.words ?? '')
    .split(',')
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length > 0);

  return (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>
        BaseWord #{tokenId}
      </h1>
      {words.length > 0 && (
        <p style={{ fontSize: 18, marginBottom: 24 }}>
          {words.join(' / ')}
        </p>
      )}
      <Link
        href="/basewords"
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          border: '1px solid var(--rule)',
          textDecoration: 'none',
          color: 'var(--fg)',
          fontWeight: 600,
        }}
      >
        VIEW ON CWOMA
      </Link>
    </div>
  );
}
