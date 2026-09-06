import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-white/7">
        <div className="cg-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.95] tracking-tight text-white">
            YOUR NEXT POST IS <span className="text-accent">TWO MINUTES AWAY</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-300">
            Open a template, drop in a card, export. Nothing to install and nothing to sign up for.
          </p>
          <Link
            href="/app"
            className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-100"
          >
            Start designing
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-white">CARDGRAPH</span>
            <span className="text-[12px] text-ink-500">Premium trading-card graphics in seconds.</span>
          </div>
          <p className="text-[12px] text-ink-500">
            Everything runs in your browser — your card images never leave your device.
          </p>
        </div>
      </footer>
    </>
  );
}
