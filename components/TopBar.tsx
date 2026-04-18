'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const pathname = usePathname();
  const onColorPunks = pathname?.startsWith('/colorpunks');
  // Click the nav — always navigate to the project you're NOT on.
  const otherHref = onColorPunks ? '/basewords' : '/colorpunks';

  return (
    <header className="topbar">
      <Link href="/" className="topbar-title">
        CWOMA.TOOLS
      </Link>

      <nav className="topbar-nav">
        <Link href={otherHref} className="topbar-nav-link">
          <span className={onColorPunks ? 'dim' : ''}>BASEWORDS</span>
          <span className="topbar-slash"> / </span>
          <span className={onColorPunks ? '' : 'dim'}>COLORPUNKS</span>
        </Link>
      </nav>

      <div className="topbar-right">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
