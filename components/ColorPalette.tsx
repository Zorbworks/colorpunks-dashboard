'use client';

import { useEffect, useRef } from 'react';
import type { EnrichedColor } from '@/lib/color';

interface Props {
  colors: EnrichedColor[];
  allColorCount: number;
  selectedColor: string | null;
  onSelect: (hex: string) => void;
  isLoading: boolean;
}

/**
 * Renders the currently-filtered palette as a 4-wide grid of swatches.
 * Named colors show the custom name; unnamed colors show their hex.
 * The currently-selected swatch shows an inset ring — no separate picked
 * indicator is needed.
 */
export function ColorPalette({
  colors,
  allColorCount,
  selectedColor,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return <div className="empty-rail">LOADING BASECOLORS…</div>;
  }

  if (allColorCount === 0) {
    return <div className="empty-rail">NO BASECOLORS IN WALLET</div>;
  }

  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll the selected swatch into view when selectedColor changes
  // (e.g. when picked from the Palette tab).
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedColor]);

  return (
    <div className="colors-list">
      {colors.length === 0 && (
        <div className="empty-state">NO COLORS MATCH</div>
      )}
      {colors.map((c) => {
        const isSelected = c.color === selectedColor;
        const label = c.isNamed ? c.name.toUpperCase() : c.color.toUpperCase();
        const tooltip = c.isNamed ? `${c.name} — ${c.color}` : c.color;
        return (
          <button
            key={`${c.tokenId}-${c.color}`}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            className={`color${isSelected ? ' sel' : ''}`}
            style={{ backgroundColor: c.color }}
            title={tooltip}
            aria-label={tooltip}
            onClick={() => onSelect(c.color)}
          >
            <span className="color-name">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
