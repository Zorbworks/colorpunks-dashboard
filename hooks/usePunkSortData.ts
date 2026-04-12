'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem, type PublicClient } from 'viem';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

export interface PunkSortData {
  /** tokenId → block number when last transferred to the current owner. */
  lastReceivedBlock: Map<string, bigint>;
  /** tokenId → block number when tokenURI was last updated. */
  lastColoredBlock: Map<string, bigint>;
}

/**
 * Queries Transfer and TokenURIUpdated events from the ColorPunks
 * contract to build sort-data maps. Runs once per wallet and caches
 * the result. Queries from genesis — the contract has a manageable
 * number of events.
 */
export function usePunkSortData() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['punk-sort-data', address],
    enabled: Boolean(address) && Boolean(publicClient),
    staleTime: 60_000,
    queryFn: async (): Promise<PunkSortData> => {
      if (!address || !publicClient) {
        return { lastReceivedBlock: new Map(), lastColoredBlock: new Map() };
      }
      return loadSortData(publicClient, address as `0x${string}`);
    },
  });
}

async function loadSortData(
  client: PublicClient,
  owner: `0x${string}`
): Promise<PunkSortData> {
  const lastReceivedBlock = new Map<string, bigint>();
  const lastColoredBlock = new Map<string, bigint>();

  // Query both event types in parallel.
  const [transferLogs, coloredLogs] = await Promise.all([
    // Transfer events TO this owner.
    client.getLogs({
      address: COLOR_PUNKS_ADDRESS,
      event: parseAbiItem(
        'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
      ),
      args: { to: owner },
      fromBlock: 0n,
      toBlock: 'latest',
    }).catch(() => []),

    // All TokenURIUpdated events on the contract.
    client.getLogs({
      address: COLOR_PUNKS_ADDRESS,
      event: parseAbiItem(
        'event TokenURIUpdated(uint256 indexed tokenId, string uri, address indexed user)'
      ),
      fromBlock: 0n,
      toBlock: 'latest',
    }).catch(() => []),
  ]);

  // For each token, keep the LATEST (highest block) Transfer to this owner.
  for (const log of transferLogs) {
    const tokenId = (log.args.tokenId ?? 0n).toString();
    const block = log.blockNumber ?? 0n;
    const existing = lastReceivedBlock.get(tokenId);
    if (!existing || block > existing) {
      lastReceivedBlock.set(tokenId, block);
    }
  }

  // For each token, keep the LATEST TokenURIUpdated event.
  for (const log of coloredLogs) {
    const tokenId = (log.args.tokenId ?? 0n).toString();
    const block = log.blockNumber ?? 0n;
    const existing = lastColoredBlock.get(tokenId);
    if (!existing || block > existing) {
      lastColoredBlock.set(tokenId, block);
    }
  }

  return { lastReceivedBlock, lastColoredBlock };
}
