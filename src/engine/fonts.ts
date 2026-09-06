/**
 * Self-hosted font registry. Canvas needs a font to be fully loaded before it
 * measures or paints text, so every render path awaits `ensureFontsLoaded()`.
 */

export interface FontDefinition {
  family: string;
  /** Weights offered in the UI; variable files cover the whole range. */
  weights: number[];
  /** CSS stack used when the file has not loaded yet. */
  fallback: string;
  category: 'display' | 'sans' | 'mono';
  files: { weight: number | string; file: string }[];
  variable: boolean;
}

export const FONTS: FontDefinition[] = [
  {
    family: 'Bebas Neue',
    weights: [400],
    fallback: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
    category: 'display',
    files: [{ weight: 400, file: '/fonts/bebas-neue-400.woff2' }],
    variable: false,
  },
  {
    family: 'Anton',
    weights: [400],
    fallback: "'Anton', 'Impact', sans-serif",
    category: 'display',
    files: [{ weight: 400, file: '/fonts/anton-400.woff2' }],
    variable: false,
  },
  {
    family: 'Oswald',
    weights: [400, 500, 600, 700],
    fallback: "'Oswald', 'Arial Narrow', sans-serif",
    category: 'display',
    files: [{ weight: '400 700', file: '/fonts/oswald-var.woff2' }],
    variable: true,
  },
  {
    family: 'Montserrat',
    weights: [400, 500, 600, 700, 800],
    fallback: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    files: [{ weight: '400 800', file: '/fonts/montserrat-var.woff2' }],
    variable: true,
  },
  {
    family: 'Inter',
    weights: [400, 500, 600, 700, 800],
    fallback: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    files: [{ weight: '400 800', file: '/fonts/inter-var.woff2' }],
    variable: true,
  },
  {
    family: 'Poppins',
    weights: [400, 600, 800],
    fallback: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    files: [
      { weight: 400, file: '/fonts/poppins-400.woff2' },
      { weight: 600, file: '/fonts/poppins-600.woff2' },
      { weight: 800, file: '/fonts/poppins-800.woff2' },
    ],
    variable: false,
  },
  {
    family: 'Space Grotesk',
    weights: [400, 500, 600, 700],
    fallback: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    files: [{ weight: '400 700', file: '/fonts/space-grotesk-var.woff2' }],
    variable: true,
  },
  {
    family: 'Roboto Mono',
    weights: [400, 500, 700],
    fallback: "'Roboto Mono', ui-monospace, monospace",
    category: 'mono',
    files: [{ weight: '400 700', file: '/fonts/roboto-mono-var.woff2' }],
    variable: true,
  },
];

export const FONT_FAMILIES = FONTS.map((f) => f.family);

export function getFont(family: string): FontDefinition {
  return FONTS.find((f) => f.family === family) ?? FONTS[3];
}

export function fontStack(family: string): string {
  return getFont(family).fallback;
}

/** Nearest available weight, so switching family never breaks a text node. */
export function nearestWeight(family: string, weight: number): number {
  const { weights } = getFont(family);
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), weights[0]);
}

let loadPromise: Promise<void> | null = null;

/** Registers every font with the browser and waits until all are usable. */
export function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const faces: Promise<unknown>[] = [];
    for (const font of FONTS) {
      for (const file of font.files) {
        const face = new FontFace(font.family, `url(${file.file}) format('woff2')`, {
          weight: String(file.weight),
          style: 'normal',
          display: 'block',
        });
        faces.push(
          face.load().then((loaded) => {
            document.fonts.add(loaded);
          }),
        );
      }
    }
    await Promise.all(faces).catch(() => undefined);
    await document.fonts.ready;
  })();

  return loadPromise;
}
