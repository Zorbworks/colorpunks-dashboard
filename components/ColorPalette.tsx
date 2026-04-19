'use client';

import type { EnrichedColor } from '@/lib/color';

interface Props {
  colors: EnrichedColor[];
  allColorCount: number;
  selectedColor: string | null;
  onSelect: (hex: string) => void;
  isLoading: boolean;
  /** Hex that should render as disabled (greyed-out, unclickable). Used in
   *  BaseWords to forbid picking the same colour for text and background. */
  disabledColor?: string | null;
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
  disabledColor,
}: Props) {
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
        const label = c.isNamed ? c.name.toUpperCase() : c.color.toUpperCase();
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
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(c.color)}
          >
            <span className="color-name">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
