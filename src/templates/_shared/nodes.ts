import type {
  BadgeNode,
  ChartNode,
  ChartRow,
  DividerNode,
  ImageNode,
  Shadow,
  TextNode,
} from '@/lib/types';

/**
 * Node factories with the design-language defaults applied, so a template body
 * stays readable and no template hand-writes a colour or a magic number twice.
 */

export function textNode(node: Partial<TextNode> & Pick<TextNode, 'id' | 'x' | 'y' | 'width' | 'color'>): TextNode {
  return {
    type: 'text',
    name: node.name ?? node.id,
    text: '',
    height: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fromTemplate: true,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: 40,
    letterSpacing: 0,
    lineHeight: 1.1,
    align: 'left',
    verticalAlign: 'top',
    transform: 'none',
    shadow: null,
    autoFit: false,
    ...node,
  };
}

export function imageNode(node: Partial<ImageNode> & Pick<ImageNode, 'id' | 'x' | 'y' | 'width' | 'height'>): ImageNode {
  return {
    type: 'image',
    name: node.name ?? node.id,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fromTemplate: true,
    assetId: null,
    fit: 'contain',
    radius: 0,
    shadow: null,
    role: 'extra',
    flipX: false,
    ...node,
  };
}

export function dividerNode(
  node: Partial<DividerNode> & Pick<DividerNode, 'id' | 'x' | 'y' | 'width' | 'height' | 'color'>,
): DividerNode {
  return {
    type: 'divider',
    name: node.name ?? node.id,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fromTemplate: true,
    orientation: 'horizontal',
    thickness: 2,
    fade: 0,
    ...node,
  };
}

export function badgeNode(
  node: Partial<BadgeNode> & Pick<BadgeNode, 'id' | 'x' | 'y' | 'width' | 'height' | 'color'>,
): BadgeNode {
  return {
    type: 'badge',
    name: node.name ?? node.id,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fromTemplate: true,
    kind: 'builtin',
    badgeId: 'ebay',
    text: '',
    assetId: null,
    caption: '',
    captionColor: node.color,
    captionFontFamily: 'Montserrat',
    captionFontSize: node.height * 0.85,
    align: 'center',
    ...node,
  };
}

export function chartNode(
  node: Partial<ChartNode> & Pick<ChartNode, 'id' | 'x' | 'y' | 'width' | 'height' | 'panelFill' | 'gridColor' | 'axisColor'>,
): ChartNode {
  return {
    type: 'chart',
    name: node.name ?? node.id,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fromTemplate: true,
    rows: [],
    strokeMode: 'auto',
    stroke: '#2EE59D',
    strokeWidth: Math.max(3, node.width * 0.011),
    smooth: true,
    glow: node.width * 0.03,
    panelRadius: node.width * 0.055,
    panelOpacity: 0.82,
    showPanel: true,
    showYAxis: true,
    showXAxis: true,
    showGrid: false,
    axisFontFamily: 'Bebas Neue',
    axisFontSize: node.width * 0.062,
    tickCount: 6,
    padding: { top: 0.07, right: 0.05, bottom: 0.13, left: 0.2 },
    ...node,
  };
}

export function softShadow(color: string, size: number, opacity = 0.55): Shadow {
  return { color, blur: size, offsetX: 0, offsetY: size * 0.35, opacity };
}

export function glow(color: string, size: number, opacity = 0.5): Shadow {
  return { color, blur: size, offsetX: 0, offsetY: 0, opacity };
}

export function rowsFromPairs(pairs: [string, number][]): ChartRow[] {
  return pairs.map(([label, value], i) => ({ id: `r${i}`, label, value }));
}
