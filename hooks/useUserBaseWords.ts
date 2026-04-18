'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { getUserBaseWords, type AlchemyNft } from '@/lib/alchemy';

/**
 * Load the user's BaseWords tokens. The contract renders tokenURI fully
 * onchain from the immutable words stored at mint, so Alchemy's cached
 * metadata is authoritative — no extra tokenURI refresh needed.
 */
export function useUserBaseWords() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['user-basewords', address],
    enabled: Boolean(address),
    staleTime: 30_000,
    queryFn: async (): Promise<AlchemyNft[]> => {
      if (!address) return [];
      return getUserBaseWords(address);
    },
  });
}
