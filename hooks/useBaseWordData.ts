'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';

export interface BaseWordTokenData {
  word1: string;
  word2: string;
  word3: string;
  backgroundColor: string; // hex like "#RRGGBB" (or BaseColor name)
  textColor: string;
  isTextColored: boolean;
  isBackgroundColored: boolean;
  isInverted: boolean;
  wordCount: bigint;
  /** Non-empty words extracted in order. */
  words: string[];
}

/** Fetch full token data (words + colors + flags) for a BaseWord tokenId. */
export function useBaseWordData(tokenId: string | null) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['baseword-data', tokenId],
    enabled: Boolean(tokenId) && Boolean(publicClient),
    staleTime: 30_000,
    queryFn: async (): Promise<BaseWordTokenData | null> => {
      if (!tokenId || !publicClient) return null;
      const raw = (await publicClient.readContract({
        address: BASEWORDS_ADDRESS,
        abi: BASEWORDS_ABI,
        functionName: 'getTokenData',
        args: [BigInt(tokenId)],
      })) as {
        word1: string;
        word2: string;
        word3: string;
        backgroundColor: string;
        textColor: string;
        isTextColored: boolean;
        isBackgroundColored: boolean;
        isInverted: boolean;
        wordCount: bigint;
      };
      const words = [raw.word1, raw.word2, raw.word3].filter((w) => w.length > 0);
      return { ...raw, words };
    },
  });
}
