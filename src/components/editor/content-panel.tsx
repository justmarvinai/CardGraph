'use client';

import { useMemo } from 'react';
import { Link2, Unlink } from 'lucide-react';
import type { ChartRow } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { useNodes } from '@/store/use-nodes';
import { requireTemplate } from '@/templates/registry';
import type { Field } from '@/templates/types';
import { Field as FieldRow, Input, Textarea } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { ChartEditor } from './chart-editor';
import { ImageField } from './image-field';
import { BadgeField } from './badge-field';
import { parseLooseNumber } from '@/lib/format';

/** The simple editing path: fill in the form, get a finished graphic. */
export function ContentPanel() {
  const doc = useEditor((s) => s.doc);
  const setField = useEditor((s) => s.setField);
  const resetField = useEditor((s) => s.resetField);
  const updateNodes = useEditor((s) => s.updateNodes);
  const nodes = useNodes();

  const template = requireTemplate(doc.templateId);
  const groups = useMemo(() => {
    const map = new Map<string, Field[]>();
    for (const field of template.fields) {
      if (field.visibleWhen && !field.visibleWhen(doc.data)) continue;
      const list = map.get(field.group) ?? [];
      list.push(field);
      map.set(field.group, list);
    }
    return [...map.entries()];
  }, [template.fields, doc.data]);

  const imageAssetFor = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node && node.type === 'image' ? node.assetId : null;
  };

  return (
    <div className="space-y-6">
      {groups.map(([group, fields]) => (
        <section key={group} className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{group}</h3>
          <div className="space-y-3">
            {fields.map((field) => {
              const value = doc.data[field.id];
              const isUnbound = doc.unbound.includes(field.id);

              if (field.kind === 'image') {
                return (
                  <FieldRow key={field.id} label={field.label}>
                    <ImageField
                      assetId={imageAssetFor(field.id)}
                      label={field.label}
                      onChange={(assetId) => updateNodes([{ id: field.id, patch: { assetId } }])}
                    />
                  </FieldRow>
                );
              }

              if (field.kind === 'chartRows') {
                return (
                  <FieldRow key={field.id} label={field.label} hint={field.help}>
                    <ChartEditor
                      rows={(value as ChartRow[]) ?? []}
                      onChange={(rows) => setField(field.id, rows)}
                    />
                  </FieldRow>
                );
              }

              if (field.kind === 'badge') {
                const prefix = field.id.replace(/Badge$/, '');
                return (
                  <FieldRow key={field.id} label={field.label}>
                    <BadgeField
                      kind={String(doc.data[`${prefix}BadgeKind`] ?? 'builtin')}
                      badgeId={String(value ?? 'ebay')}
                      text={String(doc.data[`${prefix}BadgeText`] ?? '')}
                      assetId={(doc.data[`${prefix}BadgeAsset`] as string) ?? null}
                      onChange={(patch) => {
                        if (patch.kind !== undefined) setField(`${prefix}BadgeKind`, patch.kind);
                        if (patch.badgeId !== undefined) setField(field.id, patch.badgeId);
                        if (patch.text !== undefined) setField(`${prefix}BadgeText`, patch.text);
                        if (patch.assetId !== undefined) setField(`${prefix}BadgeAsset`, patch.assetId);
                      }}
                    />
                  </FieldRow>
                );
              }

              const action = field.derived ? (
                <Tooltip
                  content={
                    isUnbound
                      ? 'You edited this. Click to follow the data again.'
                      : 'Filled in automatically from your data.'
                  }
                >
                  <button
                    type="button"
                    onClick={() => isUnbound && resetField(field.id)}
                    className={`rounded p-0.5 transition-colors ${
                      isUnbound ? 'text-ink-300 hover:text-accent' : 'text-accent/70'
                    }`}
                    aria-label={isUnbound ? 'Restore automatic value' : 'Automatic value'}
                  >
                    {isUnbound ? <Unlink className="size-3" /> : <Link2 className="size-3" />}
                  </button>
                </Tooltip>
              ) : undefined;

              return (
                <FieldRow key={field.id} label={field.label} hint={field.help} action={action}>
                  {field.kind === 'textarea' ? (
                    <Textarea
                      value={String(value ?? '')}
                      placeholder={field.placeholder}
                      onChange={(e) => setField(field.id, e.target.value)}
                    />
                  ) : field.kind === 'currency' || field.kind === 'number' ? (
                    <Input
                      inputMode="decimal"
                      value={String(value ?? '')}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setField(
                          field.id,
                          e.target.value === '' ? '' : parseLooseNumber(e.target.value, doc.formatting),
                        )
                      }
                    />
                  ) : field.kind === 'date' ? (
                    <Input
                      type="date"
                      value={String(value ?? '')}
                      onChange={(e) => setField(field.id, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={String(value ?? '')}
                      placeholder={field.placeholder}
                      onChange={(e) => setField(field.id, e.target.value)}
                    />
                  )}
                </FieldRow>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
