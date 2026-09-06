import Konva from 'konva';
import type { Node, TextNode } from '@/lib/types';
import { fontStack } from '@/engine/fonts';
import { textNode, dividerNode, badgeNode, glow } from './nodes';
import { withAlpha } from '@/lib/palette';
import type { BuildContext } from '../types';

/**
 * Layout vocabulary shared by every template.
 *
 * Six formats are covered by four archetypes rather than six hand-written
 * layouts: the difference that matters is how much horizontal room there is
 * next to the card, not the exact ratio.
 */
export type Archetype = 'tall' | 'portrait' | 'square' | 'landscape';

export function archetypeOf(width: number, height: number): Archetype {
  const aspect = width / height;
  if (aspect <= 0.62) return 'tall';
  if (aspect < 0.95) return 'portrait';
  if (aspect <= 1.15) return 'square';
  return 'landscape';
}

export interface Metrics {
  width: number;
  height: number;
  archetype: Archetype;
  /** Design unit: all sizes are authored against a 1080-wide canvas. */
  u: number;
  margin: number;
  contentWidth: number;
  left: number;
  right: number;
}

export function metrics(ctx: BuildContext): Metrics {
  const { width, height } = ctx;
  const archetype = archetypeOf(width, height);
  const u = Math.min(width, height * 0.8) / 1080;
  const margin = width * (archetype === 'landscape' ? 0.035 : 0.042);
  return {
    width,
    height,
    archetype,
    u,
    margin,
    contentWidth: width - margin * 2,
    left: margin,
    right: width - margin,
  };
}

interface RunPart {
  id: string;
  text: string;
  color: string;
  fontFamily?: string;
  fontWeight?: number;
  /** Multiplies the run's font size — used for superscripts like "1ST". */
  scale?: number;
}

interface RunOptions {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  transform?: 'none' | 'uppercase';
  gap?: number;
}

function measure(text: string, family: string, weight: number, size: number, tracking: number): number {
  if (!text) return 0;
  const probe = new Konva.Text({
    text,
    fontFamily: fontStack(family),
    fontSize: size,
    fontStyle: String(weight),
    letterSpacing: tracking * size,
  });
  const w = probe.getTextWidth();
  probe.destroy();
  return w;
}

/**
 * Lays out several differently-coloured pieces on one line — the reference
 * sublines put the set number in the accent colour ("Paldean Fates #232").
 * Each piece stays its own node so the user can restyle or move it.
 */
export function inlineRun(parts: RunPart[], options: RunOptions): TextNode[] {
  const tracking = options.letterSpacing ?? 0;
  const gap = options.gap ?? options.fontSize * 0.28;
  const visible = parts.filter((p) => p.text.length > 0);

  const widths = visible.map((p) =>
    measure(
      options.transform === 'uppercase' ? p.text.toUpperCase() : p.text,
      p.fontFamily ?? options.fontFamily,
      p.fontWeight ?? options.fontWeight,
      options.fontSize * (p.scale ?? 1),
      tracking,
    ),
  );
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, visible.length - 1);

  let cursor = options.x;
  if (options.align === 'center') cursor = options.x + (options.width - total) / 2;
  else if (options.align === 'right') cursor = options.x + options.width - total;

  return visible.map((part, i) => {
    const size = options.fontSize * (part.scale ?? 1);
    const node = textNode({
      id: part.id,
      x: cursor,
      y: options.y + (options.fontSize - size) * 0.85,
      width: widths[i] + size * 0.4,
      color: part.color,
      text: part.text,
      fontFamily: part.fontFamily ?? options.fontFamily,
      fontWeight: part.fontWeight ?? options.fontWeight,
      fontSize: size,
      letterSpacing: tracking,
      transform: options.transform ?? 'none',
      lineHeight: 1,
    });
    cursor += widths[i] + gap;
    return node;
  });
}

export interface HeadlineOptions {
  id?: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  color: string;
  text: string;
  fontFamily?: string;
  glowColor?: string;
}

/** The oversized accent headline every reference graphic opens with. */
export function headline(options: HeadlineOptions): TextNode {
  return textNode({
    id: options.id ?? 'headline',
    name: 'Headline',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.fontSize * 1.08,
    color: options.color,
    text: options.text,
    fontFamily: options.fontFamily ?? 'Anton',
    fontWeight: 400,
    fontSize: options.fontSize,
    letterSpacing: -0.015,
    lineHeight: 0.92,
    align: options.align ?? 'left',
    transform: 'uppercase',
    autoFit: true,
    minFontSize: options.fontSize * 0.42,
    shadow: options.glowColor ? glow(options.glowColor, options.fontSize * 0.42, 0.35) : null,
  });
}

export interface StatColumn {
  id: string;
  label: string;
  value: string;
  valueColor: string;
  /** Prefix drawn before the value in the same colour, e.g. an arrow. */
  prefix?: string;
  badge?: {
    kind: 'builtin' | 'text' | 'image';
    badgeId: string;
    text: string;
    caption: string;
  };
}

export interface StatsRowOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: StatColumn[];
  /** Thin vertical rules between the columns, as in the references. */
  separators?: boolean;
  topRule?: boolean;
  bottomRule?: boolean;
}

/**
 * The bottom band: rule, N centred label/value columns, rule.
 * Every piece is an ordinary node, so users can move or restyle any of it.
 */
export function statsRow(ctx: BuildContext, m: Metrics, options: StatsRowOptions): Node[] {
  const { palette } = ctx;
  const nodes: Node[] = [];
  const { x, y, width, height, columns } = options;
  const ruleColor = withAlpha(palette.divider, 0.28);

  if (options.topRule !== false) {
    nodes.push(
      dividerNode({
        id: 'stats-rule-top',
        name: 'Rule (top)',
        x,
        y,
        width,
        height: Math.max(1.5, m.u * 2),
        thickness: Math.max(1.5, m.u * 2),
        color: ruleColor,
      }),
    );
  }

  const labelSize = height * 0.135;
  const valueSize = height * 0.36;
  const badgeSize = height * 0.15;
  const colWidth = width / columns.length;
  const padTop = height * 0.14;

  columns.forEach((column, i) => {
    const cx = x + colWidth * i;

    nodes.push(
      textNode({
        id: `${column.id}-label`,
        name: `${column.label || 'Stat'} label`,
        x: cx,
        y: y + padTop,
        width: colWidth,
        height: labelSize * 1.3,
        color: palette.textSecondary,
        text: column.label,
        fontFamily: 'Montserrat',
        fontWeight: 500,
        fontSize: labelSize,
        letterSpacing: 0.02,
        align: 'center',
        transform: 'uppercase',
        autoFit: true,
      }),
    );

    const valueY = y + padTop + labelSize * 1.75;
    const valueText = column.prefix ? `${column.prefix}${column.value}` : column.value;
    nodes.push(
      textNode({
        id: `${column.id}-value`,
        name: `${column.label || 'Stat'} value`,
        x: cx + colWidth * 0.03,
        y: valueY,
        width: colWidth * 0.94,
        height: valueSize * 1.2,
        color: column.valueColor,
        text: valueText,
        fontFamily: 'Montserrat',
        fontWeight: 800,
        fontSize: valueSize,
        letterSpacing: -0.01,
        align: 'center',
        autoFit: true,
        minFontSize: valueSize * 0.5,
      }),
    );

    if (column.badge) {
      nodes.push(
        badgeNode({
          id: `${column.id}-badge`,
          name: `${column.label || 'Stat'} source`,
          x: cx,
          y: valueY + valueSize * 1.24,
          width: colWidth,
          height: badgeSize,
          color: palette.textPrimary,
          kind: column.badge.kind,
          badgeId: column.badge.badgeId,
          text: column.badge.text,
          caption: column.badge.caption,
          captionColor: palette.textSecondary,
          captionFontSize: badgeSize * 0.82,
          align: 'center',
        }),
      );
    }

    if (options.separators !== false && i > 0) {
      nodes.push(
        dividerNode({
          id: `stats-sep-${i}`,
          name: `Separator ${i}`,
          x: cx,
          y: y + height * 0.12,
          width: Math.max(1, m.u * 1.5),
          height: height * 0.76,
          orientation: 'vertical',
          thickness: Math.max(1, m.u * 1.5),
          color: withAlpha(palette.divider, 0.22),
        }),
      );
    }
  });

  if (options.bottomRule !== false) {
    nodes.push(
      dividerNode({
        id: 'stats-rule-bottom',
        name: 'Rule (bottom)',
        x,
        y: y + height,
        width,
        height: Math.max(1.5, m.u * 2),
        thickness: Math.max(1.5, m.u * 2),
        color: ruleColor,
      }),
    );
  }

  return nodes;
}

/** Reads a string field with a fallback, so `build()` never renders "undefined". */
export function str(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key];
  return typeof value === 'string' ? value : fallback;
}

export function num(data: Record<string, unknown>, key: string, fallback = 0): number {
  const value = data[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function bool(data: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = data[key];
  return typeof value === 'boolean' ? value : fallback;
}
