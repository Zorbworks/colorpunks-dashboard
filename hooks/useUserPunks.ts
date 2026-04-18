'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
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
 * Persisted memo of the last successfully-fetched fresh image per token.
 * Backed by localStorage so a transient RPC/IPFS failure (or a full reload)
 * falls back to the last good colorful render instead of Alchemy's stale grey.
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

/** Drop a single token's cached fresh image so the next fetch is forced
 *  to re-read metadata. Call this after a reset / save so the stale
 *  pre-change image doesn't mask the update when the post-change fetch
 *  hits a transient failure. */
export function invalidateFreshImage(tokenId: string | bigint) {
  freshImageCache.delete(String(tokenId));
  persistCache();
}

/**
 * Load the user's ColorPunks with fresh on-chain metadata.
 *
 * Alchemy caches NFT metadata aggressively and does NOT automatically refresh
 * when a contract emits a URI-changed event, so `getNFTsForOwner` returns
 * whatever image Alchemy cached when the token was first indexed. For a
 * collection where users routinely overwrite their own tokenURI (ColorPunks),
 * that means most colored punks still look grey.
 *
 * The fix:
 *   1. Use Alchemy for the (fast) list of owned token IDs.
 *   2. Multicall `tokenURI(id)` on the ColorPunks contract to get the
 *      current, authoritative URI for each.
 *   3. Fetch each metadata JSON and use its `image` field.
 *
 * Falls back to whatever Alchemy gave us if any step fails for a given token.
 */
export function useUserPunks() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['user-punks', address],
    enabled: Boolean(address) && Boolean(publicClient),
    staleTime: 30_000,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address || !publicClient) return [];

      // 1. Alchemy gives us the ownership list cheaply.
      const owned = await getOwnedPunksFromAlchemy(address);
      if (!owned.length) return owned;

      // 2. Read the current tokenURI for every owned punk in a single multicall.
      const uris = await readAllTokenURIs(publicClient, owned);

      // 3. Resolve metadata JSON in parallel (swallow per-token failures).
      const withFresh = await Promise.all(
        owned.map(async (nft, i): Promise<AlchemyNft> => {
          const onchainUri = uris[i];
          const cached = freshImageCache.get(nft.tokenId);
          const applyCached = (): AlchemyNft =>
            cached
              ? {
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
                      description:
                        cached.description ?? nft.raw?.metadata?.description,
                      image: cached.image,
                      attributes:
                        cached.attributes ?? nft.raw?.metadata?.attributes,
                    },
                  },
                }
              : nft;

          if (!onchainUri) return applyCached();

          const metaUrl = resolveImageUrl(onchainUri);
          if (!metaUrl) return applyCached();

          try {
            const res = await fetch(metaUrl, { cache: 'no-store' });
            if (!res.ok) return applyCached();
            const meta = (await res.json()) as FreshMetadata;
            const freshImage = resolveImageUrl(meta.image ?? null);
            if (!freshImage) return applyCached();

            freshImageCache.set(nft.tokenId, {
              name: meta.name ?? null,
              description: meta.description ?? null,
              image: freshImage,
              attributes: meta.attributes,
            });
            persistCache();

            return {
              ...nft,
              name: meta.name ?? nft.name,
              description: meta.description ?? nft.description,
              image: {
                cachedUrl: freshImage,
                originalUrl: freshImage,
              },
              raw: {
                metadata: {
                  ...(nft.raw?.metadata ?? {}),
                  name: meta.name ?? nft.raw?.metadata?.name,
                  description:
                    meta.description ?? nft.raw?.metadata?.description,
                  image: meta.image ?? nft.raw?.metadata?.image,
                  attributes:
                    meta.attributes ?? nft.raw?.metadata?.attributes,
                },
              },
            };
          } catch {
            return applyCached();
          }
        })
      );

      return withFresh;
    },
  });
}

/**
 * Multicall all tokenURI reads for the owned punks. Falls back to sequential
 * single reads if the chain doesn't expose a multicall contract (it does on
 * Base mainnet, so this path is a safety net).
 */
async function readAllTokenURIs(
  publicClient: PublicClient,
  owned: AlchemyNft[]
): Promise<Array<string | null>> {
  const contracts = owned.map((nft) => ({
    address: COLOR_PUNKS_ADDRESS,
    abi: COLOR_PUNKS_ABI,
    functionName: 'tokenURI' as const,
    args: [BigInt(nft.tokenId)] as const,
  }));

  try {
    const results = await retryOnce(() =>
      publicClient.multicall({ contracts, allowFailure: true })
    );
    return results.map((r) =>
      r.status === 'success' ? (r.result as string) : null
    );
  } catch {
    // Fallback: sequential single reads.
    const out: Array<string | null> = [];
    for (const c of contracts) {
      try {
        const uri = (await publicClient.readContract(c)) as string;
        out.push(uri);
      } catch {
        out.push(null);
      }
    }
    return out;
  }
}
