'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { COLOR_PUNKS_ABI, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

export function useSavePunk() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const savePunk = (tokenId: bigint, metadataUri: string) => {
    writeContract({
      address: COLOR_PUNKS_ADDRESS,
      abi: COLOR_PUNKS_ABI,
      functionName: 'updateTokenURI',
      args: [tokenId, metadataUri],
      chain: base,
    });
  };

  return {
    savePunk,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ?? receiptError ?? null,
    reset,
  };
}
