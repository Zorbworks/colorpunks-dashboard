'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';
import { AboutCwomaModal } from './AboutCwomaModal';

/** Complementary RGB/CMY colour pairs. Picking one at random on mount
 *  gives a fresh "theme" on every page reload — bg and text are always
 *  each other's complement (RGB → CMY or vice versa). */
const PAIRS: Array<{ bg: string; fg: string }> = [
  { bg: '#FF0000', fg: '#00FFFF' },
  { bg: '#00FF00', fg: '#FF00FF' },
  { bg: '#0000FF', fg: '#FFFF00' },
  { bg: '#00FFFF', fg: '#FF0000' },
  { bg: '#FF00FF', fg: '#00FF00' },
  { bg: '#FFFF00', fg: '#0000FF' },
];

export function TopBar() {
  const [pair, setPair] = useState<{ bg: string; fg: string } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    setPair(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
  }, []);

  return (
    <>
      <header
        className="topbar"
        style={pair ? { background: pair.bg, color: pair.fg } : undefined}
      >
        <Link
          href="/"
          className="topbar-title"
          style={pair ? { color: pair.fg } : undefined}
        >
          CWOMA.TOOLS
          <span className="topbar-subtitle">
            {' '}| Colors, Words and Onchain Memetic Arts.
          </span>
        </Link>

        <div className="topbar-right">
          <button
            type="button"
            className="topbar-about"
            onClick={() => setAboutOpen(true)}
            aria-label="About CWOMA"
            title="About CWOMA"
          >
            ?
          </button>
          <ThemeToggle />
          <ConnectButton />
        </div>
      </header>

      <AboutCwomaModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />
    </>
  );
}
