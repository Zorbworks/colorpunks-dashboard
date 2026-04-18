'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { type PublicClient } from 'viem';
import {
  getUserPunks as getOwnedPunksFromAlchemy,
  resolveImageUrl,
  type AlchemyNft,
} from '@/lib/alchemy';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

interface FreshMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

/**
 * Persisted per-token fresh-image cache.
 *
 * Alchemy's NFT API caches the metadata at first-index time and does NOT
 * re-index when a ColorPunks token's URI changes (i.e. when the owner saves
 * a colored version). So if we trusted Alchemy alone, a user who coloured
 * their punk yesterday would still see the grey original today.
 *
 * We used to solve this by multicalling `tokenURI` + fetching every punk's
 * metadata on every mount — fine for a 3-punk wallet, awful for 50 and a
 * notable CPU spike even on smaller ones. Now:
 *
 *   - On mount we only hit Alchemy (cheap, cached on their side).
 *   - If we've previously fetched a fresh image for a token we overlay it.
 *   - On SAVE / RESET the caller invokes `refreshPunkImage(tokenId)` which
 *     does the contract read + metadata fetch for that single token, then
 *     updates the cache.
 *
 * Net effect: 1 network request per page load instead of N+1, and the
 * coloured punk a user just saved is immediately visible after the tx.
 */
interface CacheEntry {
  name: string | null;
  description: string | null;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}
const CACHE_STORAGE_KEY = 'colorpunks:fresh-images:v1';
const freshImageCache: Map<string, CacheEntry> = loadCache();

function loadCache(): Map<string, CacheEntry> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function persistCache() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, CacheEntry> = {};
    for (const [k, v] of freshImageCache) obj[k] = v;
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* quota or disabled; ignore */
  }
}

/** Drop a single token's cached fresh image. Used after reset — makes the
 *  next render fall back to Alchemy's (original grey) cached image. */
export function invalidateFreshImage(tokenId: string | bigint) {
  freshImageCache.delete(String(tokenId));
  persistCache();
}

/** Overlay cached fresh data onto an Alchemy NFT if we have any. */
function applyCachedImage(nft: AlchemyNft): AlchemyNft {
  const cached = freshImageCache.get(nft.tokenId);
  if (!cached) return nft;
  return {
    ...nft,
    name: cached.name ?? nft.name,
    description: cached.description ?? nft.description,
    image: {
      cachedUrl: cached.image,
      originalUrl: cached.image,
    },
    raw: {
      metadata: {
        ...(nft.raw?.metadata ?? {}),
        name: cached.name ?? nft.raw?.metadata?.name,
        description: cached.description ?? nft.raw?.metadata?.description,
        image: cached.image,
        attributes: cached.attributes ?? nft.raw?.metadata?.attributes,
      },
    },
  };
}

/**
 * Load the user's ColorPunks from Alchemy, applying the per-token fresh-
 * image cache so a user sees their saved colours without an N-wide multicall
 * on every mount.
 */
export function useUserPunks() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['user-punks', address],
    enabled: Boolean(address),
    staleTime: 30_000,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address) return [];
      const owned = await getOwnedPunksFromAlchemy(address);
      return owned.map(applyCachedImage);
    },
  });
}

/**
 * Fetch a single token's current on-chain URI + metadata and write it into
 * the fresh-image cache. Call after a save so the UI immediately shows the
 * user's new colour (Alchemy's cached image will still be stale).
 */
export async function refreshPunkImage(
  tokenId: string | bigint,
  publicClient: PublicClient
): Promise<boolean> {
  const idStr = String(tokenId);
  try {
    const uri = (await publicClient.readContract({
      address: COLOR_PUNKS_ADDRESS,
      abi: COLOR_PUNKS_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })) as string;
    const metaUrl = resolveImageUrl(uri);
    if (!metaUrl) return false;
    const res = await fetch(metaUrl, { cache: 'no-store' });
    if (!res.ok) return false;
    const meta = (await res.json()) as FreshMetadata;
    const freshImage = resolveImageUrl(meta.image ?? null);
    if (!freshImage) return false;
    freshImageCache.set(idStr, {
      name: meta.name ?? null,
      description: meta.description ?? null,
      image: freshImage,
      attributes: meta.attributes,
    });
    persistCache();
    return true;
  } catch {
    return false;
  }
}
