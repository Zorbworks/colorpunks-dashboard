'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/Header';
import { ConnectButton } from '@/components/ConnectButton';
import { Footer } from '@/components/Footer';
import { PunkSelector } from '@/components/PunkSelector';
import { ColorPalette } from '@/components/ColorPalette';
import { ColorFilters } from '@/components/ColorFilters';
import { Canvas, CanvasHandle, type ColorInfo } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { SaveButton } from '@/components/SaveButton';
import { PunkPalette } from '@/components/PunkPalette';
import { PunkFilters } from '@/components/PunkFilters';
import { PaletteBrowser } from '@/components/PaletteBrowser';
import { BaseWordsMintForm } from '@/components/BaseWordsMintForm';

import { useUserPunks } from '@/hooks/useUserPunks';
import { useUserColors } from '@/hooks/useUserColors';
import { useUserPalettes, type UserPalette } from '@/hooks/useUserPalettes';
import { useResetPunk } from '@/hooks/useResetPunk';
import { usePunkSortData } from '@/hooks/usePunkSortData';

import { resolveImageUrl, type AlchemyNft } from '@/lib/alchemy';
import { BASEWORDS_ADDRESS, COLOR_PUNKS_ADDRESS } from '@/lib/contracts';
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
  sortPunks,
  type PunkTypeFilter,
  type PunkSort,
  type SortMaps,
} from '@/lib/punk-traits';

type Project = 'basewords' | 'colorpunks';

export default function Page() {
  const { isConnected, address } = useAccount();
  // Default project is Base Words.
  const [project, setProject] = useState<Project>('basewords');

  const { data: punks, isLoading: punksLoading } = useUserPunks();
  const { data: rawColors, isLoading: colorsLoading } = useUserColors();
  const { data: palettes, isLoading: palettesLoading } = useUserPalettes();
  const { data: punkSortData } = usePunkSortData();

  const [selectedPunk, setSelectedPunk] = useState<AlchemyNft | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [centerTab, setCenterTab] = useState<'canvas' | 'details'>('canvas');
  const [paletteColors, setPaletteColors] = useState<ColorInfo[]>([]);
  const [punkTypeFilter, setPunkTypeFilter] = useState<PunkTypeFilter>('all');
  const [punkSort, setPunkSort] = useState<PunkSort>('default');
  const [traitGroupBy, setTraitGroupBy] = useState<string | null>(null);
  const [colorsTab, setColorsTab] = useState<'colors' | 'palettes'>('colors');
  const [activePalette, setActivePalette] = useState<UserPalette | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const {
    resetPunk,
    isPending: resetPending,
    isConfirming: resetConfirming,
    isSuccess: resetSuccess,
  } = useResetPunk();
  const queryClient = useQueryClient();

  // Clear selected punk when wallet changes so the canvas doesn't show
  // a punk from the previous wallet.
  useEffect(() => {
    setSelectedPunk(null);
    setActivePalette(null);
  }, [address]);

  // Auto-select first punk and keep it fresh (only applies to ColorPunks).
  useEffect(() => {
    if (project !== 'colorpunks') return;
    if (!punks || punks.length === 0) return;
    if (!selectedPunk) {
      setSelectedPunk(punks[0]);
      return;
    }
    const fresh = punks.find((p) => p.tokenId === selectedPunk.tokenId);
    if (!fresh) {
      setSelectedPunk(punks[0]);
      return;
    }
    const freshImg =
      fresh.image?.cachedUrl ??
      fresh.image?.originalUrl ??
      fresh.raw?.metadata?.image;
    const currentImg =
      selectedPunk.image?.cachedUrl ??
      selectedPunk.image?.originalUrl ??
      selectedPunk.raw?.metadata?.image;
    if (freshImg !== currentImg) setSelectedPunk(fresh);
  }, [project, punks, punkSort, punkTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resetSuccess || !address) return;
    queryClient.invalidateQueries({ queryKey: ['user-punks', address] });
  }, [resetSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (centerTab !== 'details' || !selectedPunk) return;
    const timer = setTimeout(() => {
      setPaletteColors(canvasRef.current?.extractColors() ?? []);
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedPunk, centerTab]);

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

  const sortMaps: SortMaps | undefined = punkSortData ?? undefined;
  const filteredPunks = useMemo(
    () =>
      sortPunks(
        filterPunksByType(punks ?? [], punkTypeFilter),
        punkSort,
        sortMaps
      ),
    [punks, punkTypeFilter, punkSort, sortMaps]
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

  const enriched = useMemo(() => enrichColors(rawColors ?? []), [rawColors]);
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
        <main className="hero-screen">
          <div className="hero-overlay">
            <h1 className="hero-title">WE ARE SO BACK</h1>
            <p className="hero-sub">
              Connect your wallet and bring your ColorPunks back to life
            </p>
            <ConnectButton />
          </div>
        </main>
      ) : (
        <main className="main">
          {/* ---------- Left: Projects rail ---------- */}
          <aside className="rail punks-rail">
            <div className="rail-head">
              <div className="rail-head-row">
                <h2>
                  {project === 'colorpunks'
                    ? `[01] YOUR PUNKS · ${String(filteredPunks.length).padStart(2, '0')}${
                        punkTypeFilter !== 'all' ? ` / ${punkCount}` : ''
                      }`
                    : `[01] YOUR BASEWORDS`}
                </h2>
                <div className="center-tabs">
                  <button
                    type="button"
                    className={`center-tab${project === 'basewords' ? ' active' : ''}`}
                    onClick={() => setProject('basewords')}
                  >
                    BASEWORDS
                  </button>
                  <button
                    type="button"
                    className={`center-tab${project === 'colorpunks' ? ' active' : ''}`}
                    onClick={() => setProject('colorpunks')}
                  >
                    COLORPUNKS
                  </button>
                </div>
                <a
                  className="center-tab"
                  href={
                    project === 'colorpunks'
                      ? `https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}`
                      : `https://opensea.io/assets/base/${BASEWORDS_ADDRESS}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  BUY MORE
                </a>
              </div>
              {project === 'colorpunks' && (
                <PunkFilters
                  typeFilter={punkTypeFilter}
                  onTypeChange={handlePunkTypeChange}
                  onRandomTrait={handleRandomTrait}
                  activeTraitGroup={traitGroupBy}
                  sort={punkSort}
                  onSortChange={setPunkSort}
                />
              )}
            </div>
            <div className="rail-scroll">
              {project === 'colorpunks' ? (
                <PunkSelector
                  punks={filteredPunks}
                  selectedTokenId={selectedPunk?.tokenId ?? null}
                  onSelect={setSelectedPunk}
                  isLoading={punksLoading}
                  groups={punkGroups}
                />
              ) : (
                <div className="bw-empty">
                  <p className="bw-empty-title">
                    COMING SOON: YOUR BASEWORDS COLLECTION
                  </p>
                  <p className="bw-empty-body">
                    Mint 1–3 uppercase words as a 1/1 onchain NFT.
                    Use the canvas to create your word, then hit MINT.
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* ---------- Center: Canvas (ColorPunks) / Mint form (BaseWords) ---------- */}
          <section className="center">
            <div className="center-head">
              <span>
                {project === 'colorpunks' ? '[02] CANVAS' : '[02] MINT'}
              </span>
              {project === 'colorpunks' && (
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
                      setPaletteColors(
                        canvasRef.current?.extractColors() ?? []
                      );
                      setCenterTab('details');
                    }}
                  >
                    DETAILS
                  </button>
                </div>
              )}
              <b>
                {project === 'colorpunks'
                  ? selectedPunk
                    ? `#${selectedPunk.tokenId}`
                    : '—'
                  : 'BASEWORDS'}
              </b>
            </div>

            {project === 'colorpunks' ? (
              <>
                <div
                  className="canvas-frame"
                  style={{ display: centerTab === 'canvas' ? undefined : 'none' }}
                >
                  <Canvas
                    ref={canvasRef}
                    imageUrl={imageUrl}
                    selectedColor={selectedColor}
                  />
                </div>
                <div
                  className="punk-palette"
                  style={{ display: centerTab === 'details' ? undefined : 'none' }}
                >
                  <PunkPalette
                    colors={paletteColors}
                    baseColors={rawColors ?? []}
                    selectedColor={selectedColor}
                    onSelect={setSelectedColor}
                    punk={selectedPunk}
                  />
                </div>
                <Toolbar
                  disabled={!selectedPunk}
                  onUndo={() => canvasRef.current?.undo()}
                  onReset={handleReset}
                  onRandom={() => {
                    const palette = activePalette
                      ? activePalette.colors.map((c) => ({
                          tokenId: '',
                          color: c.hex,
                          name: c.name,
                          isNamed: c.isNamed,
                          image: null,
                        }))
                      : filtered;
                    if (palette.length === 0) return;
                    canvasRef.current?.randomize(palette);
                  }}
                  resetState={
                    resetState as 'idle' | 'pending' | 'confirming' | 'success'
                  }
                />
                <SaveButton
                  punk={selectedPunk}
                  getCanvas={() => canvasRef.current?.getCanvas() ?? null}
                />
              </>
            ) : (
              <BaseWordsMintForm />
            )}
          </section>

          {/* ---------- Right: Colors / Palettes rail ---------- */}
          <aside className="rail colors-rail">
            <div className="rail-head">
              <div className="rail-head-row">
                <h2>
                  {colorsTab === 'colors'
                    ? `[03] BASECOLORS · ${String(filtered.length).padStart(2, '0')} / ${String(allColorCount).padStart(2, '0')}`
                    : `[03] PALETTES · ${String(palettes?.length ?? 0).padStart(2, '0')}`}
                </h2>
                <div className="center-tabs">
                  <button
                    type="button"
                    className={`center-tab${colorsTab === 'colors' ? ' active' : ''}`}
                    onClick={() => {
                      setColorsTab('colors');
                      setActivePalette(null);
                    }}
                  >
                    BASE COLORS
                  </button>
                  <button
                    type="button"
                    className={`center-tab${colorsTab === 'palettes' ? ' active' : ''}`}
                    onClick={() => setColorsTab('palettes')}
                  >
                    PALETTES
                  </button>
                </div>
              </div>
              {colorsTab === 'colors' && (
                <ColorFilters filters={filters} onChange={setFilters} />
              )}
            </div>
            <div className="rail-scroll">
              {colorsTab === 'colors' ? (
                <ColorPalette
                  colors={filtered}
                  allColorCount={allColorCount}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                  isLoading={colorsLoading}
                />
              ) : (
                <PaletteBrowser
                  palettes={palettes ?? []}
                  isLoading={palettesLoading}
                  selectedPaletteId={activePalette?.tokenId ?? null}
                  onSelect={(p) =>
                    setActivePalette(
                      activePalette?.tokenId === p.tokenId ? null : p
                    )
                  }
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                />
              )}
            </div>
          </aside>
        </main>
      )}

      <Footer />
    </div>
  );
}
