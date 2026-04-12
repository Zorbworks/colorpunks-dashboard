import type { Metadata } from 'next';
import { Jost, Silkscreen } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';

// next/font sets the resolved font-family as CSS custom properties on the
// <body>. globals.css reads these via var(--font-silkscreen) / var(--font-jost).
const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-silkscreen',
  display: 'swap',
});

const jost = Jost({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Color Punks Toolbox — Power Tools for Color Punk Collectors',
  description:
    'Paint your ColorPunks with your BaseColors. On-chain coloring book on Base mainnet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${silkscreen.variable} ${jost.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
