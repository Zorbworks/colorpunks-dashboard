'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useMintBaseWord } from '@/hooks/useMintBaseWord';
import {
  buildBaseWordsSvg,
  svgToDataUri,
  sanitizeWord,
  isValidWord,
  BASEWORDS_MAX_CHARS,
  BASEWORDS_MAX_WORDS,
} from '@/lib/basewords';
import { BASEWORDS_ADDRESS } from '@/lib/contracts';

export function BaseWordsMintForm() {
  const { isConnected } = useAccount();
  // Start with one input — user can add more by pressing Enter/Space.
  const [words, setWords] = useState<string[]>(['']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const cleaned = useMemo(
    () => words.map((w) => sanitizeWord(w)),
    [words]
  );
  const nonEmpty = useMemo(
    () => cleaned.filter((w) => w.length > 0),
    [cleaned]
  );
  const allValid = nonEmpty.length > 0 && nonEmpty.every(isValidWord);

  const {
    mintPrice,
    isUnique,
    isVerifying,
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  } = useMintBaseWord(nonEmpty);

  const updateWord = useCallback((i: number, raw: string) => {
    setWords((prev) => {
      const next = prev.slice();
      next[i] = sanitizeWord(raw);
      return next;
    });
  }, []);

  const addWord = useCallback((focusNew = true) => {
    setWords((prev) => {
      if (prev.length >= BASEWORDS_MAX_WORDS) return prev;
      const next = [...prev, ''];
      if (focusNew) {
        // Focus the new input on next paint.
        requestAnimationFrame(() => {
          inputRefs.current[next.length - 1]?.focus();
        });
      }
      return next;
    });
  }, []);

  const removeWord = useCallback((i: number) => {
    setWords((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== i);
      requestAnimationFrame(() => {
        inputRefs.current[Math.max(0, i - 1)]?.focus();
      });
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
      // Enter or Space on a non-empty input adds a new line (up to max).
      if ((e.key === 'Enter' || e.key === ' ') && words[i].length > 0) {
        e.preventDefault();
        if (i === words.length - 1 && words.length < BASEWORDS_MAX_WORDS) {
          addWord(true);
        } else if (i < words.length - 1) {
          inputRefs.current[i + 1]?.focus();
        }
      }
      // Backspace on an empty input removes that line.
      if (e.key === 'Backspace' && words[i].length === 0 && words.length > 1) {
        e.preventDefault();
        removeWord(i);
      }
    },
    [words, addWord, removeWord]
  );

  const previewSvg = useMemo(() => buildBaseWordsSvg(cleaned), [cleaned]);
  const previewUri = useMemo(() => svgToDataUri(previewSvg), [previewSvg]);

  // Status label.
  let statusLabel = '';
  let statusKind: '' | 'ok' | 'err' | 'wait' = '';
  if (nonEmpty.length > 0 && allValid) {
    if (isVerifying) {
      statusLabel = 'CHECKING…';
      statusKind = 'wait';
    } else if (isUnique === true) {
      statusLabel = 'AVAILABLE';
      statusKind = 'ok';
    } else if (isUnique === false) {
      statusLabel = 'NOT AVAILABLE';
      statusKind = 'err';
    }
  }

  // Mint button state.
  const mintDisabled =
    !isConnected ||
    !allValid ||
    !isUnique ||
    !mintPrice ||
    isPending ||
    isConfirming ||
    isSuccess;

  const mintLabel = !isConnected
    ? 'CONNECT WALLET TO MINT'
    : isPending
      ? 'SIGN IN WALLET…'
      : isConfirming
        ? 'MINTING…'
        : isSuccess
          ? 'MINTED ✓'
          : mintPrice
            ? `MINT · ${formatEther(mintPrice)} ETH`
            : 'MINT';

  const errorText =
    error &&
    (('shortMessage' in (error as object) &&
      (error as { shortMessage?: string }).shortMessage) ||
      (error as Error).message);

  return (
    <div className="bw-mint">
      <div className="bw-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUri} alt="Base Words preview" />
      </div>

      <div className="bw-inputs">
        {words.map((w, i) => (
          <div className="bw-input-row" key={i}>
            <span className="bw-input-num">{i + 1}</span>
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              className="bw-input"
              value={w}
              maxLength={BASEWORDS_MAX_CHARS}
              placeholder="TYPE A WORD"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => updateWord(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
            <span className="bw-input-count">
              {w.length}/{BASEWORDS_MAX_CHARS}
            </span>
          </div>
        ))}
        {words.length < BASEWORDS_MAX_WORDS && (
          <button
            type="button"
            className="bw-add-line"
            onClick={() => addWord(true)}
          >
            + ADD LINE
          </button>
        )}
      </div>

      {statusLabel && (
        <div className={`bw-status bw-status-${statusKind}`}>{statusLabel}</div>
      )}

      <button
        type="button"
        className="bw-mint-btn"
        onClick={mint}
        disabled={mintDisabled}
      >
        {mintLabel}
      </button>

      {error && <div className="save-status error">{errorText}</div>}

      {isSuccess && hash && (
        <div className="save-status success">
          MINTED.
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            TX
          </a>
          <a
            href={`https://opensea.io/assets/base/${BASEWORDS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPENSEA
          </a>
          <button
            type="button"
            className="bw-mint-reset"
            onClick={() => {
              reset();
              setWords(['']);
            }}
          >
            MINT ANOTHER
          </button>
        </div>
      )}
    </div>
  );
}
