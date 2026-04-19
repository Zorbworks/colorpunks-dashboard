'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import { getUserBaseWords, type AlchemyNft } from '@/lib/alchemy';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';
import { retryOnce } from '@/lib/retry';

/**
 * Per-token fresh-image cache for BaseWords thumbnails.
 *
 * BaseWords renders its SVG fully on-chain but Alchemy's cached
 * `image.cachedUrl` is whatever the token looked like at first-index
 * time. When an owner updates colours (`updateWordColor` etc.) the
 * on-chain SVG changes immediately but Alchemy's CDN thumbnail doesn't.
 *
 * Same two-layer strategy as ColorPunks:
 *   1. `useUserBaseWords` renders instantly from Alchemy + this cache.
 *   2. On mount, a throttled background refresh multicalls tokenURI for
 *      every owned token (one RPC call), decodes the fully-on-chain
 *      metadata, and patches each fresh image into React Query's cache.
 *      BaseWords metadata is inlined in a data URI — no IPFS fetches
 *      required, so this is cheap compared to punks.
 *   3. Save / reset / invert call `setBaseWordImage` (optimistic) and
 *      `refreshBaseWordImage` (authoritative) directly for the mutated
 *      token so the thumbnail updates immediately without waiting for
 *      the throttle to expire.
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

/** Write a fresh image data URI straight into the cache. Used
 *  optimistically when the user triggers a color change — we already
 *  know the target colors and the word list so we can render the
 *  expected SVG client-side and skip waiting for the chain. */
export function setBaseWordImage(
  tokenId: string | bigint,
  image: string,
  name?: string | null
) {
  freshImageCache.set(String(tokenId), { image, name: name ?? null });
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

const STALE_TIME_MS = 5 * 60 * 1000;

export function useUserBaseWords() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-basewords', address],
    enabled: Boolean(address),
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address) return [];
      const owned = await getUserBaseWords(address);
      return owned.map(applyCachedImage);
    },
  });

  // Authoritative background refresh (throttled, progressive).
  useEffect(() => {
    if (!address || !publicClient) return;
    void backgroundRefresh(address, publicClient, queryClient);
  }, [address, publicClient, queryClient]);

  return query;
}

interface BaseWordMeta {
  name?: string;
  image?: string;
}

/**
 * Fetch a single token's on-chain tokenURI, pull the image data-URI out of
 * the decoded metadata, and cache it. Used from the save/reset/invert
 * flow in BaseWordEditor after the tx confirms.
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
    return decodeAndCache(idStr, uri);
  } catch {
    return false;
  }
}

// ---------- Internal: bulk background refresh ----------

const lastRefreshAt = new Map<string, number>();
const REFRESH_INTERVAL_MS = STALE_TIME_MS;

async function backgroundRefresh(
  address: string,
  publicClient: PublicClient,
  queryClient: QueryClient
): Promise<void> {
  const key = address.toLowerCase();
  const last = lastRefreshAt.get(key) ?? 0;
  if (Date.now() - last < REFRESH_INTERVAL_MS) return;
  lastRefreshAt.set(key, Date.now());

  const owned = await getUserBaseWords(address);
  if (!owned.length) return;

  const contracts = owned.map((nft) => ({
    address: BASEWORDS_ADDRESS,
    abi: BASEWORDS_ABI,
    functionName: 'tokenURI' as const,
    args: [BigInt(nft.tokenId)] as const,
  }));

  let results;
  try {
    results = await retryOnce(() =>
      publicClient.multicall({ contracts, allowFailure: true })
    );
  } catch {
    return;
  }

  let anyUpdated = false;
  for (let i = 0; i < owned.length; i++) {
    const r = results[i];
    if (r.status !== 'success' || !r.result) continue;
    const nft = owned[i];
    if (!decodeAndCache(nft.tokenId, r.result as string)) continue;
    anyUpdated = true;
    queryClient.setQueryData<AlchemyNft[]>(
      ['user-basewords', address],
      (prev) =>
        prev
          ? prev.map((n) => (n.tokenId === nft.tokenId ? applyCachedImage(n) : n))
          : prev
    );
  }

  if (anyUpdated) persistCache();
}

/** Decode a BaseWords data URI tokenURI and write it to the cache. */
function decodeAndCache(tokenId: string, uri: string): boolean {
  let json: string | null = null;
  if (uri.startsWith('data:application/json;base64,')) {
    try {
      json = atob(uri.replace('data:application/json;base64,', ''));
    } catch {
      return false;
    }
  } else if (uri.startsWith('data:application/json,')) {
    try {
      json = decodeURIComponent(uri.replace('data:application/json,', ''));
    } catch {
      return false;
    }
  }
  if (!json) return false;

  let meta: BaseWordMeta;
  try {
    meta = JSON.parse(json) as BaseWordMeta;
  } catch {
    return false;
  }
  if (!meta.image) return false;

  freshImageCache.set(tokenId, {
    image: meta.image,
    name: meta.name ?? null,
  });
  return true;
}
