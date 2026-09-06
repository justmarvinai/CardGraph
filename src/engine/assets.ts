import { getAsset, putAsset, type StoredAsset } from '@/lib/storage';
import { createId } from '@/lib/id';

/**
 * Image cache shared by the editor canvas and the export pipeline.
 * Konva needs a decoded HTMLImageElement, so blobs are resolved once and kept.
 */

const images = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();
const objectUrls = new Map<string, string>();

/** Long edge cap on import: keeps 2x export sharp without huge memory use. */
export const MAX_IMPORT_EDGE = 2400;

export function getCachedImage(assetId: string | null): HTMLImageElement | null {
  if (!assetId) return null;
  return images.get(assetId) ?? null;
}

export async function loadImage(assetId: string): Promise<HTMLImageElement | null> {
  const cached = images.get(assetId);
  if (cached) return cached;
  const inFlight = pending.get(assetId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const asset = await getAsset(assetId);
    if (!asset) return null;
    const url = URL.createObjectURL(asset.blob);
    objectUrls.set(assetId, url);
    try {
      const img = await decode(url);
      images.set(assetId, img);
      return img;
    } catch {
      URL.revokeObjectURL(url);
      objectUrls.delete(assetId);
      return null;
    } finally {
      pending.delete(assetId);
    }
  })();

  pending.set(assetId, promise);
  return promise;
}

/** Puts an already-decoded image into the cache under a known id. */
export function registerImage(assetId: string, image: HTMLImageElement): void {
  images.set(assetId, image);
}

export function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function releaseAsset(assetId: string): void {
  const url = objectUrls.get(assetId);
  if (url) URL.revokeObjectURL(url);
  objectUrls.delete(assetId);
  images.delete(assetId);
}

export interface ImportResult {
  assetId: string;
  width: number;
  height: number;
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];

export class ImportError extends Error {}

/**
 * Reads a user file, downscales it if huge, trims fully transparent padding
 * (slab cut-outs often ship with a lot of it) and stores it in IndexedDB.
 */
export async function importImageFile(file: File): Promise<ImportResult> {
  if (!ACCEPTED.includes(file.type)) {
    throw new ImportError('Please use a PNG, JPG, WEBP or GIF image.');
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new ImportError('That image is larger than 40 MB. Please use a smaller file.');
  }

  const url = URL.createObjectURL(file);
  let source: HTMLImageElement;
  try {
    source = await decode(url);
  } catch {
    URL.revokeObjectURL(url);
    throw new ImportError('That file could not be read as an image.');
  }

  const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const trimmed = hasAlpha ? trimTransparent(source) : drawToCanvas(source);
  const scaled = downscale(trimmed, MAX_IMPORT_EDGE);
  URL.revokeObjectURL(url);

  const blob = await canvasToBlob(scaled, hasAlpha ? 'image/png' : 'image/jpeg', 0.94);
  const assetId = createId('asset');
  const stored: StoredAsset = {
    id: assetId,
    blob,
    width: scaled.width,
    height: scaled.height,
    name: file.name,
    createdAt: Date.now(),
  };
  await putAsset(stored);

  const img = await decode(URL.createObjectURL(blob));
  images.set(assetId, img);

  return { assetId, width: scaled.width, height: scaled.height };
}

function drawToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas;
}

/** Crops fully transparent rows/columns around the artwork. */
function trimTransparent(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = drawToCanvas(img);
  const ctx = canvas.getContext('2d')!;
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return canvas;
  }
  const { width, height } = canvas;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data.data[(y * width + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0 || bottom < 0) return canvas;
  const pad = 2;
  const x0 = Math.max(0, left - pad);
  const y0 = Math.max(0, top - pad);
  const w = Math.min(width, right + pad) - x0 + 1;
  const h = Math.min(height, bottom + pad) - y0 + 1;
  if (w >= width && h >= height) return canvas;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')!.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
  return out;
}

function downscale(canvas: HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const longest = Math.max(canvas.width, canvas.height);
  if (longest <= maxEdge) return canvas;
  const scale = maxEdge / longest;
  const out = document.createElement('canvas');
  out.width = Math.round(canvas.width * scale);
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      type,
      quality,
    );
  });
}
