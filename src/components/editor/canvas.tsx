'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import type { CardGraphDocument, ImageNode, Node, TextNode } from '@/lib/types';
import { FORMATS } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { resolveNodes } from '@/engine/document';
import { buildBackgroundLayer, buildContentLayer, mainCardAsset } from '@/engine/render';
import { getCachedImage, loadImage } from '@/engine/assets';
import { motionAt, NO_MOTION } from '@/engine/animation';
import { resolvePalette, withAlpha } from '@/lib/palette';
import { requireTemplate } from '@/templates/registry';
import { ensureFontsLoaded } from '@/engine/fonts';
import { fontStack } from '@/engine/fonts';
import type { RenderContext } from '@/engine/context';

const SNAP_TOLERANCE = 7;

interface Guide {
  orientation: 'v' | 'h';
  position: number;
}

export interface CanvasHandle {
  fit: () => void;
  zoomTo: (scale: number) => void;
}

export function EditorCanvas({
  playing,
  onViewport,
  onReady,
}: {
  playing: boolean;
  onViewport?: (state: { scale: number }) => void;
  onReady?: (handle: CanvasHandle) => void;
}) {
  const doc = useEditor((s) => s.doc);
  const selection = useEditor((s) => s.selection);
  const assetVersion = useEditor((s) => s.assetVersion);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const updateNodes = useEditor((s) => s.updateNodes);
  const setField = useEditor((s) => s.setField);
  const bumpAssets = useEditor((s) => s.bumpAssets);

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const contentRef = useRef<Konva.Layer | null>(null);
  const uiRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const rafRef = useRef<number | null>(null);
  const spaceRef = useRef(false);

  const [fontsReady, setFontsReady] = useState(false);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [editing, setEditing] = useState<{ node: TextNode; field: string | null } | null>(null);

  const size = FORMATS[doc.format];
  const palette = useMemo(() => resolvePalette(doc.theme, doc.palette), [doc.theme, doc.palette]);
  const nodes = useMemo(() => resolveNodes(doc), [doc]);

  // ── Fonts and images ────────────────────────────────────────────────────
  useEffect(() => {
    void ensureFontsLoaded().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const ids = new Set<string>();
    for (const node of nodes) {
      if (node.type === 'image' && node.assetId) ids.add(node.assetId);
      if (node.type === 'badge' && node.assetId) ids.add(node.assetId);
    }
    if (doc.background.customAssetId) ids.add(doc.background.customAssetId);
    const missing = [...ids].filter((id) => !getCachedImage(id));
    if (!missing.length) return;
    let cancelled = false;
    void Promise.all(missing.map(loadImage)).then(() => {
      if (!cancelled) bumpAssets();
    });
    return () => {
      cancelled = true;
    };
  }, [nodes, doc.background.customAssetId, bumpAssets]);

  const renderContext = useCallback(
    (t: number | null): RenderContext => ({
      width: size.width,
      height: size.height,
      theme: doc.theme,
      palette,
      formatting: doc.formatting,
      getImage: (assetId) => getCachedImage(assetId),
      motionFor: (node) =>
        t === null || node.type !== 'image' || node.role !== 'card'
          ? NO_MOTION
          : motionAt(doc.animation, t, Math.min(node.width, node.height)),
      showPlaceholders: true,
    }),
    [doc.animation, doc.formatting, doc.theme, palette, size.height, size.width],
  );

  // ── Stage lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const stage = new Konva.Stage({ container: host, width: 100, height: 100 });
    const ui = new Konva.Layer();
    const transformer = new Konva.Transformer({
      rotateAnchorOffset: 28,
      anchorSize: 9,
      anchorStroke: '#CCFF00',
      anchorFill: '#0B0C0E',
      anchorCornerRadius: 2,
      borderStroke: '#CCFF00',
      borderStrokeWidth: 1.5,
      padding: 2,
      ignoreStroke: true,
    });
    ui.add(transformer);
    stage.add(ui);

    stageRef.current = stage;
    uiRef.current = ui;
    transformerRef.current = transformer;

    return () => {
      stage.destroy();
      stageRef.current = null;
      contentRef.current = null;
      uiRef.current = null;
      transformerRef.current = null;
    };
  }, []);

  // ── Viewport ────────────────────────────────────────────────────────────
  const fit = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const pad = 56;
    const scale = Math.min(
      (host.clientWidth - pad) / size.width,
      (host.clientHeight - pad) / size.height,
    );
    const next = Math.max(0.05, scale);
    setViewport({
      scale: next,
      x: (host.clientWidth - size.width * next) / 2,
      y: (host.clientHeight - size.height * next) / 2,
    });
  }, [size.height, size.width]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => {
      const stage = stageRef.current;
      if (!stage) return;
      stage.size({ width: host.clientWidth, height: host.clientHeight });
      fit();
    });
    observer.observe(host);
    fit();
    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    fit();
  }, [doc.format, fit]);

  useEffect(() => {
    onViewport?.({ scale: viewport.scale });
  }, [viewport.scale, onViewport]);

  useEffect(() => {
    onReady?.({
      fit,
      zoomTo: (scale: number) => {
        const host = hostRef.current;
        if (!host) return;
        setViewport({
          scale,
          x: (host.clientWidth - size.width * scale) / 2,
          y: (host.clientHeight - size.height * scale) / 2,
        });
      },
    });
  }, [fit, onReady, size.height, size.width]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: viewport.scale, y: viewport.scale });
    stage.position({ x: viewport.x, y: viewport.y });
    stage.batchDraw();
  }, [viewport]);

  // ── Scene rendering ─────────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const ui = uiRef.current;
    if (!stage || !ui || !fontsReady) return;

    const ctx = renderContext(playing ? 0 : null);
    const scene = {
      document: doc,
      nodes,
      width: size.width,
      height: size.height,
      context: ctx,
      backgroundImageKey:
        (doc.background.source === 'custom' ? doc.background.customAssetId : mainCardAsset(nodes)) ??
        `none-${assetVersion}`,
    };

    // `getLayers()` hands back the stage's live child array, so destroying while
    // iterating it splices entries out from under the loop and leaves an old
    // content layer behind — which then ghosts under the new one.
    for (const layer of [...stage.getLayers()]) {
      if (layer !== ui) layer.destroy();
    }

    const background = buildBackgroundLayer(scene);
    const content = buildContentLayer(scene);
    contentRef.current = content;

    // A frame around the artboard so the canvas edge is visible on any backdrop.
    content.add(
      new Konva.Rect({
        width: size.width,
        height: size.height,
        stroke: withAlpha('#FFFFFF', 0.1),
        strokeWidth: 1 / Math.max(0.001, viewport.scale),
        listening: false,
      }),
    );

    stage.add(background);
    stage.add(content);
    background.moveToBottom();
    ui.moveToTop();

    attachInteractions(content);
    stage.batchDraw();
    // `viewport.scale` only affects the hairline width, so it is intentionally
    // not a dependency — re-rendering the whole scene on every zoom step would
    // make panning feel heavy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, nodes, fontsReady, assetVersion, renderContext, playing, size.height, size.width]);

  // ── Selection ───────────────────────────────────────────────────────────
  useEffect(() => {
    const transformer = transformerRef.current;
    const content = contentRef.current;
    if (!transformer || !content) return;
    const selected = selection
      .map((id) => content.findOne(`#${id}`))
      .filter((n): n is Konva.Group => Boolean(n));
    transformer.nodes(selected);
    transformer.getLayer()?.batchDraw();
  }, [selection, nodes, doc]);

  // ── Animation preview ───────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const start = performance.now();
    const tick = () => {
      const content = contentRef.current;
      if (!content) return;
      const elapsed = (performance.now() - start) % doc.animation.durationMs;
      const t = elapsed / doc.animation.durationMs;
      for (const node of nodes) {
        if (node.type !== 'image' || node.role !== 'card') continue;
        const group = content.findOne(`#${node.id}`);
        if (!group) continue;
        const motion = motionAt(doc.animation, t, Math.min(node.width, node.height));
        group.x(node.x + node.width / 2 + motion.dx);
        group.y(node.y + node.height / 2 + motion.dy);
        group.rotation(node.rotation + motion.rotation);
        group.scale({ x: motion.scale, y: motion.scale });
        group.skewX(motion.skewX);
      }
      content.batchDraw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, doc.animation, nodes]);

  // ── Interactions ────────────────────────────────────────────────────────
  const attachInteractions = useCallback(
    (content: Konva.Layer) => {
      const stage = stageRef.current;
      const ui = uiRef.current;
      if (!stage || !ui) return;

      for (const node of nodes) {
        const group = content.findOne(`#${node.id}`) as Konva.Group | undefined;
        if (!group) continue;
        group.draggable(!node.locked && node.visible);

        group.on('mousedown touchstart', (event) => {
          if (spaceRef.current) return;
          event.cancelBubble = true;
          const shift = (event.evt as MouseEvent).shiftKey;
          if (shift) toggleSelect(node.id);
          else if (!selectionRef.current.includes(node.id)) select([node.id]);
        });

        group.on('dblclick dbltap', () => {
          if (node.type !== 'text') return;
          const template = requireTemplate(doc.templateId);
          setEditing({ node, field: template.nodeFields?.[node.id] ?? null });
        });

        group.on('dragmove', () => {
          const guides = snapGroup(group, node, nodes, size.width, size.height);
          drawGuides(ui, guides, size.width, size.height, viewport.scale);
        });

        group.on('dragend', () => {
          clearGuides(ui);
          const isCard = node.type === 'image' && node.role === 'card';
          const x = isCard ? group.x() - node.width / 2 : group.x();
          const y = isCard ? group.y() - node.height / 2 : group.y();
          updateNodes([{ id: node.id, patch: { x, y } }]);
        });

        group.on('transformend', () => {
          const scaleX = group.scaleX();
          const scaleY = group.scaleY();
          group.scale({ x: 1, y: 1 });
          const patch = scalePatch(node, scaleX, scaleY, group.rotation());
          const isCard = node.type === 'image' && node.role === 'card';
          patch.x = isCard ? group.x() - (patch.width ?? node.width) / 2 : group.x();
          patch.y = isCard ? group.y() - (patch.height ?? node.height) / 2 : group.y();
          updateNodes([{ id: node.id, patch }]);
        });
      }
    },
    [doc.templateId, nodes, select, size.height, size.width, toggleSelect, updateNodes, viewport.scale],
  );

  const selectionRef = useRef(selection);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  // Stage-level: click-away, marquee, wheel zoom, space-pan.
  useEffect(() => {
    const stage = stageRef.current;
    const ui = uiRef.current;
    const host = hostRef.current;
    if (!stage || !ui || !host) return;

    let marquee: Konva.Rect | null = null;
    let origin: { x: number; y: number } | null = null;
    let panning = false;
    let panStart = { x: 0, y: 0, vx: 0, vy: 0 };

    const toStage = (): { x: number; y: number } => {
      const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
      return {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };
    };

    const onMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
      const middle = event.evt.button === 1;
      if (spaceRef.current || middle) {
        panning = true;
        const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
        panStart = { x: pointer.x, y: pointer.y, vx: stage.x(), vy: stage.y() };
        event.evt.preventDefault();
        return;
      }
      if (event.target !== stage && event.target.getLayer() !== ui) return;
      if (event.target !== stage && event.target.parent?.className === 'Transformer') return;
      origin = toStage();
      marquee = new Konva.Rect({
        stroke: '#CCFF00',
        strokeWidth: 1 / stage.scaleX(),
        fill: 'rgba(204,255,0,0.08)',
        listening: false,
        name: 'marquee',
      });
      ui.add(marquee);
      if (!event.evt.shiftKey) select([]);
    };

    const onMouseMove = () => {
      if (panning) {
        const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
        setViewport((v) => ({
          ...v,
          x: panStart.vx + (pointer.x - panStart.x),
          y: panStart.vy + (pointer.y - panStart.y),
        }));
        return;
      }
      if (!marquee || !origin) return;
      const current = toStage();
      marquee.setAttrs({
        x: Math.min(origin.x, current.x),
        y: Math.min(origin.y, current.y),
        width: Math.abs(current.x - origin.x),
        height: Math.abs(current.y - origin.y),
      });
      ui.batchDraw();
    };

    const onMouseUp = () => {
      panning = false;
      if (!marquee || !origin) return;
      const box = marquee.getClientRect({ relativeTo: stage as unknown as Konva.Container });
      marquee.destroy();
      marquee = null;
      origin = null;
      ui.batchDraw();
      if (box.width < 4 && box.height < 4) return;
      const hits = nodes
        .filter((node) => node.visible && !node.locked)
        .filter(
          (node) =>
            node.x < box.x + box.width &&
            node.x + node.width > box.x &&
            node.y < box.y + box.height &&
            node.y + node.height > box.y,
        )
        .map((node) => node.id);
      select(hits);
    };

    const onWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      if (event.evt.ctrlKey || event.evt.metaKey) {
        const oldScale = stage.scaleX();
        const direction = event.evt.deltaY > 0 ? -1 : 1;
        const next = Math.min(4, Math.max(0.05, oldScale * (direction > 0 ? 1.08 : 1 / 1.08)));
        const mouse = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        setViewport({
          scale: next,
          x: pointer.x - mouse.x * next,
          y: pointer.y - mouse.y * next,
        });
      } else {
        setViewport((v) => ({ ...v, x: v.x - event.evt.deltaX, y: v.y - event.evt.deltaY }));
      }
    };

    stage.on('mousedown touchstart', onMouseDown);
    stage.on('mousemove touchmove', onMouseMove);
    stage.on('mouseup touchend', onMouseUp);
    stage.on('wheel', onWheel);

    return () => {
      stage.off('mousedown touchstart', onMouseDown);
      stage.off('mousemove touchmove', onMouseMove);
      stage.off('mouseup touchend', onMouseUp);
      stage.off('wheel', onWheel);
    };
  }, [nodes, select]);

  // ── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isTypingTarget(event.target)) {
        spaceRef.current = true;
        if (hostRef.current) hostRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spaceRef.current = false;
        if (hostRef.current) hostRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ── Inline text editing ─────────────────────────────────────────────────
  const commitEdit = (value: string) => {
    if (!editing) return;
    if (editing.field) setField(editing.field, value);
    else updateNodes([{ id: editing.node.id, patch: { text: value } as Partial<Node> }]);
    setEditing(null);
  };

  return (
    <div className="relative size-full overflow-hidden cg-canvas-bg">
      <div ref={hostRef} className="size-full" />
      {editing && (
        <InlineEditor
          node={editing.node}
          viewport={viewport}
          onCommit={commitEdit}
          onCancel={() => setEditing(null)}
        />
      )}
      {!fontsReady && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="text-[13px] text-ink-400">Loading fonts…</span>
        </div>
      )}
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/** Resize commits differ per node type — text scales its font, shapes their box. */
function scalePatch(node: Node, scaleX: number, scaleY: number, rotation: number): Partial<Node> {
  const patch: Record<string, unknown> = { rotation };
  patch.width = Math.max(8, node.width * scaleX);
  if (node.type === 'text') {
    patch.fontSize = Math.max(6, (node as TextNode).fontSize * scaleY);
    if (node.height > 0) patch.height = Math.max(8, node.height * scaleY);
  } else {
    patch.height = Math.max(8, node.height * scaleY);
  }
  if (node.type === 'chart') {
    const s = Math.min(scaleX, scaleY);
    patch.strokeWidth = node.strokeWidth * s;
    patch.axisFontSize = node.axisFontSize * s;
    patch.panelRadius = node.panelRadius * s;
    patch.glow = node.glow * s;
  }
  if (node.type === 'divider') {
    patch.thickness = node.thickness * (node.orientation === 'horizontal' ? scaleY : scaleX);
  }
  return patch as Partial<Node>;
}

/** Snaps to canvas centre lines, edges and other nodes' edges while dragging. */
function snapGroup(
  group: Konva.Group,
  node: Node,
  all: Node[],
  canvasWidth: number,
  canvasHeight: number,
): Guide[] {
  const isCard = node.type === 'image' && node.role === 'card';
  const width = node.width;
  const height = node.height;
  const left = isCard ? group.x() - width / 2 : group.x();
  const top = isCard ? group.y() - height / 2 : group.y();

  const verticals = [0, canvasWidth / 2, canvasWidth];
  const horizontals = [0, canvasHeight / 2, canvasHeight];
  for (const other of all) {
    if (other.id === node.id) continue;
    verticals.push(other.x, other.x + other.width / 2, other.x + other.width);
    horizontals.push(other.y, other.y + other.height / 2, other.y + other.height);
  }

  const guides: Guide[] = [];
  const candidatesX = [left, left + width / 2, left + width];
  const candidatesY = [top, top + height / 2, top + height];

  let bestX: { delta: number; position: number } | null = null;
  for (const line of verticals) {
    for (const candidate of candidatesX) {
      const delta = line - candidate;
      if (Math.abs(delta) <= SNAP_TOLERANCE && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
        bestX = { delta, position: line };
      }
    }
  }
  let bestY: { delta: number; position: number } | null = null;
  for (const line of horizontals) {
    for (const candidate of candidatesY) {
      const delta = line - candidate;
      if (Math.abs(delta) <= SNAP_TOLERANCE && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
        bestY = { delta, position: line };
      }
    }
  }

  if (bestX) {
    group.x(group.x() + bestX.delta);
    guides.push({ orientation: 'v', position: bestX.position });
  }
  if (bestY) {
    group.y(group.y() + bestY.delta);
    guides.push({ orientation: 'h', position: bestY.position });
  }
  return guides;
}

function drawGuides(ui: Konva.Layer, guides: Guide[], width: number, height: number, scale: number) {
  clearGuides(ui);
  for (const guide of guides) {
    ui.add(
      new Konva.Line({
        name: 'guide',
        points:
          guide.orientation === 'v'
            ? [guide.position, 0, guide.position, height]
            : [0, guide.position, width, guide.position],
        stroke: '#FF4D9D',
        strokeWidth: 1 / Math.max(0.001, scale),
        dash: [6 / Math.max(0.001, scale), 6 / Math.max(0.001, scale)],
        listening: false,
      }),
    );
  }
  ui.batchDraw();
}

function clearGuides(ui: Konva.Layer) {
  ui.find('.guide').forEach((guide) => guide.destroy());
  ui.batchDraw();
}

/** A textarea laid exactly over the node, styled to match what Konva draws. */
function InlineEditor({
  node,
  viewport,
  onCommit,
  onCancel,
}: {
  node: TextNode;
  viewport: { scale: number; x: number; y: number };
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(node.text);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onCommit(value);
        }
      }}
      spellCheck={false}
      className="absolute z-20 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none ring-2 ring-accent/70"
      style={{
        left: node.x * viewport.scale + viewport.x,
        top: node.y * viewport.scale + viewport.y,
        width: node.width * viewport.scale,
        height: Math.max(node.height, node.fontSize * 1.3) * viewport.scale,
        fontFamily: fontStack(node.fontFamily),
        fontWeight: node.fontWeight,
        fontSize: node.fontSize * viewport.scale,
        lineHeight: node.lineHeight,
        letterSpacing: `${node.letterSpacing * node.fontSize * viewport.scale}px`,
        color: node.color,
        textAlign: node.align,
        textTransform: node.transform === 'uppercase' ? 'uppercase' : 'none',
      }}
    />
  );
}

export type { CardGraphDocument, ImageNode };
