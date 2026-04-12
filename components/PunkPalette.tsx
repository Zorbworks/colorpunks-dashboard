'use client';

import type { ColorInfo } from './Canvas';
import type { UserColor } from '@/lib/alchemy';

interface Props {
  colors: ColorInfo[];
  /** The user's BaseColors — used to look up custom names by hex. */
  baseColors: UserColor[];
  /** When set, clicking a color row selects it as the active paint color. */
  onSelect?: (hex: string) => void;
  selectedColor?: string | null;
}

/**
 * Shows a breakdown of all colors found in the current punk.
 * Each color is shown as a swatch + name (if it matches a BaseColor) or hex,
 * plus what percentage of the fillable pixels it covers.
 */
export function PunkPalette({ colors, baseColors, onSelect, selectedColor }: Props) {
  // Build a lookup from hex → BaseColor name.
  const nameByHex = new Map<string, string>();
  for (const bc of baseColors) {
    if (bc.isNamed) {
      nameByHex.set(bc.color.toUpperCase(), bc.name);
    }
  }

  if (colors.length === 0) {
    return <div className="empty-rail">NO COLORS DETECTED</div>;
  }

  return (
    <div className="punk-palette">
      {colors.map((c) => {
        const name = nameByHex.get(c.hex);
        const isSelected = selectedColor === c.hex;
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
            <span className="punk-palette-name">
              {name ? name.toUpperCase() : c.hex}
            </span>
            {name && (
              <span className="punk-palette-hex">{c.hex}</span>
            )}
            <span className="punk-palette-pct">{c.percentage}%</span>
          </button>
        );
      })}
    </div>
  );
}
