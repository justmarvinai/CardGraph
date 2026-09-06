'use client';

import { BarChart3, Eye, EyeOff, Image as ImageIcon, Lock, Minus, Tag, Type } from 'lucide-react';
import type { Node } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { useNodes } from '@/store/use-nodes';
import { cn } from '@/lib/cn';

const ICONS = {
  text: Type,
  image: ImageIcon,
  chart: BarChart3,
  divider: Minus,
  badge: Tag,
} as const;

export function LayersPanel() {
  const nodes = useNodes();
  const selection = useEditor((s) => s.selection);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const updateNodes = useEditor((s) => s.updateNodes);

  // Top of the list is top of the canvas, which is how designers read layers.
  const ordered = [...nodes].reverse();

  return (
    <div className="space-y-0.5">
      {ordered.map((node: Node) => {
        const Icon = ICONS[node.type];
        const active = selection.includes(node.id);
        return (
          <div
            key={node.id}
            className={cn(
              'group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
              active ? 'bg-accent/12 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white',
            )}
          >
            <button
              type="button"
              onClick={(e) => (e.shiftKey ? toggleSelect(node.id) : select([node.id]))}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Icon className={cn('size-3.5 shrink-0', active ? 'text-accent' : 'text-ink-500')} />
              <span className={cn('truncate text-[12px]', !node.visible && 'line-through opacity-50')}>
                {node.name}
              </span>
              {node.fromTemplate === false && (
                <span className="shrink-0 rounded bg-white/8 px-1 text-[9px] uppercase tracking-wide text-ink-400">
                  added
                </span>
              )}
            </button>
            {node.locked && <Lock className="size-3 shrink-0 text-ink-500" />}
            <button
              type="button"
              aria-label={node.visible ? `Hide ${node.name}` : `Show ${node.name}`}
              onClick={() => updateNodes([{ id: node.id, patch: { visible: !node.visible } }])}
              className={cn(
                'shrink-0 rounded p-1 text-ink-500 transition-opacity hover:text-white',
                node.visible ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
              )}
            >
              {node.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
