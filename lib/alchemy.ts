import { BASE_COLORS_ADDRESS, COLOR_PUNKS_ADDRESS } from './contracts';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export interface AlchemyNft {
  tokenId: string;
  name: string | null;
  description: string | null;
  image: {
    cachedUrl: string | null;
    originalUrl: string | null;
    pngUrl?: string | null;
  } | null;
  raw: {
    metadata: {
      name?: string;
      description?: string;
      image?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    } | null;
  };
}

export interface UserColor {
  tokenId: string;
  /** Hex color used for painting, always "#RRGGBB". */
  color: string;
  /** Display label. Either the BaseColors custom name, or the hex if unnamed. */
  name: string;
  /** True if the owner gave this BaseColor a custom name (i.e. name !== hex). */
  isNamed: boolean;
  image: string | null;
}

const HEX_RE = /#?([0-9a-f]{6})\b/i;

/** Pull a #RRGGBB out of attributes, name, or description — in that order. */
function extractHex(nft: AlchemyNft): string | null {
  const attrs = nft.raw?.metadata?.attributes ?? [];
  for (const attr of attrs) {
    const val = String(attr?.value ?? '');
    const m = HEX_RE.exec(val);
    if (m) return `#${m[1].toUpperCase()}`;
  }
  const name = nft.name ?? nft.raw?.metadata?.name ?? '';
  const nm = HEX_RE.exec(name);
  if (nm) return `#${nm[1].toUpperCase()}`;
  const desc = nft.description ?? nft.raw?.metadata?.description ?? '';
  const dm = HEX_RE.exec(desc);
  if (dm) return `#${dm[1].toUpperCase()}`;
  return null;
}

/**
 * Decide whether the BaseColor has a real custom name or is still just the hex.
 * BaseColors defaults the name to the hex string; owners may rename it.
 */
function extractName(nft: AlchemyNft, hex: string): { name: string; isNamed: boolean } {
  const raw = (nft.name ?? nft.raw?.metadata?.name ?? '').trim();
  if (!raw) return { name: hex, isNamed: false };
  // Bare hex (with or without '#') → not a real name.
  if (/^#?[0-9a-f]{6}$/i.test(raw)) return { name: hex, isNamed: false };
  return { name: raw, isNamed: true };
}

function baseUrl() {
  if (!ALCHEMY_API_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local'
    );
  }
  return `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
}

async function fetchNfts(owner: string, contract: string): Promise<AlchemyNft[]> {
  const all: AlchemyNft[] = [];
  let pageKey: string | undefined;
  do {
    const url =
      `${baseUrl()}/getNFTsForOwner?owner=${owner}` +
      `&contractAddresses[]=${contract}` +
      `&withMetadata=true&pageSize=100` +
      (pageKey ? `&pageKey=${pageKey}` : '');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Alchemy error: ${res.status}`);
    const data = await res.json();
    all.push(...(data.ownedNfts ?? []));
    pageKey = data.pageKey;
  } while (pageKey);
  return all;
}

export async function getUserPunks(wallet: string): Promise<AlchemyNft[]> {
  return fetchNfts(wallet, COLOR_PUNKS_ADDRESS);
}

export async function getUserColors(wallet: string): Promise<UserColor[]> {
  const nfts = await fetchNfts(wallet, BASE_COLORS_ADDRESS);
  const byHex = new Map<string, UserColor>();

  for (const nft of nfts) {
    const hex = extractHex(nft);
    if (!hex) continue;
    const { name, isNamed } = extractName(nft, hex);

    const entry: UserColor = {
      tokenId: nft.tokenId,
      color: hex,
      name,
      isNamed,
      image: nft.image?.cachedUrl ?? nft.image?.originalUrl ?? null,
    };

    // Dedupe by hex, preferring the named one if we ever see both.
    const existing = byHex.get(hex);
    if (!existing || (entry.isNamed && !existing.isNamed)) {
      byHex.set(hex, entry);
    }
  }

  // Named colors first (alphabetical), then unnamed hex-only colors.
  return Array.from(byHex.values()).sort((a, b) => {
    if (a.isNamed !== b.isNamed) return a.isNamed ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Resolve ipfs:// URIs to an HTTP gateway so <img> / canvas can load them. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    const path = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${path}`;
  }
  return url;
}
