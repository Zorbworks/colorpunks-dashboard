'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useMintBaseWord } from '@/hooks/useMintBaseWord';
import { TermsModal } from './TermsModal';
import {
  sanitizeWord,
  isValidWord,
  BASEWORDS_MAX_CHARS,
  BASEWORDS_MAX_WORDS,
} from '@/lib/basewords';

export function BaseWordsMintForm() {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The textarea value is the source of truth. Each line is a word.
  const [raw, setRaw] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);

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

  // After a successful mint, wait for Alchemy to index the new ownership
  // (usually a few seconds) then refresh the left rail so the new word
  // appears without a page reload.
  useEffect(() => {
    if (!isSuccess || !address) return;
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['user-basewords', address] });
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, address, queryClient]);

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

  // After a successful mint the button flips to a "MINT ANOTHER" reset
  // action so the user can clear the canvas and start a fresh word
  // without reloading. Before success it's the normal mint CTA.
  const handleMintAnother = useCallback(() => {
    reset();
    setRaw('');
    textareaRef.current?.focus();
  }, [reset]);

  const mintDisabled = isSuccess
    ? false
    : !isConnected ||
      !allValid ||
      !isUnique ||
      !mintPrice ||
      isPending ||
      isConfirming;

  const mintLabel = !isConnected
    ? 'CONNECT WALLET TO MINT'
    : isPending
      ? 'SIGN IN WALLET…'
      : isConfirming
        ? 'MINTING…'
        : isSuccess
          ? 'MINT ANOTHER'
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
        {isSuccess ? (
          <span className="bw-meta-status bw-meta-status-ok">MINTED ✓</span>
        ) : statusLabel ? (
          <span className={`bw-meta-status bw-meta-status-${statusKind}`}>
            {statusLabel}
          </span>
        ) : null}
        <span>
          {lastLineLen}/{BASEWORDS_MAX_CHARS} CHARS
        </span>
      </div>

      <p className="bw-mint-terms">
        BASEWORDS is a public arena of expression. Please use your judgement
        when minting. We reserve the right to block offensive mints at our
        sole discretion without refund. By minting you are agreeing to these{' '}
        <button
          type="button"
          className="bw-mint-terms-link"
          onClick={() => setTermsOpen(true)}
        >
          TERMS
        </button>
        .
      </p>

      <button
        type="button"
        className="bw-mint-btn"
        onClick={isSuccess ? handleMintAnother : mint}
        disabled={mintDisabled}
      >
        {mintLabel}
      </button>

      {error && <div className="save-status error">{errorText}</div>}

      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
