'use client';

import { useEffect, useState } from 'react';
import { Modal } from './Modal';

/** Same RGB/CMY pairs the TopBar uses — keep these in sync. */
const PAIRS: Array<{ bg: string; fg: string }> = [
  { bg: '#FF0000', fg: '#00FFFF' },
  { bg: '#00FF00', fg: '#FF00FF' },
  { bg: '#0000FF', fg: '#FFFF00' },
  { bg: '#00FFFF', fg: '#FF0000' },
  { bg: '#FF00FF', fg: '#00FF00' },
  { bg: '#FFFF00', fg: '#0000FF' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Placeholder "About CWOMA" modal — text is intentionally sketchy and
 *  meant to be edited later. Picks a random RGB/CMY pair each time it
 *  opens so the popup rotates through the same palette as the topbar. */
export function AboutCwomaModal({ open, onClose }: Props) {
  const [pair, setPair] = useState<{ bg: string; fg: string } | null>(null);

  useEffect(() => {
    if (open) setPair(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="[ ABOUT ] CWOMA.TOOLS"
      style={
        pair
          ? { background: pair.bg, color: pair.fg, borderColor: pair.fg }
          : undefined
      }
    >
      <p>
        <strong>CWOMA placeholder copy.</strong> Replace this with the real
        CWOMA about text — the project ethos, what lives at this domain, who
        runs it, etc.
      </p>
      <p>
        CWOMA is a hub for onchain NFT tools on Base. Each project lives at
        its own route (e.g. <code>/basewords</code>, <code>/colorpunks</code>)
        and can be shared as a standalone link, while the top bar ties them
        together under one roof.
      </p>
      <p>
        Built by the community. Bring your <strong>BaseColors</strong>,
        paint your <strong>ColorPunks</strong>, mint your{' '}
        <strong>BaseWords</strong>.
      </p>
      <p style={{ opacity: 0.75, fontSize: '11px', marginTop: '16px' }}>
        (Drop-in text — edit in <code>components/AboutCwomaModal.tsx</code>.)
      </p>
    </Modal>
  );
}
