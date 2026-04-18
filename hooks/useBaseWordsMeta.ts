'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';
import { retryOnce } from '@/lib/retry';

export interface BaseWordMeta {
  wordCount: number;
  /** True if either text or background color has been customized. */
  isColored: boolean;
}

/**
 * Multicall `getTokenData` for every BaseWord tokenId we pass in, so we can
 * sort/filter client-side by word count and colored status without hitting
 * the RPC per-token.
 */
export function useBaseWordsMeta(tokenIds: string[]) {
  const publicClient = usePublicClient();
  const key = tokenIds.join(',');

  return useQuery({
    queryKey: ['baseword-meta', key],
    enabled: Boolean(publicClient) && tokenIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, BaseWordMeta>> => {
      if (!publicClient || tokenIds.length === 0) return new Map();
      return fetchMeta(publicClient, tokenIds);
    },
  });
}

async function fetchMeta(
  client: PublicClient,
  tokenIds: string[]
): Promise<Map<string, BaseWordMeta>> {
  const contracts = tokenIds.map((id) => ({
    address: BASEWORDS_ADDRESS,
    abi: BASEWORDS_ABI,
    functionName: 'getTokenData' as const,
    args: [BigInt(id)] as const,
  }));

  const results = await retryOnce(() =>
    client.multicall({ contracts, allowFailure: true })
  );
  const out = new Map<string, BaseWordMeta>();
  results.forEach((r, i) => {
    if (r.status !== 'success' || !r.result) return;
    const d = r.result as {
      wordCount: bigint;
      isTextColored: boolean;
      isBackgroundColored: boolean;
    };
    out.set(tokenIds[i], {
      wordCount: Number(d.wordCount),
      isColored: d.isTextColored || d.isBackgroundColored,
    });
  });
  return out;
}
