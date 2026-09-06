import Konva from 'konva';
import type { DividerNode } from '@/lib/types';
import { withAlpha } from '@/lib/palette';
import type { RenderContext } from '../context';

export function renderDivider(node: DividerNode, _ctx: RenderContext): Konva.Group {
  const group = new Konva.Group({
    id: node.id,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    opacity: node.opacity,
    listening: !node.locked,
  });

  const horizontal = node.orientation === 'horizontal';
  const length = horizontal ? node.width : node.height;
  const thickness = node.thickness;

  const config: Konva.RectConfig = {
    width: horizontal ? length : thickness,
    height: horizontal ? thickness : length,
  };

  if (node.fade > 0) {
    // Fading ends is what makes the vertical accent split read as a glow line
    // rather than a hard rule.
    const edge = withAlpha(node.color, 0);
    const mid = node.color;
    config.fillLinearGradientStartPoint = { x: 0, y: 0 };
    config.fillLinearGradientEndPoint = horizontal ? { x: length, y: 0 } : { x: 0, y: length };
    const stop = 0.5 * node.fade;
    config.fillLinearGradientColorStops = [0, edge, stop, mid, 1 - stop, mid, 1, edge];
  } else {
    config.fill = node.color;
  }

  group.add(new Konva.Rect(config));

  // Generous hit area — a 2 px line is otherwise impossible to click.
  group.add(
    new Konva.Rect({
      x: horizontal ? 0 : -6,
      y: horizontal ? -6 : 0,
      width: horizontal ? length : thickness + 12,
      height: horizontal ? thickness + 12 : length,
      fill: 'transparent',
    }),
  );

  return group;
}
