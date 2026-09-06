import type { AnimationPreset, AnimationSettings } from '@/lib/types';

/**
 * Loop presets applied to the main card node(s).
 *
 * Every term is built from sin(2πt) / sin(4πt) / cos(2πt), so frame 0 and frame
 * N are identical by construction: any duration loops perfectly.
 */

export interface Motion {
  dx: number;
  dy: number;
  rotation: number;
  scale: number;
  skewX: number;
  shadowOffsetY: number;
  shadowBlurScale: number;
}

export const NO_MOTION: Motion = {
  dx: 0,
  dy: 0,
  rotation: 0,
  scale: 1,
  skewX: 0,
  shadowOffsetY: 0,
  shadowBlurScale: 1,
};

export interface AnimationPresetInfo {
  id: AnimationPreset;
  name: string;
  description: string;
}

export const ANIMATION_PRESETS: AnimationPresetInfo[] = [
  { id: 'none', name: 'Still', description: 'No movement — export as image.' },
  { id: 'hover', name: 'Hover', description: 'Soft vertical bob, like the card floats.' },
  { id: 'sway', name: 'Sway', description: 'Gentle rotation left and right.' },
  { id: 'float', name: 'Float', description: 'Bob and sway with a moving shadow.' },
  { id: 'tilt', name: 'Tilt', description: 'Subtle 3-D style lean.' },
];

const TAU = Math.PI * 2;

/**
 * @param t  loop position in [0, 1)
 * @param referenceSize  the card's size in px, so motion scales with the format
 */
export function motionAt(settings: AnimationSettings, t: number, referenceSize: number): Motion {
  const amp = Math.max(0, settings.amplitude);
  if (settings.preset === 'none' || amp === 0) return NO_MOTION;

  const unit = referenceSize * 0.01;
  const sin = Math.sin(TAU * t);
  const sin2 = Math.sin(2 * TAU * t);
  const cos = Math.cos(TAU * t);

  switch (settings.preset) {
    case 'hover':
      return {
        ...NO_MOTION,
        dy: -sin * 1.6 * unit * amp,
        shadowOffsetY: sin * 0.9 * unit * amp,
        shadowBlurScale: 1 + sin * 0.16 * amp,
      };
    case 'sway':
      return {
        ...NO_MOTION,
        rotation: sin * 1.5 * amp,
        dx: sin * 0.5 * unit * amp,
      };
    case 'float':
      return {
        dx: sin * 0.7 * unit * amp,
        dy: -Math.abs(sin2) * 1.1 * unit * amp - sin * 0.9 * unit * amp,
        rotation: cos * 1.1 * amp,
        scale: 1 + sin * 0.008 * amp,
        skewX: 0,
        shadowOffsetY: sin * 1.2 * unit * amp,
        shadowBlurScale: 1 + sin * 0.22 * amp,
      };
    case 'tilt':
      return {
        ...NO_MOTION,
        rotation: sin * 0.8 * amp,
        skewX: sin * 0.035 * amp,
        scale: 1 + cos * 0.01 * amp,
        dy: -cos * 0.5 * unit * amp,
      };
    default:
      return NO_MOTION;
  }
}

export function frameCount(settings: AnimationSettings): number {
  if (settings.preset === 'none') return 1;
  return Math.max(2, Math.round((settings.durationMs / 1000) * settings.fps));
}

export const DEFAULT_ANIMATION: AnimationSettings = {
  preset: 'none',
  durationMs: 3000,
  fps: 30,
  amplitude: 1,
};
