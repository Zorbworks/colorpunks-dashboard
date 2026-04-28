'use client';

import Link from 'next/link';

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

/** Footer with a static (theme-aware) background — the previous rotating
 *  RGB/CMY stripe was retired in favour of a calmer "white" footer that
 *  matches the new TopBar treatment. */
export function Footer() {
  return (
    <footer className="footer">
      {LINKS.map((l) => (
        <span key={l.href} className="footer-item">
          {l.internal ? (
            <Link href={l.href} className="footer-link">
              {l.label}
            </Link>
          ) : (
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              {l.label}
            </a>
          )}
          {l.by && l.by.length > 0 && (
            <span className="footer-credit">
              {' '}by{' '}
              {l.by.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && ' '}
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-credit-link"
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
