import { createStore, get, set, del, keys, entries } from 'idb-keyval';
import type { CardGraphDocument } from './types';

/** Everything lives in the browser — there is no server to sync with. */
const assetStore = createStore('cardgraph-assets', 'assets');
const docStore = createStore('cardgraph-docs', 'docs');
const presetStore = createStore('cardgraph-presets', 'presets');

export interface StoredAsset {
  id: string;
  blob: Blob;
  width: number;
  height: number;
  name: string;
  createdAt: number;
}

export async function putAsset(asset: StoredAsset): Promise<void> {
  await set(asset.id, asset, assetStore);
}

export async function getAsset(id: string): Promise<StoredAsset | undefined> {
  return get<StoredAsset>(id, assetStore);
}

export async function deleteAsset(id: string): Promise<void> {
  await del(id, assetStore);
}

export async function listAssetIds(): Promise<string[]> {
  return (await keys(assetStore)) as string[];
}

export async function saveDocument(doc: CardGraphDocument): Promise<void> {
  await set(doc.id, doc, docStore);
}

export async function loadDocument(id: string): Promise<CardGraphDocument | undefined> {
  return get<CardGraphDocument>(id, docStore);
}

export async function deleteDocument(id: string): Promise<void> {
  await del(id, docStore);
}

export async function listDocuments(): Promise<CardGraphDocument[]> {
  const all = (await entries(docStore)) as [string, CardGraphDocument][];
  return all.map(([, doc]) => doc).sort((a, b) => b.updatedAt - a.updatedAt);
}

export interface Preset {
  id: string;
  name: string;
  templateId: string;
  createdAt: number;
  includesImages: boolean;
  /** A document snapshot without identity, applied on top of a new document. */
  document: Omit<CardGraphDocument, 'id' | 'createdAt' | 'updatedAt'>;
  /** Base64 payloads when the user chose to include images. */
  assets?: Record<string, { dataUrl: string; width: number; height: number; name: string }>;
  thumbnail?: string;
}

export async function savePreset(preset: Preset): Promise<void> {
  await set(preset.id, preset, presetStore);
}

export async function listPresets(): Promise<Preset[]> {
  const all = (await entries(presetStore)) as [string, Preset][];
  return all.map(([, p]) => p).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPreset(id: string): Promise<Preset | undefined> {
  return get<Preset>(id, presetStore);
}

export async function deletePreset(id: string): Promise<void> {
  await del(id, presetStore);
}

const UI_KEY = 'cg:ui';

export function readUiPrefs<T>(fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(UI_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as object) } : fallback;
  } catch {
    return fallback;
  }
}

export function writeUiPrefs(prefs: Record<string, unknown>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(prefs));
  } catch {
    /* quota or private mode — UI prefs are not worth failing over */
  }
}
