'use client';

import { useMemo } from 'react';
import type { Node, Palette } from '@/lib/types';
import { useEditor } from './editor';
import { resolveNodes } from '@/engine/document';
import { resolvePalette } from '@/lib/palette';

/**
 * The resolved node list, memoised on the document.
 *
 * Never select this through `useEditor(s => s.nodes())`: `resolveNodes` returns
 * a new array every call, so a store selector would compare unequal on every
 * read and re-render forever.
 */
export function useNodes(): Node[] {
  const doc = useEditor((s) => s.doc);
  return useMemo(() => resolveNodes(doc), [doc]);
}

export function usePalette(): Palette {
  const theme = useEditor((s) => s.doc.theme);
  const overrides = useEditor((s) => s.doc.palette);
  return useMemo(() => resolvePalette(theme, overrides), [theme, overrides]);
}
