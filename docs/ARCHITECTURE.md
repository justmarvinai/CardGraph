# Architecture

Everything runs in the browser. There is no server, no database, no API.
Vercel only serves static files and the Next.js pages.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Next.js (App Router)                                                  │
│  /            landing (static)                                        │
│  /app         template gallery + recent projects + presets (client)   │
│  /app/edit/:id editor (client)                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Editor UI (React)                                                     │
│  Content panel │ Canvas (react-konva) │ Properties panel │ Toolbar    │
├──────────────────────────────────────────────────────────────────────┤
│ Store (Zustand + zundo)         Document · UI state · Presets         │
├──────────────────────────────────────────────────────────────────────┤
│ Engine (framework-agnostic TS)                                        │
│  templates/  → build(ctx) → nodes[]                                   │
│  engine/     → render(nodes, t) onto a Konva stage                    │
│  export/     → png/jpg · gif (worker) · mp4 (WebCodecs) · webm        │
├──────────────────────────────────────────────────────────────────────┤
│ Storage: IndexedDB (idb-keyval) for images, autosave, presets         │
└──────────────────────────────────────────────────────────────────────┘
```

## 1. Document model

```ts
type Format = '4:5' | '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
type Theme  = 'dark' | 'light';

interface Document {
  version: 1;
  id: string;
  templateId: string;
  format: Format;
  theme: Theme;
  data: Record<string, unknown>;   // template field values (title, prices, chart rows…)
  overrides: Record<NodeId, Partial<Node>>; // user edits on top of template layout
  extraNodes: Node[];              // nodes the user added (small images, extra text)
  background: BackgroundSettings;  // blur, overlay strength, custom image?
  animation: AnimationSettings;    // preset, duration, fps, amplitude
  createdAt: number; updatedAt: number;
}
```

Key decision: the document stores **template data + overrides**, not a flat
node list. The template's `build()` is re-run whenever `data`, `format` or
`theme` changes; user overrides (moved a title, changed a font) are merged on
top by node id. This is what makes "switch format" and "switch theme" work
without losing the user's content, and it keeps templates upgradable.

If a user edits a node that the template rebuilds (e.g. moves the chart), the
override is keyed by the node's stable id (`title`, `chart`, `stat-1`…), so it
survives rebuilds. Overrides for positions are stored as **fractions of canvas
size** so they survive format changes reasonably; the user can "Reset layout"
per node or for the whole document.

## 2. Nodes

```ts
interface BaseNode { id; type; x; y; width; height; rotation; opacity; locked; visible; name }

TextNode    { text; fontFamily; fontWeight; fontSize; letterSpacing; lineHeight;
              align; color; uppercase; shadow?: Shadow; glow?: Glow; maxWidth?; autoFit? }
ImageNode   { src (asset id); fit: 'contain'|'cover'; radius; shadow?; role?: 'card'|'extra' }
ChartNode   { rows: {label: string; value: number}[]; stroke; strokeWidth; smooth;
              glow; yTicks: 'auto'|number; yFormat: NumberFormat; xLabelStyle; grid?: boolean }
StatNode    { label; value; valueColor; trend?: 'up'|'down'|null; badge?: BadgeRef; caption? }
DividerNode { orientation; color; thickness }
BadgeNode   { kind: 'builtin'|'text'|'image'; id/text/assetId; size }
GroupNode   { children: Node[] }   // used for stat rows so they move together
```

`bindings` live in the template: e.g. `stat-change.value ← percentChange(chart.rows)`.
A binding is active until the user types directly into the bound field; the
Content panel shows a lock/unlock icon to restore the binding.

## 3. Rendering

- One Konva `Stage`, three `Layer`s: `background` (cached bitmap), `content`
  (all nodes), `ui` (selection, transformer, guides). The `ui` layer is hidden
  during export.
- Each node type has a renderer in `src/engine/nodes/*.ts` that maps a node to
  Konva shapes. Text glow/shadow use Konva `shadowColor/Blur`; the neon "lime
  glow" of headlines is a soft shadow with the same colour.
- The chart renderer computes: nice y-ticks (`lib/math.ts`, 1-2-5 stepping),
  x labels (month abbreviations + day numbers, merging a month label when the
  month changes), smooth curve via Catmull-Rom → cubic bezier (`Konva.Line`
  with `tension`), optional soft glow line underneath.
- Canvas is always rendered at the format's logical size (e.g. 1080×1350) and
  scaled by the viewport zoom; export renders with `pixelRatio` 1 or 2.

## 4. Background pipeline

```
card image ─► downscale to ≤ 512px ─► draw cover-fit on offscreen canvas at
   export size/4 ─► ctx.filter = blur(24px) (≈ 96px at full size) ─► upscale
   ─► theme gradient overlay:
        dark:  linear #000 100% → #000 55% (middle) → #000 100%, plus radial vignette
        light: linear #fff 100% → #fff 60%          → #fff 100%
```
Result is cached per (assetId, format, theme, blur, strength) and drawn as one
`Konva.Image`. This keeps dragging at 60 fps even with a huge blur.

## 5. Animation & video export

- `animation.ts` exposes presets as `(t) => { dx, dy, rotation, scale, shadowOffset }`
  with `t ∈ [0,1)`, built from `sin(2πt)` and `sin(4πt)` terms only, so the
  first and last frames are identical → seamless loop at any duration.
- Preview: `requestAnimationFrame` updates only the animated node(s).
- Export: for `frame in 0..N-1`, set `t = frame/N`, `stage.draw()`,
  `stage.toCanvas({pixelRatio})`, hand the `ImageData`/`VideoFrame` to the
  encoder. UI shows progress and stays responsive (`await` per frame).
- GIF: `gifenc` in a Web Worker, 256-colour palette from the first frame,
  optional 2-colour dithering, output ≤ ~15 MB warning.
- MP4: `VideoEncoder` (H.264 `avc1.42001f`/`avc1.4d0028`, 30 fps, bitrate
  ~8 Mbit/s) → `mp4-muxer` → Blob. Feature-detect `VideoEncoder`; otherwise
  `canvas.captureStream()` + `MediaRecorder` → WebM, and tell the user.

## 6. Storage

| What | Where | Key |
|---|---|---|
| Uploaded images (Blob) | IndexedDB `assets` | `asset:<hash>` |
| Autosaved documents | IndexedDB `documents` | `doc:<id>` |
| Presets | IndexedDB `presets` | `preset:<id>` |
| UI prefs (last format/theme, zoom) | localStorage | `cg:ui` |

Presets are documents minus `id/createdAt`, with `includeImages: boolean`.
Export/import as JSON (images embedded as base64 when included).

## 7. Performance budget

- Import: images downscaled to max 2400 px on the long edge (keeps 2x export sharp).
- Stage redraws only the layer that changed; background layer is a cached bitmap.
- Fonts preloaded once at editor mount (`document.fonts.load`) with a loading state.
- Export of 120 frames at 1080×1350 should finish in < 15 s on a laptop.

## 8. Browser support

Chrome / Edge / Safari 17+ / Firefox latest. MP4 export needs WebCodecs
(Chrome, Edge, Safari 16.4+, Firefox 130+); others get WebM. Phone: gallery
works, editor shows a "best on desktop/tablet" notice but stays usable.
