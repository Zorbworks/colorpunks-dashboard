'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './ConnectButton';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const pathname = usePathname();
  const onBaseWords =
    pathname === '/' || pathname?.startsWith('/basewords');
  const onColorPunks = pathname?.startsWith('/colorpunks');

  return (
    <header className="topbar">
      <Link href="/" className="topbar-title">
        CWOMA.TOOLS
      </Link>

      <nav className="topbar-nav">
        <Link
          href="/basewords"
          className={`topbar-btn${onBaseWords ? ' active' : ''}`}
        >
          BASEWORDS
        </Link>
        <Link
          href="/colorpunks"
          className={`topbar-btn${onColorPunks ? ' active' : ''}`}
        >
          COLORPUNKS TOOLBOX
        </Link>
      </nav>

      <div className="topbar-right">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
