'use client';

import { useEffect, useState } from 'react';

/**
 * A live, self-drawing miniature of the Price Trend template. It is plain SVG
 * rather than the real engine so the landing page ships no canvas JavaScript.
 */
const POINTS = [2760, 2820, 2980, 2870, 2795, 2990, 3010, 3500];

export function HeroPreview() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const min = Math.min(...POINTS);
  const max = Math.max(...POINTS);
  const path = POINTS.map((value, i) => {
    const x = (i / (POINTS.length - 1)) * 100;
    const y = 100 - ((value - min) / (max - min)) * 88 - 6;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -inset-6 rounded-[32px] bg-accent/10 blur-3xl" aria-hidden />

      <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-panel">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 45% at 30% 35%, rgba(60,130,255,0.55), transparent 70%), radial-gradient(55% 40% at 75% 55%, rgba(46,229,157,0.35), transparent 70%), linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 45%, #000 100%)',
          }}
          aria-hidden
        />

        <div className="relative flex h-full flex-col p-5">
          <p className="font-display text-[clamp(1.9rem,7cqw,2.6rem)] leading-[0.9] tracking-tight text-accent">
            MEW EX
          </p>
          <p className="mt-1 text-[11px] text-white/85">
            PSA 10 · Paldean Fates <span className="font-bold text-accent">#232</span>
          </p>

          <div className="mt-4 grid flex-1 grid-cols-[0.9fr_1.1fr] gap-3">
            <div className="cg-float relative rounded-lg border border-white/15 bg-gradient-to-b from-white/12 to-white/4 p-1.5">
              <div className="h-[22%] rounded-sm border border-red-500/70 bg-white/90" />
              <div className="mt-1.5 h-[76%] rounded-sm bg-gradient-to-b from-sky-300/80 via-sky-200/60 to-emerald-300/60" />
            </div>

            <div className="rounded-xl bg-black/70 p-2.5 backdrop-blur-sm">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
                <path
                  d={path}
                  fill="none"
                  stroke="#2EE59D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(46,229,157,0.65))',
                    strokeDasharray: 400,
                    strokeDashoffset: drawn ? 0 : 400,
                    transition: 'stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 border-t border-white/20 pt-2.5">
            <div className="grid grid-cols-3 divide-x divide-white/15 text-center">
              {[
                ['AUG 28, 2026', '$2,760', 'text-accent'],
                ['7-DAY CHANGE', '▲ 26.81%', 'text-[#2EE59D]'],
                ['SEP 4, 2026', '$3,500', 'text-accent'],
              ].map(([label, value, tone]) => (
                <div key={label} className="px-1">
                  <p className="text-[7px] uppercase tracking-wider text-white/70">{label}</p>
                  <p className={`mt-0.5 text-[clamp(0.7rem,3.4cqw,1rem)] font-extrabold ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
