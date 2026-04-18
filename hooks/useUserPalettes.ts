'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import { PALETTES_ABI, PALETTES_ADDRESS } from '@/lib/contracts';
import { retryOnce } from '@/lib/retry';

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

/** Persisted memo of the last successful palette list per owner so a
 * transient RPC failure doesn't wipe the rail with "NO PALETTES FOUND".
 * Backed by localStorage — survives reloads and dev-server restarts. */
const PALETTES_STORAGE_KEY = 'colorpunks:palettes:v1';
const palettesCache: Map<string, UserPalette[]> = loadPalettesCache();

function loadPalettesCache(): Map<string, UserPalette[]> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(PALETTES_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, UserPalette[]>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function persistPalettesCache() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, UserPalette[]> = {};
    for (const [k, v] of palettesCache) obj[k] = v;
    window.localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* quota or disabled; ignore */
  }
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
      try {
        const fresh = await loadPalettes(publicClient, address);
        if (fresh.length > 0) {
          palettesCache.set(address, fresh);
          persistPalettesCache();
        } else if (palettesCache.has(address)) {
          // Empty result after a prior success is almost always a transient
          // RPC failure — fall back to the last known good list.
          return palettesCache.get(address)!;
        }
        return fresh;
      } catch (err) {
        const prior = palettesCache.get(address);
        if (prior) return prior;
        throw err;
      }
    },
  });
}

async function loadPalettes(
  client: PublicClient,
  owner: string
): Promise<UserPalette[]> {
  // 1. Get balance.
  const balance = (await retryOnce(() =>
    client.readContract({
      address: PALETTES_ADDRESS,
      abi: PALETTES_ABI,
      functionName: 'balanceOf',
      args: [owner as `0x${string}`],
    })
  )) as bigint;

  if (balance === 0n) return [];

  // 2. Get all token IDs via tokenOfOwnerByIndex.
  const indexCalls = Array.from({ length: Number(balance) }, (_, i) => ({
    address: PALETTES_ADDRESS,
    abi: PALETTES_ABI,
    functionName: 'tokenOfOwnerByIndex' as const,
    args: [owner as `0x${string}`, BigInt(i)] as const,
  }));

  const idResults = await retryOnce(() =>
    client.multicall({ contracts: indexCalls, allowFailure: true })
  );

  const tokenIds = idResults
    .filter((r) => r.status === 'success')
    .map((r) => r.result as bigint);

  if (tokenIds.length === 0) return [];

  // 3. Consolidated multicall — 5× tokenColors + 1× tokenURI per palette.
  //    One RPC round trip instead of two, which halves the chance of a
  //    transient rate-limit stranding us with partial data.
  const perPalette = 6; // 5 color reads + 1 URI read
  const combinedCalls = tokenIds.flatMap((id) => [
    ...Array.from({ length: 5 }, (_, i) => ({
      address: PALETTES_ADDRESS,
      abi: PALETTES_ABI,
      functionName: 'tokenColors' as const,
      args: [id, BigInt(i)] as const,
    })),
    {
      address: PALETTES_ADDRESS,
      abi: PALETTES_ABI,
      functionName: 'tokenURI' as const,
      args: [id] as const,
    },
  ]);

  const combinedResults = await retryOnce(() =>
    client.multicall({ contracts: combinedCalls, allowFailure: true })
  );

  // 5. Assemble palette objects.
  const palettes: UserPalette[] = [];

  for (let p = 0; p < tokenIds.length; p++) {
    const tokenId = tokenIds[p].toString();

    // Extract hex colors (indices 0-4, skip failures = fewer colors).
    const base = p * perPalette;
    const hexColors: string[] = [];
    for (let c = 0; c < 5; c++) {
      const result = combinedResults[base + c];
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

    const uriResult = combinedResults[base + 5];
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
