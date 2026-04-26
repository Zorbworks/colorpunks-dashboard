'use client';

import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "About CWOMA" modal opened from the "?" button in the top bar. */
export function AboutCwomaModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] CWOMA.TOOLS">
      <p>
        CWOMA (Colors, Words &amp; Onchain Memetic Arts) is an experimental
        platform bringing together projects from the Basecolors and Basewords
        ecosystem.
      </p>
      <div className="about-credits">
        <span>
          Built by{' '}
          <a
            href="https://farcaster.xyz/deebee"
            target="_blank"
            rel="noopener noreferrer"
          >
            @deebee
          </a>
        </span>
      </div>
    </Modal>
  );
}
