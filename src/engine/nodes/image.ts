import Konva from 'konva';
import type { ImageNode } from '@/lib/types';
import { fitRect } from '@/lib/math';
import { withAlpha } from '@/lib/palette';
import type { RenderContext } from '../context';

export function renderImage(node: ImageNode, ctx: RenderContext): Konva.Group {
  const motion = ctx.motionFor(node);
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;

  // Animation transforms around the card's centre so it bobs in place.
  const group = new Konva.Group({
    id: node.id,
    x: cx + motion.dx,
    y: cy + motion.dy,
    offsetX: node.width / 2,
    offsetY: node.height / 2,
    width: node.width,
    height: node.height,
    rotation: node.rotation + motion.rotation,
    scaleX: motion.scale,
    scaleY: motion.scale,
    skewX: motion.skewX,
    opacity: node.opacity,
    listening: !node.locked,
  });

  const image = ctx.getImage(node.assetId);

  if (!image) {
    if (ctx.showPlaceholders) group.add(placeholder(node));
    return group;
  }

  const box = fitRect(image.naturalWidth, image.naturalHeight, node.width, node.height, node.fit);
  const config: Konva.ImageConfig = {
    image,
    x: node.fit === 'contain' ? box.x : 0,
    y: node.fit === 'contain' ? box.y : 0,
    width: node.fit === 'contain' ? box.width : node.width,
    height: node.fit === 'contain' ? box.height : node.height,
    cornerRadius: node.radius,
    scaleX: node.flipX ? -1 : 1,
    offsetX: node.flipX ? (node.fit === 'contain' ? box.width : node.width) : 0,
  };

  if (node.fit === 'cover') {
    // Crop to the node box rather than letting the image bleed outside it.
    config.crop = cropForCover(image, node.width, node.height);
  }

  if (node.shadow) {
    config.shadowColor = node.shadow.color;
    config.shadowBlur = node.shadow.blur * motion.shadowBlurScale;
    config.shadowOffsetX = node.shadow.offsetX;
    config.shadowOffsetY = node.shadow.offsetY + motion.shadowOffsetY;
    config.shadowOpacity = node.shadow.opacity;
  }

  group.add(new Konva.Image(config));
  return group;
}

function cropForCover(image: HTMLImageElement, w: number, h: number) {
  const targetRatio = w / h;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  if (sourceRatio > targetRatio) {
    const cropWidth = image.naturalHeight * targetRatio;
    return {
      x: (image.naturalWidth - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: image.naturalHeight,
    };
  }
  const cropHeight = image.naturalWidth / targetRatio;
  return {
    x: 0,
    y: (image.naturalHeight - cropHeight) / 2,
    width: image.naturalWidth,
    height: cropHeight,
  };
}

/** Editor-only hint that this slot is waiting for an upload. */
function placeholder(node: ImageNode): Konva.Group {
  const group = new Konva.Group({ listening: false });
  group.add(
    new Konva.Rect({
      width: node.width,
      height: node.height,
      cornerRadius: Math.max(node.radius, 16),
      fill: withAlpha('#FFFFFF', 0.04),
      stroke: withAlpha('#FFFFFF', 0.28),
      strokeWidth: 2,
      dash: [14, 12],
    }),
  );
  group.add(
    new Konva.Text({
      text: node.role === 'card' ? 'Drop your card image here' : 'Image',
      width: node.width,
      y: node.height / 2 - node.width * 0.035,
      fontSize: Math.max(14, node.width * 0.055),
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: '600',
      fill: withAlpha('#FFFFFF', 0.6),
      align: 'center',
    }),
  );
  return group;
}
