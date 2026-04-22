'use client';

import { useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { Modal } from './Modal';
import { BASEWORDS_ABI, BASEWORDS_ADDRESS } from '@/lib/contracts';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-composed message body with color names + basewords.xyz. */
  shareText: string;
  /** The NFT tokenId to SEND. If omitted, the SEND action is hidden. */
  tokenId?: string | null;
}

export function ShareModal({ open, onClose, shareText, tokenId }: Props) {
  const [showSend, setShowSend] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);
  const { address } = useAccount();
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
  } = useWaitForTransactionReceipt({ hash });

  // Reset local state whenever the modal closes.
  useEffect(() => {
    if (!open) {
      setShowSend(false);
      setRecipient('');
      setResolveError(null);
      reset();
    }
  }, [open, reset]);

  const encoded = encodeURIComponent(shareText);
  const xUrl = `https://x.com/intent/tweet?text=${encoded}`;
  const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encoded}&channelKey=basewords`;

  const openExternal = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  /** Accept either a 0x address or an ENS name; resolve ENS via
   *  ensideas.com (same free endpoint we use for reverse lookups). */
  const resolveRecipient = async (
    input: string
  ): Promise<`0x${string}` | null> => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (isAddress(trimmed)) return trimmed as `0x${string}`;
    try {
      const res = await fetch(
        `https://api.ensideas.com/ens/resolve/${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { address?: string };
      if (data.address && isAddress(data.address)) {
        return data.address as `0x${string}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSend = async () => {
    setResolveError(null);
    if (!address) {
      setResolveError('Connect a wallet first');
      return;
    }
    if (!tokenId) {
      setResolveError('No token selected');
      return;
    }
    const to = await resolveRecipient(recipient);
    if (!to) {
      setResolveError(
        'Could not resolve that — try a 0x address or a valid ENS name'
      );
      return;
    }
    writeContract({
      address: BASEWORDS_ADDRESS,
      abi: BASEWORDS_ABI,
      functionName: 'safeTransferFrom',
      args: [address, to, BigInt(tokenId)],
      chain: base,
    });
  };

  const sendBtnLabel = isPending
    ? 'SIGN IN WALLET…'
    : isConfirming
      ? 'SENDING…'
      : isSuccess
        ? 'SENT ✓'
        : 'SEND';

  const errorText =
    error &&
    (('shortMessage' in (error as object) &&
      (error as { shortMessage?: string }).shortMessage) ||
      (error as Error).message);

  return (
    <Modal open={open} onClose={onClose} title="[ SHARE ] BASEWORD">
      <p className="share-preview">{shareText}</p>

      <div className="share-buttons">
        <button
          type="button"
          className="share-btn"
          onClick={() => openExternal(xUrl)}
        >
          X
        </button>
        <button
          type="button"
          className="share-btn"
          onClick={() => openExternal(farcasterUrl)}
          title="Share to /basewords on Farcaster"
        >
          FARCASTER
        </button>
        {tokenId && (
          <button
            type="button"
            className={`share-btn${showSend ? ' active' : ''}`}
            onClick={() => setShowSend((v) => !v)}
          >
            SEND
          </button>
        )}
      </div>

      {showSend && tokenId && (
        <div className="share-send">
          <label className="share-send-label">
            Send BaseWord <strong>#{tokenId}</strong> to:
          </label>
          <div className="share-send-row">
            <input
              type="text"
              className="share-send-input"
              placeholder="0x… or name.eth"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={isPending || isConfirming || isSuccess}
            />
            <button
              type="button"
              className="share-send-btn"
              onClick={handleSend}
              disabled={
                !recipient.trim() || isPending || isConfirming || isSuccess
              }
            >
              {sendBtnLabel}
            </button>
          </div>
          {resolveError && (
            <p className="share-send-error">{resolveError}</p>
          )}
          {errorText && (
            <p className="share-send-error">{errorText}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
