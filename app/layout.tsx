import type { Metadata } from 'next';
import {
  Jost,
  Press_Start_2P,
  IBM_Plex_Mono,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { TopBar } from '@/components/TopBar';

// next/font sets the resolved font-family as CSS custom properties on the
// <body>. globals.css reads these via var(--font-silkscreen) / var(--font-jost).
const pressStart = Press_Start_2P({
  weight: '400',
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

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-title',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cwoma.tools'),
  title: 'CWOMA: Colors, Words & Onchain Memetic Arts',
  description:
    'Building onchain systems for all the colors and words on the internet.',
  openGraph: {
    title: 'CWOMA: Colors, Words & Onchain Memetic Arts',
    description:
      'Building onchain systems for all the colors and words on the internet.',
    images: [
      {
        url: '/og-image.png?v=3',
        width: 1200,
        height: 630,
        alt: 'CWOMA — Colors, Words & Onchain Memetic Arts',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CWOMA: Colors, Words & Onchain Memetic Arts',
    description:
      'Building onchain systems for all the colors and words on the internet.',
    images: ['/og-image.png?v=3'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Tiny5 — pixel display face used for the CWOMA.TOOLS topbar
            wordmark. Loaded via a Google Fonts <link> because the
            current next/font/google types pre-date Tiny5 being added
            to the catalogue. Globals.css picks it up through the
            --font-pixel CSS variable. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tiny5&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${pressStart.variable} ${jost.variable} ${ibmPlexMono.variable} ${jetbrainsMono.variable}`}>
        <Providers>
          <div className="page">
            <TopBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
