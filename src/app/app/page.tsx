import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GALLERY } from '@/templates/registry';
import { TemplateCard } from '@/components/landing/template-card';
import { RecentDocuments } from '@/components/editor/recent-documents';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Pick a template and start designing.',
};

export default function GalleryPage() {
  return (
    <div className="min-h-dvh">
      <div className="cg-aurora absolute inset-x-0 top-0 h-[420px] opacity-70" aria-hidden />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-300 transition-colors hover:bg-white/6 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Home
        </Link>
        <span className="font-display text-[15px] tracking-wide text-white">CARDGRAPH</span>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="max-w-2xl py-8">
          <h1 className="font-display text-4xl leading-none tracking-tight text-white sm:text-5xl">
            Choose a template
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
            Every template is finished out of the box. Upload a card, type your numbers, and it is
            ready to post — or change anything you like.
          </p>
        </div>

        <RecentDocuments />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((entry, index) => (
            <TemplateCard key={entry.key} entry={entry} index={index} />
          ))}
        </div>
      </main>
    </div>
  );
}
