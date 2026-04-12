'use client';

import { Modal } from './Modal';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

interface Props {
  open: boolean;
  onClose: () => void;
}

const OPENSEA_URL = `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`;

export function AboutModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="[ ABOUT ] COLORPUNKS TOOLBOX">
      <p>
        ColorPunks is a collection of 1,000 unique Punks customisable with Base
        Colors.
      </p>
      <p>This is a community toolbox to bring the collection back to life.</p>
      <ul className="about-list">
        <li>Select one of your punks</li>
        <li>Select one of your colors</li>
        <li>Click any part of your punk to color it in</li>
        <li>Or just mash the random button until you find something you like or undo if it gets weird</li>
        <li>Click &ldquo;Save&rdquo; to update your Punk onchain</li>
      </ul>
      <p>
        Reset takes you back to your punk as originally minted. You can also
        sort your colors by themes and use your Palette collection as a color
        source.
      </p>
      <div className="about-links">
        <a href={OPENSEA_URL} target="_blank" rel="noopener noreferrer">
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
