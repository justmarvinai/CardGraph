import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { CardGraphDocument } from '@/lib/types';
import { prepareScene, renderFrame, yieldToBrowser } from './frames';
import { ExportError, filenameFor, type ExportResult, type ProgressHandler } from './types';

/**
 * MP4 through WebCodecs, with a WebM fallback where WebCodecs is missing (Q7).
 * No ffmpeg.wasm: a 30 MB download for one export is not a trade worth making.
 */

export function supportsMp4(): boolean {
  return typeof window !== 'undefined' && typeof window.VideoEncoder !== 'undefined';
}

export function supportsWebm(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm'))
  );
}

export async function exportVideo(
  doc: CardGraphDocument,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  if (supportsMp4()) return exportMp4(doc, onProgress);
  if (supportsWebm()) return exportWebm(doc, onProgress);
  throw new ExportError(
    'This browser cannot encode video. Try Chrome, Edge or Safari — or export a GIF instead.',
  );
}

async function exportMp4(
  doc: CardGraphDocument,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  const { scene, width, height, frames } = await prepareScene(doc);
  // H.264 requires even dimensions.
  const w = width - (width % 2);
  const h = height - (height % 2);
  const fps = doc.animation.fps;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h, frameRate: fps },
    fastStart: 'in-memory',
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: () => undefined,
  });

  encoder.configure({
    codec: 'avc1.4d0032',
    width: w,
    height: h,
    bitrate: Math.round(w * h * fps * 0.12),
    framerate: fps,
  });

  const staging = document.createElement('canvas');
  staging.width = w;
  staging.height = h;
  const ctx = staging.getContext('2d')!;
  const frameDuration = 1_000_000 / fps;

  for (let i = 0; i < frames; i += 1) {
    onProgress?.({ phase: 'encoding', current: i + 1, total: frames });
    const canvas = renderFrame(scene, i, frames, 1);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0, w, h);

    const frame = new VideoFrame(staging, {
      timestamp: Math.round(i * frameDuration),
      duration: Math.round(frameDuration),
    });
    encoder.encode(frame, { keyFrame: i % fps === 0 });
    frame.close();

    // Keep the encoder queue short so memory stays flat on long loops.
    if (encoder.encodeQueueSize > 8) {
      await new Promise<void>((resolve) => {
        const check = () => (encoder.encodeQueueSize <= 4 ? resolve() : setTimeout(check, 8));
        check();
      });
    }
    await yieldToBrowser();
  }

  onProgress?.({ phase: 'finalising', current: frames, total: frames });
  await encoder.flush();
  encoder.close();
  muxer.finalize();

  const { buffer } = muxer.target as ArrayBufferTarget;
  return {
    blob: new Blob([buffer], { type: 'video/mp4' }),
    filename: filenameFor(doc, 'mp4'),
    width: w,
    height: h,
  };
}

/**
 * MediaRecorder records in real time, so the loop is played once into the
 * recorder at its natural speed.
 */
async function exportWebm(
  doc: CardGraphDocument,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  const { scene, width, height, frames } = await prepareScene(doc);
  const fps = doc.animation.fps;

  const staging = document.createElement('canvas');
  staging.width = width;
  staging.height = height;
  const ctx = staging.getContext('2d')!;

  const stream = staging.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  const finished = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  const frameMs = 1000 / fps;
  const start = performance.now();

  // Two loops give players a clean seam to loop on.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < frames; i += 1) {
      onProgress?.({ phase: 'encoding', current: pass * frames + i + 1, total: frames * 2 });
      const canvas = renderFrame(scene, i, frames, 1);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(canvas, 0, 0);
      const target = start + (pass * frames + i + 1) * frameMs;
      const wait = target - performance.now();
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, wait)));
    }
  }

  onProgress?.({ phase: 'finalising', current: frames * 2, total: frames * 2 });
  recorder.stop();
  await finished;

  return {
    blob: new Blob(chunks, { type: 'video/webm' }),
    filename: filenameFor(doc, 'webm'),
    width,
    height,
  };
}
