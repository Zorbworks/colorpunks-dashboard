import { fetchBaseWordToken } from '@/lib/baseWordTokenData';
import { buildBaseWordsSvg } from '@/lib/basewords';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params;
  if (!/^\d+$/.test(tokenId)) {
    return new Response('bad token id', { status: 400 });
  }
  const data = await fetchBaseWordToken(BigInt(tokenId));
  if (!data) {
    return new Response('not found', { status: 404 });
  }
  const svg = buildBaseWordsSvg(data.words, {
    textColor: data.textColor,
    bgColor: data.bgColor,
  });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
