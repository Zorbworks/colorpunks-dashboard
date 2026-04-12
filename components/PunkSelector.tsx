'use client';

import { AlchemyNft, resolveImageUrl } from '@/lib/alchemy';

interface Props {
  punks: AlchemyNft[];
  selectedTokenId: string | null;
  onSelect: (punk: AlchemyNft) => void;
  isLoading: boolean;
}

export function PunkSelector({
  punks,
  selectedTokenId,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return <div className="empty-rail">LOADING PUNKS…</div>;
  }

  if (!punks.length) {
    return <div className="empty-rail">NO COLORPUNKS IN WALLET</div>;
  }

  return (
    <div className="punks-list">
      {punks.map((punk) => {
        const src = resolveImageUrl(
          punk.image?.cachedUrl ??
            punk.image?.originalUrl ??
            punk.raw?.metadata?.image
        );
        const isSelected = punk.tokenId === selectedTokenId;
        return (
          <button
            key={punk.tokenId}
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
      })}
    </div>
  );
}
