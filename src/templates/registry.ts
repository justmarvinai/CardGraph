import type { Template, TemplateVariant } from './types';
import { priceTrend } from './price-trend';
import { gradeComparison } from './grade-comparison';
import { saleComparison } from './sale-comparison';
import { mostGraded } from './most-graded';
import { topSalesDuo } from './top-sales-duo';

export const TEMPLATES: Template[] = [
  priceTrend,
  gradeComparison,
  saleComparison,
  mostGraded,
  topSalesDuo,
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function requireTemplate(id: string): Template {
  const template = getTemplate(id);
  if (!template) throw new Error(`Unknown template: ${id}`);
  return template;
}

/** One gallery card per variant, so "Price Drop" is findable on its own (Q1). */
export interface GalleryEntry {
  key: string;
  templateId: string;
  variantId: string | null;
  name: string;
  description: string;
  tags: string[];
  preview: string;
}

export const GALLERY: GalleryEntry[] = TEMPLATES.flatMap((template): GalleryEntry[] => {
  if (template.variants.length === 0) {
    return [
      {
        key: template.id,
        templateId: template.id,
        variantId: null,
        name: template.name,
        description: template.description,
        tags: template.tags,
        preview: `/previews/${template.id}.jpg`,
      },
    ];
  }
  return template.variants.map((variant: TemplateVariant) => {
    // The gallery key is the single source for both the route and the preview
    // filename — deriving them separately let them drift apart.
    const key = `${template.id}--${variant.id}`;
    return {
      key,
      templateId: template.id,
      variantId: variant.id,
      name: variant.name,
      description: variant.description,
      tags: template.tags,
      preview: `/previews/${key}.jpg`,
    };
  });
});

export function findGalleryEntry(key: string): GalleryEntry | undefined {
  return GALLERY.find((entry) => entry.key === key);
}
