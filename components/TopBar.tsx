'use client';

import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  return (
    <header className="topbar">
      <Link href="/" className="topbar-title">
        CWOMA.TOOLS
      </Link>

      <div className="topbar-right">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
