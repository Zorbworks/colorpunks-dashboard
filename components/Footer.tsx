'use client';

import { useEffect, useState } from 'react';

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

const LINKS: Array<{ label: string; href: string }> = [
  { label: 'BASECOLORS', href: 'https://www.basecolors.com' },
  { label: 'BASEWORDS', href: 'https://basewords.xyz' },
  { label: 'COLORPUNKS', href: 'https://colorpunks.com' },
  {
    label: 'SOULBOUNDS',
    href: 'https://www.basecolors.com/soulbounds',
  },
  { label: 'PALETTES.FUN', href: 'https://www.palettes.fun' },
];

export function Footer() {
  const [pair, setPair] = useState<{ bg: string; fg: string } | null>(null);

  useEffect(() => {
    setPair(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
  }, []);

  return (
    <footer
      className="footer"
      style={pair ? { background: pair.bg, color: pair.fg } : undefined}
    >
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          style={pair ? { color: pair.fg } : undefined}
        >
          {l.label}
        </a>
      ))}
    </footer>
  );
}
