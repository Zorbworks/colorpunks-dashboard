'use client';

import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

const OPENSEA_URL = `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`;

export function Header() {
  return (
    <header className="header">
      <div className="logo-wrap">
        <div className="logo">COLORPUNKS</div>
        <div className="logo-sub">POWER TOOLS FOR COLORPUNKS</div>
      </div>
      <div className="header-right">
        <ThemeToggle />
        <a
          className="opensea-btn"
          href={OPENSEA_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          BUY ON OPENSEA ↗
        </a>
        <ConnectButton />
      </div>
    </header>
  );
}
