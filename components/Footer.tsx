'use client';

import { useState } from 'react';
import { AboutModal } from './AboutModal';
import { RecentModal } from './RecentModal';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

const BASESCAN_URL = `https://basescan.org/address/${COLOR_PUNKS_ADDRESS}`;

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <>
      <footer className="footer">
        <span className="credits">
          COLORPUNKS BY{' '}
          <a
            href="https://farcaster.xyz/myk"
            target="_blank"
            rel="noopener noreferrer"
          >
            @MYK
          </a>{' '}
          · TOOL BY{' '}
          <a
            href="https://farcaster.xyz/deebee"
            target="_blank"
            rel="noopener noreferrer"
          >
            @DEEBEE
          </a>
        </span>

        <div className="footer-actions">
          <button type="button" onClick={() => setAboutOpen(true)}>
            ABOUT
          </button>
          <button type="button" onClick={() => setRecentOpen(true)}>
            RECENT ⊞
          </button>
          <a
            href="https://www.basecolors.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            BASECOLORS ↗
          </a>
        </div>

        <a
          className="chain-info"
          href={BASESCAN_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          BASE 8453<span className="sep">·</span>0X67C7…02EB2 ↗
        </a>
      </footer>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <RecentModal open={recentOpen} onClose={() => setRecentOpen(false)} />
    </>
  );
}
