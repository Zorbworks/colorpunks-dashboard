'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

/**
 * The original black-and-white ColorPunks metadata lives at this IPFS CID.
 * Each token's original metadata is at `{BASE}/{tokenId}` (no .json extension).
 * This is the same CID used by the original colorpunks.com reset function.
 * Source: https://github.com/mykcryptodev/punk-coloring-book/blob/main/src/components/ResetToOriginal.tsx
 */
const ORIGINAL_BASE_URI =
  'ipfs://QmZzBSaDAEwJhSUkhrcfVmZmbD1GwVLHd4GGoGGTWJWmSQ';

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
    const originalUri = `${ORIGINAL_BASE_URI}/${tokenId}`;
    writeContract({
      address: COLOR_PUNKS_ADDRESS,
      abi: COLOR_PUNKS_ABI,
      functionName: 'updateTokenURI',
      args: [tokenId, originalUri],
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
