import type { CardGraphDocument } from '@/lib/types';
import { exportStill } from './still';
import { exportGif } from './gif';
import { exportVideo, canExportMp4, hasVideoEncoder, supportsWebm } from './video';
import type { ExportOptions, ExportResult, ProgressHandler } from './types';

export * from './types';
export { canExportMp4, hasVideoEncoder, supportsWebm };

export async function runExport(
  doc: CardGraphDocument,
  options: ExportOptions,
  onProgress?: ProgressHandler,
): Promise<ExportResult> {
  switch (options.format) {
    case 'gif':
      return exportGif(doc, onProgress);
    case 'mp4':
    case 'webm':
      return exportVideo(doc, onProgress);
    default:
      return exportStill(doc, options);
  }
}

export function download(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
