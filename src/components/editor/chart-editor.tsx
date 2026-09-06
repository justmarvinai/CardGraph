'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { ChartRow } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createId } from '@/lib/id';

/**
 * The live chart data table. Every keystroke re-runs the layout, so the curve,
 * the percentage and the dates underneath move as the user types.
 */
export function ChartEditor({
  rows,
  onChange,
}: {
  rows: ChartRow[];
  onChange: (rows: ChartRow[]) => void;
}) {
  const update = (index: number, patch: Partial<ChartRow>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    const nextLabel = nextDate(last?.label);
    onChange([...rows, { id: createId('r'), label: nextLabel, value: last?.value ?? 100 }]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[16px_1fr_92px_28px] items-center gap-1.5 px-0.5">
        <span />
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-400">Date</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-400">Value</span>
        <span />
      </div>

      <div className="cg-scroll max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[16px_1fr_92px_28px] items-center gap-1.5">
            <GripVertical className="size-3.5 text-ink-600" />
            <Input
              type="date"
              value={toDateInput(row.label)}
              onChange={(e) => update(index, { label: e.target.value })}
              className="h-8 text-[12px]"
            />
            <Input
              type="number"
              inputMode="decimal"
              value={String(row.value)}
              onChange={(e) => update(index, { value: Number(e.target.value) || 0 })}
              className="h-8 text-[12px] font-mono"
            />
            <button
              type="button"
              aria-label={`Remove point ${index + 1}`}
              disabled={rows.length <= 2}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-white/8 hover:text-negative disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button size="sm" variant="secondary" onClick={addRow} className="w-full">
        <Plus className="size-3.5" /> Add point
      </Button>
    </div>
  );
}

/** `<input type="date">` needs `YYYY-MM-DD`; templates accept free text too. */
function toDateInput(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function nextDate(label: string | undefined): string {
  const base = label && /^\d{4}-\d{2}-\d{2}$/.test(label) ? new Date(label) : new Date();
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0, 10);
}
