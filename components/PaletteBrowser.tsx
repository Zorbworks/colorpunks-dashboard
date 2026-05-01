'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserPalette } from '@/hooks/useUserPalettes';

interface Props {
  palettes: UserPalette[];
  isLoading: boolean;
  selectedPaletteId: string | null;
  onSelect: (palette: UserPalette) => void;
  /** Active paint color hex — highlights the matching swatch. */
  selectedColor: string | null;
  onSelectColor: (hex: string) => void;
}

/**
 * Lists all owned Palettes NFTs. Click a palette to select it,
 * then click individual colors to paint with them.
 */
export function PaletteBrowser({
  palettes,
  isLoading,
  selectedPaletteId,
  onSelect,
  selectedColor,
  onSelectColor,
}: Props) {
  // Tracks which hex is currently flashing the "copied" tick. Cleared
  // on a 1.2s timer so the chip glyph snaps back to ⎘. Same pattern
  // used in ColorPalette + BaseWordPalette.
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async (hex: string) => {
    const value = hex.toUpperCase();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard fallback for restricted contexts.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(ta);
    }
    setCopiedHex(value);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedHex(null), 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return <div className="empty-rail">LOADING PALETTES…</div>;
  }

  if (palettes.length === 0) {
    return (
      <div className="empty-rail">
        NO PALETTES FOUND
        <br />
        <a
          href="https://www.palettes.fun/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}
        >
          CREATE ONE AT PALETTES.FUN
        </a>
      </div>
    );
  }

  return (
    <div className="palette-browser">
      {palettes.map((p) => {
        const isActive = p.tokenId === selectedPaletteId;
        return (
          <div key={p.tokenId} className="palette-browser-item">
            <button
              type="button"
              className={`palette-browser-header${isActive ? ' active' : ''}`}
              onClick={() => onSelect(p)}
            >
              <span className="palette-browser-id">#{p.tokenId}</span>
              <span className="palette-browser-swatches-mini">
                {p.colors.map((c, i) => (
                  <span
                    key={i}
                    className="palette-mini-dot"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </span>
            </button>
            {isActive && (
              <div className="palette-browser-colors">
                {p.colors.map((c, i) => {
                  const isCopied = copiedHex === c.hex.toUpperCase();
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`palette-color-btn${selectedColor === c.hex ? ' sel' : ''}`}
                      onClick={() => onSelectColor(c.hex)}
                      title={c.isNamed ? `${c.name} — ${c.hex}` : c.hex}
                    >
                      <span
                        className="palette-color-swatch"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="palette-color-label">
                        {c.isNamed ? c.name.toUpperCase() : c.hex}
                      </span>
                      {/* Right-justified hex value — shown only when the
                          row already shows a custom name on the left, so
                          the hex is not duplicated for unnamed colors
                          (their hex already lives in the .label slot). */}
                      {c.isNamed && (
                        <span className="palette-color-hex">{c.hex}</span>
                      )}
                      {/* Borderless copy glyph — click copies this row's
                          hex and briefly flips to ✓. stopPropagation
                          prevents the parent button's onClick (which
                          selects the swatch as the active paint color)
                          from firing in the same gesture. */}
                      <span
                        className={`palette-color-copy${isCopied ? ' copied' : ''}`}
                        role="button"
                        tabIndex={0}
                        title={isCopied ? 'Copied!' : `Copy ${c.hex}`}
                        aria-label={`Copy ${c.hex}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(c.hex);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopy(c.hex);
                          }
                        }}
                      >
                        {isCopied ? '✓' : '⎘'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
