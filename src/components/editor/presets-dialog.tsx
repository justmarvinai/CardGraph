'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FolderOpen, Loader2, Save, Trash2, Upload } from 'lucide-react';
import type { CardGraphDocument } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { deletePreset, listPresets, savePreset, type Preset } from '@/lib/storage';
import { getAsset, putAsset } from '@/lib/storage';
import { createId } from '@/lib/id';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { decode } from '@/engine/assets';

/**
 * Presets are whole documents the user can re-apply to the next card (Q8).
 * They live in IndexedDB and can be exported as a file, since there is no
 * account to sync them with.
 */
export function PresetsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const doc = useEditor((s) => s.doc);
  const setDocument = useEditor((s) => s.setDocument);
  const bumpAssets = useEditor((s) => s.bumpAssets);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const [includeImages, setIncludeImages] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setPresets(await listPresets()), []);

  useEffect(() => {
    if (open) {
      void refresh();
      setName(doc.name);
    }
  }, [open, refresh, doc.name]);

  const save = async () => {
    setBusy(true);
    try {
      const preset: Preset = {
        id: createId('preset'),
        name: name.trim() || doc.name,
        templateId: doc.templateId,
        createdAt: Date.now(),
        includesImages: includeImages,
        document: stripIdentity(doc),
        assets: includeImages ? await collectAssets(doc) : undefined,
      };
      await savePreset(preset);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const apply = async (preset: Preset) => {
    setBusy(true);
    try {
      if (preset.assets) await restoreAssets(preset.assets);
      setDocument({
        ...preset.document,
        id: createId('doc'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      bumpAssets();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const exportFile = (preset: Preset) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.cardgraph.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const importFile = async (file: File) => {
    setBusy(true);
    try {
      const preset = JSON.parse(await file.text()) as Preset;
      if (!preset.document?.templateId) throw new Error('Not a CardGraph preset');
      await savePreset({ ...preset, id: createId('preset'), createdAt: Date.now() });
      await refresh();
    } catch {
      /* a bad file simply does not import */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="My presets"
      description="Save this design and reuse it for the next card."
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-white/8 bg-ink-900/50 p-3">
          <Field label="Preset name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My style" />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-200">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="size-3.5 accent-[var(--color-accent)]"
            />
            Include the card images
          </label>
          <Button variant="primary" size="sm" className="w-full" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save current design
          </Button>
        </div>

        <div className="space-y-1.5">
          {presets.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-400">
              No presets yet. Save one above and it will show up here.
            </p>
          )}
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-ink-900/40 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink-100">{preset.name}</p>
                <p className="text-[11px] text-ink-500">
                  {new Date(preset.createdAt).toLocaleDateString()}
                  {preset.includesImages && ' · with images'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => void apply(preset)} disabled={busy}>
                <FolderOpen className="size-3.5" /> Use
              </Button>
              <button
                type="button"
                aria-label={`Export ${preset.name}`}
                onClick={() => exportFile(preset)}
                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
              >
                <Download className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${preset.name}`}
                onClick={async () => {
                  await deletePreset(preset.id);
                  await refresh();
                }}
                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/8 hover:text-negative"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 px-3 py-3 text-[12px] text-ink-300 transition-colors hover:border-white/25 hover:text-white">
          <Upload className="size-3.5" /> Import a .cardgraph.json preset
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </Dialog>
  );
}

function stripIdentity(doc: CardGraphDocument): Preset['document'] {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = doc;
  return rest;
}

function assetIdsOf(doc: CardGraphDocument): string[] {
  const ids = new Set<string>();
  for (const node of doc.extraNodes) {
    if ((node.type === 'image' || node.type === 'badge') && node.assetId) ids.add(node.assetId);
  }
  for (const override of Object.values(doc.overrides)) {
    const assetId = (override as { assetId?: string | null }).assetId;
    if (assetId) ids.add(assetId);
  }
  if (doc.background.customAssetId) ids.add(doc.background.customAssetId);
  return [...ids];
}

async function collectAssets(doc: CardGraphDocument): Promise<Preset['assets']> {
  const assets: NonNullable<Preset['assets']> = {};
  for (const id of assetIdsOf(doc)) {
    const asset = await getAsset(id);
    if (!asset) continue;
    assets[id] = {
      dataUrl: await blobToDataUrl(asset.blob),
      width: asset.width,
      height: asset.height,
      name: asset.name,
    };
  }
  return assets;
}

async function restoreAssets(assets: NonNullable<Preset['assets']>): Promise<void> {
  for (const [id, asset] of Object.entries(assets)) {
    if (await getAsset(id)) continue;
    const blob = await (await fetch(asset.dataUrl)).blob();
    await putAsset({ id, blob, width: asset.width, height: asset.height, name: asset.name, createdAt: Date.now() });
    await decode(asset.dataUrl).catch(() => undefined);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(blob);
  });
}
