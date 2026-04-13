export type RGBA = [number, number, number, number];

export function hexToRgba(hex: string): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        255,
      ]
    : [0, 0, 0, 255];
}

function colorsMatch(a: RGBA, b: RGBA, tolerance = 0) {
  if (tolerance === 0) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

function isOutline(c: RGBA): boolean {
  // Treat near-black with full alpha as outline, don't overwrite it.
  // Only treat pure black as outline. Threshold of 3 catches antialiased
  // edges but allows very dark BaseColors to be painted over.
  return c[3] === 255 && c[0] < 3 && c[1] < 3 && c[2] < 3;
}

/**
 * Flood-fill implementation using a stack. Will not fill outline pixels.
 * Mutates the passed-in ImageData in place.
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: RGBA
) {
  const { data, width, height } = imageData;

  const idx = (x: number, y: number) => (y * width + x) * 4;

  const getPixel = (x: number, y: number): RGBA => {
    const i = idx(x, y);
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const setPixel = (x: number, y: number, color: RGBA) => {
    const i = idx(x, y);
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  };

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const target = getPixel(startX, startY);
  if (isOutline(target)) return;
  if (colorsMatch(target, fillColor)) return;

  // Small tolerance so scaled/antialiased edges still fill cleanly.
  const tolerance = 8;

  const stack: Array<[number, number]> = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const current = getPixel(x, y);
    if (isOutline(current)) continue;
    if (!colorsMatch(current, target, tolerance)) continue;

    setPixel(x, y, fillColor);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

/** Load an image element from a URL with CORS enabled so we can read pixels. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}
