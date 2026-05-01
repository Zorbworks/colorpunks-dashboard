'use client';

import { useCallback } from 'react';
import type {
  ColorFilters as Filters,
  HueBucket,
  Tone,
  Sort,
} from '@/lib/color';
import type { ColorLabelMode } from './ColorPalette';
import { FarcasterIcon } from './FarcasterIcon';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  /** Toggle for the swatch tile label — name vs raw hex. Lives on the
   *  right-hand side of the SORT row. */
  labelMode: ColorLabelMode;
  onLabelModeChange: (mode: ColorLabelMode) => void;
}

const HUES: { key: HueBucket; color: string; label: string }[] = [
  { key: 'red', color: '#E53935', label: 'Red' },
  { key: 'orange', color: '#FB8C00', label: 'Orange' },
  { key: 'yellow', color: '#FDD835', label: 'Yellow' },
  { key: 'green', color: '#43A047', label: 'Green' },
  { key: 'cyan', color: '#00ACC1', label: 'Cyan' },
  { key: 'blue', color: '#1E88E5', label: 'Blue' },
  { key: 'purple', color: '#8E24AA', label: 'Purple' },
  { key: 'gray', color: '#999999', label: 'Gray' },
];

export function ColorFilters({
  filters,
  onChange,
  labelMode,
  onLabelModeChange,
}: Props) {
  const setTone = (tone: Tone) => onChange({ ...filters, tone });
  const setSort = (sort: Sort) => onChange({ ...filters, sort });

  const toggleHue = useCallback(
    (bucket: HueBucket) => {
      const next = new Set(filters.hue);
      if (next.has(bucket)) {
        next.delete(bucket);
      } else {
        next.add(bucket);
      }
      onChange({ ...filters, hue: next });
    },
    [filters, onChange]
  );

  const clearHue = useCallback(() => {
    onChange({ ...filters, hue: new Set() });
  }, [filters, onChange]);

  return (
    <>
      <div className="filter-row">
        <span className="filter-label">TONE</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${filters.tone === 'all' ? ' active' : ''}`}
            onClick={() => setTone('all')}
          >
            ALL
          </button>
          <button
            type="button"
            className={`chip${filters.tone === 'light' ? ' active' : ''}`}
            onClick={() => setTone('light')}
          >
            LIGHT
          </button>
          <button
            type="button"
            className={`chip${filters.tone === 'dark' ? ' active' : ''}`}
            onClick={() => setTone('dark')}
          >
            DARK
          </button>
          <button
            type="button"
            className={`chip${filters.tone === 'vivid' ? ' active' : ''}`}
            onClick={() => setTone('vivid')}
          >
            VIVID
          </button>
          <button
            type="button"
            className={`chip${filters.tone === 'muted' ? ' active' : ''}`}
            onClick={() => setTone('muted')}
          >
            MUTED
          </button>
        </div>
        {/* External BASECOLORS controls — BUY MORE links to the mint
            site, Farcaster button opens the /basecolors channel.
            Right-aligned so the chip cluster on the left stays
            grouped with the TONE label. */}
        <div className="filter-group filter-group-right">
          <a
            className="chip chip-buy"
            href="https://www.basecolors.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Buy more BaseColors at basecolors.com"
          >
            BUY MORE
          </a>
          <a
            className="chip-fc"
            href="https://farcaster.xyz/~/channel/basecolors"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="BaseColors Farcaster channel"
            title="BaseColors Farcaster channel"
          >
            <FarcasterIcon size={12} />
          </a>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">HUE</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${filters.hue.size === 0 ? ' active' : ''}`}
            onClick={clearHue}
          >
            ALL
          </button>
          {HUES.map(({ key, color, label }) => (
            <button
              key={key}
              type="button"
              className={`hue-swatch${filters.hue.has(key) ? ' active' : ''}`}
              style={{ background: color }}
              title={label}
              aria-label={`Toggle ${label}`}
              onClick={() => toggleHue(key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">SORT</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${filters.sort === 'new' ? ' active' : ''}`}
            onClick={() => setSort('new')}
          >
            NEW ↓
          </button>
          <button
            type="button"
            className={`chip${filters.sort === 'old' ? ' active' : ''}`}
            onClick={() => setSort('old')}
          >
            OLD ↑
          </button>
          <button
            type="button"
            className={`chip${filters.sort === 'az' ? ' active' : ''}`}
            onClick={() => setSort('az')}
          >
            A-Z
          </button>
        </div>
        {/* Swatch label-mode toggle — pushed to the right of the SORT
            row so the chips read as a separate "view" control rather
            than another sort option. */}
        <div className="filter-group filter-group-right">
          <button
            type="button"
            className={`chip chip-sm${labelMode === 'name' ? ' active' : ''}`}
            onClick={() => onLabelModeChange('name')}
            title="Show color names"
          >
            NAME
          </button>
          <button
            type="button"
            className={`chip chip-sm${labelMode === 'hex' ? ' active' : ''}`}
            onClick={() => onLabelModeChange('hex')}
            title="Show hex codes"
          >
            HEX
          </button>
        </div>
      </div>
    </>
  );
}
