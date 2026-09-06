import Konva from 'konva';
import type { BadgeNode } from '@/lib/types';
import { getBadge } from '@/lib/badges';
import { fitRect } from '@/lib/math';
import { fontStack } from '../fonts';
import type { RenderContext } from '../context';

/**
 * A source mark plus an optional caption ("eBay · AUG 31, 2026"), laid out on
 * one baseline and aligned as a unit.
 */
export function renderBadge(node: BadgeNode, ctx: RenderContext): Konva.Group {
  const group = new Konva.Group({
    id: node.id,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    opacity: node.opacity,
    listening: !node.locked,
  });

  const markHeight = node.height;
  const parts: Konva.Node[] = [];
  let cursor = 0;

  if (node.kind === 'image') {
    const image = ctx.getImage(node.assetId);
    if (image) {
      const box = fitRect(image.naturalWidth, image.naturalHeight, node.width, markHeight, 'contain');
      parts.push(
        new Konva.Image({ image, x: 0, y: (markHeight - box.height) / 2, width: box.width, height: box.height }),
      );
      cursor = box.width;
    }
  } else {
    const builtin = node.kind === 'builtin' ? getBadge(node.badgeId) : undefined;
    const segments = builtin
      ? builtin.segments
      : [{ text: node.text, color: null as string | null }];
    const family = builtin?.fontFamily ?? 'Montserrat';
    const weight = builtin?.fontWeight ?? 700;
    const tracking = builtin?.letterSpacing ?? 0;
    const fontSize = markHeight * (builtin?.scale ?? 1);

    for (const segment of segments) {
      if (!segment.text) continue;
      const text = new Konva.Text({
        text: segment.text,
        x: cursor,
        fontFamily: fontStack(family),
        fontSize,
        fontStyle: builtin?.italic ? `italic ${weight}` : String(weight),
        letterSpacing: tracking * fontSize,
        fill: segment.color ?? node.color,
      });
      parts.push(text);
      cursor += text.getTextWidth();
    }
  }

  if (node.caption) {
    const caption = new Konva.Text({
      text: node.caption,
      x: cursor + node.captionFontSize * 0.35,
      y: (markHeight - node.captionFontSize) / 2 + node.captionFontSize * 0.06,
      fontFamily: fontStack(node.captionFontFamily),
      fontSize: node.captionFontSize,
      fontStyle: '500',
      fill: node.captionColor,
    });
    parts.push(caption);
    cursor += caption.getTextWidth() + node.captionFontSize * 0.35;
  }

  // Align the assembled row inside the node's own width.
  const offset =
    node.align === 'center' ? (node.width - cursor) / 2 : node.align === 'right' ? node.width - cursor : 0;
  const inner = new Konva.Group({ x: offset });
  parts.forEach((part) => inner.add(part as Konva.Shape));
  group.add(inner);

  group.add(new Konva.Rect({ width: node.width, height: markHeight, fill: 'transparent' }));
  return group;
}

/** Width the badge actually occupies — templates use it to centre a stat block. */
export function measureBadge(node: BadgeNode, ctx: RenderContext): number {
  const group = renderBadge(node, ctx);
  const inner = group.getChildren()[0] as Konva.Group;
  const width = inner.getChildren().reduce((max, child) => {
    const shape = child as Konva.Shape;
    return Math.max(max, shape.x() + shape.width());
  }, 0);
  group.destroy();
  return width;
}
