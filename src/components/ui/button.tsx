'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-black font-semibold hover:bg-[#d9ff33] active:bg-accent-dim shadow-[0_0_0_1px_rgba(204,255,0,0.35),0_10px_30px_-12px_rgba(204,255,0,0.55)]',
  secondary:
    'bg-ink-700 text-ink-100 hover:bg-ink-600 border border-white/8',
  ghost: 'text-ink-200 hover:text-white hover:bg-white/6',
  danger: 'bg-negative/12 text-negative hover:bg-negative/20 border border-negative/25',
  toolbar:
    'bg-ink-800/80 text-ink-200 hover:text-white hover:bg-ink-700 border border-white/8 backdrop-blur',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg justify-center',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-[background,color,box-shadow,transform] duration-150 select-none',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
