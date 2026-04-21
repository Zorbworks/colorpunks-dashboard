'use client';

import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Placeholder "About CWOMA" modal — plain black-and-white, same
 *  visual language as the project About modals. */
export function AboutCwomaModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] CWOMA.TOOLS">
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
