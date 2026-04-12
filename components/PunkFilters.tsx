'use client';

import {
  PUNK_TYPE_LABELS,
  type PunkType,
  type PunkTypeFilter,
} from '@/lib/punk-traits';

interface Props {
  typeFilter: PunkTypeFilter;
  onTypeChange: (t: PunkTypeFilter) => void;
  onRandomTrait: () => void;
  /** Currently active random trait grouping label, or null if off. */
  activeTraitGroup: string | null;
}

const TYPES: PunkType[] = ['male', 'female', 'zombie', 'ape', 'alien'];

export function PunkFilters({
  typeFilter,
  onTypeChange,
  onRandomTrait,
  activeTraitGroup,
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
        </div>
      </div>
      <div className="filter-row">
        <span className="filter-label">TRAIT</span>
        <div className="filter-group">
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
            ⚅ {activeTraitGroup ? activeTraitGroup.toUpperCase().replace('_', ' ') : 'RANDOM'}
          </button>
        </div>
      </div>
    </>
  );
}
