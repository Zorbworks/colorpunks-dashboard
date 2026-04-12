'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PunkSelector } from '@/components/PunkSelector';
import { ColorPalette } from '@/components/ColorPalette';
import { ColorFilters } from '@/components/ColorFilters';
import { Canvas, CanvasHandle } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { SaveButton } from '@/components/SaveButton';

import { useUserPunks } from '@/hooks/useUserPunks';
import { useUserColors } from '@/hooks/useUserColors';
import { useResetPunk } from '@/hooks/useResetPunk';

import { resolveImageUrl, type AlchemyNft } from '@/lib/alchemy';
import {
  applyFilters,
  DEFAULT_FILTERS,
  enrichColors,
  type ColorFilters as Filters,
} from '@/lib/color';

export default function Page() {
  const { isConnected } = useAccount();
  const { data: punks, isLoading: punksLoading } = useUserPunks();
  const { data: rawColors, isLoading: colorsLoading } = useUserColors();

  const [selectedPunk, setSelectedPunk] = useState<AlchemyNft | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const canvasRef = useRef<CanvasHandle>(null);
  const {
    resetPunk,
    isPending: resetPending,
    isConfirming: resetConfirming,
    isSuccess: resetSuccess,
  } = useResetPunk();

  // Auto-select the first punk once they load so the canvas isn't empty.
  useEffect(() => {
    if (!selectedPunk && punks && punks.length > 0) {
      setSelectedPunk(punks[0]);
    }
  }, [punks, selectedPunk]);

  // Determine the Reset button's display state.
  const resetState = resetPending
    ? 'pending'
    : resetConfirming
      ? 'confirming'
      : resetSuccess
        ? 'success'
        : 'idle';

  const handleReset = useCallback(() => {
    if (!selectedPunk) return;
    const ok = window.confirm(
      `Reset punk #${selectedPunk.tokenId} to its original uncolored state?\n\n` +
        'This calls updateTokenURI on-chain with an empty URI, clearing ' +
        'any custom artwork. You\u2019ll need to sign a transaction.'
    );
    if (!ok) return;
    resetPunk(BigInt(selectedPunk.tokenId));
  }, [selectedPunk, resetPunk]);

  const enriched = useMemo(
    () => enrichColors(rawColors ?? []),
    [rawColors]
  );
  const filtered = useMemo(
    () => applyFilters(enriched, filters),
    [enriched, filters]
  );

  const imageUrl = useMemo(() => {
    if (!selectedPunk) return null;
    return (
      resolveImageUrl(selectedPunk.image?.cachedUrl) ??
      resolveImageUrl(selectedPunk.image?.originalUrl) ??
      resolveImageUrl(selectedPunk.raw?.metadata?.image) ??
      null
    );
  }, [selectedPunk]);

  const punkCount = punks?.length ?? 0;
  const allColorCount = rawColors?.length ?? 0;

  return (
    <div className="page">
      <Header />

      {!isConnected ? (
        <main className="main" style={{ gridTemplateColumns: '1fr' }}>
          <section className="connect-screen">
            <h2>CONNECT YOUR WALLET</h2>
            <p>
              Connect a wallet on Base that owns at least one ColorPunk and one
              BaseColor. The app will load your punks and colors, and you&apos;ll
              be able to paint and save on-chain.
            </p>
          </section>
        </main>
      ) : (
        <main className="main">
          {/* ---------- Punks rail ---------- */}
          <aside className="rail punks-rail">
            <div className="rail-head">
              <h2>
                [01] YOUR PUNKS ·{' '}
                {String(punkCount).padStart(2, '0')}
              </h2>
            </div>
            <div className="rail-scroll">
              <PunkSelector
                punks={punks ?? []}
                selectedTokenId={selectedPunk?.tokenId ?? null}
                onSelect={setSelectedPunk}
                isLoading={punksLoading}
              />
            </div>
          </aside>

          {/* ---------- Canvas ---------- */}
          <section className="center">
            <div className="center-head">
              <span>[02] CANVAS</span>
              <b>{selectedPunk ? `#${selectedPunk.tokenId}` : '—'}</b>
            </div>
            <Canvas
              ref={canvasRef}
              imageUrl={imageUrl}
              selectedColor={selectedColor}
            />
            <Toolbar
              disabled={!selectedPunk}
              onUndo={() => canvasRef.current?.undo()}
              onReset={handleReset}
              onRandom={() => {
                if (filtered.length === 0) return;
                canvasRef.current?.randomize(filtered);
              }}
              resetState={resetState as 'idle' | 'pending' | 'confirming' | 'success'}
            />
            <SaveButton
              punk={selectedPunk}
              getCanvas={() => canvasRef.current?.getCanvas() ?? null}
            />
          </section>

          {/* ---------- Colors rail ---------- */}
          <aside className="rail colors-rail">
            <div className="rail-head">
              <h2>
                [03] BASECOLORS ·{' '}
                {String(filtered.length).padStart(2, '0')} /{' '}
                {String(allColorCount).padStart(2, '0')}
              </h2>
              <ColorFilters filters={filters} onChange={setFilters} />
            </div>
            <div className="rail-scroll">
              <ColorPalette
                colors={filtered}
                allColorCount={allColorCount}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                isLoading={colorsLoading}
              />
            </div>
          </aside>
        </main>
      )}

      <Footer />
    </div>
  );
}
