'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import { FORMATS } from '@/lib/types';
import type {
  AnimationSettings,
  BackgroundSettings,
  CardGraphDocument,
  Format,
  FormattingSettings,
  Node,
  Palette,
  Theme,
} from '@/lib/types';
import { resolvePalette } from '@/lib/palette';
import { applyDerived, createDocument, rescaleForFormat, resolveNodes, templateNodeIds } from '@/engine/document';
import { requireTemplate } from '@/templates/registry';
import { saveDocument } from '@/lib/storage';
import { createId } from '@/lib/id';
import { textNode, imageNode } from '@/templates/_shared/nodes';

interface EditorState {
  doc: CardGraphDocument;
  selection: string[];
  /** Bumped whenever an image finishes loading, to force a redraw. */
  assetVersion: number;

  setDocument: (doc: CardGraphDocument) => void;
  newDocument: (templateId: string, variantId: string | null) => void;
  rename: (name: string) => void;

  setField: (id: string, value: unknown) => void;
  resetField: (id: string) => void;
  setFormat: (format: Format) => void;
  setTheme: (theme: Theme) => void;
  setPalette: (key: keyof Palette, value: string | null) => void;
  resetPalette: () => void;
  setBackground: (patch: Partial<BackgroundSettings>) => void;
  setAnimation: (patch: Partial<AnimationSettings>) => void;
  setFormatting: (patch: Partial<FormattingSettings>) => void;

  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  updateNode: (id: string, patch: Partial<Node>, options?: { transient?: boolean }) => void;
  updateNodes: (patches: { id: string; patch: Partial<Node> }[]) => void;
  resetNode: (id: string) => void;
  resetLayout: () => void;
  addTextNode: () => void;
  addImageNode: (assetId: string, width: number, height: number) => void;
  duplicateNodes: (ids: string[]) => void;
  removeNodes: (ids: string[]) => void;
  reorderNode: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;

  bumpAssets: () => void;
}

function touch(doc: CardGraphDocument): CardGraphDocument {
  return { ...doc, updatedAt: Date.now() };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Autosave to IndexedDB; there is no server, so this is the only safety net. */
function scheduleSave(doc: CardGraphDocument) {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void saveDocument(doc);
  }, 700);
}

export const useEditor = create<EditorState>()(
  temporal(
    (set) => ({
      doc: createDocument('price-trend', 'up'),
      selection: [],
      assetVersion: 0,

      setDocument: (doc) => set({ doc, selection: [] }),

      newDocument: (templateId, variantId) =>
        set({ doc: createDocument(templateId, variantId), selection: [] }),

      rename: (name) =>
        set((state) => {
          const doc = touch({ ...state.doc, name });
          scheduleSave(doc);
          return { doc };
        }),

      setField: (id, value) =>
        set((state) => {
          const template = requireTemplate(state.doc.templateId);
          const field = template.fields.find((f) => f.id === id);
          // Typing into a computed field breaks its binding until reset (Q10).
          const unbound =
            field?.derived && !state.doc.unbound.includes(id)
              ? [...state.doc.unbound, id]
              : state.doc.unbound;

          const doc = touch(
            applyDerived({ ...state.doc, data: { ...state.doc.data, [id]: value }, unbound }),
          );
          scheduleSave(doc);
          return { doc };
        }),

      resetField: (id) =>
        set((state) => {
          const doc = touch(
            applyDerived({ ...state.doc, unbound: state.doc.unbound.filter((f) => f !== id) }),
          );
          scheduleSave(doc);
          return { doc };
        }),

      setFormat: (format) =>
        set((state) => {
          if (format === state.doc.format) return state;
          const doc = touch(rescaleForFormat(state.doc, state.doc.format, format));
          scheduleSave(doc);
          return { doc };
        }),

      setTheme: (theme) =>
        set((state) => {
          const doc = touch({ ...state.doc, theme });
          scheduleSave(doc);
          return { doc };
        }),

      setPalette: (key, value) =>
        set((state) => {
          const palette = { ...state.doc.palette };
          if (value === null) delete palette[key];
          else palette[key] = value;
          const doc = touch({ ...state.doc, palette });
          scheduleSave(doc);
          return { doc };
        }),

      resetPalette: () =>
        set((state) => {
          const doc = touch({ ...state.doc, palette: {} });
          scheduleSave(doc);
          return { doc };
        }),

      setBackground: (patch) =>
        set((state) => {
          const doc = touch({ ...state.doc, background: { ...state.doc.background, ...patch } });
          scheduleSave(doc);
          return { doc };
        }),

      setAnimation: (patch) =>
        set((state) => {
          const doc = touch({ ...state.doc, animation: { ...state.doc.animation, ...patch } });
          scheduleSave(doc);
          return { doc };
        }),

      setFormatting: (patch) =>
        set((state) => {
          const doc = touch(
            applyDerived({ ...state.doc, formatting: { ...state.doc.formatting, ...patch } }),
          );
          scheduleSave(doc);
          return { doc };
        }),

      select: (ids) => set({ selection: ids }),

      toggleSelect: (id) =>
        set((state) => ({
          selection: state.selection.includes(id)
            ? state.selection.filter((s) => s !== id)
            : [...state.selection, id],
        })),

      updateNode: (id, patch) =>
        set((state) => {
          const extraIndex = state.doc.extraNodes.findIndex((n) => n.id === id);
          let doc: CardGraphDocument;
          if (extraIndex >= 0) {
            const extraNodes = [...state.doc.extraNodes];
            extraNodes[extraIndex] = { ...extraNodes[extraIndex], ...patch } as Node;
            doc = touch({ ...state.doc, extraNodes });
          } else {
            doc = touch({
              ...state.doc,
              overrides: {
                ...state.doc.overrides,
                [id]: { ...(state.doc.overrides[id] ?? {}), ...patch },
              },
            });
          }
          scheduleSave(doc);
          return { doc };
        }),

      updateNodes: (patches) =>
        set((state) => {
          let doc = state.doc;
          for (const { id, patch } of patches) {
            const extraIndex = doc.extraNodes.findIndex((n) => n.id === id);
            if (extraIndex >= 0) {
              const extraNodes = [...doc.extraNodes];
              extraNodes[extraIndex] = { ...extraNodes[extraIndex], ...patch } as Node;
              doc = { ...doc, extraNodes };
            } else {
              doc = {
                ...doc,
                overrides: { ...doc.overrides, [id]: { ...(doc.overrides[id] ?? {}), ...patch } },
              };
            }
          }
          doc = touch(doc);
          scheduleSave(doc);
          return { doc };
        }),

      resetNode: (id) =>
        set((state) => {
          const overrides = { ...state.doc.overrides };
          delete overrides[id];
          const doc = touch({ ...state.doc, overrides });
          scheduleSave(doc);
          return { doc };
        }),

      resetLayout: () =>
        set((state) => {
          const ids = new Set(templateNodeIds(state.doc));
          const overrides = Object.fromEntries(
            Object.entries(state.doc.overrides).filter(([id]) => !ids.has(id)),
          );
          const doc = touch({ ...state.doc, overrides });
          scheduleSave(doc);
          return { doc };
        }),

      addTextNode: () =>
        set((state) => {
          const palette = resolvePalette(state.doc.theme, state.doc.palette);
          const { width, height } = sizeOf(state.doc);
          const node = textNode({
            id: createId('text'),
            name: 'Text',
            x: width * 0.2,
            y: height * 0.45,
            width: width * 0.6,
            color: palette.textPrimary,
            text: 'Your text',
            fontSize: width * 0.05,
            align: 'center',
          });
          node.fromTemplate = false;
          const doc = touch({ ...state.doc, extraNodes: [...state.doc.extraNodes, node] });
          scheduleSave(doc);
          return { doc, selection: [node.id] };
        }),

      addImageNode: (assetId, imgWidth, imgHeight) =>
        set((state) => {
          const { width, height } = sizeOf(state.doc);
          const target = width * 0.25;
          const ratio = imgHeight / Math.max(1, imgWidth);
          const node = imageNode({
            id: createId('image'),
            name: 'Image',
            x: width * 0.5 - target / 2,
            y: height * 0.4,
            width: target,
            height: target * ratio,
            assetId,
            role: 'extra',
          });
          node.fromTemplate = false;
          const doc = touch({ ...state.doc, extraNodes: [...state.doc.extraNodes, node] });
          scheduleSave(doc);
          return { doc, selection: [node.id] };
        }),

      duplicateNodes: (ids) =>
        set((state) => {
          const all = resolveNodes(state.doc);
          const copies: Node[] = [];
          for (const id of ids) {
            const source = all.find((n) => n.id === id);
            if (!source) continue;
            const copy = {
              ...source,
              id: createId(source.type),
              name: `${source.name} copy`,
              x: source.x + 24,
              y: source.y + 24,
              fromTemplate: false,
            } as Node;
            copies.push(copy);
          }
          if (!copies.length) return state;
          const doc = touch({ ...state.doc, extraNodes: [...state.doc.extraNodes, ...copies] });
          scheduleSave(doc);
          return { doc, selection: copies.map((c) => c.id) };
        }),

      removeNodes: (ids) =>
        set((state) => {
          const extraIds = new Set(state.doc.extraNodes.map((n) => n.id));
          const overrides = { ...state.doc.overrides };
          // Template nodes cannot be deleted outright — hiding them keeps the
          // layout stable and the action reversible from the Layers panel.
          for (const id of ids) {
            if (!extraIds.has(id)) overrides[id] = { ...(overrides[id] ?? {}), visible: false };
          }
          const doc = touch({
            ...state.doc,
            overrides,
            extraNodes: state.doc.extraNodes.filter((n) => !ids.includes(n.id)),
          });
          scheduleSave(doc);
          return { doc, selection: [] };
        }),

      reorderNode: (id, direction) =>
        set((state) => {
          const nodes = [...state.doc.extraNodes];
          const index = nodes.findIndex((n) => n.id === id);
          if (index < 0) return state;
          const [node] = nodes.splice(index, 1);
          const target =
            direction === 'front'
              ? nodes.length
              : direction === 'back'
                ? 0
                : direction === 'forward'
                  ? Math.min(nodes.length, index + 1)
                  : Math.max(0, index - 1);
          nodes.splice(target, 0, node);
          const doc = touch({ ...state.doc, extraNodes: nodes });
          scheduleSave(doc);
          return { doc };
        }),

      bumpAssets: () => set((state) => ({ assetVersion: state.assetVersion + 1 })),
    }),
    {
      limit: 100,
      // Selection and asset ticks are UI noise; only the document is undoable.
      partialize: (state) => ({ doc: state.doc }) as Partial<EditorState>,
      equality: (a, b) => (a as { doc: CardGraphDocument }).doc === (b as { doc: CardGraphDocument }).doc,
    },
  ),
);

function sizeOf(doc: CardGraphDocument) {
  return { width: FORMATS[doc.format].width, height: FORMATS[doc.format].height };
}

export const useTemporal = useEditor.temporal;
