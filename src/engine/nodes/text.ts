import Konva from 'konva';
import type { TextNode } from '@/lib/types';
import { fontStack } from '../fonts';
import type { RenderContext } from '../context';

export function applyTextTransform(node: TextNode): string {
  return node.transform === 'uppercase' ? node.text.toUpperCase() : node.text;
}

function baseConfig(node: TextNode, fontSize: number): Konva.TextConfig {
  return {
    text: applyTextTransform(node),
    fontFamily: fontStack(node.fontFamily),
    fontSize,
    fontStyle: String(node.fontWeight),
    fill: node.color,
    align: node.align,
    verticalAlign: node.verticalAlign,
    lineHeight: node.lineHeight,
    letterSpacing: node.letterSpacing * fontSize,
    width: node.width,
    wrap: 'word',
  };
}

/**
 * Headlines are typed by the user and can be long ("CHARIZARD VMAX RAINBOW"),
 * so display text shrinks to fit its box instead of wrapping or overflowing.
 */
function fitFontSize(node: TextNode): number {
  if (!node.autoFit || !node.text) return node.fontSize;
  const min = node.minFontSize ?? node.fontSize * 0.4;
  const probe = new Konva.Text(baseConfig(node, node.fontSize));
  probe.width(undefined as unknown as number);

  let size = node.fontSize;
  for (let i = 0; i < 40; i += 1) {
    probe.fontSize(size);
    probe.letterSpacing(node.letterSpacing * size);
    const w = probe.getTextWidth();
    const linesFit = node.height <= 0 || probe.height() <= node.height;
    if (w <= node.width && linesFit) break;
    if (size <= min) break;
    size = Math.max(min, size * Math.min(0.97, Math.max(0.7, node.width / Math.max(1, w))));
  }
  probe.destroy();
  return size;
}

export function renderText(node: TextNode, _ctx: RenderContext): Konva.Group {
  const group = new Konva.Group({
    id: node.id,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    opacity: node.opacity,
    listening: !node.locked,
  });

  const fontSize = fitFontSize(node);
  const config = baseConfig(node, fontSize);
  if (node.height > 0) config.height = node.height;

  if (node.shadow) {
    config.shadowColor = node.shadow.color;
    config.shadowBlur = node.shadow.blur;
    config.shadowOffsetX = node.shadow.offsetX;
    config.shadowOffsetY = node.shadow.offsetY;
    config.shadowOpacity = node.shadow.opacity;
  }

  group.add(new Konva.Text(config));
  return group;
}

/** Measured height of a text node at its fitted size — used by layout code. */
export function measureText(node: TextNode): { width: number; height: number } {
  const fontSize = fitFontSize(node);
  const probe = new Konva.Text(baseConfig(node, fontSize));
  const size = { width: probe.width(), height: probe.height() };
  probe.destroy();
  return size;
}
