'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Tracks which hex value is currently flashing "COPIED!" — same
  // pattern used in the swatch grid. Cleared on a 1.2s timer so the
  // chip returns to its normal hex glyph.
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async (hex: string) => {
    const value = hex.toUpperCase();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for restricted contexts (e.g. embedded preview frames).
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
        copiedHex={copiedHex}
        onCopy={handleCopy}
      />
      <ColorRow
        label="BACKGROUND"
        hex={bgHex}
        name={bgHex ? nameByHex.get(bgHex.toUpperCase()) : undefined}
        selected={selectedHex === bgHex}
        onClick={() => bgHex && onPickBg(bgHex)}
        copiedHex={copiedHex}
        onCopy={handleCopy}
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
  copiedHex,
  onCopy,
}: {
  label: string;
  hex: string | null;
  name: string | undefined;
  selected: boolean;
  onClick: () => void;
  copiedHex: string | null;
  onCopy: (hex: string) => void;
}) {
  const isCopied = !!hex && copiedHex === hex.toUpperCase();
  // Combined "NAME / #HEX" display — falls back to just the hex when
  // the swatch has no custom name. Empty rows show an em-dash.
  const display = hex
    ? name
      ? `${name.toUpperCase()} / ${hex}`
      : hex
    : '—';
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
      {/* name + copy live together in a flex:1 wrapper so the copy
          glyph sits right after the hex text with a fixed gap, while
          the wrapper itself absorbs the row's free space — pushing
          the TEXT / BACKGROUND label to the far right. */}
      <span className="punk-palette-text">
        <span className="punk-palette-name">{display}</span>
        {hex && (
          <span
            className={`punk-palette-copy${isCopied ? ' copied' : ''}`}
            role="button"
            tabIndex={0}
            title={isCopied ? 'Copied!' : `Copy ${hex}`}
            aria-label={`Copy ${hex}`}
            onClick={(e) => {
              e.stopPropagation();
              onCopy(hex);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onCopy(hex);
              }
            }}
          >
            {isCopied ? '✓' : '⎘'}
          </span>
        )}
      </span>
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
