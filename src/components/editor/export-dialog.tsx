'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Download, Loader2 } from 'lucide-react';
import { FORMATS } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { runExport, download, formatBytes, canExportMp4, supportsWebm } from '@/export';
import type { ExportFormat, ExportProgress, ExportResult } from '@/export/types';
import { frameCount } from '@/engine/animation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Field } from '@/components/ui/input';
import { SliderRow } from '@/components/ui/slider';
import { cn } from '@/lib/cn';

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const doc = useEditor((s) => s.doc);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<1 | 2>(2);
  const [quality, setQuality] = useState(0.92);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoSupport, setVideoSupport] = useState<{ mp4: boolean; webm: boolean }>({
    mp4: true,
    webm: true,
  });

  const animated = doc.animation.preset !== 'none';
  const spec = FORMATS[doc.format];

  // Probing is asynchronous: several browsers expose `VideoEncoder` but ship no
  // H.264 encoder, and only `isConfigSupported` tells the truth.
  useEffect(() => {
    let cancelled = false;
    void canExportMp4(doc).then((mp4) => {
      if (!cancelled) setVideoSupport({ mp4, webm: supportsWebm() });
    });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  useEffect(() => {
    if (!animated && (format === 'gif' || format === 'mp4')) setFormat('png');
  }, [animated, format]);

  useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
      setProgress(null);
    }
  }, [open]);

  const videoFormat: ExportFormat = videoSupport.mp4 ? 'mp4' : 'webm';

  const options = useMemo(
    () => [
      { value: 'png' as const, label: 'PNG', hint: 'Sharpest still' },
      { value: 'jpg' as const, label: 'JPG', hint: 'Smaller file' },
      { value: 'gif' as const, label: 'GIF', hint: 'Looping, works everywhere' },
      { value: videoFormat, label: videoFormat.toUpperCase(), hint: 'Looping, best quality' },
    ],
    [videoFormat],
  );

  const run = async () => {
    setError(null);
    setResult(null);
    setProgress({ phase: 'rendering', current: 0, total: 1 });
    try {
      const output = await runExport(doc, { format, scale, quality }, setProgress);
      setResult(output);
      download(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The export failed. Please try again.');
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const isVideo = format === 'mp4' || format === 'webm';
  const isAnimated = format === 'gif' || isVideo;

  return (
    <Dialog
      open={open}
      onOpenChange={busy ? () => undefined : onOpenChange}
      title="Export"
      description={`${spec.width * (isAnimated ? 1 : scale)} × ${spec.height * (isAnimated ? 1 : scale)} px · ${doc.theme} theme`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-ink-400">
            {result ? (
              <span className="inline-flex items-center gap-1.5 text-positive">
                <Check className="size-3.5" /> Saved {result.filename} · {formatBytes(result.blob.size)}
              </span>
            ) : (
              'Rendered in your browser — nothing is uploaded.'
            )}
          </p>
          <Button variant="primary" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {busy ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const disabled = (option.value === 'gif' || option.value === videoFormat) && !animated;
            const active = format === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => setFormat(option.value)}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left transition-colors',
                  active ? 'border-accent/60 bg-accent/8' : 'border-white/8 bg-ink-900/50 hover:border-white/18',
                  disabled && 'cursor-not-allowed opacity-40 hover:border-white/8',
                )}
              >
                <span className={cn('block text-[13px] font-semibold', active ? 'text-accent' : 'text-ink-100')}>
                  {option.label}
                </span>
                <span className="block text-[11px] text-ink-400">
                  {disabled ? 'Add movement first' : option.hint}
                </span>
              </button>
            );
          })}
        </div>

        {!isAnimated && (
          <Field label="Resolution">
            <Segmented
              value={String(scale)}
              onChange={(value) => setScale(Number(value) as 1 | 2)}
              className="w-full"
              options={[
                { value: '1', label: `1× · ${spec.width}px` },
                { value: '2', label: `2× · ${spec.width * 2}px` },
              ]}
            />
          </Field>
        )}

        {format === 'jpg' && (
          <SliderRow
            label="Quality"
            value={quality}
            min={0.5}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onValueChange={setQuality}
          />
        )}

        {isAnimated && (
          <p className="rounded-xl border border-white/8 bg-ink-900/50 px-3 py-2.5 text-[12px] leading-relaxed text-ink-300">
            {frameCount(doc.animation)} frames · {(doc.animation.durationMs / 1000).toFixed(1)}s loop
            {format === 'gif' && ' · GIF renders at up to 1080 px and 20 fps to keep the file small'}
            {isVideo && ` · ${doc.animation.fps} fps`}
          </p>
        )}

        {format === 'webm' && (
          <p className="flex gap-2 rounded-xl border border-amber-400/25 bg-amber-400/8 px-3 py-2.5 text-[12px] leading-relaxed text-amber-200/90">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            This browser cannot encode MP4, so the export will be a WebM file. Chrome, Edge or Safari
            produce MP4.
          </p>
        )}

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-ink-300">
              <span className="capitalize">{progress.phase}</span>
              <span className="font-mono">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150"
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="flex gap-2 rounded-xl border border-negative/25 bg-negative/8 px-3 py-2.5 text-[12px] text-negative">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
