import { describe, expect, it } from 'vitest';
import { FORMATS, FORMAT_ORDER, type Format, type Theme } from '@/lib/types';
import { TEMPLATES, GALLERY, getTemplate } from '@/templates/registry';
import { resolvePalette, THEME_PALETTES } from '@/lib/palette';
import { DEFAULT_FORMATTING } from '@/lib/format';
import type { BuildContext } from '@/templates/types';

function contextFor(templateId: string, format: Format, theme: Theme): BuildContext {
  const template = getTemplate(templateId)!;
  const spec = FORMATS[format];
  return {
    width: spec.width,
    height: spec.height,
    format,
    theme,
    palette: resolvePalette(theme, {}),
    formatting: DEFAULT_FORMATTING,
    data: template.defaults,
    variantId: null,
  };
}

describe('template registry', () => {
  it('gives every gallery entry a real template', () => {
    for (const entry of GALLERY) {
      expect(getTemplate(entry.templateId), entry.key).toBeDefined();
    }
  });

  it('keeps gallery keys unique', () => {
    const keys = GALLERY.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('points every template at a reference graphic', () => {
    for (const template of TEMPLATES) {
      expect(template.reference, template.id).toMatch(/\.jpg$/);
    }
  });
});

describe('template layout', () => {
  it('builds in every format and both themes without escaping the canvas', () => {
    for (const template of TEMPLATES) {
      for (const format of FORMAT_ORDER) {
        for (const theme of ['dark', 'light'] as Theme[]) {
          const ctx = contextFor(template.id, format, theme);
          const nodes = template.build(ctx);
          const where = `${template.id} ${format} ${theme}`;

          expect(nodes.length, where).toBeGreaterThan(0);

          for (const node of nodes) {
            expect(Number.isFinite(node.x), `${where} ${node.id}.x`).toBe(true);
            expect(Number.isFinite(node.y), `${where} ${node.id}.y`).toBe(true);
            expect(node.width, `${where} ${node.id}.width`).toBeGreaterThan(0);
            expect(node.height, `${where} ${node.id}.height`).toBeGreaterThanOrEqual(0);
            // A watermark may bleed deliberately; everything else stays inside.
            if (node.id !== 'watermark') {
              expect(node.y, `${where} ${node.id} above canvas`).toBeGreaterThanOrEqual(-1);
              expect(
                node.y + node.height,
                `${where} ${node.id} below canvas`,
              ).toBeLessThanOrEqual(ctx.height + 1);
              expect(node.x, `${where} ${node.id} left of canvas`).toBeGreaterThanOrEqual(-1);
            }
          }
        }
      }
    }
  });

  it('gives every node a unique id', () => {
    for (const template of TEMPLATES) {
      const ctx = contextFor(template.id, '4:5', 'dark');
      const ids = template.build(ctx).map((n) => n.id);
      expect(new Set(ids).size, template.id).toBe(ids.length);
    }
  });

  it('never hard-codes a colour outside the palette', () => {
    // Q5: the Director must be able to restyle everything. A template that
    // wrote its own hex would silently ignore the document palette.
    const allowed = new Set([
      ...Object.values(THEME_PALETTES.dark),
      ...Object.values(THEME_PALETTES.light),
    ]);
    for (const template of TEMPLATES) {
      for (const theme of ['dark', 'light'] as Theme[]) {
        for (const node of template.build(contextFor(template.id, '4:5', theme))) {
          const colours: string[] = [];
          if (node.type === 'text') colours.push(node.color);
          if (node.type === 'divider') colours.push(node.color);
          if (node.type === 'badge') colours.push(node.color, node.captionColor);
          if (node.type === 'chart') colours.push(node.panelFill, node.axisColor, node.gridColor);

          for (const colour of colours) {
            // Palette colours may arrive as rgba() after `withAlpha`.
            const hex = /^#[0-9a-fA-F]{6}$/.test(colour) ? colour.toUpperCase() : null;
            if (!hex) continue;
            expect(allowed.has(hex), `${template.id}/${theme} ${node.id} used ${hex}`).toBe(true);
          }
        }
      }
    }
  });

  it('recomputes derived values from the data', () => {
    const priceTrend = getTemplate('price-trend')!;
    const derived = priceTrend.derive!(priceTrend.defaults, DEFAULT_FORMATTING);
    expect(derived.changeText).toBe('▲ 26.81%');
    expect(derived.startPriceText).toBe('$2,760');
    expect(derived.endPriceText).toBe('$3,500');
    expect(derived.changeLabel).toBe('7-DAY CHANGE');
  });

  it('follows a falling series down', () => {
    const priceTrend = getTemplate('price-trend')!;
    const down = priceTrend.variants.find((v) => v.id === 'down')!;
    const derived = priceTrend.derive!(
      { ...priceTrend.defaults, ...down.data },
      DEFAULT_FORMATTING,
    );
    expect(String(derived.changeText)).toContain('▼');
    expect(String(derived.changeText)).toContain('50.72%');
  });
});
