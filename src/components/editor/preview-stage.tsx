'use client';

import { useEffect, useRef, useState } from 'react';
import type { CardGraphDocument, Format, Theme } from '@/lib/types';
import { FORMATS } from '@/lib/types';
import { createDocument } from '@/engine/document';
import { prepareScene } from '@/export/frames';
import { renderSceneToCanvas } from '@/engine/render';
import { decode, registerImage } from '@/engine/assets';
import { findGalleryEntry } from '@/templates/registry';

const PLACEHOLDERS: Record<string, string> = {
  'placeholder-a': '/placeholders/slab-a.png',
  'placeholder-b': '/placeholders/slab-b.png',
};

export function PreviewStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const key = params.get('key') ?? 'price-trend--up';
      const theme = (params.get('theme') as Theme) ?? 'dark';
      const format = (params.get('format') as Format) ?? '4:5';
      const entry = findGalleryEntry(key);
      if (!entry) return;

      for (const [id, url] of Object.entries(PLACEHOLDERS)) {
        registerImage(id, await decode(url));
      }

      const base = createDocument(entry.templateId, entry.variantId);
      const doc: CardGraphDocument = {
        ...base,
        theme,
        format,
        overrides: {
          card: { assetId: 'placeholder-a' },
          'card-right': { assetId: 'placeholder-b' },
        },
      };

      const { scene } = await prepareScene(doc);
      if (cancelled) return;

      const canvas = renderSceneToCanvas(scene(null), 1);
      const spec = FORMATS[format];
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      const host = hostRef.current;
      if (!host) return;
      host.style.width = `${spec.width}px`;
      host.replaceChildren(canvas);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-black p-0">
      <div ref={hostRef} data-ready={ready ? 'true' : 'false'} id="preview-stage" />
    </div>
  );
}
