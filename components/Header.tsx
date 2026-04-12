'use client';

import { useState } from 'react';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';
import { AboutModal } from './AboutModal';
import { RecentModal } from './RecentModal';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

const OPENSEA_URL = `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`;

export function Header() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="logo-wrap">
          <div className="logo">COLORPUNKS TOOLBOX</div>
          <div className="logo-sub">POWER TOOLS FOR COLORPUNK COLLECTORS</div>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="opensea-btn"
            onClick={() => setAboutOpen(true)}
          >
            ABOUT
          </button>
          <button
            type="button"
            className="opensea-btn"
            onClick={() => setRecentOpen(true)}
          >
            RECENT ⊞
          </button>
          <ThemeToggle />
          <a
            className="opensea-btn"
            href={OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPENSEA ↗
          </a>
          <ConnectButton />
        </div>
      </header>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <RecentModal open={recentOpen} onClose={() => setRecentOpen(false)} />
    </>
  );
}
