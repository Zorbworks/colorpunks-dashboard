// Shared mock data + flood-fill engine for the design mockups.
// Loaded by each variation HTML with <script src="./_shared.js"></script>.
(function () {
  'use strict';

  // Distinct near-white greys so each region looks like a "blank coloring book"
  // page but the randomize() palette replacement treats them as separate targets.
  // Outline pixels stay pure black.
  const R = {
    bg:   '#F2F2F2',  // background behind the punk
    face: '#FFFFFF',  // face / skin
    hat:  '#E2E2E2',  // main accessory body (hat crown, cap crown, mohawk)
    band: '#D2D2D2',  // accessory band / brim / stripe
    shirt:'#C8C8C8',  // shirt / collar
  };

  function svgPunk(opts) {
    opts = opts || {};
    const acc = opts.accessory || 'none';
    let accessoryShape = '';
    if (acc === 'hat') {
      accessoryShape = `
        <rect x="5" y="2" width="14" height="1" fill="#000"/>
        <rect x="4" y="3" width="16" height="1" fill="#000"/>
        <rect x="5" y="4" width="14" height="2" fill="${R.hat}"/>
        <rect x="4" y="6" width="16" height="1" fill="${R.band}"/>`;
    } else if (acc === 'band') {
      accessoryShape = `
        <rect x="6" y="4" width="12" height="1" fill="#000"/>
        <rect x="6" y="5" width="12" height="1" fill="${R.band}"/>
        <rect x="6" y="6" width="12" height="1" fill="#000"/>`;
    } else if (acc === 'cap') {
      accessoryShape = `
        <rect x="6" y="3" width="12" height="1" fill="#000"/>
        <rect x="6" y="4" width="12" height="2" fill="${R.hat}"/>
        <rect x="6" y="6" width="12" height="1" fill="#000"/>
        <rect x="14" y="5" width="6" height="1" fill="#000"/>
        <rect x="14" y="6" width="6" height="1" fill="${R.band}"/>
        <rect x="14" y="7" width="6" height="1" fill="#000"/>`;
    } else if (acc === 'mohawk') {
      accessoryShape = `
        <rect x="11" y="1" width="2" height="1" fill="#000"/>
        <rect x="10" y="2" width="4" height="1" fill="#000"/>
        <rect x="10" y="3" width="4" height="3" fill="${R.hat}"/>
        <rect x="10" y="6" width="4" height="1" fill="#000"/>`;
    }
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" shape-rendering="crispEdges">
        <rect width="24" height="24" fill="${R.bg}"/>
        ${accessoryShape}
        <rect x="7" y="7" width="10" height="11" fill="${R.face}"/>
        <rect x="7" y="7"  width="10" height="1" fill="#000"/>
        <rect x="6" y="8"  width="1"  height="10" fill="#000"/>
        <rect x="17" y="8" width="1"  height="10" fill="#000"/>
        <rect x="7" y="18" width="10" height="1" fill="#000"/>
        <rect x="9"  y="10" width="2" height="2" fill="#000"/>
        <rect x="13" y="10" width="2" height="2" fill="#000"/>
        <rect x="11" y="13" width="2" height="1" fill="#000"/>
        <rect x="10" y="15" width="4" height="1" fill="#000"/>
        <rect x="4" y="19" width="16" height="5" fill="${R.shirt}"/>
        <rect x="4" y="19" width="16" height="1" fill="#000"/>
        <rect x="3" y="20" width="1"  height="4" fill="#000"/>
        <rect x="20" y="20" width="1" height="4" fill="#000"/>
        <rect x="11" y="19" width="2" height="2" fill="#000"/>
      </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }

  const PUNKS = [
    { tokenId: '0001', name: 'COLORPUNK #0001', src: svgPunk({ accessory: 'hat'    }) },
    { tokenId: '0042', name: 'COLORPUNK #0042', src: svgPunk({ accessory: 'band'   }) },
    { tokenId: '0137', name: 'COLORPUNK #0137', src: svgPunk({ accessory: 'cap'    }) },
    { tokenId: '0256', name: 'COLORPUNK #0256', src: svgPunk({ accessory: 'none'   }) },
    { tokenId: '0512', name: 'COLORPUNK #0512', src: svgPunk({ accessory: 'mohawk' }) },
    { tokenId: '1024', name: 'COLORPUNK #1024', src: svgPunk({ accessory: 'cap'    }) },
  ];

  const COLORS = [
    { hex: '#FF5733', name: 'Sunset Red' },
    { hex: '#FFC300', name: 'Mustard' },
    { hex: '#DAF7A6', name: 'Mint' },
    { hex: '#33FF57', name: 'Neon Lime' },
    { hex: '#33FFF5', name: 'Cyan Pop' },
    { hex: '#3380FF', name: null },
    { hex: '#8E44AD', name: 'Grape' },
    { hex: '#FF33A8', name: null },
    { hex: '#E5B887', name: 'Skin Tone' },
    { hex: '#5C3317', name: 'Walnut' },
    { hex: '#FFFFFF', name: 'Paper' },
    { hex: '#1C1C1C', name: null },
    { hex: '#0052FF', name: 'Base Blue' },
    { hex: '#FFD700', name: 'Gold' },
    { hex: '#C0C0C0', name: null },
    { hex: '#8B0000', name: 'Blood' },
  ];

  function hexToRgba(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255] : [0, 0, 0, 255];
  }
  function isOutline(c) { return c[3] === 255 && c[0] < 24 && c[1] < 24 && c[2] < 24; }
  function match(a, b, tol) {
    return Math.abs(a[0] - b[0]) <= tol
        && Math.abs(a[1] - b[1]) <= tol
        && Math.abs(a[2] - b[2]) <= tol
        && Math.abs(a[3] - b[3]) <= tol;
  }
  function floodFill(imageData, sx, sy, fill) {
    const { data, width, height } = imageData;
    const idx = (x, y) => (y * width + x) * 4;
    const get = (x, y) => [data[idx(x,y)], data[idx(x,y)+1], data[idx(x,y)+2], data[idx(x,y)+3]];
    const set = (x, y, c) => { const i = idx(x,y); data[i]=c[0]; data[i+1]=c[1]; data[i+2]=c[2]; data[i+3]=c[3]; };
    if (sx<0||sx>=width||sy<0||sy>=height) return;
    const target = get(sx, sy);
    if (isOutline(target)) return;
    if (match(target, fill, 0)) return;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x<0||x>=width||y<0||y>=height) continue;
      const cur = get(x, y);
      if (isOutline(cur)) continue;
      if (!match(cur, target, 8)) continue;
      set(x, y, fill);
      stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
    }
  }

  function mountCanvas(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    let original = null;
    let history = [];
    let selectedColor = null;

    canvas.addEventListener('click', (e) => {
      if (!selectedColor) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) * canvas.width / rect.width);
      const y = Math.floor((e.clientY - rect.top) * canvas.height / rect.height);
      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        history.push(new ImageData(new Uint8ClampedArray(data.data), data.width, data.height));
        if (history.length > 50) history.shift();
        floodFill(data, x, y, hexToRgba(selectedColor));
        ctx.putImageData(data, 0, 0);
      } catch (err) { console.error(err); }
    });

    return {
      loadPunk(src) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          original = ctx.getImageData(0, 0, canvas.width, canvas.height);
          history = [];
        };
        img.src = src;
      },
      undo() { const p = history.pop(); if (p) ctx.putImageData(p, 0, 0); },
      reset() { if (original) { ctx.putImageData(original, 0, 0); history = []; } },
      setColor(hex) { selectedColor = hex; },
      /**
       * Randomize every fillable region of the current image using the
       * provided palette. Palette entries must have a `hex` field. Outline
       * (near-black) pixels are preserved. Each unique source colour maps
       * to a single random palette entry, so a region painted one colour
       * stays one colour after randomising.
       */
      randomize(palette) {
        if (!palette || !palette.length) return;
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          history.push(new ImageData(
            new Uint8ClampedArray(data.data),
            data.width, data.height
          ));
          if (history.length > 50) history.shift();

          const pixels = data.data;
          const replacements = new Map();
          for (let i = 0; i < pixels.length; i += 4) {
            // Preserve outlines.
            if (pixels[i] < 24 && pixels[i + 1] < 24 && pixels[i + 2] < 24) continue;
            const key = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
            let c = replacements.get(key);
            if (!c) {
              const rnd = palette[Math.floor(Math.random() * palette.length)];
              c = hexToRgba(rnd.hex);
              replacements.set(key, c);
            }
            pixels[i]     = c[0];
            pixels[i + 1] = c[1];
            pixels[i + 2] = c[2];
          }
          ctx.putImageData(data, 0, 0);
        } catch (err) {
          console.error(err);
        }
      },
    };
  }

  window.Mockup = { PUNKS, COLORS, mountCanvas };
})();
