import type { CardGraphDocument } from '@/lib/types';
import { prepareScene, renderFrame, yieldToBrowser } from './frames';
import { ExportError, filenameFor, type ExportResult, type ProgressHandler } from './types';

/** GIFs stay reasonable in size: 1080 px long edge, 20 fps (Q7). */
export const GIF_MAX_EDGE = 1080;
export const GIF_MAX_FPS = 20;

export async function exportGif(
  doc: CardGraphDocument,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  const { scene, width, height, frames } = await prepareScene(doc);

  const scale = Math.min(1, GIF_MAX_EDGE / Math.max(width, height));
  const outWidth = Math.round(width * scale);
  const outHeight = Math.round(height * scale);

  const sourceFps = doc.animation.fps;
  const step = Math.max(1, Math.round(sourceFps / GIF_MAX_FPS));
  const indices: number[] = [];
  for (let i = 0; i < frames; i += step) indices.push(i);
  const delay = Math.round(doc.animation.durationMs / Math.max(1, indices.length));

  const worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module' });

  try {
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      let encoded = 0;

      worker.onerror = () => reject(new ExportError('The GIF encoder failed to start.'));
      worker.onmessage = (event: MessageEvent<{ type: string; bytes?: Uint8Array }>) => {
        if (event.data.type === 'progress') {
          encoded += 1;
          onProgress?.({ phase: 'encoding', current: encoded, total: indices.length });
        }
        if (event.data.type === 'done' && event.data.bytes) resolve(event.data.bytes);
      };

      worker.postMessage({
        type: 'start',
        width: outWidth,
        height: outHeight,
        delay,
        total: indices.length,
      });

      void (async () => {
        const staging = document.createElement('canvas');
        staging.width = outWidth;
        staging.height = outHeight;
        const ctx = staging.getContext('2d', { willReadFrequently: true })!;

        for (let i = 0; i < indices.length; i += 1) {
          onProgress?.({ phase: 'rendering', current: i + 1, total: indices.length });
          const canvas = renderFrame(scene, indices[i], frames, 1);
          ctx.clearRect(0, 0, outWidth, outHeight);
          ctx.drawImage(canvas, 0, 0, outWidth, outHeight);
          const image = ctx.getImageData(0, 0, outWidth, outHeight);
          worker.postMessage({ type: 'frame', index: i, data: image.data.buffer }, [
            image.data.buffer,
          ]);
          await yieldToBrowser();
        }

        onProgress?.({ phase: 'finalising', current: indices.length, total: indices.length });
        worker.postMessage({ type: 'finish' });
      })().catch(reject);
    });

    return {
      blob: new Blob([bytes as BlobPart], { type: 'image/gif' }),
      filename: filenameFor(doc, 'gif'),
      width: outWidth,
      height: outHeight,
    };
  } finally {
    worker.terminate();
  }
}
