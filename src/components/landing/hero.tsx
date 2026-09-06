import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroPreview } from './hero-preview';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="cg-aurora pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <div className="cg-rise">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            <Sparkles className="size-3" />
            For trading-card people
          </span>

          <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.92] tracking-tight text-white">
            CARD GRAPHICS
            <br />
            <span className="text-accent">THAT LOOK FINISHED</span>
            <br />
            IN SECONDS.
          </h1>

          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-300">
            Pick a template, drop in your slab photo, type the numbers. CardGraph builds the blurred
            backdrop, the live price chart and the stat row for you — then lets you change every
            colour, font and pixel if you want to.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-semibold text-black shadow-[0_0_0_1px_rgba(204,255,0,0.35),0_16px_40px_-16px_rgba(204,255,0,0.7)] transition-transform hover:scale-[1.02] active:scale-100"
            >
              Start designing
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-[13px] text-ink-400">
              No account. No upload. Runs entirely in your browser.
            </span>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/8 pt-6">
            {[
              ['6', 'formats'],
              ['2', 'themes'],
              ['4', 'export types'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-3xl text-white">{value}</dt>
                <dd className="mt-0.5 text-[12px] uppercase tracking-[0.1em] text-ink-400">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="cg-rise" style={{ animationDelay: '140ms' }}>
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
