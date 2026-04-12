'use client';

import { Modal } from './Modal';
import { useRecentColored } from '@/hooks/useRecentColored';

interface Props {
  open: boolean;
  onClose: () => void;
}

function timeAgo(timestamp: number): string {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return `${seconds}S AGO`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`;
  return `${Math.floor(seconds / 86400)}D AGO`;
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
              title={`#${item.tokenId} · ${item.user}`}
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={`ColorPunk #${item.tokenId}`}
                  loading="lazy"
                />
              )}
              <div className="gallery-meta">
                <span>#{item.tokenId}</span>
                <span className="muted">{timeAgo(item.timestamp)}</span>
              </div>
            </div>
          ))}
      </div>
    </Modal>
  );
}
