'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { type PublicClient } from 'viem';
import { getUserBaseWords, type AlchemyNft } from '@/lib/alchemy';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';

/**
 * Per-token fresh-image cache for BaseWords thumbnails.
 *
 * BaseWords renders its SVG fully onchain but Alchemy still caches the
 * metadata it saw at first-index time. When an owner updates colors via
 * updateWordColor / updateAllColors, the on-chain SVG changes but
 * Alchemy's cached `image.cachedUrl` doesn't — so the left-rail thumbnail
 * would stay at the old colors until Alchemy eventually re-indexes.
 *
 * We mirror the ColorPunks fix: after a color save, the editor calls
 * refreshBaseWordImage(tokenId) which reads tokenURI on-chain, extracts
 * the fresh image data URI from the JSON, and caches it. useUserBaseWords
 * overlays this cache on Alchemy's list so the thumbnail updates
 * immediately.
 */
interface CacheEntry {
  image: string;
  name: string | null;
}
const CACHE_STORAGE_KEY = 'basewords:fresh-images:v1';
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

/** Drop a single token's cached image so the next render falls back to
 *  Alchemy's cached image — useful if the owner resets colors. */
export function invalidateBaseWordImage(tokenId: string | bigint) {
  freshImageCache.delete(String(tokenId));
  persistCache();
}

function applyCachedImage(nft: AlchemyNft): AlchemyNft {
  const cached = freshImageCache.get(nft.tokenId);
  if (!cached) return nft;
  return {
    ...nft,
    name: cached.name ?? nft.name,
    image: {
      cachedUrl: cached.image,
      originalUrl: cached.image,
    },
    raw: {
      metadata: {
        ...(nft.raw?.metadata ?? {}),
        image: cached.image,
      },
    },
  };
}

/** Load the user's BaseWords tokens, applying the fresh-image cache
 *  overlay so post-save color updates show up in the left-rail thumbnails. */
export function useUserBaseWords() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['user-basewords', address],
    enabled: Boolean(address),
    staleTime: 30_000,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address) return [];
      const owned = await getUserBaseWords(address);
      return owned.map(applyCachedImage);
    },
  });
}

interface BaseWordMeta {
  name?: string;
  image?: string;
}

/**
 * Fetch a single token's on-chain tokenURI, pull the image data-URI out of
 * the decoded metadata, and cache it. Call after a save so the thumbnail
 * shows the new colors even though Alchemy's cache is still stale.
 */
export async function refreshBaseWordImage(
  tokenId: string | bigint,
  publicClient: PublicClient
): Promise<boolean> {
  const idStr = String(tokenId);
  try {
    const uri = (await publicClient.readContract({
      address: BASEWORDS_ADDRESS,
      abi: BASEWORDS_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })) as string;

    // BaseWords tokenURI is a fully on-chain data URI — either base64 JSON
    // or URI-encoded JSON. Decode it and pull out the `image` field.
    let json: string | null = null;
    if (uri.startsWith('data:application/json;base64,')) {
      json = atob(uri.replace('data:application/json;base64,', ''));
    } else if (uri.startsWith('data:application/json,')) {
      json = decodeURIComponent(uri.replace('data:application/json,', ''));
    }
    if (!json) return false;

    const meta = JSON.parse(json) as BaseWordMeta;
    if (!meta.image) return false;

    freshImageCache.set(idStr, {
      image: meta.image,
      name: meta.name ?? null,
    });
    persistCache();
    return true;
  } catch {
    return false;
  }
}
