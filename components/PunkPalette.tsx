'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ColorInfo } from './Canvas';
import type { UserColor, AlchemyNft } from '@/lib/alchemy';
import { getPunkType, getPunkTraits } from '@/lib/punk-traits';

interface Props {
  colors: ColorInfo[];
  /** The user's BaseColors — used to look up custom names by hex. */
  baseColors: UserColor[];
  /** When set, clicking a color row selects it as the active paint color. */
  onSelect?: (hex: string) => void;
  selectedColor?: string | null;
  /** The currently loaded punk — used to display traits. */
  punk?: AlchemyNft | null;
}

/**
 * DETAILS tab: shows the punk's type + traits, then a breakdown of all
 * colors found in the current canvas image.
 */
export function PunkPalette({
  colors,
  baseColors,
  onSelect,
  selectedColor,
  punk,
}: Props) {
  // Build a lookup from hex → BaseColor name.
  const nameByHex = new Map<string, string>();
  for (const bc of baseColors) {
    if (bc.isNamed) {
      nameByHex.set(bc.color.toUpperCase(), bc.name);
    }
  }

  const punkType = punk ? getPunkType(punk) : null;
  const traits = punk ? getPunkTraits(punk) : [];

  // Tracks which hex is flashing the "copied" tick. Cleared on a
  // 1.2s timer so the chip glyph snaps back to ⎘. Same pattern used
  // in the BaseWords metadata tab and the palette browser.
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

  return (
    <>
      {/* Punk traits section */}
      {punk && (
        <>
          <div className="punk-palette-section">TRAITS</div>
          {punkType && (
            <div className="punk-palette-trait">
              <span className="punk-palette-trait-type">TYPE</span>
              <span className="punk-palette-trait-value">
                {punkType.toUpperCase()}
              </span>
            </div>
          )}
          {traits.map((t) => (
            <div className="punk-palette-trait" key={t.traitType}>
              <span className="punk-palette-trait-type">
                {t.traitType.toUpperCase().replace(/_/g, ' ')}
              </span>
              <span className="punk-palette-trait-value">
                {t.value.toUpperCase().replace(/_/g, ' ')}
              </span>
            </div>
          ))}
          {traits.length === 0 && !punkType && (
            <div className="punk-palette-trait">
              <span className="punk-palette-trait-type">—</span>
              <span className="punk-palette-trait-value">NO TRAITS</span>
            </div>
          )}
          <div className="punk-palette-section">COLORS</div>
        </>
      )}

      {/* Color breakdown */}
      {colors.length === 0 && (
        <div className="punk-palette-trait">
          <span className="punk-palette-trait-value">NO COLORS DETECTED</span>
        </div>
      )}
      {colors.map((c) => {
        const name = nameByHex.get(c.hex);
        const isSelected = selectedColor === c.hex;
        const isCopied = copiedHex === c.hex.toUpperCase();
        // Combined NAME / #HEX cell so the row matches the BaseWords
        // metadata tab. Falls back to just the hex for unnamed colors.
        const display = name ? `${name.toUpperCase()} / ${c.hex}` : c.hex;
        return (
          <button
            type="button"
            className={`punk-palette-row${isSelected ? ' selected' : ''}`}
            key={c.hex}
            onClick={() => onSelect?.(c.hex)}
          >
            <span
              className="punk-palette-swatch"
              style={{ backgroundColor: c.hex }}
            />
            {/* name + copy live in the flex:1 cluster so the copy
                glyph sits next to the hex text, while the wrapper
                pushes the % column to the far right of the row. */}
            <span className="punk-palette-text">
              <span className="punk-palette-name">{display}</span>
              <span
                className={`punk-palette-copy${isCopied ? ' copied' : ''}`}
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
            </span>
            <span className="punk-palette-pct">{c.percentage}%</span>
          </button>
        );
      })}
    </>
  );
}
