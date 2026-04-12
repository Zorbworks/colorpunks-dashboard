'use client';

export function Footer() {
  return (
    <footer className="footer">
      <span className="credits">
        COLORPUNKS BY{' '}
        <a
          href="https://farcaster.xyz/myk"
          target="_blank"
          rel="noopener noreferrer"
        >
          @MYK
        </a>{' '}
        · TOOLBOX BY{' '}
        <a
          href="https://farcaster.xyz/deebee"
          target="_blank"
          rel="noopener noreferrer"
        >
          @DEEBEE
        </a>
      </span>

      <a
        className="chain-info"
        href="https://www.basecolors.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        BASECOLORS ↗
      </a>
    </footer>
  );
}
