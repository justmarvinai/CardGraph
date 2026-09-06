import type { CardGraphDocument, Format, Node, Palette } from '@/lib/types';
import { FORMATS } from '@/lib/types';
import { resolvePalette } from '@/lib/palette';
import { DEFAULT_FORMATTING } from '@/lib/format';
import { DEFAULT_ANIMATION } from './animation';
import { requireTemplate } from '@/templates/registry';
import type { BuildContext } from '@/templates/types';
import { createId } from '@/lib/id';

/**
 * Turns a stored document into the node list the renderer draws:
 * `template.build()` for layout, then the user's overrides on top by node id,
 * then any nodes the user added themselves.
 */

export function buildContext(doc: CardGraphDocument, palette: Palette): BuildContext {
  const spec = FORMATS[doc.format];
  return {
    width: spec.width,
    height: spec.height,
    format: doc.format,
    theme: doc.theme,
    palette,
    formatting: doc.formatting,
    data: doc.data,
    variantId: doc.variantId,
  };
}

export function resolveNodes(doc: CardGraphDocument): Node[] {
  const palette = resolvePalette(doc.theme, doc.palette);
  const template = requireTemplate(doc.templateId);
  const base = template.build(buildContext(doc, palette));

  const merged = base.map((node) => {
    const override = doc.overrides[node.id];
    return override ? ({ ...node, ...override, type: node.type } as Node) : node;
  });

  return [...merged, ...doc.extraNodes];
}

/** Node ids the template owns, used to decide what "Reset layout" clears. */
export function templateNodeIds(doc: CardGraphDocument): string[] {
  const palette = resolvePalette(doc.theme, doc.palette);
  return requireTemplate(doc.templateId)
    .build(buildContext(doc, palette))
    .map((n) => n.id);
}

/**
 * Auto-computed fields (percent change, dates, formatted prices) are refreshed
 * on every data change, except where the user typed a value themselves (Q10).
 */
export function applyDerived(doc: CardGraphDocument): CardGraphDocument {
  const template = requireTemplate(doc.templateId);
  if (!template.derive) return doc;

  const computed = template.derive(doc.data, doc.formatting);
  const data = { ...doc.data };
  let changed = false;

  for (const [key, value] of Object.entries(computed)) {
    if (doc.unbound.includes(key)) continue;
    if (data[key] !== value) {
      data[key] = value;
      changed = true;
    }
  }

  return changed ? { ...doc, data } : doc;
}

export function createDocument(templateId: string, variantId: string | null): CardGraphDocument {
  const template = requireTemplate(templateId);
  const variant = variantId ? template.variants.find((v) => v.id === variantId) : undefined;

  const doc: CardGraphDocument = {
    version: 1,
    id: createId('doc'),
    name: variant?.name ?? template.name,
    templateId,
    variantId: variant?.id ?? null,
    format: '4:5',
    theme: 'dark',
    palette: {},
    data: { ...template.defaults, ...(variant?.data ?? {}) },
    unbound: [],
    overrides: {},
    extraNodes: [],
    background: {
      source: 'card',
      customAssetId: null,
      blur: 90,
      overlayStrength: 0.86,
      vignette: 0.35,
      zoom: 1.1,
      fallbackColor: '#08090A',
    },
    animation: { ...DEFAULT_ANIMATION },
    formatting: { ...DEFAULT_FORMATTING },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return applyDerived(doc);
}

/**
 * Format changes re-run the template layout; only the user's own overrides need
 * moving, and they are scaled proportionally (Q11). "Reset layout" undoes any
 * awkwardness a big aspect-ratio jump leaves behind.
 */
export function rescaleForFormat(
  doc: CardGraphDocument,
  from: Format,
  to: Format,
): CardGraphDocument {
  const a = FORMATS[from];
  const b = FORMATS[to];
  const sx = b.width / a.width;
  const sy = b.height / a.height;
  const s = Math.min(sx, sy);

  const scaleNode = <T extends Partial<Node>>(node: T): T => {
    const out: Record<string, unknown> = { ...node };
    if (typeof node.x === 'number') out.x = node.x * sx;
    if (typeof node.y === 'number') out.y = node.y * sy;
    if (typeof node.width === 'number') out.width = node.width * s;
    if (typeof node.height === 'number') out.height = node.height * s;
    const withFont = node as { fontSize?: number };
    if (typeof withFont.fontSize === 'number') out.fontSize = withFont.fontSize * s;
    const withStroke = node as { strokeWidth?: number };
    if (typeof withStroke.strokeWidth === 'number') out.strokeWidth = withStroke.strokeWidth * s;
    const withThickness = node as { thickness?: number };
    if (typeof withThickness.thickness === 'number') out.thickness = withThickness.thickness * s;
    return out as T;
  };

  return {
    ...doc,
    format: to,
    overrides: Object.fromEntries(
      Object.entries(doc.overrides).map(([id, override]) => [id, scaleNode(override)]),
    ),
    extraNodes: doc.extraNodes.map((node) => scaleNode(node)),
  };
}

export function documentSize(doc: CardGraphDocument): { width: number; height: number } {
  const spec = FORMATS[doc.format];
  return { width: spec.width, height: spec.height };
}
