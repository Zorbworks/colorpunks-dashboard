'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import type { UserColor } from '@/lib/alchemy';
import { useBaseWordData } from '@/hooks/useBaseWordData';
import { useUpdateBaseWord } from '@/hooks/useUpdateBaseWord';
import {
  invalidateBaseWordImage,
  refreshBaseWordImage,
} from '@/hooks/useUserBaseWords';
import { BASEWORDS_ADDRESS } from '@/lib/contracts';

export type EditTarget = 'text' | 'bg';

interface Props {
  tokenId: string;
  /** Controlled preview colors (hex). Fall back to the token's saved colors. */
  textColor: string | null;
  bgColor: string | null;
  onTextColorChange: (hex: string | null) => void;
  onBgColorChange: (hex: string | null) => void;
  editTarget: EditTarget;
  onEditTargetChange: (t: EditTarget) => void;
  /** The wallet's owned BaseColors — used to resolve hex → tokenId for saves. */
  ownedColors: UserColor[];
}

export function BaseWordEditor({
  tokenId,
  textColor,
  bgColor,
  onTextColorChange,
  onBgColorChange,
  editTarget,
  onEditTargetChange,
  ownedColors,
}: Props) {
  const qc = useQueryClient();
  const publicClient = usePublicClient();
  const { data: tokenData, isLoading } = useBaseWordData(tokenId);
  const {
    save,
    reset,
    invert,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    clear,
  } = useUpdateBaseWord();

  // Clear the write-tx state (isSuccess etc.) when switching tokens so the
  // previous token's save doesn't leak into the new selection. Don't clear
  // on plain color changes — that would flip isSuccess off mid-refresh and
  // cancel our post-save thumbnail refresh timer.
  useEffect(() => {
    clear();
  }, [tokenId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill the canvas preview colors from the current on-chain token
  // data. Also fires after a save/reset/invert because tokenData refetches
  // with new values — which is what makes the canvas immediately reflect
  // the new colors without a page reload.
  useEffect(() => {
    if (!tokenData) return;
    onTextColorChange(normalizeHex(tokenData.textColor));
    onBgColorChange(normalizeHex(tokenData.backgroundColor));
  }, [tokenData?.textColor, tokenData?.backgroundColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh token data + owned list after a successful save. Also fetch
  // the fresh on-chain image so the left-rail thumbnail updates despite
  // Alchemy's metadata cache still being stale.
  useEffect(() => {
    if (!isSuccess) return;
    invalidateBaseWordImage(tokenId);
    qc.invalidateQueries({ queryKey: ['baseword-data', tokenId] });
    qc.invalidateQueries({ queryKey: ['baseword-meta'] });
    const timer = setTimeout(async () => {
      if (publicClient) {
        await refreshBaseWordImage(tokenId, publicClient);
      }
      qc.invalidateQueries({ queryKey: ['user-basewords'] });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, tokenId, qc, publicClient]);

  const savedText = normalizeHex(tokenData?.textColor ?? null);
  const savedBg = normalizeHex(tokenData?.backgroundColor ?? null);
  const textChanged = !!textColor && textColor !== savedText;
  const bgChanged = !!bgColor && bgColor !== savedBg;
  const anyChanged = textChanged || bgChanged;

  const colorByHex = useMemo(() => {
    const m = new Map<string, UserColor>();
    for (const c of ownedColors) m.set(c.color.toUpperCase(), c);
    return m;
  }, [ownedColors]);

  const handleSave = () => {
    if (!anyChanged) return;
    const textId = textChanged && textColor
      ? colorByHex.get(textColor.toUpperCase())?.tokenId ?? null
      : null;
    const bgId = bgChanged && bgColor
      ? colorByHex.get(bgColor.toUpperCase())?.tokenId ?? null
      : null;
    // Guard: user must own the BaseColor for the hex they picked.
    if (textChanged && !textId) return;
    if (bgChanged && !bgId) return;
    save({ tokenId, textColorTokenId: textId, bgColorTokenId: bgId });
  };

  const handleRandom = () => {
    if (ownedColors.length < 2) return;
    const shuffled = [...ownedColors].sort(() => Math.random() - 0.5);
    const [a, b] = shuffled;
    onTextColorChange(a.color);
    onBgColorChange(b.color);
  };

  const previewWords = tokenData?.words ?? [];
  const previewText = textColor ?? savedText ?? '#0052FF';
  const previewBg = bgColor ?? savedBg ?? '#FFFFFF';

  const saveLabel = isPending
    ? 'SIGN IN WALLET…'
    : isConfirming
      ? 'SAVING…'
      : isSuccess
        ? 'SAVED ✓'
        : 'SAVE';

  const errorText =
    error &&
    (('shortMessage' in (error as object) &&
      (error as { shortMessage?: string }).shortMessage) ||
      (error as Error).message);

  return (
    <div className="bw-mint">
      <div
        className="bw-canvas"
        style={{ backgroundColor: previewBg, borderColor: previewText }}
      >
        {isLoading ? (
          <div className="bw-canvas-msg" style={{ color: previewText }}>
            LOADING…
          </div>
        ) : (
          <div
            className="bw-canvas-readonly"
            style={{ color: previewText }}
          >
            {previewWords.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bw-toolbar">
        <button
          type="button"
          className={`bw-tool${editTarget === 'text' ? ' active' : ''}`}
          onClick={() => onEditTargetChange('text')}
        >
          TEXT
        </button>
        <button
          type="button"
          className={`bw-tool${editTarget === 'bg' ? ' active' : ''}`}
          onClick={() => onEditTargetChange('bg')}
        >
          BG
        </button>
        <button
          type="button"
          className="bw-tool"
          onClick={() => invert(tokenId)}
          disabled={isPending || isConfirming}
          title="Swap to default inverted (white-on-blue)"
        >
          INVERT
        </button>
        <button
          type="button"
          className="bw-tool"
          onClick={handleRandom}
          disabled={ownedColors.length < 2}
        >
          RANDOM
        </button>
        <button
          type="button"
          className="bw-tool"
          onClick={() => reset(tokenId)}
          disabled={isPending || isConfirming}
          title="Reset to default (#0052FF on #FFFFFF)"
        >
          RESET
        </button>
      </div>

      <button
        type="button"
        className="bw-mint-btn"
        onClick={handleSave}
        disabled={!anyChanged || isPending || isConfirming || isSuccess}
      >
        {saveLabel}
      </button>

      {error && <div className="save-status error">{errorText}</div>}

      {isSuccess && hash && (
        <div className="save-status success">
          SAVED.
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            TX
          </a>
          <a
            href={`https://opensea.io/assets/base/${BASEWORDS_ADDRESS}/${tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPENSEA
          </a>
        </div>
      )}
    </div>
  );
}

/** Contract may return "#RRGGBB" or a bare BaseColor name (hex still). */
function normalizeHex(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return trimmed; // unknown — likely a BaseColor name; pass through
}
