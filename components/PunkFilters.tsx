'use client';

import {
  PUNK_TYPE_LABELS,
  type PunkType,
  type PunkTypeFilter,
  type PunkSort,
} from '@/lib/punk-traits';

interface Props {
  typeFilter: PunkTypeFilter;
  onTypeChange: (t: PunkTypeFilter) => void;
  onRandomTrait: () => void;
  activeTraitGroup: string | null;
  sort: PunkSort;
  onSortChange: (s: PunkSort) => void;
}

const TYPES: PunkType[] = ['male', 'female', 'zombie', 'ape', 'alien'];

const SORTS: { key: PunkSort; label: string }[] = [
  { key: 'recent', label: 'RECENT' },
  { key: 'rare', label: 'RARITY' },
  { key: 'id-desc', label: 'ID ↓' },
  { key: 'id-asc', label: 'ID ↑' },
];

export function PunkFilters({
  typeFilter,
  onTypeChange,
  onRandomTrait,
  activeTraitGroup,
  sort,
  onSortChange,
}: Props) {
  return (
    <>
      <div className="filter-row">
        <span className="filter-label">TYPE</span>
        <div className="filter-group">
          <button
            type="button"
            className={`chip${typeFilter === 'all' ? ' active' : ''}`}
            onClick={() => onTypeChange('all')}
          >
            ALL
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${typeFilter === t ? ' active' : ''}`}
              onClick={() => onTypeChange(t)}
            >
              {PUNK_TYPE_LABELS[t]}
            </button>
          ))}
          <div className="filter-group" style={{ marginLeft: 6 }}>
            <button
              type="button"
              className={`chip${!activeTraitGroup ? ' active' : ''}`}
              onClick={() => onTypeChange(typeFilter)}
            >
              —
            </button>
            <button
              type="button"
              className={`chip${activeTraitGroup ? ' active' : ''}`}
              onClick={onRandomTrait}
              title="Group by a random trait"
            >
              ⚅ {activeTraitGroup ? activeTraitGroup.toUpperCase().replace(/_/g, ' ') : 'TRAIT'}
            </button>
          </div>
        </div>
      </div>
      <div className="filter-row">
        <span className="filter-label">SORT</span>
        <div className="filter-group">
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`chip${sort === key ? ' active' : ''}`}
              onClick={() => onSortChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
