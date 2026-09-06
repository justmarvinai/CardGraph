'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Trash2 } from 'lucide-react';
import type { CardGraphDocument } from '@/lib/types';
import { deleteDocument, listDocuments } from '@/lib/storage';
import { findGalleryEntry, getTemplate } from '@/templates/registry';

/** Autosaved work, listed so a reload never means starting over. */
export function RecentDocuments() {
  const [docs, setDocs] = useState<CardGraphDocument[]>([]);

  useEffect(() => {
    void listDocuments().then((all) => setDocs(all.filter((d) => d.id.startsWith('last:')).slice(0, 4)));
  }, []);

  if (docs.length === 0) return null;

  return (
    <section className="mt-2">
      <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        <Clock className="size-3" /> Continue where you left off
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {docs.map((doc) => {
          const key = doc.id.replace('last:', '').replace(':default', '').replace(':', '--');
          const entry = findGalleryEntry(key);
          const template = getTemplate(doc.templateId);
          return (
            <div
              key={doc.id}
              className="group flex items-center gap-2 rounded-xl border border-white/8 bg-ink-850/60 px-3 py-2.5 transition-colors hover:border-white/18"
            >
              <Link href={`/app/edit/${entry?.key ?? doc.templateId}`} className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink-100">{doc.name}</p>
                <p className="text-[11px] text-ink-500">
                  {template?.name} · {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${doc.name}`}
                onClick={async () => {
                  await deleteDocument(doc.id);
                  setDocs((current) => current.filter((d) => d.id !== doc.id));
                }}
                className="rounded-lg p-1.5 text-ink-500 opacity-0 transition-opacity hover:text-negative group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
