'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageUp, Loader2, Trash2 } from 'lucide-react';
import { importImageFile, ImportError, loadImage, getCachedImage } from '@/engine/assets';
import { cn } from '@/lib/cn';

/**
 * Upload target used for the main card and for any extra image.
 * Files are read, trimmed and stored locally — nothing is uploaded anywhere.
 */
export function ImageField({
  assetId,
  onChange,
  label,
  compact,
}: {
  assetId: string | null;
  onChange: (assetId: string | null, size: { width: number; height: number }) => void;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!assetId) {
      setPreview(null);
      return;
    }
    const cached = getCachedImage(assetId);
    if (cached) {
      setPreview(cached.src);
      return;
    }
    void loadImage(assetId).then((img) => {
      if (!cancelled) setPreview(img?.src ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        const result = await importImageFile(file);
        onChange(result.assetId, { width: result.width, height: result.height });
      } catch (err) {
        setError(err instanceof ImportError ? err.message : 'That image could not be imported.');
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={cn(
          'group relative flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-2.5 transition-colors',
          dragging ? 'border-accent bg-accent/8' : 'border-white/12 hover:border-white/25 hover:bg-white/4',
          compact ? 'min-h-[56px]' : 'min-h-[76px]',
        )}
      >
        {preview ? (
          <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-12 max-w-12 object-contain" />
          </span>
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-white/5 text-ink-400">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-ink-100">
            {preview ? (label ?? 'Replace image') : (label ?? 'Upload card image')}
          </span>
          <span className="block truncate text-[11px] text-ink-400">
            {busy ? 'Processing…' : 'Drop a file or click · PNG, JPG, WEBP'}
          </span>
        </span>
        {preview && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null, { width: 0, height: 0 });
            }}
            className="rounded-lg p-2 text-ink-400 opacity-0 transition-opacity hover:bg-white/8 hover:text-negative group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="text-[11px] text-negative">{error}</p>}
    </div>
  );
}
