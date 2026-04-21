'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { type PublicClient } from 'viem';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';
import { retryOnce } from '@/lib/retry';

export interface RecentBaseWordItem {
  tokenId: string;
  user: string;
  /** ENS name if resolvable, otherwise truncated address. */
  displayName: string;
  imageUrl: string | null;
  timestamp: number;
  txHash: string;
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface AssetTransfer {
  blockNum: string;
  tokenId?: string;
  hash: string;
  to: string;
  metadata?: { blockTimestamp?: string };
}

/**
 * Fetch the most recent BaseWord mints (ERC-721 transfers from the zero
 * address) via Alchemy's asset-transfers API — no 10-block getLogs cap,
 * so this works on the free tier. Then multicall tokenURI on each to
 * decode the on-chain SVG data URI.
 */
export function useRecentBaseWords(enabled: boolean, limit = 24) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['recent-basewords', limit],
    enabled: enabled && Boolean(publicClient) && Boolean(ALCHEMY_API_KEY),
    staleTime: 30_000,
    queryFn: async (): Promise<RecentBaseWordItem[]> => {
      if (!publicClient || !ALCHEMY_API_KEY) return [];
      return loadRecent(publicClient, limit);
    },
  });
}

async function loadRecent(
  publicClient: PublicClient,
  limit: number
): Promise<RecentBaseWordItem[]> {
  const url = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'alchemy_getAssetTransfers',
    params: [
      {
        fromBlock: '0x0',
        toBlock: 'latest',
        fromAddress: ZERO_ADDRESS,
        contractAddresses: [BASEWORDS_ADDRESS],
        category: ['erc721'],
        order: 'desc',
        maxCount: `0x${limit.toString(16)}`,
        withMetadata: true,
      },
    ],
  };

  let transfers: AssetTransfer[] = [];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      result?: { transfers?: AssetTransfer[] };
    };
    transfers = data.result?.transfers ?? [];
  } catch {
    return [];
  }

  if (transfers.length === 0) return [];

  // Multicall tokenURI for every recent mint — one RPC call.
  const contracts = transfers.map((t) => ({
    address: BASEWORDS_ADDRESS,
    abi: BASEWORDS_ABI,
    functionName: 'tokenURI' as const,
    args: [BigInt(t.tokenId ?? '0x0')] as const,
  }));

  let uriResults;
  try {
    uriResults = await retryOnce(() =>
      publicClient.multicall({ contracts, allowFailure: true })
    );
  } catch {
    return [];
  }

  const items: RecentBaseWordItem[] = transfers.map((t, i) => {
    const tokenId = BigInt(t.tokenId ?? '0x0').toString();
    const user = t.to;
    const uriRes = uriResults[i];
    let imageUrl: string | null = null;
    if (uriRes.status === 'success' && uriRes.result) {
      imageUrl = extractImageFromDataUri(uriRes.result as string);
    }
    return {
      tokenId,
      user,
      displayName: truncateAddress(user),
      imageUrl,
      timestamp: t.metadata?.blockTimestamp
        ? Math.floor(new Date(t.metadata.blockTimestamp).getTime() / 1000)
        : 0,
      txHash: t.hash,
    };
  });

  // Best-effort ENS resolution.
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
        } catch {
          /* skip */
        }
      })
    );
    for (const item of items) {
      const ens = ensMap.get(item.user.toLowerCase());
      if (ens) item.displayName = ens;
    }
  } catch {
    /* keep truncated addresses */
  }

  return items;
}

/** Pull the image data URI out of a BaseWord tokenURI (either base64 JSON
 *  or URI-encoded JSON payload). */
function extractImageFromDataUri(uri: string): string | null {
  try {
    let json: string | null = null;
    if (uri.startsWith('data:application/json;base64,')) {
      json = atob(uri.replace('data:application/json;base64,', ''));
    } else if (uri.startsWith('data:application/json,')) {
      json = decodeURIComponent(uri.replace('data:application/json,', ''));
    }
    if (!json) return null;
    const meta = JSON.parse(json) as { image?: string };
    return meta.image ?? null;
  } catch {
    return null;
  }
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
