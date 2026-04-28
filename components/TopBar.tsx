'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
// Theme toggle is hidden for now — keeping the import path commented
// so we can re-enable it later without rewiring anything.
// import { ThemeToggle } from './ThemeToggle';
import { AboutCwomaModal } from './AboutCwomaModal';

/** Top navigation for CWOMA — the parent site. Background follows the
 *  page theme (white in light mode, dark in dark mode) so the bar reads
 *  as primary site chrome rather than a rotating colour stripe. */
export function TopBar() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="topbar-title">
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
          {/* <ThemeToggle /> — hidden for now; re-add to bring it back */}
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
