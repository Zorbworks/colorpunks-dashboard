'use client';

import { Modal } from './Modal';
import { COLOR_PUNKS_ADDRESS, BASEWORDS_ADDRESS } from '@/lib/contracts';
import type { Project } from './ProjectPage';

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
}

const COLORPUNKS_OPENSEA = `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`;
const BASEWORDS_OPENSEA = `https://opensea.io/assets/base/${BASEWORDS_ADDRESS}`;

export function AboutModal({ open, onClose, project = 'colorpunks' }: Props) {
  if (project === 'basewords') {
    return (
      <Modal open={open} onClose={onClose} title="[ ABOUT ] BASEWORDS">
        <p>
          <strong>BaseWords placeholder copy.</strong> Replace this with the
          BaseWords about text — what the project is, who built it, how the
          onchain text NFT works.
        </p>
        <p>
          <strong>Base Words</strong> is an onchain text NFT — mint 1–3
          uppercase words as a 1/1 and color them with your Base Colors.
        </p>
        <p style={{ fontWeight: 600 }}>To mint a Base Word:</p>
        <ul className="about-list">
          <li>Click + NEW WORD in the left rail</li>
          <li>Enter 1–3 words in the canvas (A–Z and 0–9, max 15 chars per line)</li>
          <li>Check that your combination is AVAILABLE</li>
          <li>Hit MINT to create your 1/1 onchain</li>
        </ul>
        <p style={{ fontWeight: 600 }}>To color a Base Word:</p>
        <ul className="about-list">
          <li>Select one of your minted BaseWords from the left rail</li>
          <li>Pick a BaseColor from the right panel for TEXT and BG</li>
          <li>Hit SAVE to write the new colors onchain</li>
        </ul>
        <div className="about-links">
          <a href={BASEWORDS_OPENSEA} target="_blank" rel="noopener noreferrer">
            Buy Base Words on OpenSea
          </a>
          <a
            href="https://www.basecolors.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mint Base Colors at basecolors.com
          </a>
        </div>
        <div className="about-credits">
          <span>
            Base Words by{' '}
            <a
              href="https://farcaster.xyz/deebee"
              target="_blank"
              rel="noopener noreferrer"
            >
              @deebee
            </a>
          </span>
          <span>
            Toolbox by{' '}
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

  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] COLORPUNKS TOOLBOX">
      <p>
        <strong>ColorPunks placeholder copy.</strong> Replace this with the
        ColorPunks about text — what the collection is, who built it, how the
        coloring flow works.
      </p>
      <p>
        <strong>ColorPunks</strong> is a collection of 1,000 unique Punks
        customisable with Base Colors.
      </p>
      <p style={{ fontWeight: 600 }}>To paint a ColorPunk:</p>
      <ul className="about-list">
        <li>Select one of your punks from the left rail</li>
        <li>Select one of your colors from the right panel</li>
        <li>Click any part of your punk to color it in</li>
        <li>Or mash the random button until you find something you like, undo if it gets weird</li>
        <li>Click &ldquo;SAVE&rdquo; to update your Punk onchain</li>
      </ul>
      <p>
        Reset takes your punk back to its original minted state. You can also
        sort your colors by themes and use your Palette collection as a color
        source.
      </p>
      <div className="about-links">
        <a href={COLORPUNKS_OPENSEA} target="_blank" rel="noopener noreferrer">
          Buy ColorPunks on OpenSea
        </a>
        <a
          href="https://www.basecolors.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mint Base Colors at basecolors.com
        </a>
        <a
          href="https://www.palettes.fun"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mint Palettes at palettes.fun
        </a>
      </div>
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
        <span>
          Toolbox by{' '}
          <a
            href="https://farcaster.xyz/deebee"
            target="_blank"
            rel="noopener noreferrer"
          >
            @deebee
          </a>
        </span>
        <span>
          Palettes by{' '}
          <a
            href="https://farcaster.xyz/genuinejack"
            target="_blank"
            rel="noopener noreferrer"
          >
            @genuinejack
          </a>
        </span>
      </div>
    </Modal>
  );
}
