'use client';

import { Modal } from './Modal';
import { useRecentColored } from '@/hooks/useRecentColored';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RecentModal({ open, onClose }: Props) {
  const { data, isLoading, error } = useRecentColored(open, 24);

  return (
    <Modal open={open} onClose={onClose} title="[ RECENT ] LATEST 24">
      <div className="gallery-grid">
        {isLoading && <div className="gallery-loading">LOADING…</div>}
        {!isLoading && error && (
          <div className="gallery-loading">COULD NOT LOAD RECENT ACTIVITY</div>
        )}
        {!isLoading && data && data.length === 0 && (
          <div className="gallery-loading">NO RECENT ACTIVITY</div>
        )}
        {!isLoading &&
          data &&
          data.map((item) => (
            <div
              className="gallery-item"
              key={`${item.tokenId}-${item.txHash}`}
              title={item.user}
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={`ColorPunk #${item.tokenId}`}
                  loading="lazy"
                />
              )}
              <div className="gallery-meta-below">
                <span className="gallery-meta-id">#{item.tokenId}</span>
                <span className="gallery-meta-name">{item.displayName}</span>
              </div>
            </div>
          ))}
      </div>
    </Modal>
  );
}
