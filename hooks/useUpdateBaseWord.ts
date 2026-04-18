'use client';

import { useCallback } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';

export interface UseUpdateBaseWord {
  save: (args: {
    tokenId: string;
    /** BaseColor tokenId for text, or null if unchanged. */
    textColorTokenId: string | null;
    /** BaseColor tokenId for background, or null if unchanged. */
    bgColorTokenId: string | null;
  }) => void;
  reset: (tokenId: string) => void;
  invert: (tokenId: string) => void;
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  clear: () => void;
}

/**
 * Write hook covering the three color-edit paths on the BaseWords contract:
 * save (update one or both colors), reset (back to default), and invert.
 */
export function useUpdateBaseWord(): UseUpdateBaseWord {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset: clear,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const save = useCallback(
    ({
      tokenId,
      textColorTokenId,
      bgColorTokenId,
    }: {
      tokenId: string;
      textColorTokenId: string | null;
      bgColorTokenId: string | null;
    }) => {
      const id = BigInt(tokenId);
      if (textColorTokenId && bgColorTokenId) {
        writeContract({
          address: BASEWORDS_ADDRESS,
          abi: BASEWORDS_ABI,
          functionName: 'updateAllColors',
          args: [id, BigInt(bgColorTokenId), BigInt(textColorTokenId)],
          chain: base,
        });
      } else if (textColorTokenId) {
        writeContract({
          address: BASEWORDS_ADDRESS,
          abi: BASEWORDS_ABI,
          functionName: 'updateWordColor',
          args: [id, BigInt(textColorTokenId)],
          chain: base,
        });
      } else if (bgColorTokenId) {
        writeContract({
          address: BASEWORDS_ADDRESS,
          abi: BASEWORDS_ABI,
          functionName: 'updateBackgroundColor',
          args: [id, BigInt(bgColorTokenId)],
          chain: base,
        });
      }
    },
    [writeContract]
  );

  const reset = useCallback(
    (tokenId: string) => {
      writeContract({
        address: BASEWORDS_ADDRESS,
        abi: BASEWORDS_ABI,
        functionName: 'resetColors',
        args: [BigInt(tokenId)],
        chain: base,
      });
    },
    [writeContract]
  );

  const invert = useCallback(
    (tokenId: string) => {
      writeContract({
        address: BASEWORDS_ADDRESS,
        abi: BASEWORDS_ABI,
        functionName: 'invertDefaultColors',
        args: [BigInt(tokenId)],
        chain: base,
      });
    },
    [writeContract]
  );

  return {
    save,
    reset,
    invert,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ?? receiptError ?? null,
    clear,
  };
}
