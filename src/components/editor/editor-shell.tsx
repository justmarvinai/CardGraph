'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Bookmark, Download, ImagePlus, Layers, Maximize2, Palette, Play,
  Redo2, Sparkles, SlidersHorizontal, Type, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useEditor, useTemporal } from '@/store/editor';
import { useNodes } from '@/store/use-nodes';
import { loadDocument } from '@/lib/storage';
import { createDocument } from '@/engine/document';
import { importImageFile } from '@/engine/assets';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Segmented } from '@/components/ui/segmented';
import { ContentPanel } from './content-panel';
import { DesignPanel } from './design-panel';
import { PropertiesPanel } from './properties-panel';
import { LayersPanel } from './layers-panel';
import { AnimationPanel } from './animation-panel';
import { ExportDialog } from './export-dialog';
import { PresetsDialog } from './presets-dialog';
import type { CanvasHandle } from './canvas';
import { cn } from '@/lib/cn';

// Konva touches `window` at import time, so the canvas never renders on the server.
const EditorCanvas = dynamic(() => import('./canvas').then((m) => m.EditorCanvas), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center cg-canvas-bg">
      <span className="text-[13px] text-ink-400">Starting the editor…</span>
    </div>
  ),
});

type LeftTab = 'content' | 'design' | 'motion';
type RightTab = 'properties' | 'layers';

export function EditorShell({ templateId, variantId }: { templateId: string; variantId: string | null }) {
  const doc = useEditor((s) => s.doc);
  const setDocument = useEditor((s) => s.setDocument);
  const rename = useEditor((s) => s.rename);
  const selection = useEditor((s) => s.selection);
  const addTextNode = useEditor((s) => s.addTextNode);
  const addImageNode = useEditor((s) => s.addImageNode);
  const duplicateNodes = useEditor((s) => s.duplicateNodes);
  const removeNodes = useEditor((s) => s.removeNodes);
  const updateNodes = useEditor((s) => s.updateNodes);
  const nodes = useNodes();

  const [leftTab, setLeftTab] = useState<LeftTab>('content');
  const [rightTab, setRightTab] = useState<RightTab>('properties');
  const [playing, setPlaying] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<CanvasHandle | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { undo, redo, pastStates, futureStates } = useTemporal.getState();
  const [historyTick, setHistoryTick] = useState(0);
  useEffect(() => useTemporal.subscribe(() => setHistoryTick((t) => t + 1)), []);

  // Restore the last document for this template, or start a fresh one. The
  // document carries the `last:` key as its own id, so the store's autosave is
  // the only writer — otherwise every edit would leave a second orphaned record.
  useEffect(() => {
    let cancelled = false;
    const key = `last:${templateId}:${variantId ?? 'default'}`;
    void (async () => {
      const stored = await loadDocument(key);
      if (cancelled) return;
      setDocument(stored ?? { ...createDocument(templateId, variantId), id: key });
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId, variantId, setDocument]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'd' && selection.length) {
        event.preventDefault();
        duplicateNodes(selection);
        return;
      }
      if (mod && event.key === '0') {
        event.preventDefault();
        canvasRef.current?.fit();
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection.length) {
        event.preventDefault();
        removeNodes(selection);
        return;
      }
      if (event.key.startsWith('Arrow') && selection.length) {
        event.preventDefault();
        const step = event.shiftKey ? 20 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        updateNodes(
          selection.map((id) => {
            const node = nodes.find((n) => n.id === id);
            return { id, patch: { x: (node?.x ?? 0) + dx, y: (node?.y ?? 0) + dy } };
          }),
        );
      }
    },
    [duplicateNodes, nodes, redo, removeNodes, selection, undo, updateNodes],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const handleViewport = useCallback(({ scale }: { scale: number }) => setZoom(scale), []);
  const handleReady = useCallback((handle: CanvasHandle) => {
    canvasRef.current = handle;
  }, []);

  const addImage = async (file: File | undefined) => {
    if (!file) return;
    const result = await importImageFile(file);
    addImageNode(result.assetId, result.width, result.height);
  };

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-ink-950">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/7 bg-ink-900/80 px-2 backdrop-blur sm:gap-3 sm:px-3">
          <Link
            href="/app"
            aria-label="Back to templates"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-300 transition-colors hover:bg-white/6 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Templates</span>
          </Link>

          <div className="hidden h-5 w-px bg-white/8 sm:block" />

          <input
            value={doc.name}
            onChange={(e) => rename(e.target.value)}
            aria-label="Design name"
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-[13px] font-medium text-white outline-none transition-colors hover:bg-white/5 focus:bg-white/8 sm:max-w-[220px]"
          />

          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip content="Undo (⌘Z)">
              <Button variant="ghost" size="icon" onClick={() => undo()} disabled={pastStates.length === 0} aria-label="Undo">
                <Undo2 className="size-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Redo (⇧⌘Z)">
              <Button variant="ghost" size="icon" onClick={() => redo()} disabled={futureStates.length === 0} aria-label="Redo">
                <Redo2 className="size-4" />
              </Button>
            </Tooltip>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Wrapped rather than class-toggled: `hidden` on the Button would
                have to out-specify its own `inline-flex` base class. */}
            <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
              <Tooltip content="Add a text box">
                <Button variant="toolbar" size="icon" onClick={addTextNode} aria-label="Add text">
                  <Type className="size-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Add an image">
                <Button
                  variant="toolbar"
                  size="icon"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Add image"
                >
                  <ImagePlus className="size-4" />
                </Button>
              </Tooltip>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void addImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Tooltip content="Saved presets">
              <Button variant="toolbar" size="icon" onClick={() => setPresetsOpen(true)} aria-label="Presets">
                <Bookmark className="size-4" />
              </Button>
            </Tooltip>
            <Button variant="primary" size="sm" className="sm:h-10 sm:px-4 sm:text-sm" onClick={() => setExportOpen(true)}>
              <Download className="size-4" /> Export
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* ── Left panel ────────────────────────────────────────────── */}
          <aside className="hidden w-[330px] shrink-0 flex-col border-r border-white/7 bg-ink-900/60 lg:flex">
            <div className="shrink-0 p-3 pb-0">
              <Segmented
                value={leftTab}
                onChange={setLeftTab}
                className="w-full"
                size="sm"
                options={[
                  { value: 'content', label: 'Content' },
                  { value: 'design', label: 'Design' },
                  { value: 'motion', label: 'Motion' },
                ]}
              />
            </div>
            <div className="cg-scroll min-h-0 flex-1 overflow-y-auto p-4">
              {leftTab === 'content' && <ContentPanel />}
              {leftTab === 'design' && <DesignPanel />}
              {leftTab === 'motion' && <AnimationPanel playing={playing} onPlayingChange={setPlaying} />}
            </div>
          </aside>

          {/* ── Canvas ────────────────────────────────────────────────── */}
          <main className="relative min-w-0 flex-1 pb-[60px] lg:pb-0">
            <EditorCanvas playing={playing} onViewport={handleViewport} onReady={handleReady} />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4">
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/8 bg-ink-900/85 p-1 shadow-panel backdrop-blur">
                <Tooltip content="Zoom out">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Zoom out"
                    onClick={() => canvasRef.current?.zoomTo(Math.max(0.05, zoom / 1.25))}
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                </Tooltip>
                <button
                  type="button"
                  onClick={() => canvasRef.current?.fit()}
                  className="min-w-[52px] rounded-lg px-2 py-1.5 font-mono text-[12px] text-ink-200 transition-colors hover:bg-white/6 hover:text-white"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <Tooltip content="Zoom in">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Zoom in"
                    onClick={() => canvasRef.current?.zoomTo(Math.min(4, zoom * 1.25))}
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </Tooltip>
                <div className="mx-0.5 h-5 w-px bg-white/8" />
                <Tooltip content="Fit to screen (⌘0)">
                  <Button variant="ghost" size="icon" aria-label="Fit to screen" onClick={() => canvasRef.current?.fit()}>
                    <Maximize2 className="size-4" />
                  </Button>
                </Tooltip>
                {doc.animation.preset !== 'none' && (
                  <Tooltip content={playing ? 'Stop preview' : 'Preview the loop'}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Preview loop"
                      onClick={() => setPlaying((p) => !p)}
                      className={cn(playing && 'text-accent')}
                    >
                      <Play className="size-4" />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>

            <p className="pointer-events-none absolute left-4 top-4 hidden text-[11px] text-ink-500 xl:block">
              Double-click text to edit · Space + drag to pan · ⌘ + scroll to zoom
            </p>
          </main>

          {/* ── Right panel ───────────────────────────────────────────── */}
          <aside className="hidden w-[300px] shrink-0 flex-col border-l border-white/7 bg-ink-900/60 xl:flex">
            <div className="shrink-0 p-3 pb-0">
              <Segmented
                value={rightTab}
                onChange={setRightTab}
                className="w-full"
                size="sm"
                options={[
                  { value: 'properties', label: 'Style' },
                  { value: 'layers', label: 'Layers' },
                ]}
              />
            </div>
            <div className="cg-scroll min-h-0 flex-1 overflow-y-auto p-4">
              {rightTab === 'properties' ? <PropertiesPanel /> : <LayersPanel />}
            </div>
          </aside>
        </div>

        {/* ── Small screens ───────────────────────────────────────────── */}
        <MobilePanels
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          playing={playing}
          setPlaying={setPlaying}
        />

        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        <PresetsDialog open={presetsOpen} onOpenChange={setPresetsOpen} />
        <span className="hidden">{historyTick}</span>
      </div>
    </TooltipProvider>
  );
}

/** Below `lg` the panels become a bottom sheet; the canvas stays usable. */
function MobilePanels({
  leftTab,
  setLeftTab,
  playing,
  setPlaying,
}: {
  leftTab: LeftTab;
  setLeftTab: (tab: LeftTab) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-ink-900/95 backdrop-blur">
        {open && (
          <div className="cg-scroll max-h-[46vh] overflow-y-auto p-4">
            {leftTab === 'content' && <ContentPanel />}
            {leftTab === 'design' && <DesignPanel />}
            {leftTab === 'motion' && <AnimationPanel playing={playing} onPlayingChange={setPlaying} />}
          </div>
        )}
        <div className="flex items-center gap-1 p-2">
          {(
            [
              { tab: 'content' as const, icon: SlidersHorizontal, label: 'Content' },
              { tab: 'design' as const, icon: Palette, label: 'Design' },
              { tab: 'motion' as const, icon: Sparkles, label: 'Motion' },
            ]
          ).map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setLeftTab(tab);
                setOpen(leftTab === tab ? !open : true);
              }}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] transition-colors',
                open && leftTab === tab ? 'bg-white/8 text-accent' : 'text-ink-300 hover:text-white',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] text-ink-300 transition-colors hover:text-white',
              !open && 'text-accent',
            )}
          >
            <Layers className="size-4" />
            Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
