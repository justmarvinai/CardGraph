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

TextNode    { text; fontFamily; fontWeight; fontSize; letterSpacing; lineHeight; align;
              verticalAlign; color; transform; shadow: Shadow | null; autoFit; minFontSize }
ImageNode   { assetId; fit: 'contain'|'cover'; radius; shadow; role: 'card'|'extra'; flipX }
ChartNode   { rows: {id; label; value}[]; strokeMode: 'auto'|'custom'; stroke; strokeWidth;
              smooth; glow; panelFill; panelRadius; panelOpacity; showPanel; showYAxis;
              showXAxis; showGrid; gridColor; axisColor; axisFontFamily; axisFontSize;
              tickCount; padding }
DividerNode { orientation; color; thickness; fade }
BadgeNode   { kind: 'builtin'|'text'|'image'; badgeId; text; assetId; color; caption; … }
```

**Two deviations from the original plan**, both taken to keep the engine small:

- There is no `stat` node. The bottom band is ordinary text, divider and badge
  nodes emitted by `statsRow()`. Users get the same freedom to move and restyle
  each piece, and the renderer keeps one code path per primitive.
- There is no `group` node. Multi-select covers moving several elements at once,
  which is what grouping would have been used for.

`bindings` live in the template: e.g. `stat-change.value ← percentChange(chart.rows)`.
A binding is active until the user types directly into the bound field; the
Content panel shows a lock/unlock icon to restore the binding.

## 3. Rendering

- One Konva `Stage`, three `Layer`s: `background` (cached bitmap), `content`
  (all nodes), `ui` (selection, transformer, guides). Exports build their own
  stage from the same `Scene`, so the `ui` layer never exists there at all.
- Konva is driven **imperatively** rather than through react-konva: the editor
  preview and the export call the same `renderNode()` functions, which is what
  guarantees an export matches what the user was looking at.
- Templates measure text with the plain 2D context (`measureText`), not Konva,
  so `src/templates` stays independent of the renderer — and importable on the
  server, where Konva would drag in a native `canvas` dependency.
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
- MP4: `VideoEncoder` → `mp4-muxer` → Blob. **The presence of `VideoEncoder` is
  not sufficient** — several browsers (notably Chromium on Linux) expose the API
  with no H.264 encoder behind it — so `VideoEncoder.isConfigSupported()` is
  probed against `avc1.42E01F`, `avc1.4D0028` and `avc1.640028` before MP4 is
  offered at all. Encoder errors arrive asynchronously and are captured, because
  an unhandled one makes `flush()` wait forever.
- WebM fallback: `canvas.captureStream()` + `MediaRecorder`, recorded in real
  time over two loop passes, with a notice in the export dialog.

## 6. Storage

| What | Where | Key |
|---|---|---|
| Uploaded images (Blob) | IndexedDB `assets` | `asset:<hash>` |
| Autosaved documents | IndexedDB `documents` | `doc:<id>` |
| Presets | IndexedDB `presets` | `preset:<id>` |
| UI prefs (last format/theme, zoom) | localStorage | `cg:ui` |

Presets are documents minus `id/createdAt`, with `includeImages: boolean`.
Export/import as JSON (images embedded as base64 when included).

## 7. Two traps worth remembering

- **Never select derived state through the store.** `resolveNodes()` returns a
  new array each call, so `useEditor(s => s.nodes())` compares unequal on every
  read and re-renders forever. The node list comes from `useNodes()`, memoised
  on the document.
- **Chart axes must not go negative for non-negative data.** A price series from
  5 to 100 padded into a "nice" scale used to start at −50 and waste half the
  panel; `niceScale` now clamps to zero when the data never goes below it.

## 8. Performance budget

- Import: images downscaled to max 2400 px on the long edge (keeps 2x export sharp).
- Stage redraws only the layer that changed; background layer is a cached bitmap.
- Fonts preloaded once at editor mount (`document.fonts.load`) with a loading state.
- Export of 120 frames at 1080×1350 should finish in < 15 s on a laptop.

## 9. Browser support

Chrome / Edge / Safari 17+ / Firefox latest. MP4 export needs WebCodecs
(Chrome, Edge, Safari 16.4+, Firefox 130+); others get WebM. Phone: gallery
works, editor shows a "best on desktop/tablet" notice but stays usable.
