/**
 * The CardGraph document model.
 *
 * A document stores *template data + user overrides*, never a flat node list.
 * `template.build()` is re-run whenever data, format, theme or palette change,
 * and the user's overrides are merged on top by node id. That is what makes
 * "switch format" and "switch theme" keep the user's content intact.
 */

export type Format = '4:5' | '1:1' | '9:16' | '16:9' | '4:3' | '3:4';

export interface FormatSpec {
  id: Format;
  label: string;
  hint: string;
  width: number;
  height: number;
}

export const FORMATS: Record<Format, FormatSpec> = {
  '4:5': { id: '4:5', label: '4:5', hint: 'Feed post', width: 1080, height: 1350 },
  '1:1': { id: '1:1', label: '1:1', hint: 'Square', width: 1080, height: 1080 },
  '9:16': { id: '9:16', label: '9:16', hint: 'Story / Reel', width: 1080, height: 1920 },
  '16:9': { id: '16:9', label: '16:9', hint: 'Landscape', width: 1920, height: 1080 },
  '4:3': { id: '4:3', label: '4:3', hint: 'Classic', width: 1440, height: 1080 },
  '3:4': { id: '3:4', label: '3:4', hint: 'Portrait', width: 1080, height: 1440 },
};

export const FORMAT_ORDER: Format[] = ['4:5', '1:1', '9:16', '16:9', '4:3', '3:4'];

export type Theme = 'dark' | 'light';

/**
 * Every colour a template draws comes from here. Templates must never write a
 * literal colour — the Director can change all of these per document.
 */
export interface Palette {
  accent: string;
  textPrimary: string;
  textSecondary: string;
  positive: string;
  negative: string;
  panel: string;
  overlay: string;
  divider: string;
}

export type PaletteKey = keyof Palette;

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export type NodeType = 'text' | 'image' | 'chart' | 'divider' | 'badge';

export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  /** Marks nodes the template regenerates; user-added nodes are `false`. */
  fromTemplate?: boolean;
}

export type TextAlign = 'left' | 'center' | 'right';
export type TextTransform = 'none' | 'uppercase';

export interface TextNode extends BaseNode {
  type: 'text';
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  align: TextAlign;
  verticalAlign: 'top' | 'middle' | 'bottom';
  color: string;
  transform: TextTransform;
  shadow: Shadow | null;
  /** Shrink the font until the text fits `width`. Used for headlines. */
  autoFit: boolean;
  minFontSize?: number;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  /** Key into the asset store; `null` renders the drop placeholder. */
  assetId: string | null;
  fit: 'contain' | 'cover';
  radius: number;
  shadow: Shadow | null;
  /** `card` nodes are the ones animation presets move. */
  role: 'card' | 'extra';
  flipX: boolean;
}

export interface ChartRow {
  id: string;
  label: string;
  value: number;
}

export interface ChartNode extends BaseNode {
  type: 'chart';
  rows: ChartRow[];
  /** `auto` follows the trend (positive/negative palette colours). */
  strokeMode: 'auto' | 'custom';
  stroke: string;
  strokeWidth: number;
  smooth: boolean;
  glow: number;
  panelFill: string;
  panelRadius: number;
  panelOpacity: number;
  showPanel: boolean;
  showYAxis: boolean;
  showXAxis: boolean;
  showGrid: boolean;
  gridColor: string;
  axisColor: string;
  axisFontFamily: string;
  axisFontSize: number;
  tickCount: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface DividerNode extends BaseNode {
  type: 'divider';
  orientation: 'horizontal' | 'vertical';
  color: string;
  thickness: number;
  /** 0 = solid ends, 1 = fully faded ends (the vertical accent split). */
  fade: number;
}

export type BadgeKind = 'builtin' | 'text' | 'image';

export interface BadgeNode extends BaseNode {
  type: 'badge';
  kind: BadgeKind;
  /** Id from `src/lib/badges.ts` when `kind === 'builtin'`. */
  badgeId: string;
  text: string;
  assetId: string | null;
  color: string;
  /** Optional trailing caption, e.g. " · AUG 31, 2026". */
  caption: string;
  captionColor: string;
  captionFontFamily: string;
  captionFontSize: number;
  align: TextAlign;
}

export type Node = TextNode | ImageNode | ChartNode | DividerNode | BadgeNode;

export interface BackgroundSettings {
  /** Which image feeds the blurred backdrop; defaults to the main card. */
  source: 'card' | 'custom' | 'none';
  customAssetId: string | null;
  blur: number;
  /** Strength of the theme gradient over the blur, 0..1. */
  overlayStrength: number;
  vignette: number;
  zoom: number;
  /** Flat colour used when `source === 'none'` or no image is present. */
  fallbackColor: string;
}

export type AnimationPreset = 'none' | 'hover' | 'sway' | 'float' | 'tilt';

export interface AnimationSettings {
  preset: AnimationPreset;
  durationMs: number;
  fps: 24 | 30;
  /** 0..2, scales the preset's built-in motion. */
  amplitude: number;
}

export interface FormattingSettings {
  currency: string;
  thousandsSeparator: ',' | '.' | ' ' | '';
  decimalSeparator: '.' | ',';
  dateStyle: 'long' | 'short' | 'numeric';
}

export interface CardGraphDocument {
  version: 1;
  id: string;
  name: string;
  templateId: string;
  variantId: string | null;
  format: Format;
  theme: Theme;
  /** Only the slots the user changed; theme defaults fill the rest. */
  palette: Partial<Palette>;
  data: Record<string, unknown>;
  /** Fields the user typed into directly, so bindings stop overwriting them. */
  unbound: string[];
  overrides: Record<string, Partial<Node>>;
  extraNodes: Node[];
  background: BackgroundSettings;
  animation: AnimationSettings;
  formatting: FormattingSettings;
  createdAt: number;
  updatedAt: number;
}
