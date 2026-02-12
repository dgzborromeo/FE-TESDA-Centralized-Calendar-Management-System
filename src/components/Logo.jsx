import { useEffect, useMemo, useState } from 'react';

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Converts near-black pixels to transparent (simple chroma key).
 * Useful when you have a logo PNG that was exported with a black background.
 */
async function makeBlackTransparent(src, { threshold = 42, feather = 18 } = {}) {
  if (typeof document === 'undefined') return src;

  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.crossOrigin = 'anonymous';

  const loaded = await new Promise((resolve, reject) => {
    img.onload = () => resolve(true);
    img.onerror = reject;
    img.src = src;
  });
  if (!loaded) return src;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;

    // simple "blackness" metric
    const max = Math.max(r, g, b);
    if (max <= threshold + feather) {
      // fade alpha around the edge to reduce jaggies
      const t = clamp01((max - threshold) / Math.max(1, feather));
      data[i + 3] = Math.round(a * t);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function Logo({
  src,
  alt,
  className,
  transparentBlack = false,
  threshold = 42,
  feather = 18,
}) {
  const [processed, setProcessed] = useState(null);

  const key = useMemo(() => `${src}|${transparentBlack}|${threshold}|${feather}`, [src, transparentBlack, threshold, feather]);

  useEffect(() => {
    let cancelled = false;
    setProcessed(null);
    if (!transparentBlack) return;
    makeBlackTransparent(src, { threshold, feather })
      .then((out) => {
        if (!cancelled) setProcessed(out);
      })
      .catch(() => {
        if (!cancelled) setProcessed(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, src, transparentBlack, threshold, feather]);

  return <img className={className} src={processed || src} alt={alt} />;
}

