import type { CardGraphDocument } from '@/lib/types';
import { canvasToBlob } from '@/engine/assets';
import { prepareScene, renderFrame } from './frames';
import { filenameFor, type ExportOptions, type ExportResult } from './types';

export async function exportStill(
  doc: CardGraphDocument,
  options: ExportOptions,
): Promise<ExportResult> {
  const { scene, width, height } = await prepareScene(doc);
  const canvas = renderFrame(scene, 0, 1, options.scale);
  const isJpg = options.format === 'jpg';
  const blob = await canvasToBlob(
    canvas,
    isJpg ? 'image/jpeg' : 'image/png',
    isJpg ? options.quality : undefined,
  );
  return {
    blob,
    filename: filenameFor(doc, options.format),
    width: width * options.scale,
    height: height * options.scale,
  };
}
