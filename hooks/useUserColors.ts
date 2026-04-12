'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import {
  getUserColors as getColorsFromAlchemy,
  resolveImageUrl,
  type UserColor,
  type AlchemyNft,
} from '@/lib/alchemy';
import { BASE_COLORS_ABI, BASE_COLORS_ADDRESS } from '@/lib/contracts';

/**
 * Same stale-cache problem as punks: Alchemy indexes BaseColors metadata
 * once and never re-fetches it, so colors that were renamed on
 * basecolors.com still return the raw hex as their name.
 *
 * Fix: use Alchemy for the ownership list (which token IDs the wallet
 * owns), then multicall tokenURI on the BaseColors contract for each,
 * fetch the on-chain metadata JSON, and extract the real name from there.
 */
export function useUserColors() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['user-colors', address],
    enabled: Boolean(address) && Boolean(publicClient),
    staleTime: 60_000,
    queryFn: async (): Promise<UserColor[]> => {
      if (!address || !publicClient) return [];

      // 1. Alchemy gives us the ownership list.
      const alchemyColors = await getColorsFromAlchemy(address);
      if (!alchemyColors.length) return alchemyColors;

      // 2. Read tokenURI for every owned BaseColor via multicall.
      const freshMeta = await readFreshBaseColorsMeta(
        publicClient,
        alchemyColors
      );

      // 3. Merge fresh on-chain names into the UserColor objects.
      //
      // BaseColors metadata structure:
      //   { "name": "#00FF00",                          ← always the hex
      //     "attributes": [{ "trait_type": "Color Name",
      //                      "value": "Lime" }] }       ← custom name here
      //
      // The custom name lives in the "Color Name" attribute, NOT in the
      // top-level `name` field (which is always just the hex).
      return alchemyColors.map((c, i) => {
        const meta = freshMeta[i];
        if (!meta) return c;

        // Look for a "Color Name" attribute — this is where basecolors.com
        // stores the user-set name.
        const colorNameAttr = (meta.attributes ?? []).find(
          (a) => a.trait_type === 'Color Name'
        );
        const customName = colorNameAttr?.value?.trim() ?? '';
        const isNamed = Boolean(customName);

        return {
          ...c,
          name: isNamed ? customName : c.color,
          isNamed,
          image: resolveImageUrl(meta.image) ?? c.image,
        };
      });
    },
  });
}

interface BaseColorMeta {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

/**
 * Multicall tokenURI for every BaseColor the user owns, then fetch each
 * metadata JSON. Returns an array parallel to `colors` — null entries mean
 * "couldn't fetch, fall back to Alchemy".
 */
async function readFreshBaseColorsMeta(
  publicClient: PublicClient,
  colors: UserColor[]
): Promise<Array<BaseColorMeta | null>> {
  // Multicall tokenURI reads.
  const contracts = colors.map((c) => ({
    address: BASE_COLORS_ADDRESS,
    abi: BASE_COLORS_ABI,
    functionName: 'tokenURI' as const,
    args: [BigInt(c.tokenId)] as const,
  }));

  let uris: Array<string | null>;
  try {
    const results = await publicClient.multicall({
      contracts,
      allowFailure: true,
    });
    uris = results.map((r) =>
      r.status === 'success' ? (r.result as string) : null
    );
  } catch {
    // If multicall fails entirely, fall back to sequential.
    uris = [];
    for (const c of contracts) {
      try {
        uris.push((await publicClient.readContract(c)) as string);
      } catch {
        uris.push(null);
      }
    }
  }

  // Fetch metadata JSON for each URI in parallel.
  const metadatas = await Promise.allSettled(
    uris.map(async (uri): Promise<BaseColorMeta | null> => {
      if (!uri) return null;

      // BaseColors may return a data URI (base64 JSON) or an ipfs:// URL.
      let metaJson: string;
      if (uri.startsWith('data:application/json;base64,')) {
        metaJson = atob(uri.replace('data:application/json;base64,', ''));
      } else if (uri.startsWith('data:application/json,')) {
        metaJson = decodeURIComponent(
          uri.replace('data:application/json,', '')
        );
      } else {
        const metaUrl = resolveImageUrl(uri);
        if (!metaUrl) return null;
        const res = await fetch(metaUrl, { cache: 'no-store' });
        if (!res.ok) return null;
        metaJson = await res.text();
      }

      try {
        return JSON.parse(metaJson) as BaseColorMeta;
      } catch {
        return null;
      }
    })
  );

  return metadatas.map((r) =>
    r.status === 'fulfilled' ? r.value : null
  );
}
