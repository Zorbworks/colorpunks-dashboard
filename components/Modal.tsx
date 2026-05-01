'use client';

import { CSSProperties, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Inline styles applied to the modal container — used by the About
   *  CWOMA modal to theme its background/foreground on each open. */
  style?: CSSProperties;
  /** Optional extra class on the modal container — used for size or
   *  layout variants (e.g. the square share modal). Concatenated with
   *  the base `.modal` class. */
  className?: string;
}

/**
 * Base modal rendered via a React portal. Handles:
 *   - backdrop click to close
 *   - ESC key to close
 *   - header with close button
 * Uses the brutalist .modal* classes from globals.css.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  style,
  className,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={style}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
