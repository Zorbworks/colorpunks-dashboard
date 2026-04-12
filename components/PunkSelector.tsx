'use client';

import { AlchemyNft, resolveImageUrl } from '@/lib/alchemy';

interface Props {
  punks: AlchemyNft[];
  selectedTokenId: string | null;
  onSelect: (punk: AlchemyNft) => void;
  isLoading: boolean;
  /** When set, punks are displayed in groups with group headers. */
  groups?: { value: string; punks: AlchemyNft[] }[] | null;
}

export function PunkSelector({
  punks,
  selectedTokenId,
  onSelect,
  isLoading,
  groups,
}: Props) {
  if (isLoading) {
    return <div className="empty-rail">LOADING PUNKS…</div>;
  }

  if (!punks.length) {
    return <div className="empty-rail">NO COLORPUNKS IN WALLET</div>;
  }

  // Grouped display.
  if (groups && groups.length > 0) {
    return (
      <div>
        {groups.map((g) => (
          <div key={g.value} style={{ marginBottom: 12 }}>
            <div className="punk-group-label">
              {g.value.toUpperCase().replace(/_/g, ' ')} ({g.punks.length})
            </div>
            <div className="punks-list">
              {g.punks.map((punk) => (
                <PunkButton
                  key={punk.tokenId}
                  punk={punk}
                  isSelected={punk.tokenId === selectedTokenId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat display.
  return (
    <div className="punks-list">
      {punks.map((punk) => (
        <PunkButton
          key={punk.tokenId}
          punk={punk}
          isSelected={punk.tokenId === selectedTokenId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function PunkButton({
  punk,
  isSelected,
  onSelect,
}: {
  punk: AlchemyNft;
  isSelected: boolean;
  onSelect: (punk: AlchemyNft) => void;
}) {
  const src = resolveImageUrl(
    punk.image?.cachedUrl ??
      punk.image?.originalUrl ??
      punk.raw?.metadata?.image
  );
  return (
    <button
      type="button"
      className={`punk${isSelected ? ' sel' : ''}`}
      onClick={() => onSelect(punk)}
      title={punk.name ?? `#${punk.tokenId}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={punk.name ?? `Punk ${punk.tokenId}`} />
      ) : null}
      <span className="punk-num">#{punk.tokenId}</span>
    </button>
  );
}
