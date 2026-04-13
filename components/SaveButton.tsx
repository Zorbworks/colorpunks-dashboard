'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useSavePunk } from '@/hooks/useSavePunk';
import { uploadColoredPunk } from '@/lib/ipfs';
import type { AlchemyNft } from '@/lib/alchemy';
import { COLOR_PUNKS_ADDRESS } from '@/lib/contracts';

interface Props {
  punk: AlchemyNft | null;
  getCanvas: () => HTMLCanvasElement | null;
}

export function SaveButton({ punk, getCanvas }: Props) {
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { savePunk, hash, isPending, isConfirming, isSuccess, error, reset } =
    useSavePunk();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  // Once the tx confirms, wait briefly for the block to propagate then
  // invalidate all punk-related queries so the grid re-fetches fresh data.
  useEffect(() => {
    if (!isSuccess || !address) return;
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['user-punks', address] });
      queryClient.invalidateQueries({ queryKey: ['punk-sort-data', address] });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, address, queryClient]);

  // Reset the save state when a different punk is selected so the
  // button goes back to "SAVE ONCHAIN" instead of staying on "SAVED".
  useEffect(() => {
    reset();
    setStatus('');
  }, [punk?.tokenId]); // eslint-disable-line react-hooks/exhaustive-deps

  const disabled = !punk || uploading || isPending || isConfirming;

  async function handleSave() {
    if (!punk) return;
    const canvas = getCanvas();
    if (!canvas) {
      setStatus('Canvas not ready');
      return;
    }

    try {
      setUploading(true);
      setStatus('UPLOADING TO IPFS…');
      const metadataUri = await uploadColoredPunk(canvas, punk);
      setStatus('CONFIRM IN YOUR WALLET…');
      savePunk(BigInt(punk.tokenId), metadataUri);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setStatus(`ERROR: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  const label = uploading
    ? 'UPLOADING…'
    : isPending
      ? 'WAITING FOR WALLET…'
      : isConfirming
        ? 'CONFIRMING ON BASE…'
        : isSuccess
          ? 'SAVED ✓'
          : 'SAVE ONCHAIN';

  const errorText =
    error &&
    (('shortMessage' in (error as object) &&
      (error as { shortMessage?: string }).shortMessage) ||
      (error as Error).message);

  return (
    <div>
      <button
        type="button"
        className="save"
        onClick={handleSave}
        disabled={disabled}
      >
        {label}
      </button>

      {status && !isSuccess && !error && (
        <div className="save-status">{status}</div>
      )}

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
          {punk && (
            <a
              href={`https://opensea.io/assets/base/${COLOR_PUNKS_ADDRESS}/${punk.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              OPENSEA
            </a>
          )}
        </div>
      )}
    </div>
  );
}
