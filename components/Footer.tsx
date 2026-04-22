'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Same six RGB/CMY pairs the TopBar uses. Fresh pick on each mount so
 *  the footer stripe re-themes on every page load. */
const PAIRS: Array<{ bg: string; fg: string }> = [
  { bg: '#FF0000', fg: '#00FFFF' },
  { bg: '#00FF00', fg: '#FF00FF' },
  { bg: '#0000FF', fg: '#FFFF00' },
  { bg: '#00FFFF', fg: '#FF0000' },
  { bg: '#FF00FF', fg: '#00FF00' },
  { bg: '#FFFF00', fg: '#0000FF' },
];

interface Creator {
  handle: string;
  href: string;
}

interface FooterLink {
  label: string;
  href: string;
  /** Internal cwoma.tools route — use next/link + same-tab. */
  internal?: boolean;
  by?: Creator[];
}

const LINKS: FooterLink[] = [
  {
    label: 'BASECOLORS',
    href: 'https://www.basecolors.com',
    by: [{ handle: '@jake', href: 'https://farcaster.xyz/jake' }],
  },
  {
    label: 'BASEWORDS',
    href: '/basewords',
    internal: true,
    by: [{ handle: '@deebee', href: 'https://farcaster.xyz/deebee' }],
  },
  {
    label: 'COLORPUNKS',
    href: '/colorpunks',
    internal: true,
    by: [{ handle: '@myk', href: 'https://farcaster.xyz/myk' }],
  },
  {
    label: 'SOULBOUNDS',
    href: 'https://www.basecolors.com/soulbounds',
    by: [{ handle: '@apex777', href: 'https://farcaster.xyz/apex777' }],
  },
  {
    label: 'PALETTES.FUN',
    href: 'https://www.palettes.fun',
    by: [
      { handle: '@genuinejack', href: 'https://farcaster.xyz/genuinejack' },
    ],
  },
];

export function Footer() {
  const [pair, setPair] = useState<{ bg: string; fg: string } | null>(null);

  useEffect(() => {
    setPair(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
  }, []);

  const colorStyle = pair ? { color: pair.fg } : undefined;

  return (
    <footer
      className="footer"
      style={pair ? { background: pair.bg, color: pair.fg } : undefined}
    >
      {LINKS.map((l) => (
        <span key={l.href} className="footer-item">
          {l.internal ? (
            <Link href={l.href} className="footer-link" style={colorStyle}>
              {l.label}
            </Link>
          ) : (
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={colorStyle}
            >
              {l.label}
            </a>
          )}
          {l.by && l.by.length > 0 && (
            <span className="footer-credit" style={colorStyle}>
              {' '}by{' '}
              {l.by.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && ' '}
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-credit-link"
                    style={colorStyle}
                  >
                    {c.handle}
                  </a>
                </span>
              ))}
            </span>
          )}
        </span>
      ))}
    </footer>
  );
}
