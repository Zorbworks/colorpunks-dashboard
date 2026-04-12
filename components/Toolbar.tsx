'use client';

interface Props {
  onUndo: () => void;
  onReset: () => void;
  onRandom: () => void;
  disabled?: boolean;
  /** When set, the Reset button shows a tx-in-progress label instead. */
  resetState?: 'idle' | 'pending' | 'confirming' | 'success';
}

const RESET_LABELS: Record<string, string> = {
  idle: 'RESET',
  pending: 'SIGN TX…',
  confirming: 'CONFIRMING…',
  success: 'RESET ✓',
};

export function Toolbar({
  onUndo,
  onReset,
  onRandom,
  disabled,
  resetState = 'idle',
}: Props) {
  const resetBusy = resetState !== 'idle' && resetState !== 'success';

  return (
    <div className="toolbar">
      <button
        type="button"
        className="tool"
        onClick={onUndo}
        disabled={disabled}
      >
        UNDO
      </button>
      <button
        type="button"
        className="tool"
        onClick={onReset}
        disabled={disabled || resetBusy}
        title="Reset to original uncolored punk (on-chain transaction)"
      >
        {RESET_LABELS[resetState] ?? 'RESET'}
      </button>
      <button
        type="button"
        className="tool random"
        onClick={onRandom}
        disabled={disabled}
      >
        RANDOM ⚅
      </button>
    </div>
  );
}
