'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            'cg-anim fixed left-1/2 top-1/2 z-50 w-[min(92vw,540px)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-pop',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/7 px-5 py-4">
            <div>
              <RadixDialog.Title className="text-[15px] font-semibold text-white">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-[13px] text-ink-300">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/8 hover:text-white">
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          <div className="cg-scroll max-h-[62vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-white/7 px-5 py-3.5">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
