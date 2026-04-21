'use client';

import { Modal } from './Modal';
import { useRecentColored } from '@/hooks/useRecentColored';
import { useRecentBaseWords } from '@/hooks/useRecentBaseWords';
import type { Project } from './ProjectPage';

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
}

export function RecentModal({ open, onClose, project = 'colorpunks' }: Props) {
  if (project === 'basewords') {
    return <RecentBaseWordsModal open={open} onClose={onClose} />;
  }
  return <RecentColorPunksModal open={open} onClose={onClose} />;
}

function RecentBaseWordsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useRecentBaseWords(open, 24);

  return (
    <Modal open={open} onClose={onClose} title="[ RECENT ] LATEST 24">
      <div className="gallery-grid">
        {isLoading && <div className="gallery-loading">LOADING…</div>}
        {!isLoading && error && (
          <div className="gallery-loading">COULD NOT LOAD RECENT MINTS</div>
        )}
        {!isLoading && data && data.length === 0 && (
          <div className="gallery-loading">NO RECENT MINTS</div>
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
                  alt={`BaseWord #${item.tokenId}`}
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

function RecentColorPunksModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
