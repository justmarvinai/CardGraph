import type { BackgroundSettings, Palette, Theme } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import { fitRect } from '@/lib/math';

/**
 * card image → cover-fit → heavy blur → theme gradient → vignette.
 *
 * The blur runs on a quarter-size canvas and is upscaled: visually identical at
 * this radius and fast enough to keep dragging at 60 fps. Results are cached,
 * because the backdrop only changes when its inputs do.
 */

export interface BackgroundInput {
  width: number;
  height: number;
  theme: Theme;
  palette: Palette;
  settings: BackgroundSettings;
  image: HTMLImageElement | null;
  /** Identity of `image`, so the cache key is stable. */
  imageKey: string;
}

const cache = new Map<string, HTMLCanvasElement>();
const CACHE_LIMIT = 8;

function cacheKey(input: BackgroundInput): string {
  const s = input.settings;
  return [
    input.width,
    input.height,
    input.theme,
    input.palette.overlay,
    input.imageKey,
    s.source,
    s.blur,
    s.overlayStrength,
    s.vignette,
    s.zoom,
    s.fallbackColor,
  ].join('|');
}

export function renderBackground(input: BackgroundInput): HTMLCanvasElement {
  const key = cacheKey(input);
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = paint(input);
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, canvas);
  return canvas;
}

export function clearBackgroundCache(): void {
  cache.clear();
}

function paint(input: BackgroundInput): HTMLCanvasElement {
  const { width, height, settings, image, palette } = input;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = settings.fallbackColor;
  ctx.fillRect(0, 0, width, height);

  const usable = settings.source !== 'none' ? image : null;
  if (usable && usable.naturalWidth > 0) {
    drawBlurred(ctx, usable, width, height, settings);
  }

  drawOverlay(ctx, width, height, palette, settings, Boolean(usable));
  return canvas;
}

function drawBlurred(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  settings: BackgroundSettings,
) {
  const divisor = 4;
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(width / divisor));
  small.height = Math.max(1, Math.round(height / divisor));
  const sctx = small.getContext('2d')!;

  const zoom = Math.max(1, settings.zoom);
  const box = fitRect(
    image.naturalWidth,
    image.naturalHeight,
    small.width * zoom,
    small.height * zoom,
    'cover',
  );
  sctx.imageSmoothingQuality = 'high';
  sctx.filter = `blur(${Math.max(0, settings.blur / divisor)}px)`;
  // Overdraw past the edges so the blur never samples empty canvas.
  const bleed = Math.max(box.width, box.height) * 0.06;
  sctx.drawImage(
    image,
    box.x - (small.width * (zoom - 1)) / 2 - bleed,
    box.y - (small.height * (zoom - 1)) / 2 - bleed,
    box.width + bleed * 2,
    box.height + bleed * 2,
  );
  sctx.filter = 'none';

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, width, height);
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
  settings: BackgroundSettings,
  hasImage: boolean,
) {
  const s = Math.max(0, Math.min(1, settings.overlayStrength));
  const overlay = palette.overlay;

  if (!hasImage) {
    ctx.fillStyle = withAlpha(overlay, s * 0.9);
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Near-opaque top and bottom, a window of colour in the middle: the look the
  // reference graphics get from a blurred card behind a dark gradient.
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, withAlpha(overlay, Math.min(1, 0.97 * s + 0.03)));
  gradient.addColorStop(0.18, withAlpha(overlay, 0.82 * s));
  gradient.addColorStop(0.45, withAlpha(overlay, 0.6 * s));
  gradient.addColorStop(0.72, withAlpha(overlay, 0.78 * s));
  gradient.addColorStop(1, withAlpha(overlay, Math.min(1, 0.97 * s + 0.03)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const v = Math.max(0, Math.min(1, settings.vignette));
  if (v > 0) {
    const radial = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.15,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    radial.addColorStop(0, withAlpha(overlay, 0));
    radial.addColorStop(1, withAlpha(overlay, v));
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }
}
