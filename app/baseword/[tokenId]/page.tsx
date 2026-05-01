import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { fetchBaseWordToken } from '@/lib/baseWordTokenData';
import { buildBaseWordsSvg } from '@/lib/basewords';

interface Props {
  params: { tokenId: string };
}

function getOrigin(): string {
  const h = headers();
  const host = h.get('host') ?? 'cwoma.tools';
  const proto =
    h.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenId } = params;
  if (!/^\d+$/.test(tokenId)) return {};
  const data = await fetchBaseWordToken(BigInt(tokenId));
  if (!data) return {};

  const origin = getOrigin();
  const title = `BaseWord #${tokenId}`;
  const description = data.words.join(' ').toUpperCase();
  const imageUrl = `${origin}/api/og/baseword/${tokenId}`;
  const pageUrl = `${origin}/baseword/${tokenId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [{ url: imageUrl, width: 600, height: 600, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BaseWordSharePage({ params }: Props) {
  const { tokenId } = params;
  if (!/^\d+$/.test(tokenId)) notFound();
  const data = await fetchBaseWordToken(BigInt(tokenId));
  if (!data) notFound();

  const svg = buildBaseWordsSvg(data.words, {
    textColor: data.textColor,
    bgColor: data.bgColor,
  });

  return (
    <main className="baseword-share-page">
      <div
        className="baseword-share-art"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <h1 className="baseword-share-title">BaseWord #{tokenId}</h1>
      <p className="baseword-share-words">{data.words.join(' ').toUpperCase()}</p>
      <Link href="/basewords" className="baseword-share-link">
        ← OPEN IN CWOMA · BASEWORDS
      </Link>
    </main>
  );
}
