'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/8 bg-ink-900/80 px-3',
          'text-sm text-ink-100 transition-colors hover:border-white/14 focus:outline-none focus:ring-2 focus:ring-accent/20',
          className,
        )}
      >
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <ChevronDown className="size-4 text-ink-400" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="cg-anim z-50 max-h-[300px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/10 bg-ink-850 shadow-pop"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-8 pr-3 text-sm text-ink-200 outline-none data-[highlighted]:bg-white/8 data-[highlighted]:text-white"
              >
                <RadixSelect.ItemIndicator className="absolute left-2.5">
                  <Check className="size-3.5 text-accent" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                {option.hint && <span className="ml-auto text-[11px] text-ink-400">{option.hint}</span>}
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
