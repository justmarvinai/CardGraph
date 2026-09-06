'use client';

import { BUILTIN_BADGES } from '@/lib/badges';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ImageField } from './image-field';

const KIND_OPTIONS = [
  { value: 'builtin', label: 'Marketplace / grader' },
  { value: 'text', label: 'Custom text' },
  { value: 'image', label: 'Own logo' },
];

/**
 * Source mark picker (Q3): recreated wordmarks, free text, or the user's own
 * logo. Nothing here embeds a company's logo file.
 */
export function BadgeField({
  kind,
  badgeId,
  text,
  assetId,
  onChange,
}: {
  kind: string;
  badgeId: string;
  text: string;
  assetId: string | null;
  onChange: (patch: { kind?: string; badgeId?: string; text?: string; assetId?: string | null }) => void;
}) {
  return (
    <div className="space-y-2">
      <Select
        value={kind || 'builtin'}
        onValueChange={(value) => onChange({ kind: value })}
        options={KIND_OPTIONS}
        ariaLabel="Source type"
      />
      {kind === 'text' ? (
        <Input
          value={text}
          placeholder="Marketplace name"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      ) : kind === 'image' ? (
        <ImageField
          assetId={assetId}
          label="Upload logo"
          compact
          onChange={(id) => onChange({ assetId: id })}
        />
      ) : (
        <Select
          value={badgeId || 'ebay'}
          onValueChange={(value) => onChange({ badgeId: value })}
          options={BUILTIN_BADGES.map((badge) => ({ value: badge.id, label: badge.name }))}
          ariaLabel="Marketplace"
        />
      )}
    </div>
  );
}
