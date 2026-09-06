import type { CardGraphDocument } from '@/lib/types';
import { FORMATS } from '@/lib/types';
import { resolveNodes } from '@/engine/document';
import { mainCardAsset, renderSceneToCanvas, type Scene } from '@/engine/render';
import { getCachedImage, loadImage } from '@/engine/assets';
import { resolvePalette } from '@/lib/palette';
import { motionAt, NO_MOTION, frameCount } from '@/engine/animation';
import { ensureFontsLoaded } from '@/engine/fonts';

/**
 * Renders export frames through the same engine the editor draws with, so an
 * export is never a second implementation that can drift.
 */
export async function prepareScene(doc: CardGraphDocument): Promise<{
  scene: (t: number | null) => Scene;
  width: number;
  height: number;
  frames: number;
}> {
  await ensureFontsLoaded();

  const nodes = resolveNodes(doc);
  const palette = resolvePalette(doc.theme, doc.palette);
  const spec = FORMATS[doc.format];

  const assetIds = new Set<string>();
  for (const node of nodes) {
    if ((node.type === 'image' || node.type === 'badge') && node.assetId) assetIds.add(node.assetId);
  }
  if (doc.background.customAssetId) assetIds.add(doc.background.customAssetId);
  await Promise.all([...assetIds].map(loadImage));

  const backgroundImageKey =
    (doc.background.source === 'custom' ? doc.background.customAssetId : mainCardAsset(nodes)) ?? 'none';

  const scene = (t: number | null): Scene => ({
    document: doc,
    nodes,
    width: spec.width,
    height: spec.height,
    backgroundImageKey,
    context: {
      width: spec.width,
      height: spec.height,
      theme: doc.theme,
      palette,
      formatting: doc.formatting,
      getImage: (assetId) => getCachedImage(assetId),
      motionFor: (node) =>
        t === null || node.type !== 'image' || node.role !== 'card'
          ? NO_MOTION
          : motionAt(doc.animation, t, Math.min(node.width, node.height)),
      // Never bake a "drop your image here" hint into an export.
      showPlaceholders: false,
    },
  });

  return { scene, width: spec.width, height: spec.height, frames: frameCount(doc.animation) };
}

export function renderFrame(
  scene: (t: number | null) => Scene,
  index: number,
  total: number,
  pixelRatio: number,
): HTMLCanvasElement {
  const t = total <= 1 ? null : index / total;
  return renderSceneToCanvas(scene(t), pixelRatio);
}

/** Lets the browser paint the progress bar between frames. */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
