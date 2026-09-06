import type { CardGraphDocument } from '@/lib/types';

export type ExportFormat = 'png' | 'jpg' | 'gif' | 'mp4' | 'webm';

export interface ExportOptions {
  format: ExportFormat;
  /** 1 = the format's native size, 2 = double resolution. */
  scale: 1 | 2;
  /** JPG only, 0.5–1. */
  quality: number;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

export interface ExportProgress {
  phase: 'rendering' | 'encoding' | 'finalising';
  current: number;
  total: number;
}

export type ProgressHandler = (progress: ExportProgress) => void;

export class ExportError extends Error {}

export function filenameFor(doc: CardGraphDocument, format: ExportFormat): string {
  const base = (doc.name || 'cardgraph')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${base || 'cardgraph'}-${doc.format.replace(':', 'x')}.${format}`;
}
