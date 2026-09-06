'use client';

import { useEffect, useState } from 'react';

/**
 * The hero shows a real export rather than a mock-up of one: it is rendered by
 * the same engine the editor uses, so the promise on the page is the product.
 */
const SHOTS = [
  { src: '/previews/price-trend--up.jpg', alt: 'Price trend graphic made with CardGraph' },
  { src: '/previews/grade-comparison.jpg', alt: 'Grade comparison graphic made with CardGraph' },
  { src: '/previews/most-graded.jpg', alt: 'Population report graphic made with CardGraph' },
];

export function HeroPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SHOTS.length), 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="absolute -inset-8 rounded-[40px] bg-accent/10 blur-3xl" aria-hidden />

      <div className="cg-float relative aspect-4/5 overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-panel">
        {SHOTS.map((shot, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={shot.src}
            src={shot.src}
            alt={i === index ? shot.alt : ''}
            aria-hidden={i !== index}
            className="absolute inset-0 size-full object-cover transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0 }}
            fetchPriority={i === 0 ? 'high' : 'low'}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {SHOTS.map((shot, i) => (
          <span
            key={shot.src}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
