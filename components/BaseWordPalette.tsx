'use client';

import type { UserColor } from '@/lib/alchemy';
import type { BaseWordTokenData } from '@/hooks/useBaseWordData';

interface Props {
  tokenId: string | null;
  data: BaseWordTokenData | null | undefined;
  baseColors: UserColor[];
  /** Click a row → sets which field is being edited + the picked hex. */
  onPickText: (hex: string) => void;
  onPickBg: (hex: string) => void;
  selectedHex?: string | null;
}

/**
 * DETAILS tab for BaseWords: shows the word list, token id, and the two
 * active colors. Clicking a color row selects it in the right-hand palette.
 */
export function BaseWordPalette({
  tokenId,
  data,
  baseColors,
  onPickText,
  onPickBg,
  selectedHex,
}: Props) {
  if (!tokenId) {
    return (
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-value">
          SELECT A BASEWORD TO SEE DETAILS
        </span>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-value">LOADING…</span>
      </div>
    );
  }

  const nameByHex = new Map<string, string>();
  for (const bc of baseColors) {
    if (bc.isNamed) nameByHex.set(bc.color.toUpperCase(), bc.name);
  }

  const textHex = normalize(data.textColor);
  const bgHex = normalize(data.backgroundColor);

  return (
    <>
      <div className="punk-palette-section">TOKEN</div>
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-type">ID</span>
        <span className="punk-palette-trait-value">#{tokenId}</span>
      </div>
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-type">WORDS</span>
        <span className="punk-palette-trait-value">
          {data.words.join(' / ') || '—'}
        </span>
      </div>
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-type">COUNT</span>
        <span className="punk-palette-trait-value">
          {String(data.wordCount)}
        </span>
      </div>
      <div className="punk-palette-trait">
        <span className="punk-palette-trait-type">INVERTED</span>
        <span className="punk-palette-trait-value">
          {data.isInverted ? 'YES' : 'NO'}
        </span>
      </div>

      <div className="punk-palette-section">COLORS</div>
      <ColorRow
        label="TEXT"
        hex={textHex}
        name={textHex ? nameByHex.get(textHex.toUpperCase()) : undefined}
        selected={selectedHex === textHex}
        onClick={() => textHex && onPickText(textHex)}
      />
      <ColorRow
        label="BACKGROUND"
        hex={bgHex}
        name={bgHex ? nameByHex.get(bgHex.toUpperCase()) : undefined}
        selected={selectedHex === bgHex}
        onClick={() => bgHex && onPickBg(bgHex)}
      />
    </>
  );
}

function ColorRow({
  label,
  hex,
  name,
  selected,
  onClick,
}: {
  label: string;
  hex: string | null;
  name: string | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`punk-palette-row${selected ? ' selected' : ''}`}
      onClick={onClick}
      disabled={!hex}
    >
      <span
        className="punk-palette-swatch"
        style={{ backgroundColor: hex ?? 'transparent' }}
      />
      <span className="punk-palette-name">
        {name ? name.toUpperCase() : hex ?? '—'}
      </span>
      {name && hex && <span className="punk-palette-hex">{hex}</span>}
      <span className="punk-palette-pct">{label}</span>
    </button>
  );
}

function normalize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return t;
}
