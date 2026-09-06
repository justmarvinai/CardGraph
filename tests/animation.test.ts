import { describe, expect, it } from 'vitest';
import { ANIMATION_PRESETS, DEFAULT_ANIMATION, frameCount, motionAt, NO_MOTION } from '@/engine/animation';
import type { AnimationPreset, AnimationSettings } from '@/lib/types';

const presets = ANIMATION_PRESETS.map((p) => p.id).filter((id) => id !== 'none');

function settings(preset: AnimationPreset, patch: Partial<AnimationSettings> = {}): AnimationSettings {
  return { ...DEFAULT_ANIMATION, preset, ...patch };
}

describe('loop seam', () => {
  // The whole promise of the GIF/MP4 export is that the loop has no visible
  // seam, which only holds if t=0 and t=1 produce the same transform.
  it.each(presets)('%s returns to its start', (preset) => {
    const start = motionAt(settings(preset), 0, 500);
    const end = motionAt(settings(preset), 1, 500);
    for (const key of Object.keys(start) as (keyof typeof start)[]) {
      expect(end[key], `${preset}.${key}`).toBeCloseTo(start[key], 6);
    }
  });

  it.each(presets)('%s is continuous across the seam', (preset) => {
    const justBefore = motionAt(settings(preset), 0.999, 500);
    const atStart = motionAt(settings(preset), 0, 500);
    // A step at the seam would read as a jolt on every repeat.
    expect(Math.abs(justBefore.dy - atStart.dy)).toBeLessThan(1);
    expect(Math.abs(justBefore.rotation - atStart.rotation)).toBeLessThan(0.1);
  });

  it.each(presets)('%s actually moves something', (preset) => {
    const samples = [0, 0.25, 0.5, 0.75].map((t) => motionAt(settings(preset), t, 500));
    const moved = samples.some(
      (m) =>
        Math.abs(m.dx) > 0.01 ||
        Math.abs(m.dy) > 0.01 ||
        Math.abs(m.rotation) > 0.01 ||
        Math.abs(m.scale - 1) > 0.0001 ||
        Math.abs(m.skewX) > 0.0001,
    );
    expect(moved, preset).toBe(true);
  });
});

describe('motionAt', () => {
  it('is still when there is no preset or no amplitude', () => {
    expect(motionAt(settings('none'), 0.3, 500)).toEqual(NO_MOTION);
    expect(motionAt(settings('float', { amplitude: 0 }), 0.3, 500)).toEqual(NO_MOTION);
  });

  it('scales motion with the card size, so every format moves the same amount', () => {
    const small = motionAt(settings('hover'), 0.25, 200);
    const large = motionAt(settings('hover'), 0.25, 800);
    expect(Math.abs(large.dy)).toBeCloseTo(Math.abs(small.dy) * 4, 5);
  });

  it('scales motion with amplitude', () => {
    const half = motionAt(settings('sway', { amplitude: 0.5 }), 0.25, 500);
    const full = motionAt(settings('sway', { amplitude: 1 }), 0.25, 500);
    expect(Math.abs(full.rotation)).toBeCloseTo(Math.abs(half.rotation) * 2, 5);
  });
});

describe('frameCount', () => {
  it('is one frame for a still document', () => {
    expect(frameCount(settings('none'))).toBe(1);
  });

  it('follows duration and frame rate', () => {
    expect(frameCount(settings('hover', { durationMs: 3000, fps: 30 }))).toBe(90);
    expect(frameCount(settings('hover', { durationMs: 2000, fps: 24 }))).toBe(48);
  });
});
