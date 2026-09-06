import type { Metadata } from 'next';
import { PreviewStage } from '@/components/editor/preview-stage';

export const metadata: Metadata = {
  title: 'Template preview',
  robots: { index: false, follow: false },
};

/**
 * Chrome-free render of a single template, used to generate the gallery
 * thumbnails in `public/previews` (see `scripts/render-previews.mjs`).
 */
export default function PreviewPage() {
  return <PreviewStage />;
}
