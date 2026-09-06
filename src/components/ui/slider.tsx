'use client';

import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

export function Slider({
  value,
  onValueChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  className,
  ariaLabel,
}: {
  value: number;
  onValueChange: (value: number) => void;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <RadixSlider.Root
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      onValueChange={([v]) => onValueChange(v)}
      onValueCommit={([v]) => onCommit?.(v)}
    >
      <RadixSlider.Track className="relative h-1 w-full grow rounded-full bg-ink-600">
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block size-4 rounded-full border-2 border-accent bg-ink-900 shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/30" />
    </RadixSlider.Root>
  );
}

/** Label + slider + numeric readout, the shape every properties row wants. */
export function SliderRow({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-300">{label}</span>
        <span className="font-mono text-[11px] text-ink-200">{format ? format(value) : Math.round(value)}</span>
      </div>
      <Slider value={value} onValueChange={onValueChange} min={min} max={max} step={step} ariaLabel={label} />
    </div>
  );
}
