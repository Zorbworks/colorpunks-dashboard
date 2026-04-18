'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';
import { AboutModal } from './AboutModal';
import { RecentModal } from './RecentModal';

/** Primary-ish colors used to tint the COLORPUNKS TOOLBOX label. One is
 *  picked at random on mount so the label changes across loads. */
const PRIMARY_COLORS = [
  '#E53935', // red
  '#FB8C00', // orange
  '#FDD835', // yellow
  '#43A047', // green
  '#1E88E5', // blue
  '#8E24AA', // purple
  '#EC407A', // pink
];

export function TopBar() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const pathname = usePathname();

  const punksColor = useMemo(
    () => PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)],
    []
  );

  const onBaseWords = pathname?.startsWith('/basewords');
  const onColorPunks = pathname?.startsWith('/colorpunks');

  return (
    <>
      <header className="topbar">
        <Link href="/" className="topbar-title">
          CWOMA.TOOLS
        </Link>

        <nav className="topbar-nav">
          <Link
            href="/basewords"
            className={`topbar-proj${onBaseWords ? ' active' : ''}`}
            style={{ color: '#0052FF' }}
          >
            BASEWORDS
          </Link>
          <Link
            href="/colorpunks"
            className={`topbar-proj${onColorPunks ? ' active' : ''}`}
            style={{ color: punksColor }}
          >
            COLORPUNKS TOOLBOX
          </Link>
        </nav>

        <div className="topbar-right">
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
            RECENT
          </button>
          <ThemeToggle />
          <ConnectButton />
        </div>
      </header>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <RecentModal open={recentOpen} onClose={() => setRecentOpen(false)} />
    </>
  );
}
