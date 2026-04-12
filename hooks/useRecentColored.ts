'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAbiItem, type PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';
import { resolveImageUrl } from '@/lib/alchemy';

export interface RecentColoredItem {
  tokenId: string;
  user: string;
  /** ENS name if resolvable, otherwise truncated address. */
  displayName: string;
  imageUrl: string | null;
  timestamp: number;
  txHash: string;
}

const EVENT = parseAbiItem(
  'event TokenURIUpdated(uint256 indexed tokenId, string uri, address indexed user)'
);

/**
 * Queries the most recent TokenURIUpdated events from the ColorPunks contract
 * and resolves their metadata images. Intentionally bounded to the last
 * ~60k blocks (~1 day on Base with 2s blocks) to keep RPC cost sane.
 *
 * For a production app with a real collection you'd index this via Ponder /
 * The Graph / a small serverless worker — but for the launch MVP this works.
 */
export function useRecentColored(enabled: boolean, limit = 24) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['recent-colored', limit],
    enabled: enabled && Boolean(publicClient),
    staleTime: 30_000,
    queryFn: async (): Promise<RecentColoredItem[]> => {
      if (!publicClient) return [];
      return loadRecent(publicClient, limit);
    },
  });
}

async function loadRecent(
  publicClient: PublicClient,
  limit: number
): Promise<RecentColoredItem[]> {
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > 60_000n ? latest - 60_000n : 0n;

  const logs = await publicClient.getLogs({
    address: COLOR_PUNKS_ADDRESS,
    event: EVENT,
    fromBlock,
    toBlock: latest,
  });

  // Most recent first.
  const sorted = logs
    .slice()
    .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
    .slice(0, limit);

  const blockNumbers = Array.from(
    new Set(sorted.map((l) => l.blockNumber).filter(Boolean) as bigint[])
  );
  const blocks = await Promise.all(
    blockNumbers.map((n) => publicClient.getBlock({ blockNumber: n }))
  );
  const blockTimes = new Map<bigint, number>(
    blocks.map((b) => [b.number!, Number(b.timestamp)])
  );

  const items = await Promise.all(
    sorted.map(async (log): Promise<RecentColoredItem> => {
      const tokenId = (log.args.tokenId ?? 0n).toString();
      const uri = (log.args.uri ?? '') as string;
      const user = (log.args.user ?? '0x0') as string;

      let imageUrl: string | null = null;
      try {
        const metaUrl = resolveImageUrl(uri);
        if (metaUrl) {
          const res = await fetch(metaUrl);
          if (res.ok) {
            const meta = (await res.json()) as { image?: string };
            imageUrl = resolveImageUrl(meta.image);
          }
        }
      } catch {
        /* swallow — just show a blank tile */
      }

      return {
        tokenId,
        user,
        displayName: truncateAddress(user),
        imageUrl,
        timestamp: blockTimes.get(log.blockNumber ?? 0n) ?? 0,
        txHash: log.transactionHash ?? '',
      };
    })
  );

  // Try to resolve ENS names via a free API. Best-effort — falls back
  // to truncated address if the lookup fails.
  try {
    const uniqueAddrs = Array.from(new Set(items.map((i) => i.user)));
    const ensMap = new Map<string, string>();
    await Promise.allSettled(
      uniqueAddrs.map(async (addr) => {
        try {
          const res = await fetch(
            `https://api.ensideas.com/ens/resolve/${addr}`
          );
          if (res.ok) {
            const data = (await res.json()) as { name?: string };
            if (data.name) ensMap.set(addr.toLowerCase(), data.name);
          }
        } catch { /* skip */ }
      })
    );
    for (const item of items) {
      const ens = ensMap.get(item.user.toLowerCase());
      if (ens) item.displayName = ens;
    }
  } catch { /* keep truncated addresses */ }

  return items;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
