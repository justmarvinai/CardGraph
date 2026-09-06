'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full bg-ink-900/80 border border-white/8 rounded-lg px-3 text-sm text-ink-100 placeholder:text-ink-400 ' +
  'transition-colors hover:border-white/14 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, 'h-9', className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'py-2 min-h-[72px] resize-y leading-relaxed', className)} {...props} />;
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-300', className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  action,
  children,
}: {
  label?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {(label || action) && (
        <div className="flex items-center justify-between gap-2 min-h-[18px]">
          {label ? <Label>{label}</Label> : <span />}
          {action}
        </div>
      )}
      {children}
      {hint && <p className="text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
}
