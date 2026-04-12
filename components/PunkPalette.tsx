'use client';

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

  return (
    <div className="punk-palette">
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
            {name && <span className="punk-palette-hex">{c.hex}</span>}
            <span className="punk-palette-pct">{c.percentage}%</span>
          </button>
        );
      })}
    </div>
  );
}
