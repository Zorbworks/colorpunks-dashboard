'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

/**
 * Calls `updateTokenURI(tokenId, "")` on the ColorPunks contract.
 *
 * The Thirdweb ERC721Base implementation stores per-token URI overrides.
 * Setting the override to an empty string clears it, causing `tokenURI()`
 * to fall back to `baseURI + tokenId` — which is the original uncolored
 * grey punk that was set at contract deploy time.
 */
export function useResetPunk() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset: resetState,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const resetPunk = (tokenId: bigint) => {
    writeContract({
      address: COLOR_PUNKS_ADDRESS,
      abi: COLOR_PUNKS_ABI,
      functionName: 'updateTokenURI',
      args: [tokenId, ''],
      chain: base,
    });
  };

  return {
    resetPunk,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ?? receiptError ?? null,
    resetState,
  };
}
