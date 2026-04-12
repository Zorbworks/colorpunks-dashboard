'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

/**
 * The original ColorPunks metadata lives at this IPFS base URI.
 * Each token's original metadata is at `{BASE_URI}/{tokenId}.json`.
 * We reset by writing this URI back via updateTokenURI, which is more
 * reliable than writing "" (which depends on the contract's baseURI
 * fallback behavior).
 */
const ORIGINAL_BASE_URI =
  'ipfs://QmaUtpnjauXT81DFABAmrhUkjLVZvKaAf7QTi5L63xinN6';

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
    // Write the original IPFS metadata URI directly rather than clearing
    // to "". This guarantees tokenURI(id) returns the original grey punk
    // regardless of how the contract handles empty-string overrides.
    const originalUri = `${ORIGINAL_BASE_URI}/${tokenId}.json`;
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
