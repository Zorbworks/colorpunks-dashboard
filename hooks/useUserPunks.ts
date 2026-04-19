'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import {
  getUserPunks as getOwnedPunksFromAlchemy,
  resolveImageUrl,
  type AlchemyNft,
} from '@/lib/alchemy';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';
import { retryOnce } from '@/lib/retry';

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
 * a colored version). Without a correction layer, users see their punks in
 * whatever state Alchemy first saw them — e.g. the grey original even
 * after coloring, or a stale pre-colored image bought on secondary.
 *
 * Two layers cooperate to stay correct without blocking first paint:
 *
 *   1. `useUserPunks` renders immediately from Alchemy + this local cache.
 *      Fast — no chain reads, no IPFS fetches on the critical path.
 *   2. On mount, a background refresh kicks off: one multicall for all
 *      tokenURIs, then concurrency-limited IPFS fetches (6 at a time).
 *      Each completed fetch is patched straight into React Query's cache
 *      via setQueryData, so the grid updates a thumbnail at a time. A
 *      module-level throttle ensures we only run a full refresh at most
 *      once every 5 minutes per wallet.
 *   3. Mutations (save / reset) call `refreshPunkImage(tokenId, client)`
 *      directly to force that one token through the refresh path
 *      immediately, bypassing the throttle.
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

/** Drop a single token's cached fresh image. */
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

const STALE_TIME_MS = 5 * 60 * 1000;

export function useUserPunks() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-punks', address],
    enabled: Boolean(address),
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address) return [];
      const owned = await getOwnedPunksFromAlchemy(address);
      return owned.map(applyCachedImage);
    },
  });

  // Fire the authoritative background refresh on mount (throttled).
  useEffect(() => {
    if (!address || !publicClient) return;
    void backgroundRefresh(address, publicClient, queryClient);
  }, [address, publicClient, queryClient]);

  return query;
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
    return await fetchAndCache(idStr, uri);
  } catch {
    return false;
  }
}

// ---------- Internal: bulk background refresh ----------

/** Per-address throttle so navigations within the same session don't
 *  trigger a fresh full refresh on every route change. */
const lastRefreshAt = new Map<string, number>();
const REFRESH_INTERVAL_MS = STALE_TIME_MS;
const IPFS_CONCURRENCY = 6;

async function backgroundRefresh(
  address: string,
  publicClient: PublicClient,
  queryClient: QueryClient
): Promise<void> {
  const key = address.toLowerCase();
  const last = lastRefreshAt.get(key) ?? 0;
  if (Date.now() - last < REFRESH_INTERVAL_MS) return;
  lastRefreshAt.set(key, Date.now());

  const owned = await getOwnedPunksFromAlchemy(address);
  if (!owned.length) return;

  // One multicall for every tokenURI (1 RPC call, allowFailure).
  const contracts = owned.map((nft) => ({
    address: COLOR_PUNKS_ADDRESS,
    abi: COLOR_PUNKS_ABI,
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

  const uris: Array<string | null> = results.map((r) =>
    r.status === 'success' ? (r.result as string) : null
  );

  // Concurrency-limited IPFS fetches. Each success patches React Query's
  // cache directly so the grid updates a thumbnail at a time.
  let cursor = 0;
  let anyUpdated = false;
  const workers = Array.from(
    { length: Math.min(IPFS_CONCURRENCY, owned.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= owned.length) return;
        const nft = owned[i];
        const uri = uris[i];
        if (!uri) continue;
        const updated = await fetchAndCache(nft.tokenId, uri);
        if (!updated) continue;
        anyUpdated = true;
        queryClient.setQueryData<AlchemyNft[]>(
          ['user-punks', address],
          (prev) =>
            prev
              ? prev.map((n) => (n.tokenId === nft.tokenId ? applyCachedImage(n) : n))
              : prev
        );
      }
    }
  );
  await Promise.all(workers);

  if (anyUpdated) persistCache();
}

/** Fetch metadata JSON at the given URI, write to cache on success. */
async function fetchAndCache(tokenId: string, uri: string): Promise<boolean> {
  const metaUrl = resolveImageUrl(uri);
  if (!metaUrl) return false;
  try {
    const res = await fetch(metaUrl, { cache: 'no-store' });
    if (!res.ok) return false;
    const meta = (await res.json()) as FreshMetadata;
    const freshImage = resolveImageUrl(meta.image ?? null);
    if (!freshImage) return false;
    freshImageCache.set(tokenId, {
      name: meta.name ?? null,
      description: meta.description ?? null,
      image: freshImage,
      attributes: meta.attributes,
    });
    // Individual save paths call persistCache themselves; bulk refresh
    // persists once at the end for efficiency.
    return true;
  } catch {
    return false;
  }
}
