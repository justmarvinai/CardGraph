import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GALLERY } from '@/templates/registry';
import { TemplateCard } from './template-card';

export function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl leading-none tracking-tight text-white sm:text-5xl">
            THE TEMPLATES
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-300">
            Each one is designed to be postable the moment your numbers are in. New templates get
            added over time.
          </p>
        </div>
        <Link
          href="/app"
          className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-accent transition-colors hover:text-white"
        >
          Open the gallery
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY.map((entry, index) => (
          <TemplateCard key={entry.key} entry={entry} index={index} />
        ))}
      </div>
    </section>
  );
}
