'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PunkSelector } from '@/components/PunkSelector';
import { ColorPalette } from '@/components/ColorPalette';
import { ColorFilters } from '@/components/ColorFilters';
import { Canvas, CanvasHandle, type ColorInfo } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { SaveButton } from '@/components/SaveButton';
import { PunkPalette } from '@/components/PunkPalette';
import { PunkFilters } from '@/components/PunkFilters';

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
import {
  filterPunksByType,
  getAllTraitTypes,
  groupPunksByTrait,
  type PunkTypeFilter,
} from '@/lib/punk-traits';

export default function Page() {
  const { isConnected, address } = useAccount();
  const { data: punks, isLoading: punksLoading } = useUserPunks();
  const { data: rawColors, isLoading: colorsLoading } = useUserColors();

  const [selectedPunk, setSelectedPunk] = useState<AlchemyNft | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [centerTab, setCenterTab] = useState<'canvas' | 'details'>('canvas');
  const [paletteColors, setPaletteColors] = useState<ColorInfo[]>([]);
  const [punkTypeFilter, setPunkTypeFilter] = useState<PunkTypeFilter>('all');
  const [traitGroupBy, setTraitGroupBy] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const {
    resetPunk,
    isPending: resetPending,
    isConfirming: resetConfirming,
    isSuccess: resetSuccess,
  } = useResetPunk();
  const queryClient = useQueryClient();

  // Auto-select the first punk on load, and keep selectedPunk in sync
  // with the latest query data so the canvas always shows the freshest
  // image (e.g. after save or reset triggers a refetch).
  useEffect(() => {
    if (!punks || punks.length === 0) return;
    if (!selectedPunk) {
      setSelectedPunk(punks[0]);
    } else {
      // If we already have a punk selected, update it to the fresh
      // version from the latest query so the imageUrl refreshes.
      const fresh = punks.find((p) => p.tokenId === selectedPunk.tokenId);
      if (fresh && fresh !== selectedPunk) {
        setSelectedPunk(fresh);
      }
    }
  }, [punks]); // eslint-disable-line react-hooks/exhaustive-deps

  // After reset tx confirms, invalidate the punks query so the grid
  // and canvas both pick up the restored original image.
  useEffect(() => {
    if (!resetSuccess || !address) return;
    queryClient.invalidateQueries({ queryKey: ['user-punks', address] });
  }, [resetSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-extract palette colors when the punk changes while palette tab is open.
  // Small delay lets the canvas finish drawing the new image first.
  useEffect(() => {
    if (centerTab !== 'details' || !selectedPunk) return;
    const timer = setTimeout(() => {
      setPaletteColors(canvasRef.current?.extractColors() ?? []);
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedPunk, centerTab]);

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
        'This restores the original black-and-white artwork on-chain. ' +
        'You\u2019ll need to sign a transaction.'
    );
    if (!ok) return;
    resetPunk(BigInt(selectedPunk.tokenId));
  }, [selectedPunk, resetPunk]);

  const filteredPunks = useMemo(
    () => filterPunksByType(punks ?? [], punkTypeFilter),
    [punks, punkTypeFilter]
  );

  const punkGroups = useMemo(() => {
    if (!traitGroupBy || !filteredPunks.length) return null;
    return groupPunksByTrait(filteredPunks, traitGroupBy);
  }, [filteredPunks, traitGroupBy]);

  const handleRandomTrait = useCallback(() => {
    const traitTypes = getAllTraitTypes(punks ?? []);
    if (traitTypes.length === 0) return;
    const random = traitTypes[Math.floor(Math.random() * traitTypes.length)];
    setTraitGroupBy((prev) => (prev === random ? null : random));
  }, [punks]);

  const handlePunkTypeChange = useCallback((t: PunkTypeFilter) => {
    setPunkTypeFilter(t);
    setTraitGroupBy(null);
  }, []);

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
                {String(filteredPunks.length).padStart(2, '0')}
                {punkTypeFilter !== 'all' && ` / ${punkCount}`}
              </h2>
              <PunkFilters
                typeFilter={punkTypeFilter}
                onTypeChange={handlePunkTypeChange}
                onRandomTrait={handleRandomTrait}
                activeTraitGroup={traitGroupBy}
              />
            </div>
            <div className="rail-scroll">
              <PunkSelector
                punks={filteredPunks}
                selectedTokenId={selectedPunk?.tokenId ?? null}
                onSelect={setSelectedPunk}
                isLoading={punksLoading}
                groups={punkGroups}
              />
            </div>
          </aside>

          {/* ---------- Canvas ---------- */}
          <section className="center">
            <div className="center-head">
              <span>[02] CANVAS</span>
              <div className="center-tabs">
                <button
                  type="button"
                  className={`center-tab${centerTab === 'canvas' ? ' active' : ''}`}
                  onClick={() => setCenterTab('canvas')}
                >
                  PAINT
                </button>
                <button
                  type="button"
                  className={`center-tab${centerTab === 'details' ? ' active' : ''}`}
                  onClick={() => {
                    setPaletteColors(canvasRef.current?.extractColors() ?? []);
                    setCenterTab('details');
                  }}
                >
                  DETAILS
                </button>
              </div>
              <b>{selectedPunk ? `#${selectedPunk.tokenId}` : '—'}</b>
            </div>
            {/* Always render Canvas (even when palette tab is active) so the
                image loads in the background and extractColors works. */}
            <div style={{ display: centerTab === 'canvas' ? undefined : 'none' }}>
              <Canvas
                ref={canvasRef}
                imageUrl={imageUrl}
                selectedColor={selectedColor}
              />
            </div>
            {centerTab === 'details' && (
              <PunkPalette
                colors={paletteColors}
                baseColors={rawColors ?? []}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                punk={selectedPunk}
              />
            )}
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
