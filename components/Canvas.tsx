'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { floodFill, hexToRgba, loadImage } from '@/lib/canvas';
import { resolveImageUrl, type UserColor } from '@/lib/alchemy';

export interface ColorInfo {
  hex: string;
  count: number;
  percentage: number;
}

export interface CanvasHandle {
  /** Returns the current HTMLCanvasElement (for IPFS upload). */
  getCanvas: () => HTMLCanvasElement | null;
  /** Revert the canvas to the originally-loaded image. */
  reset: () => void;
  /** Undo the last fill / randomize. */
  undo: () => void;
  /**
   * Replace every fillable region of the current image with a random color
   * from the provided palette. Outline pixels are preserved. Each unique
   * source color maps to a single random palette entry, so regions painted
   * one color stay one color.
   */
  randomize: (palette: UserColor[]) => void;
  /** Extract all unique non-outline colors from the current canvas with pixel counts. */
  extractColors: () => ColorInfo[];
}

interface Props {
  imageUrl: string | null;
  selectedColor: string | null;
  /** Internal resolution for the image data. */
  workSize?: number;
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  { imageUrl, selectedColor, workSize = 512 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // (Re)load the image whenever imageUrl changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = workSize;
    canvas.height = workSize;
    ctx.imageSmoothingEnabled = false;

    const resolved = resolveImageUrl(imageUrl) ?? imageUrl;

    loadImage(resolved)
      .then((img) => {
        if (cancelled) return;
        ctx.clearRect(0, 0, workSize, workSize);
        ctx.drawImage(img, 0, 0, workSize, workSize);
        try {
          originalDataRef.current = ctx.getImageData(0, 0, workSize, workSize);
          historyRef.current = [];
        } catch {
          setError('CANNOT READ CANVAS — IMAGE HOST BLOCKS CORS');
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('FAILED TO LOAD PUNK IMAGE');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, workSize]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    reset: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const original = originalDataRef.current;
      if (!canvas || !ctx || !original) return;
      ctx.putImageData(original, 0, 0);
      historyRef.current = [];
    },
    undo: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const prev = historyRef.current.pop();
      if (prev) ctx.putImageData(prev, 0, 0);
    },
    extractColors: (): ColorInfo[] => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return [];
      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = data.data;
        const counts = new Map<string, number>();
        let totalFillable = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          // Only skip pure black (outline pixels). Threshold of 3 catches
          // antialiased edges but preserves very dark BaseColors like #0A0A0A.
          if (pixels[i] < 3 && pixels[i + 1] < 3 && pixels[i + 2] < 3) continue;
          if (pixels[i + 3] < 128) continue;
          const hex =
            '#' +
            ((1 << 24) | (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2])
              .toString(16)
              .slice(1)
              .toUpperCase();
          counts.set(hex, (counts.get(hex) || 0) + 1);
          totalFillable++;
        }
        return Array.from(counts.entries())
          .map(([hex, count]) => ({
            hex,
            count,
            percentage: totalFillable > 0 ? Math.round((count / totalFillable) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);
      } catch {
        return [];
      }
    },
    randomize: (palette: UserColor[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx || !palette.length) return;
      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Push current state onto the history stack so Undo reverses Random.
        historyRef.current.push(
          new ImageData(
            new Uint8ClampedArray(data.data),
            data.width,
            data.height
          )
        );
        if (historyRef.current.length > 50) historyRef.current.shift();

        const pixels = data.data;
        const replacements = new Map<number, [number, number, number, number]>();
        for (let i = 0; i < pixels.length; i += 4) {
          // Skip near-black outline pixels.
          if (pixels[i] < 3 && pixels[i + 1] < 3 && pixels[i + 2] < 3) continue;
          const key = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
          let c = replacements.get(key);
          if (!c) {
            const rnd = palette[Math.floor(Math.random() * palette.length)];
            c = hexToRgba(rnd.color);
            replacements.set(key, c);
          }
          pixels[i] = c[0];
          pixels[i + 1] = c[1];
          pixels[i + 2] = c[2];
        }
        ctx.putImageData(data, 0, 0);
      } catch {
        setError('CANNOT RANDOMIZE — IMAGE HOST BLOCKS CORS');
      }
    },
  }));

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !selectedColor) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(
        new ImageData(
          new Uint8ClampedArray(imageData.data),
          imageData.width,
          imageData.height
        )
      );
      if (historyRef.current.length > 50) historyRef.current.shift();

      floodFill(imageData, x, y, hexToRgba(selectedColor));
      ctx.putImageData(imageData, 0, 0);
    } catch {
      setError('CANNOT PAINT — IMAGE HOST BLOCKS CORS');
    }
  }

  return (
    <>
      {imageUrl ? (
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          width={workSize}
          height={workSize}
        />
      ) : (
        <div className="canvas-placeholder">
          SELECT A PUNK TO START COLORING
        </div>
      )}
      {loading && <div className="canvas-error">LOADING…</div>}
      {error && <div className="canvas-error">{error}</div>}
    </>
  );
});
