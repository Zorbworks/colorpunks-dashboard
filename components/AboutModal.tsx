'use client';

import { Modal } from './Modal';
import { COLOR_PUNKS_ADDRESS, BASEWORDS_ADDRESS } from '@/lib/contracts';

interface Props {
  open: boolean;
  onClose: () => void;
}

const COLORPUNKS_OPENSEA = `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`;
const BASEWORDS_OPENSEA = `https://opensea.io/assets/base/${BASEWORDS_ADDRESS}`;

export function AboutModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] COLORPUNKS TOOLBOX">
      <p>
        A community toolbox for onchain NFT projects on Base that use Base
        Colors for customisation.
      </p>
      <p>
        <strong>ColorPunks</strong> is a collection of 1,000 unique Punks
        customisable with Base Colors.
      </p>
      <p>
        <strong>Base Words</strong> is an onchain text NFT — mint 1–3
        uppercase words as a 1/1 and color them with your Base Colors.
      </p>
      <p style={{ fontWeight: 600 }}>To paint a ColorPunk:</p>
      <ul className="about-list">
        <li>Switch to the COLORPUNKS tab</li>
        <li>Select one of your punks</li>
        <li>Select one of your colors</li>
        <li>Click any part of your punk to color it in</li>
        <li>Or mash the random button until you find something you like, undo if it gets weird</li>
        <li>Click &ldquo;SAVE&rdquo; to update your Punk onchain</li>
      </ul>
      <p style={{ fontWeight: 600 }}>To mint a Base Word:</p>
      <ul className="about-list">
        <li>Switch to the BASEWORDS tab</li>
        <li>Enter 1–3 words in the canvas (A–Z and 0–9, max 15 chars per line)</li>
        <li>Check that your combination is AVAILABLE</li>
        <li>Hit MINT to create your 1/1 onchain</li>
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
