import type { Palette, Theme } from './types';

/** Defaults per theme. Every slot is overridable per document. */
export const THEME_PALETTES: Record<Theme, Palette> = {
  dark: {
    accent: '#CCFF00',
    textPrimary: '#FFFFFF',
    textSecondary: '#D8D8D8',
    positive: '#2EE59D',
    negative: '#FF3B30',
    panel: '#0B0B0B',
    overlay: '#000000',
    divider: '#FFFFFF',
  },
  light: {
    accent: '#7FA800',
    textPrimary: '#0A0A0A',
    textSecondary: '#3A3A3A',
    positive: '#12A868',
    negative: '#D92D20',
    panel: '#FFFFFF',
    overlay: '#FFFFFF',
    divider: '#101010',
  },
};

export interface AccentPreset {
  id: string;
  name: string;
  dark: string;
  light: string;
}

/** Quick picks in the UI; a full colour picker sits next to them. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'lime', name: 'Lime', dark: '#CCFF00', light: '#7FA800' },
  { id: 'cyan', name: 'Cyan', dark: '#22D3EE', light: '#0E7490' },
  { id: 'violet', name: 'Violet', dark: '#A78BFA', light: '#6D28D9' },
  { id: 'gold', name: 'Gold', dark: '#FFC94A', light: '#A16207' },
  { id: 'magenta', name: 'Magenta', dark: '#FF4D9D', light: '#BE185D' },
  { id: 'ice', name: 'Ice', dark: '#FFFFFF', light: '#111111' },
];

export const PALETTE_LABELS: Record<keyof Palette, string> = {
  accent: 'Accent',
  textPrimary: 'Text',
  textSecondary: 'Text muted',
  positive: 'Positive',
  negative: 'Negative',
  panel: 'Panel',
  overlay: 'Background overlay',
  divider: 'Dividers',
};

export function resolvePalette(theme: Theme, overrides: Partial<Palette> | undefined): Palette {
  return { ...THEME_PALETTES[theme], ...(overrides ?? {}) };
}

/** `#RRGGBB` + alpha 0..1 → `rgba(...)`, so palette colours stay editable. */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Relative luminance (WCAG); used to pick readable text over a colour. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? '#0A0A0A' : '#FFFFFF';
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  );
}
