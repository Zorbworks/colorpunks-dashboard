'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

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
import { ProjectHeader } from '@/components/ProjectHeader';
import { ShareModal } from '@/components/ShareModal';
import { buildBaseWordsSvg, svgToDataUri } from '@/lib/basewords';
import { BaseWordEditor, type EditTarget } from '@/components/BaseWordEditor';
import {
  BaseWordFilters,
  type BaseWordSort,
  type WordCountFilter,
} from '@/components/BaseWordFilters';

import { useUserPunks, invalidateFreshImage } from '@/hooks/useUserPunks';
import { useUserBaseWords } from '@/hooks/useUserBaseWords';
import { useBaseWordsMeta } from '@/hooks/useBaseWordsMeta';
import { useBaseWordData } from '@/hooks/useBaseWordData';
import { BaseWordPalette } from '@/components/BaseWordPalette';
import { useUserColors } from '@/hooks/useUserColors';
import { useUserPalettes, type UserPalette } from '@/hooks/useUserPalettes';
import { useResetPunk } from '@/hooks/useResetPunk';
import { usePunkSortData } from '@/hooks/usePunkSortData';

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
  sortPunks,
  type PunkTypeFilter,
  type PunkSort,
  type SortMaps,
} from '@/lib/punk-traits';

export type Project = 'basewords' | 'colorpunks';

interface Props {
  project: Project;
}

export function ProjectPage({ project }: Props) {
  const { isConnected, address } = useAccount();

  const { data: punks, isLoading: punksLoading } = useUserPunks();
  const { data: baseWords, isLoading: baseWordsLoading } = useUserBaseWords();
  const [selectedBaseWord, setSelectedBaseWord] = useState<AlchemyNft | null>(null);
  const [bwTextColor, setBwTextColor] = useState<string | null>(null);
  const [bwBgColor, setBwBgColor] = useState<string | null>(null);
  const [bwEditTarget, setBwEditTarget] = useState<EditTarget>('text');
  const [bwSort, setBwSort] = useState<BaseWordSort>('recent');
  const [bwWordCount, setBwWordCount] = useState<WordCountFilter>('all');
  const [bwCenterTab, setBwCenterTab] = useState<'canvas' | 'details'>('canvas');
  const [shareOpen, setShareOpen] = useState(false);
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

  useEffect(() => {
    setSelectedPunk(null);
    setSelectedBaseWord(null);
    setBwTextColor(null);
    setBwBgColor(null);
    setActivePalette(null);
  }, [address]);

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
    invalidateFreshImage(selectedPunk.tokenId);
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

  const baseWordIds = useMemo(
    () => (baseWords ?? []).map((w) => w.tokenId),
    [baseWords]
  );
  const { data: baseWordsMeta } = useBaseWordsMeta(baseWordIds);
  const { data: selectedBaseWordData } = useBaseWordData(
    selectedBaseWord?.tokenId ?? null
  );

  const filteredBaseWords = useMemo(() => {
    const list = baseWords ?? [];
    const withMeta = list.map((w) => ({
      nft: w,
      meta: baseWordsMeta?.get(w.tokenId),
    }));
    const filtered =
      bwWordCount === 'all'
        ? withMeta
        : withMeta.filter((x) => x.meta?.wordCount === bwWordCount);
    const sorted = filtered.slice().sort((a, b) => {
      if (bwSort === 'colored') {
        const ac = a.meta?.isColored ? 1 : 0;
        const bc = b.meta?.isColored ? 1 : 0;
        if (ac !== bc) return bc - ac;
      }
      const ai = BigInt(a.nft.tokenId);
      const bi = BigInt(b.nft.tokenId);
      if (bwSort === 'oldest') return ai < bi ? -1 : ai > bi ? 1 : 0;
      return ai < bi ? 1 : ai > bi ? -1 : 0;
    });
    return sorted.map((x) => x.nft);
  }, [baseWords, baseWordsMeta, bwSort, bwWordCount]);

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

  // ---- BaseWord share + download helpers ----
  // Resolve the colours currently shown in the canvas (preview-priority)
  // and look up friendly BaseColor names for the share caption.
  const shareData = useMemo(() => {
    if (!selectedBaseWord || !selectedBaseWordData) return null;
    const toHex = (v: string | null | undefined) => {
      if (!v) return null;
      const t = v.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
      if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
      return null;
    };
    const textHex =
      bwTextColor ?? toHex(selectedBaseWordData.textColor) ?? '#0052FF';
    const bgHex =
      bwBgColor ?? toHex(selectedBaseWordData.backgroundColor) ?? '#FFFFFF';
    const nameByHex = new Map<string, string>();
    for (const c of rawColors ?? []) {
      if (c.isNamed) nameByHex.set(c.color.toUpperCase(), c.name);
    }
    const textName = nameByHex.get(textHex.toUpperCase()) ?? textHex;
    const bgName = nameByHex.get(bgHex.toUpperCase()) ?? bgHex;
    const words = selectedBaseWordData.words;
    // Placeholder caption — easy to edit later.
    const shareText =
      `Just crafted "${words.join(' / ')}" on BaseWords — ` +
      `${textName} text on ${bgName} background. ` +
      `Mint yours at basewords.xyz`;
    const svg = buildBaseWordsSvg(words, {
      textColor: textHex,
      bgColor: bgHex,
    });
    return { shareText, svg, tokenId: selectedBaseWord.tokenId, words };
  }, [selectedBaseWord, selectedBaseWordData, bwTextColor, bwBgColor, rawColors]);

  const handleDownloadSvg = () => {
    if (!shareData) return;
    const blob = new Blob([shareData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baseword-${shareData.tokenId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ProjectHeader project={project} />
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
                  : `[01] YOUR BASEWORDS · ${String(filteredBaseWords.length).padStart(2, '0')}${
                      bwWordCount !== 'all'
                        ? ` / ${String((baseWords ?? []).length).padStart(2, '0')}`
                        : ''
                    }`}
              </h2>
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
            {project === 'basewords' && (
              <>
                <BaseWordFilters
                  sort={bwSort}
                  onSortChange={setBwSort}
                  wordCount={bwWordCount}
                  onWordCountChange={setBwWordCount}
                />
                <button
                  type="button"
                  className={`bw-new${selectedBaseWord ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedBaseWord(null);
                    setBwCenterTab('canvas');
                  }}
                  title="Clear selection and mint a new BaseWord"
                >
                  + NEW WORD
                </button>
              </>
            )}
          </div>
          <div className="rail-scroll">
            {!isConnected ? (
              <div className="rail-connect">
                <p>CONNECT WALLET TO VIEW YOUR COLLECTION OR MINT</p>
                <ConnectButton />
              </div>
            ) : project === 'colorpunks' ? (
              <PunkSelector
                punks={filteredPunks}
                selectedTokenId={selectedPunk?.tokenId ?? null}
                onSelect={setSelectedPunk}
                isLoading={punksLoading}
                groups={punkGroups}
              />
            ) : (
              <PunkSelector
                punks={filteredBaseWords}
                selectedTokenId={selectedBaseWord?.tokenId ?? null}
                onSelect={setSelectedBaseWord}
                isLoading={baseWordsLoading}
                loadingLabel="LOADING BASEWORDS…"
                emptyLabel="NO BASEWORDS IN WALLET — MINT ONE"
              />
            )}
          </div>
        </aside>

        {/* ---------- Center ---------- */}
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
            {project === 'basewords' && (
              <div className="center-tabs">
                <button
                  type="button"
                  className={`center-tab${bwCenterTab === 'canvas' ? ' active' : ''}`}
                  onClick={() => setBwCenterTab('canvas')}
                >
                  EDIT
                </button>
                <button
                  type="button"
                  className={`center-tab${bwCenterTab === 'details' ? ' active' : ''}`}
                  onClick={() => setBwCenterTab('details')}
                >
                  DETAILS
                </button>
                <button
                  type="button"
                  className="center-tab"
                  onClick={() => setShareOpen(true)}
                  disabled={!shareData}
                  title={
                    shareData
                      ? 'Share this BaseWord'
                      : 'Select a BaseWord to share'
                  }
                >
                  SHARE
                </button>
                <button
                  type="button"
                  className="center-tab"
                  onClick={handleDownloadSvg}
                  disabled={!shareData}
                  title={
                    shareData
                      ? 'Download SVG'
                      : 'Select a BaseWord to download'
                  }
                >
                  DOWNLOAD
                </button>
              </div>
            )}
            <b>
              {project === 'colorpunks'
                ? selectedPunk
                  ? `#${selectedPunk.tokenId}`
                  : '—'
                : selectedBaseWord
                  ? `#${selectedBaseWord.tokenId}`
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
            <>
              <div
                style={{
                  display: bwCenterTab === 'canvas' ? 'contents' : 'none',
                }}
              >
                {selectedBaseWord ? (
                  <BaseWordEditor
                    tokenId={selectedBaseWord.tokenId}
                    textColor={bwTextColor}
                    bgColor={bwBgColor}
                    onTextColorChange={setBwTextColor}
                    onBgColorChange={setBwBgColor}
                    editTarget={bwEditTarget}
                    onEditTargetChange={setBwEditTarget}
                    ownedColors={rawColors ?? []}
                  />
                ) : (
                  <BaseWordsMintForm />
                )}
              </div>
              <div
                className="punk-palette"
                style={{ display: bwCenterTab === 'details' ? undefined : 'none' }}
              >
                <BaseWordPalette
                  tokenId={selectedBaseWord?.tokenId ?? null}
                  data={selectedBaseWordData}
                  baseColors={rawColors ?? []}
                  selectedHex={
                    bwEditTarget === 'text' ? bwTextColor : bwBgColor
                  }
                  onPickText={(hex) => {
                    setBwEditTarget('text');
                    setBwTextColor(hex);
                  }}
                  onPickBg={(hex) => {
                    setBwEditTarget('bg');
                    setBwBgColor(hex);
                  }}
                />
              </div>
            </>
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
                selectedColor={
                  project === 'basewords' && selectedBaseWord
                    ? bwEditTarget === 'text'
                      ? bwTextColor
                      : bwBgColor
                    : selectedColor
                }
                disabledColor={
                  project === 'basewords' && selectedBaseWord
                    ? bwEditTarget === 'text'
                      ? bwBgColor
                      : bwTextColor
                    : null
                }
                onSelect={(hex) => {
                  if (project === 'basewords' && selectedBaseWord) {
                    // BaseWords must have distinct text + background colors
                    // (otherwise the word is invisible). Silently reject a
                    // pick that would clash with the other target.
                    const h = hex.toUpperCase();
                    if (bwEditTarget === 'text') {
                      if (h === (bwBgColor ?? '').toUpperCase()) return;
                      setBwTextColor(hex);
                    } else {
                      if (h === (bwTextColor ?? '').toUpperCase()) return;
                      setBwBgColor(hex);
                    }
                  } else {
                    setSelectedColor(hex);
                  }
                }}
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

      {shareData && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareText={shareData.shareText}
        />
      )}

      <Footer />
    </>
  );
}
