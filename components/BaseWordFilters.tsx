'use client';

export type BaseWordSort = 'recent' | 'oldest' | 'colored';
export type WordCountFilter = 'all' | 1 | 2 | 3;

interface Props {
  sort: BaseWordSort;
  onSortChange: (s: BaseWordSort) => void;
  wordCount: WordCountFilter;
  onWordCountChange: (w: WordCountFilter) => void;
}

const SORTS: { key: BaseWordSort; label: string }[] = [
  { key: 'recent', label: 'RECENT' },
  { key: 'oldest', label: 'OLDEST' },
  { key: 'colored', label: 'COLORED' },
];

const COUNTS: { key: WordCountFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 1, label: '1' },
  { key: 2, label: '2' },
  { key: 3, label: '3' },
];

export function BaseWordFilters({
  sort,
  onSortChange,
  wordCount,
  onWordCountChange,
}: Props) {
  return (
    <>
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
      <div className="filter-row">
        <span className="filter-label">WORDS</span>
        <div className="filter-group">
          {COUNTS.map(({ key, label }) => (
            <button
              key={String(key)}
              type="button"
              className={`chip${wordCount === key ? ' active' : ''}`}
              onClick={() => onWordCountChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
