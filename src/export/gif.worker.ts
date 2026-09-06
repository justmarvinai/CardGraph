/// <reference lib="webworker" />
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * GIF encoding runs here so quantising 60-plus frames never freezes the editor.
 * Frames arrive as transferred RGBA buffers; only the finished bytes come back.
 */

interface StartMessage {
  type: 'start';
  width: number;
  height: number;
  delay: number;
  total: number;
}

interface FrameMessage {
  type: 'frame';
  index: number;
  data: ArrayBuffer;
}

type Incoming = StartMessage | FrameMessage | { type: 'finish' };

let encoder: ReturnType<typeof GIFEncoder> | null = null;
let width = 0;
let height = 0;
let delay = 0;
let palette: number[][] | null = null;

self.onmessage = (event: MessageEvent<Incoming>) => {
  const message = event.data;

  if (message.type === 'start') {
    encoder = GIFEncoder();
    width = message.width;
    height = message.height;
    delay = message.delay;
    palette = null;
    return;
  }

  if (message.type === 'frame' && encoder) {
    const rgba = new Uint8ClampedArray(message.data);
    // One palette from the first frame keeps colours stable across the loop
    // and makes every later frame much cheaper to encode.
    if (!palette) palette = quantize(rgba, 256, { format: 'rgb444' });
    const indexed = applyPalette(rgba, palette, 'rgb444');
    encoder.writeFrame(indexed, width, height, { palette, delay, transparent: false });
    self.postMessage({ type: 'progress', index: message.index });
    return;
  }

  if (message.type === 'finish' && encoder) {
    encoder.finish();
    const bytes = encoder.bytes();
    encoder = null;
    palette = null;
    self.postMessage({ type: 'done', bytes }, { transfer: [bytes.buffer as ArrayBuffer] });
  }
};
