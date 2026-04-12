'use client';

import type {
  ColorFilters as Filters,
  HueBucket,
  Tone,
  Age,
} from '@/lib/color';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
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

export function ColorFilters({ filters, onChange }: Props) {
  const setTone = (tone: Tone) => onChange({ ...filters, tone });
  const setHue = (hue: Filters['hue']) => onChange({ ...filters, hue });
  const setAge = (age: Age) => onChange({ ...filters, age });

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
            LIGHT ↓
          </button>
          <button
            type="button"
            className={`chip${filters.tone === 'dark' ? ' active' : ''}`}
            onClick={() => setTone('dark')}
          >
            DARK ↓
          </button>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">HUE</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${filters.hue === 'all' ? ' active' : ''}`}
            onClick={() => setHue('all')}
          >
            ALL
          </button>
          {HUES.map(({ key, color, label }) => (
            <button
              key={key}
              type="button"
              className={`hue-swatch${filters.hue === key ? ' active' : ''}`}
              style={{ background: color }}
              title={label}
              aria-label={`Filter to ${label}`}
              onClick={() => setHue(key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">AGE</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${filters.age === 'new' ? ' active' : ''}`}
            onClick={() => setAge('new')}
          >
            NEW ↓
          </button>
          <button
            type="button"
            className={`chip${filters.age === 'old' ? ' active' : ''}`}
            onClick={() => setAge('old')}
          >
            OLD ↑
          </button>
        </div>
      </div>
    </>
  );
}
