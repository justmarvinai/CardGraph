'use client';

import * as Popover from '@radix-ui/react-popover';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from './input';

const SWATCHES = [
  '#FFFFFF', '#E6E9EE', '#8B919B', '#0A0A0A',
  '#CCFF00', '#A8D400', '#FFC94A', '#FF9F0A',
  '#2EE59D', '#12A868', '#22D3EE', '#0E7490',
  '#A78BFA', '#6D28D9', '#FF4D9D', '#FF3B30',
];

/**
 * Every colour in a document is editable (Q5), so this sits next to a lot of
 * rows: a swatch that opens presets plus a native picker and a hex field.
 */
export function ColorPicker({
  value,
  onChange,
  onReset,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label ? `${label} colour` : 'Colour'}
        className={cn(
          'size-7 shrink-0 rounded-md border border-white/15 transition-transform hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-accent/40',
          className,
        )}
        style={{ background: value }}
      />
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="cg-anim z-50 w-60 rounded-xl border border-white/10 bg-ink-850 p-3 shadow-pop"
        >
          <div className="grid grid-cols-8 gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => onChange(swatch)}
                className={cn(
                  'aspect-square rounded-md border transition-transform hover:scale-110',
                  value.toUpperCase() === swatch ? 'border-accent' : 'border-white/12',
                )}
                style={{ background: swatch }}
                aria-label={swatch}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={normalize(value)}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="size-9 rounded-lg"
              aria-label="Pick a colour"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono text-[12px] uppercase"
              spellCheck={false}
            />
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                title="Back to the template default"
                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/8 hover:text-white"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** `<input type="color">` only accepts `#rrggbb`. */
function normalize(value: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (match) return `#${match[1]}`;
  const short = /^#?([0-9a-f]{3})$/i.exec(value.trim());
  if (short) {
    const [r, g, b] = short[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}
