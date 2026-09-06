/** Pure helpers for chart scales and layout maths. No DOM, no React. */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** 1-2-5 stepping, the same ladder chart axes have used forever. */
export function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = 10 ** exponent;
  const residual = rawStep / magnitude;
  let nice: number;
  if (residual <= 1) nice = 1;
  else if (residual <= 2) nice = 2;
  else if (residual <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

export interface Scale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

/**
 * Axis range that contains [min, max] with round tick values and a little
 * headroom, so the curve never touches the panel edge.
 */
export function niceScale(min: number, max: number, targetTicks = 5): Scale {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1, step: 1, ticks: [0, 1] };
  }
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const nonNegative = min >= 0;
  const padding = (max - min) * 0.12;
  let lo = min - padding;
  let hi = max + padding;
  // Prices and population counts never go below zero, and an axis that does
  // wastes half the panel.
  if (nonNegative) lo = lo < (hi - lo) * 0.35 ? 0 : Math.max(0, lo);

  const step = niceStep((hi - lo) / Math.max(1, targetTicks - 1));
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  if (nonNegative) lo = Math.max(0, lo);

  const ticks: number[] = [];
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0;
  for (let v = lo; v <= hi + step * 0.5; v += step) {
    ticks.push(Number(v.toFixed(decimals + 2)));
  }
  return { min: lo, max: hi, step, ticks };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Catmull-Rom through the points, emitted as cubic bezier segments.
 * Konva's `tension` overshoots on spiky data; this stays inside the panel.
 */
export function catmullRomPath(points: Point[], tension = 0.5): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Fits `inner` into `outer` — the same maths for `contain` and `cover`. */
export function fitRect(
  innerW: number,
  innerH: number,
  outerW: number,
  outerH: number,
  mode: 'contain' | 'cover',
): { width: number; height: number; x: number; y: number; scale: number } {
  if (innerW <= 0 || innerH <= 0) {
    return { width: outerW, height: outerH, x: 0, y: 0, scale: 1 };
  }
  const sx = outerW / innerW;
  const sy = outerH / innerH;
  const scale = mode === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy);
  const width = innerW * scale;
  const height = innerH * scale;
  return { width, height, x: (outerW - width) / 2, y: (outerH - height) / 2, scale };
}
