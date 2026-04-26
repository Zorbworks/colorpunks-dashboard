'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { TermsModal } from './TermsModal';
import type { Project } from './ProjectPage';

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
}

export function AboutModal({ open, onClose, project = 'colorpunks' }: Props) {
  const [termsOpen, setTermsOpen] = useState(false);

  if (project === 'basewords') {
    return (
      <>
        <Modal open={open} onClose={onClose} title="[ ABOUT ] BASEWORDS">
          <p>
            BaseWords are fully onchain building blocks for an infinite social
            art experiment.
          </p>
          <p>
            A collective temporal archive of unique words, signals and
            semiotic fragments, augmented with colors and minted onchain.
          </p>
          <p>
            BaseWords connect to your Basecolors to create customisable, 1/1
            hexochromatic artefacts, each becoming a node in a networked
            onchain metastory. A composable source of dynamic metadata for new
            projects to plug into.
          </p>
          <p>
            <strong>What word will you mint first?</strong>
          </p>
          <p className="about-terms">
            BASEWORDS is a public arena of expression. Please use your
            judgement when minting. We reserve the right to block offensive
            mints at our sole discretion without refund. By minting you are
            agreeing to these{' '}
            <button
              type="button"
              className="about-terms-link"
              onClick={() => setTermsOpen(true)}
            >
              TERMS
            </button>
            .
          </p>
        </Modal>
        <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      </>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] COLORPUNKS">
      <p>
        ColorPunks is a collection of 1,000 unique Punks customisable with
        Base Colors.
      </p>
      <p style={{ fontWeight: 600 }}>To paint a ColorPunk:</p>
      <ul className="about-list">
        <li>Select your punks from the left rail</li>
        <li>Select your colors from the right panel</li>
        <li>Click any part of your punk to color it in</li>
        <li>
          Or mash the random button until you find something you like, undo
          if it gets weird
        </li>
        <li>Click &ldquo;SAVE&rdquo; to update your Punk onchain</li>
      </ul>
      <p>
        Reset takes your punk back to its original minted state. You can also
        sort your colors by themes and use your Palette collection as a color
        source.
      </p>
      <div className="about-credits">
        <span>
          ColorPunks by{' '}
          <a
            href="https://farcaster.xyz/myk"
            target="_blank"
            rel="noopener noreferrer"
          >
            @MYK
          </a>
        </span>
      </div>
    </Modal>
  );
}
