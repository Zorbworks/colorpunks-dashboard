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

interface FreshMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
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
          if (!onchainUri) return nft;

          const metaUrl = resolveImageUrl(onchainUri);
          if (!metaUrl) return nft;

          try {
            const res = await fetch(metaUrl, { cache: 'no-store' });
            if (!res.ok) return nft;
            const meta = (await res.json()) as FreshMetadata;
            const freshImage = resolveImageUrl(meta.image ?? null);
            if (!freshImage) return nft;

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
            return nft;
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
    const results = await publicClient.multicall({
      contracts,
      allowFailure: true,
    });
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
