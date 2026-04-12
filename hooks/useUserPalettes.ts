'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import { PALETTES_ABI, PALETTES_ADDRESS } from '@/lib/contracts';

export interface PaletteColor {
  hex: string;
  name: string;
  isNamed: boolean;
}

export interface UserPalette {
  tokenId: string;
  colors: PaletteColor[];
  image: string | null;
}

/**
 * Fetches all Palettes NFTs owned by the connected wallet.
 * Uses ERC721Enumerable to get token IDs, then reads colors
 * directly from the on-chain `tokenColors` mapping + parses
 * tokenURI for color names.
 */
export function useUserPalettes() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['user-palettes', address],
    enabled: Boolean(address) && Boolean(publicClient),
    staleTime: 60_000,
    queryFn: async (): Promise<UserPalette[]> => {
      if (!address || !publicClient) return [];
      return loadPalettes(publicClient, address);
    },
  });
}

async function loadPalettes(
  client: PublicClient,
  owner: string
): Promise<UserPalette[]> {
  // 1. Get balance.
  const balance = (await client.readContract({
    address: PALETTES_ADDRESS,
    abi: PALETTES_ABI,
    functionName: 'balanceOf',
    args: [owner as `0x${string}`],
  })) as bigint;

  if (balance === 0n) return [];

  // 2. Get all token IDs via tokenOfOwnerByIndex.
  const indexCalls = Array.from({ length: Number(balance) }, (_, i) => ({
    address: PALETTES_ADDRESS,
    abi: PALETTES_ABI,
    functionName: 'tokenOfOwnerByIndex' as const,
    args: [owner as `0x${string}`, BigInt(i)] as const,
  }));

  const idResults = await client.multicall({
    contracts: indexCalls,
    allowFailure: true,
  });

  const tokenIds = idResults
    .filter((r) => r.status === 'success')
    .map((r) => r.result as bigint);

  if (tokenIds.length === 0) return [];

  // 3. For each palette, read tokenColors(id, 0..4) — 5 reads per palette.
  const colorCalls = tokenIds.flatMap((id) =>
    Array.from({ length: 5 }, (_, i) => ({
      address: PALETTES_ADDRESS,
      abi: PALETTES_ABI,
      functionName: 'tokenColors' as const,
      args: [id, BigInt(i)] as const,
    }))
  );

  const colorResults = await client.multicall({
    contracts: colorCalls,
    allowFailure: true,
  });

  // 4. Also read tokenURI for each palette (for names + image).
  const uriCalls = tokenIds.map((id) => ({
    address: PALETTES_ADDRESS,
    abi: PALETTES_ABI,
    functionName: 'tokenURI' as const,
    args: [id] as const,
  }));

  const uriResults = await client.multicall({
    contracts: uriCalls,
    allowFailure: true,
  });

  // 5. Assemble palette objects.
  const palettes: UserPalette[] = [];

  for (let p = 0; p < tokenIds.length; p++) {
    const tokenId = tokenIds[p].toString();

    // Extract hex colors (indices 0-4, skip failures = fewer colors).
    const hexColors: string[] = [];
    for (let c = 0; c < 5; c++) {
      const result = colorResults[p * 5 + c];
      if (result.status === 'success' && result.result) {
        const hex = (result.result as string).trim();
        if (hex && /^#[0-9a-f]{6}$/i.test(hex)) {
          hexColors.push(hex.toUpperCase());
        }
      }
    }

    if (hexColors.length === 0) continue;

    // Parse tokenURI for color names + image.
    let colorNames: Map<number, string> = new Map();
    let image: string | null = null;

    const uriResult = uriResults[p];
    if (uriResult.status === 'success' && uriResult.result) {
      try {
        const uri = uriResult.result as string;
        let json: string;
        if (uri.startsWith('data:application/json;base64,')) {
          json = atob(uri.replace('data:application/json;base64,', ''));
        } else if (uri.startsWith('data:application/json,')) {
          json = decodeURIComponent(uri.replace('data:application/json,', ''));
        } else {
          json = '';
        }
        if (json) {
          const meta = JSON.parse(json) as {
            image?: string;
            attributes?: Array<{ trait_type: string; value: string }>;
          };
          image = meta.image ?? null;

          // Attributes are "Color 1", "Color 2", etc.
          for (const attr of meta.attributes ?? []) {
            const match = /^Color (\d+)$/i.exec(attr.trait_type);
            if (match) {
              const idx = parseInt(match[1], 10) - 1;
              // Only use the name if it's not just a hex code.
              if (!/^#?[0-9a-f]{6}$/i.test(attr.value)) {
                colorNames.set(idx, attr.value);
              }
            }
          }
        }
      } catch {
        /* swallow parse errors */
      }
    }

    const colors: PaletteColor[] = hexColors.map((hex, i) => {
      const name = colorNames.get(i);
      return {
        hex,
        name: name ?? hex,
        isNamed: Boolean(name),
      };
    });

    palettes.push({ tokenId, colors, image });
  }

  return palettes;
}
