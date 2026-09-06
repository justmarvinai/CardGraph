import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { CardGraphDocument } from '@/lib/types';
import { FORMATS } from '@/lib/types';
import { prepareScene, renderFrame, yieldToBrowser } from './frames';
import { ExportError, filenameFor, type ExportResult, type ProgressHandler } from './types';

/**
 * MP4 through WebCodecs, with a WebM fallback where H.264 encoding is missing
 * (Q7). No ffmpeg.wasm: a 30 MB download for one export is not a trade worth
 * making.
 *
 * The presence of `VideoEncoder` is not enough to go on — several browsers
 * expose the API but ship no H.264 encoder — so support is probed with
 * `isConfigSupported` before committing to MP4.
 */

/** Baseline first: the most widely decodable, then main, then high. */
const AVC_CODECS = ['avc1.42E01F', 'avc1.4D0028', 'avc1.640028'];

export function hasVideoEncoder(): boolean {
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

async function pickAvcCodec(width: number, height: number, fps: number): Promise<string | null> {
  if (!hasVideoEncoder()) return null;
  for (const codec of AVC_CODECS) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: bitrateFor(width, height, fps),
        framerate: fps,
      });
      if (support.supported) return support.config?.codec ?? codec;
    } catch {
      /* an unusable config just moves us to the next candidate */
    }
  }
  return null;
}

/** Whether this browser can actually produce an MP4 at the document's size. */
export async function canExportMp4(doc: CardGraphDocument): Promise<boolean> {
  const { width, height } = sizeFor(doc);
  return (await pickAvcCodec(width, height, doc.animation.fps)) !== null;
}

function sizeFor(doc: CardGraphDocument): { width: number; height: number } {
  // H.264 needs even dimensions.
  const spec = FORMATS[doc.format];
  return { width: spec.width - (spec.width % 2), height: spec.height - (spec.height % 2) };
}

function bitrateFor(width: number, height: number, fps: number): number {
  return Math.min(24_000_000, Math.round(width * height * fps * 0.12));
}

export async function exportVideo(
  doc: CardGraphDocument,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  const { width, height } = sizeFor(doc);
  const codec = await pickAvcCodec(width, height, doc.animation.fps);
  if (codec) {
    try {
      return await exportMp4(doc, codec, onProgress);
    } catch (error) {
      // A mid-encode failure should still hand the user a usable file.
      if (!supportsWebm()) throw error;
    }
  }
  if (supportsWebm()) return exportWebm(doc, onProgress);
  throw new ExportError(
    'This browser cannot encode video. Try Chrome, Edge or Safari — or export a GIF instead.',
  );
}

async function exportMp4(
  doc: CardGraphDocument,
  codec: string,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  const { scene, frames } = await prepareScene(doc);
  const { width: w, height: h } = sizeFor(doc);
  const fps = doc.animation.fps;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h, frameRate: fps },
    fastStart: 'in-memory',
  });

  // Encoder errors are asynchronous: without capturing one here, `flush()`
  // would wait forever on an encoder that has already given up.
  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      encoderError = error instanceof Error ? error : new Error(String(error));
    },
  });

  encoder.configure({
    codec,
    width: w,
    height: h,
    bitrate: bitrateFor(w, h, fps),
    framerate: fps,
  });

  const staging = document.createElement('canvas');
  staging.width = w;
  staging.height = h;
  const ctx = staging.getContext('2d')!;
  const frameDuration = 1_000_000 / fps;

  const fail = () => {
    if (encoderError) {
      try {
        encoder.close();
      } catch {
        /* already closed */
      }
      throw new ExportError(`MP4 encoding failed: ${encoderError.message}`);
    }
  };

  try {
    for (let i = 0; i < frames; i += 1) {
      fail();
      onProgress?.({ phase: 'encoding', current: i + 1, total: frames });

      const canvas = renderFrame(scene, i, frames, 1);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h);

      const frame = new VideoFrame(staging, {
        timestamp: Math.round(i * frameDuration),
        duration: Math.round(frameDuration),
      });
      try {
        encoder.encode(frame, { keyFrame: i % fps === 0 });
      } finally {
        frame.close();
      }

      // Keep the queue short so memory stays flat on long loops.
      let guard = 0;
      while (encoder.encodeQueueSize > 8 && !encoderError && guard < 500) {
        await yieldToBrowser();
        guard += 1;
      }
      await yieldToBrowser();
    }

    fail();
    onProgress?.({ phase: 'finalising', current: frames, total: frames });
    await encoder.flush();
    fail();
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }

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

  // Two passes give players a clean seam to loop on.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < frames; i += 1) {
      onProgress?.({ phase: 'encoding', current: pass * frames + i + 1, total: frames * 2 });
      const canvas = renderFrame(scene, i, frames, 1);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(canvas, 0, 0);
      const target = start + (pass * frames + i + 1) * frameMs;
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, target - performance.now())));
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
