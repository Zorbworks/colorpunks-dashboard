'use client';

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
  if (isLoading) {
    return <div className="empty-rail">LOADING PALETTES…</div>;
  }

  if (palettes.length === 0) {
    return (
      <div className="empty-rail">
        NO PALETTES FOUND
        <br />
        <a
          href="https://www.basecolors.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}
        >
          CREATE ONE ON BASECOLORS.COM ↗
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
                {p.colors.map((c, i) => (
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
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
