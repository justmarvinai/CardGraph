'use client';

import { RotateCcw } from 'lucide-react';
import type { Palette, PaletteKey } from '@/lib/types';
import { FORMAT_ORDER, FORMATS } from '@/lib/types';
import { useEditor } from '@/store/editor';
import { ACCENT_PRESETS, PALETTE_LABELS, THEME_PALETTES, resolvePalette } from '@/lib/palette';
import { Field, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SliderRow } from '@/components/ui/slider';
import { Segmented } from '@/components/ui/segmented';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { ImageField } from './image-field';
import { cn } from '@/lib/cn';

/** Format, theme, colours, backdrop and number formatting for the whole document. */
export function DesignPanel() {
  const doc = useEditor((s) => s.doc);
  const setFormat = useEditor((s) => s.setFormat);
  const setTheme = useEditor((s) => s.setTheme);
  const setPalette = useEditor((s) => s.setPalette);
  const resetPalette = useEditor((s) => s.resetPalette);
  const setBackground = useEditor((s) => s.setBackground);
  const setFormatting = useEditor((s) => s.setFormatting);

  const palette = resolvePalette(doc.theme, doc.palette);
  const defaults = THEME_PALETTES[doc.theme];
  const paletteKeys = Object.keys(PALETTE_LABELS) as PaletteKey[];
  const activeAccent = ACCENT_PRESETS.find((preset) => preset[doc.theme] === palette.accent);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Format</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMAT_ORDER.map((format) => {
            const spec = FORMATS[format];
            const active = doc.format === format;
            return (
              <button
                key={format}
                type="button"
                onClick={() => setFormat(format)}
                title={`${spec.hint} · ${spec.width}×${spec.height}`}
                className={cn(
                  'group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors',
                  active
                    ? 'border-accent/60 bg-accent/8'
                    : 'border-white/8 bg-ink-900/60 hover:border-white/18',
                )}
              >
                <span
                  className={cn('rounded-[3px] border', active ? 'border-accent bg-accent/25' : 'border-ink-400')}
                  style={{
                    width: 22 * Math.min(1, spec.width / Math.max(spec.width, spec.height)),
                    height: 22 * Math.min(1, spec.height / Math.max(spec.width, spec.height)),
                  }}
                />
                <span className={cn('text-[11px] font-medium', active ? 'text-accent' : 'text-ink-300')}>
                  {spec.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] leading-snug text-ink-400">
          Switching format re-runs the layout and keeps your content. Anything you moved yourself
          scales with it — use Reset layout if you want the template positions back.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Theme</h3>
        <Segmented
          value={doc.theme}
          onChange={setTheme}
          className="w-full"
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Colours</h3>
          {Object.keys(doc.palette).length > 0 && (
            <button
              type="button"
              onClick={resetPalette}
              className="inline-flex items-center gap-1 text-[11px] text-ink-400 transition-colors hover:text-white"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
        </div>

        <div>
          <Label className="mb-2">Accent</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.name}
                onClick={() => setPalette('accent', preset[doc.theme])}
                className={cn(
                  'size-7 rounded-md border transition-transform hover:scale-110',
                  activeAccent?.id === preset.id ? 'border-white' : 'border-white/15',
                )}
                style={{ background: preset[doc.theme] }}
              />
            ))}
            <ColorPicker
              value={palette.accent}
              onChange={(value) => setPalette('accent', value)}
              onReset={() => setPalette('accent', null)}
              label="Accent"
              className="rounded-md ring-1 ring-white/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          {paletteKeys
            .filter((key) => key !== 'accent')
            .map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-[12px] text-ink-200">{PALETTE_LABELS[key]}</span>
                <div className="flex items-center gap-1.5">
                  {doc.palette[key] && (
                    <button
                      type="button"
                      onClick={() => setPalette(key, null)}
                      className="text-[10px] text-ink-500 transition-colors hover:text-white"
                    >
                      reset
                    </button>
                  )}
                  <ColorPicker
                    value={palette[key as keyof Palette]}
                    onChange={(value) => setPalette(key, value)}
                    onReset={() => setPalette(key, null)}
                    label={PALETTE_LABELS[key]}
                  />
                </div>
              </div>
            ))}
        </div>
        <p className="text-[11px] leading-snug text-ink-400">
          Defaults for this theme: accent {defaults.accent}. Every value here is yours to change.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Background</h3>
        <Segmented
          value={doc.background.source}
          onChange={(source) => setBackground({ source })}
          className="w-full"
          size="sm"
          options={[
            { value: 'card', label: 'Card' },
            { value: 'custom', label: 'Own image' },
            { value: 'none', label: 'Plain' },
          ]}
        />

        {doc.background.source === 'custom' && (
          <ImageField
            assetId={doc.background.customAssetId}
            label="Background image"
            compact
            onChange={(assetId) => setBackground({ customAssetId: assetId })}
          />
        )}

        {doc.background.source === 'none' ? (
          <Field label="Colour">
            <div className="flex items-center gap-2">
              <ColorPicker
                value={doc.background.fallbackColor}
                onChange={(value) => setBackground({ fallbackColor: value })}
                label="Background"
              />
              <span className="font-mono text-[12px] text-ink-300">{doc.background.fallbackColor}</span>
            </div>
          </Field>
        ) : (
          <>
            <SliderRow
              label="Blur"
              value={doc.background.blur}
              min={0}
              max={200}
              onValueChange={(blur) => setBackground({ blur })}
            />
            <SliderRow
              label="Overlay"
              value={doc.background.overlayStrength}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onValueChange={(overlayStrength) => setBackground({ overlayStrength })}
            />
            <SliderRow
              label="Vignette"
              value={doc.background.vignette}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onValueChange={(vignette) => setBackground({ vignette })}
            />
            <SliderRow
              label="Zoom"
              value={doc.background.zoom}
              min={1}
              max={2}
              step={0.01}
              format={(v) => `${v.toFixed(2)}×`}
              onValueChange={(zoom) => setBackground({ zoom })}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Numbers & dates</h3>
        <Field label="Currency">
          <Select
            value={doc.formatting.currency}
            onValueChange={(currency) => setFormatting({ currency })}
            options={[
              { value: '$', label: '$  Dollar' },
              { value: '€', label: '€  Euro' },
              { value: '£', label: '£  Pound' },
              { value: '¥', label: '¥  Yen' },
              { value: '', label: 'No symbol' },
            ]}
          />
        </Field>
        <Field label="Thousands">
          <Segmented
            value={doc.formatting.thousandsSeparator}
            onChange={(thousandsSeparator) =>
              setFormatting({
                thousandsSeparator,
                decimalSeparator: thousandsSeparator === '.' ? ',' : '.',
              })
            }
            className="w-full"
            size="sm"
            options={[
              { value: ',', label: '1,725' },
              { value: '.', label: '1.725' },
              { value: ' ', label: '1 725' },
              { value: '', label: '1725' },
            ]}
          />
        </Field>
        <Field label="Dates">
          <Select
            value={doc.formatting.dateStyle}
            onValueChange={(dateStyle) => setFormatting({ dateStyle: dateStyle as 'long' })}
            options={[
              { value: 'long', label: 'AUGUST 28, 2026' },
              { value: 'short', label: 'AUG 28, 2026' },
              { value: 'numeric', label: '08/28/2026' },
            ]}
          />
        </Field>
      </section>

      <ResetLayoutButton />
    </div>
  );
}

function ResetLayoutButton() {
  const resetLayout = useEditor((s) => s.resetLayout);
  const overrides = useEditor((s) => Object.keys(s.doc.overrides).length);
  if (!overrides) return null;
  return (
    <Button variant="secondary" size="sm" className="w-full" onClick={resetLayout}>
      <RotateCcw className="size-3.5" /> Reset layout to the template
    </Button>
  );
}
