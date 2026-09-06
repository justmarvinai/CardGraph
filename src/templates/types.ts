import type {
  CardGraphDocument,
  Format,
  FormattingSettings,
  Node,
  Palette,
  Theme,
} from '@/lib/types';

/** Everything `build()` may depend on. Pure in, nodes out. */
export interface BuildContext {
  width: number;
  height: number;
  format: Format;
  theme: Theme;
  palette: Palette;
  formatting: FormattingSettings;
  data: Record<string, unknown>;
  variantId: string | null;
}

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'image'
  | 'chartRows'
  | 'badge'
  | 'toggle'
  | 'color';

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  id: string;
  label: string;
  kind: FieldKind;
  group: string;
  placeholder?: string;
  help?: string;
  options?: FieldOption[];
  /** Filled automatically until the user types into it (Q10). */
  derived?: boolean;
  /** Only shown when this returns true — keeps the panel free of noise. */
  visibleWhen?: (data: Record<string, unknown>) => boolean;
}

export interface TemplateVariant {
  id: string;
  name: string;
  description: string;
  /** Merged over `defaults` when a document is created from this variant. */
  data: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  /** File in `assets/template_examples/` this template is modelled on. */
  reference: string;
  tags: string[];
  variants: TemplateVariant[];
  fields: Field[];
  defaults: Record<string, unknown>;
  /**
   * Values computed from other fields (percent change, dates, spans).
   * The store applies these for every field the user has not typed into.
   */
  derive?: (data: Record<string, unknown>, formatting: FormattingSettings) => Record<string, unknown>;
  build: (ctx: BuildContext) => Node[];
  /**
   * Maps a text node to the content field it came from, so editing text
   * directly on the canvas updates the Content panel instead of drifting
   * from it.
   */
  nodeFields?: Record<string, string>;
}

export type DocumentSeed = Pick<CardGraphDocument, 'templateId' | 'variantId' | 'data'>;
