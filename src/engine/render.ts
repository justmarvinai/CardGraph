import Konva from 'konva';
import type { CardGraphDocument, Node } from '@/lib/types';
import { renderBackground } from './background';
import { renderText } from './nodes/text';
import { renderImage } from './nodes/image';
import { renderChart } from './nodes/chart';
import { renderDivider } from './nodes/divider';
import { renderBadge } from './nodes/badge';
import type { RenderContext } from './context';

/**
 * One renderer for the editor canvas and the export pipeline, so what a user
 * sees while editing is exactly what lands in the PNG/GIF/MP4.
 */

export interface Scene {
  document: CardGraphDocument;
  nodes: Node[];
  width: number;
  height: number;
  context: RenderContext;
  /** Identity of the background image, so its cache key stays stable. */
  backgroundImageKey: string;
}

export function renderNode(node: Node, ctx: RenderContext): Konva.Group | null {
  if (!node.visible) return null;
  switch (node.type) {
    case 'text':
      return renderText(node, ctx);
    case 'image':
      return renderImage(node, ctx);
    case 'chart':
      return renderChart(node, ctx);
    case 'divider':
      return renderDivider(node, ctx);
    case 'badge':
      return renderBadge(node, ctx);
    default:
      return null;
  }
}

export function buildBackgroundLayer(scene: Scene): Konva.Layer {
  const layer = new Konva.Layer({ listening: false });
  const { document: doc, context } = scene;
  const source =
    doc.background.source === 'custom' ? doc.background.customAssetId : mainCardAsset(scene.nodes);

  const canvas = renderBackground({
    width: scene.width,
    height: scene.height,
    theme: doc.theme,
    palette: context.palette,
    settings: doc.background,
    image: context.getImage(source),
    imageKey: scene.backgroundImageKey,
  });

  layer.add(new Konva.Image({ image: canvas, width: scene.width, height: scene.height }));
  return layer;
}

export function buildContentLayer(scene: Scene): Konva.Layer {
  const layer = new Konva.Layer();
  for (const node of scene.nodes) {
    const shape = renderNode(node, scene.context);
    if (shape) layer.add(shape);
  }
  return layer;
}

export function mainCardAsset(nodes: Node[]): string | null {
  for (const node of nodes) {
    if (node.type === 'image' && node.role === 'card' && node.assetId) return node.assetId;
  }
  return null;
}

/** Off-screen stage used by every export path. */
export function renderSceneToCanvas(scene: Scene, pixelRatio: number): HTMLCanvasElement {
  const container = document.createElement('div');
  const stage = new Konva.Stage({ container, width: scene.width, height: scene.height });
  stage.add(buildBackgroundLayer(scene));
  stage.add(buildContentLayer(scene));
  stage.draw();
  const canvas = stage.toCanvas({ pixelRatio });
  stage.destroy();
  return canvas;
}
