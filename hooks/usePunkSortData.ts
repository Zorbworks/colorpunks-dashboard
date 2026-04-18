'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

export interface PunkSortData {
  /** tokenId → block number when last transferred to the current owner. */
  lastReceivedBlock: Map<string, bigint>;
  /** Kept for the existing SortMaps shape — not populated anymore; the
   *  "colored" sort now uses isColored(punk) directly (no events needed). */
  lastColoredBlock: Map<string, bigint>;
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

/**
 * Builds a tokenId → last-received-block map for the connected wallet's
 * ColorPunks, using Alchemy's `alchemy_getAssetTransfers`. That endpoint
 * has no 10-block range cap (unlike free-tier `eth_getLogs`), so it works
 * on the Alchemy Free tier.
 */
export function usePunkSortData() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['punk-sort-data', address],
    enabled: Boolean(address) && Boolean(ALCHEMY_API_KEY),
    staleTime: 60_000,
    queryFn: async (): Promise<PunkSortData> => {
      if (!address || !ALCHEMY_API_KEY) {
        return { lastReceivedBlock: new Map(), lastColoredBlock: new Map() };
      }
      return loadReceivedByOwner(address);
    },
  });
}

interface AssetTransfer {
  blockNum: string; // hex string
  tokenId?: string; // hex string
  category: string;
}

async function loadReceivedByOwner(
  owner: string
): Promise<PunkSortData> {
  const lastReceivedBlock = new Map<string, bigint>();
  const url = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

  // Paginate through all ERC-721 transfers of the ColorPunks contract TO the owner.
  let pageKey: string | undefined;
  do {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [
        {
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: owner,
          contractAddresses: [COLOR_PUNKS_ADDRESS],
          category: ['erc721'],
          order: 'asc',
          maxCount: '0x3e8', // 1000 per page (max)
          withMetadata: false,
          ...(pageKey ? { pageKey } : {}),
        },
      ],
    };

    let data: { result?: { transfers: AssetTransfer[]; pageKey?: string } };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }

    const transfers = data.result?.transfers ?? [];
    for (const t of transfers) {
      if (!t.tokenId) continue;
      // tokenId from the API is a hex string like "0x1a".
      const tokenIdDec = BigInt(t.tokenId).toString();
      const block = BigInt(t.blockNum);
      const existing = lastReceivedBlock.get(tokenIdDec);
      if (!existing || block > existing) {
        lastReceivedBlock.set(tokenIdDec, block);
      }
    }

    pageKey = data.result?.pageKey;
  } while (pageKey);

  return { lastReceivedBlock, lastColoredBlock: new Map() };
}
