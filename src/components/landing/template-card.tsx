'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { GalleryEntry } from '@/templates/registry';
import { cn } from '@/lib/cn';

/**
 * Preview thumbnails are generated into `public/previews`. Until one exists the
 * card falls back to a typographic placeholder rather than a broken image.
 */
export function TemplateCard({ entry, index = 0 }: { entry: GalleryEntry; index?: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={`/app/edit/${entry.key}`}
      className="group cg-rise block overflow-hidden rounded-2xl border border-white/8 bg-ink-850/70 transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-accent/40 hover:shadow-panel"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
        {failed ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-ink-800 to-ink-950 p-6 text-center">
            <span className="font-display text-2xl tracking-tight text-accent">{entry.name}</span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">Template</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={entry.preview}
            alt={`${entry.name} template preview`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-white">{entry.name}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-400">{entry.description}</p>
        </div>
        <span
          className={cn(
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-white/10 text-ink-400',
            'transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-black',
          )}
        >
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
