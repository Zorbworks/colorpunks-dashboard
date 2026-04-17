'use client';

import { useMemo } from 'react';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';
import { isValidWord } from '@/lib/basewords';

export interface UseMintBaseWord {
  /** Current mint price in wei (bigint). */
  mintPrice: bigint | undefined;
  /** Whether the supplied word list is unique / mintable. */
  isUnique: boolean | null;
  /** Raw status byte from wordVerify. 0 usually = OK. */
  verifyStatus: number | null;
  /** True while the uniqueness check is loading. */
  isVerifying: boolean;
  /** Fire the mint tx. */
  mint: () => void;
  /** The tx hash once submitted. */
  hash: `0x${string}` | undefined;
  /** True while the wallet modal is open (user hasn't signed yet). */
  isPending: boolean;
  /** True while the tx is mined on-chain. */
  isConfirming: boolean;
  /** Tx mined successfully. */
  isSuccess: boolean;
  /** Any error from writeContract or the receipt. */
  error: Error | null;
  /** Reset the tx state (so the button goes back to idle). */
  reset: () => void;
}

/**
 * Runs the full mint flow for a Base Word: reads current mint price and
 * uniqueness, exposes the `mint()` function, and tracks tx state.
 *
 * Caller passes the (already-sanitized, uppercased) words array. The hook
 * handles price and uniqueness reads; the caller decides when to call mint().
 */
export function useMintBaseWord(words: string[]): UseMintBaseWord {
  // Only pass valid, non-empty words to the verify call.
  const cleaned = useMemo(
    () => words.map((w) => w.trim().toUpperCase()).filter((w) => isValidWord(w)),
    [words]
  );

  const { data: mintPrice } = useReadContract({
    address: BASEWORDS_ADDRESS,
    abi: BASEWORDS_ABI,
    functionName: 'mintPrice',
    chainId: base.id,
  });

  const { data: verifyResult, isLoading: isVerifying } = useReadContract({
    address: BASEWORDS_ADDRESS,
    abi: BASEWORDS_ABI,
    functionName: 'wordVerify',
    args: [cleaned],
    chainId: base.id,
    query: {
      enabled: cleaned.length > 0,
    },
  });

  const [isUnique, verifyStatus] = verifyResult
    ? (verifyResult as unknown as [boolean, number])
    : [null, null];

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const mint = () => {
    if (!mintPrice || cleaned.length === 0) return;
    writeContract({
      address: BASEWORDS_ADDRESS,
      abi: BASEWORDS_ABI,
      functionName: 'mint',
      args: [cleaned],
      value: mintPrice as bigint,
      chain: base,
    });
  };

  return {
    mintPrice: mintPrice as bigint | undefined,
    isUnique,
    verifyStatus,
    isVerifying,
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: error ?? receiptError ?? null,
    reset,
  };
}
