'use client';

import { useState } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-composed message body with color names + basewords.xyz. */
  shareText: string;
}

export function ShareModal({ open, onClose, shareText }: Props) {
  const [copied, setCopied] = useState(false);

  const encoded = encodeURIComponent(shareText);
  const xUrl = `https://x.com/intent/tweet?text=${encoded}`;
  const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encoded}&channelKey=basewords`;

  const openExternal = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const copyForInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

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
        <button
          type="button"
          className="share-btn"
          onClick={copyForInstagram}
          title="Copy caption to paste into Instagram"
        >
          {copied ? 'COPIED ✓' : 'INSTAGRAM'}
        </button>
      </div>

      <p className="share-hint">
        Instagram doesn&rsquo;t support web share links — copy the caption,
        then open Instagram and paste it into your post or story.
      </p>
    </Modal>
  );
}
