'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useMintBaseWord } from '@/hooks/useMintBaseWord';
import {
  sanitizeWord,
  isValidWord,
  BASEWORDS_MAX_CHARS,
  BASEWORDS_MAX_WORDS,
} from '@/lib/basewords';
import { BASEWORDS_ADDRESS } from '@/lib/contracts';

export function BaseWordsMintForm() {
  const { isConnected } = useAccount();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The textarea value is the source of truth. Each line is a word.
  const [raw, setRaw] = useState('');

  const words = useMemo(
    () =>
      raw
        .split('\n')
        .slice(0, BASEWORDS_MAX_WORDS)
        .map((line) => sanitizeWord(line)),
    [raw]
  );

  const nonEmpty = useMemo(() => words.filter((w) => w.length > 0), [words]);
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

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Space becomes a newline so "GM BASE" splits into two lines.
      // Sanitize each line; cap to MAX_WORDS lines.
      const incoming = e.target.value.replace(/ +/g, '\n');
      const lines = incoming
        .split('\n')
        .slice(0, BASEWORDS_MAX_WORDS)
        .map((line) => sanitizeWord(line));
      setRaw(lines.join('\n'));
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        const lines = (e.currentTarget.value || '').split('\n').length;
        if (lines >= BASEWORDS_MAX_WORDS) e.preventDefault();
      }
    },
    []
  );

  const focusCanvas = useCallback(() => textareaRef.current?.focus(), []);

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

  const lineCount = Math.max(1, raw ? raw.split('\n').length : 1);
  const lastLineLen = words[words.length - 1]?.length ?? 0;

  return (
    <div className="bw-mint">
      <div
        className="bw-canvas"
        onClick={focusCanvas}
        data-lines={lineCount}
      >
        <textarea
          ref={textareaRef}
          className="bw-canvas-input"
          value={raw}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="TYPE"
          rows={lineCount}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Base Words — type your words"
        />
      </div>

      <div className="bw-meta">
        <span>
          {nonEmpty.length}/{BASEWORDS_MAX_WORDS} WORDS
        </span>
        <span>
          {lastLineLen}/{BASEWORDS_MAX_CHARS} CHARS
        </span>
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
              setRaw('');
            }}
          >
            MINT ANOTHER
          </button>
        </div>
      )}
    </div>
  );
}
