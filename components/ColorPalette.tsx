'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnrichedColor } from '@/lib/color';

export type ColorLabelMode = 'name' | 'hex';

interface Props {
  colors: EnrichedColor[];
  allColorCount: number;
  selectedColor: string | null;
  onSelect: (hex: string) => void;
  isLoading: boolean;
  /** Hex that should render as disabled (greyed-out, unclickable). Used in
   *  BaseWords to forbid picking the same colour for text and background. */
  disabledColor?: string | null;
  /** Controls the label printed on each tile:
   *  - 'name': named colors show their custom name; unnamed colors fall
   *    back to their hex (the historical behaviour).
   *  - 'hex': every tile shows its hex code regardless of name. */
  labelMode?: ColorLabelMode;
}

/**
 * Renders the currently-filtered palette as a 4-wide grid of swatches.
 * The label printed under each swatch follows `labelMode`. The
 * currently-selected swatch shows an inset ring — no separate picked
 * indicator is needed.
 */
export function ColorPalette({
  colors,
  allColorCount,
  selectedColor,
  onSelect,
  isLoading,
  disabledColor,
  labelMode = 'name',
}: Props) {
  // Tracks which hex is currently flashing "COPIED!" so the user gets a
  // visible confirmation. Cleared on a timer so the strip returns to its
  // normal label after ~1.2s.
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async (hex: string) => {
    const value = hex.toUpperCase();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for permissions-restricted contexts (e.g. some
      // embedded preview frames). Best-effort — nothing to do if the
      // browser refuses both paths.
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
    return <div className="empty-rail">LOADING BASECOLORS…</div>;
  }

  if (allColorCount === 0) {
    return <div className="empty-rail">NO BASECOLORS IN WALLET</div>;
  }

  const forbidden = disabledColor?.toUpperCase() ?? null;

  return (
    <div className="colors-list">
      {colors.length === 0 && (
        <div className="empty-state">NO COLORS MATCH</div>
      )}
      {colors.map((c) => {
        const isSelected = c.color === selectedColor;
        const isDisabled = !!forbidden && c.color.toUpperCase() === forbidden;
        const isCopied = copiedHex === c.color.toUpperCase();
        const label =
          labelMode === 'hex' || !c.isNamed
            ? c.color.toUpperCase()
            : c.name.toUpperCase();
        const tooltip = isDisabled
          ? `${c.isNamed ? c.name : c.color} — already used by the other target`
          : c.isNamed
            ? `${c.name} — ${c.color}`
            : c.color;
        return (
          <button
            key={`${c.tokenId}-${c.color}`}
            type="button"
            className={`color${isSelected ? ' sel' : ''}${isDisabled ? ' disabled' : ''}`}
            style={{ backgroundColor: c.color }}
            title={tooltip}
            aria-label={tooltip}
            data-color-hex={c.color.toUpperCase()}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(c.color)}
          >
            {/* The bottom strip is its own click target: clicking it
                copies the swatch's hex to the clipboard and briefly
                flashes "COPIED!" while leaving the colored area to
                handle selection. stopPropagation prevents the outer
                button's onClick from firing in the same gesture. */}
            <span
              className={`color-name${isCopied ? ' copied' : ''}`}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              title={isDisabled ? tooltip : `Copy ${c.color.toUpperCase()}`}
              onClick={(e) => {
                if (isDisabled) return;
                e.stopPropagation();
                handleCopy(c.color);
              }}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy(c.color);
                }
              }}
            >
              {isCopied ? 'COPIED!' : label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
