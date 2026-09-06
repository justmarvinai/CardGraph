import { describe, expect, it } from 'vitest';
import { niceScale, niceStep, catmullRomPath, fitRect, clamp } from '@/lib/math';

describe('niceStep', () => {
  it('walks the 1-2-5 ladder', () => {
    expect(niceStep(0.9)).toBe(1);
    expect(niceStep(1.4)).toBe(2);
    expect(niceStep(3)).toBe(5);
    expect(niceStep(240)).toBe(500);
  });
});

describe('niceScale', () => {
  it('covers the data with round ticks', () => {
    const scale = niceScale(2760, 3500);
    expect(scale.min).toBeLessThanOrEqual(2760);
    expect(scale.max).toBeGreaterThanOrEqual(3500);
    expect(scale.ticks.length).toBeGreaterThan(2);
    for (const tick of scale.ticks) {
      expect(Number.isFinite(tick)).toBe(true);
    }
  });

  it('keeps a flat series renderable', () => {
    const scale = niceScale(100, 100);
    expect(scale.max).toBeGreaterThan(scale.min);
  });

  it('drops to zero when the data sits near it', () => {
    const scale = niceScale(5, 100);
    expect(scale.min).toBe(0);
  });

  it('survives an empty series', () => {
    const scale = niceScale(NaN, NaN);
    expect(scale.ticks.length).toBeGreaterThan(0);
  });
});

describe('catmullRomPath', () => {
  it('starts at the first point and emits beziers', () => {
    const path = catmullRomPath([
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 5 },
    ]);
    expect(path.startsWith('M 0 0')).toBe(true);
    expect(path).toContain('C');
  });

  it('degrades gracefully for one or two points', () => {
    expect(catmullRomPath([])).toBe('');
    expect(catmullRomPath([{ x: 1, y: 2 }])).toBe('M 1 2');
    expect(catmullRomPath([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('M 0 0 L 1 1');
  });
});

describe('fitRect', () => {
  it('contains without cropping', () => {
    const box = fitRect(200, 100, 100, 100, 'contain');
    expect(box.width).toBe(100);
    expect(box.height).toBe(50);
    expect(box.y).toBe(25);
  });

  it('covers by overflowing the short edge', () => {
    const box = fitRect(200, 100, 100, 100, 'cover');
    expect(box.height).toBe(100);
    expect(box.width).toBe(200);
  });
});

describe('clamp', () => {
  it('bounds both ends', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
  });
});

describe('niceScale sign handling', () => {
  it('never puts a price axis below zero', () => {
    for (const [min, max] of [[5, 100], [1, 3], [130, 130], [12, 1_250_000]]) {
      expect(niceScale(min, max).min).toBeGreaterThanOrEqual(0);
    }
  });

  it('still allows negative axes for data that goes negative', () => {
    expect(niceScale(-40, 60).min).toBeLessThan(0);
  });
});
