import type { FormattingSettings, Node, Palette, Theme } from '@/lib/types';
import type { Motion } from './animation';

/** What every node renderer gets. Deliberately free of React and of the store. */
export interface RenderContext {
  width: number;
  height: number;
  theme: Theme;
  palette: Palette;
  formatting: FormattingSettings;
  getImage: (assetId: string | null) => HTMLImageElement | null;
  /** Per-node loop transform; identity outside animation preview/export. */
  motionFor: (node: Node) => Motion;
  /** The editor draws placeholders for empty images; the export never does. */
  showPlaceholders: boolean;
}
