# CLAUDE.md — CardGraph

Guidance for Claude Code (and any human contributor) working in this repository.
Read this file first. It is the single source of truth for how CardGraph is built.

## 1. What CardGraph is

CardGraph is a browser-only design tool for the trading-card niche. Users pick a
template, upload a photo of their card (usually a graded slab), fill in text,
prices and chart data, tweak layout/colors/fonts if they want, and export the
result as PNG / JPG (still) or GIF / MP4 (subtly animated, perfectly looped).

Think "Canva, but only for TCG price/pop graphics, with templates that already
look finished out of the box".

- Product owner / "Director": the repo owner (decides scope, approves templates).
- Templates are authored **in code** by Claude Code on the Director's request,
  always modelled on the reference images in `assets/template_examples/`.
- No backend. Everything runs client-side and deploys to Vercel Hobby.

## 2. Working rules (non-negotiable)

1. **Do not start development until the Director explicitly says so.**
   Planning docs (this file, `ROADMAP.md`, `CHANGELOG.md`, `USER_QUESTIONS.md`,
   `docs/`) may be updated at any time.
2. **Commit and push directly to `main`.** No feature branches, no PRs, unless
   the Director asks for them.
3. **Keep it simple.** Do not re-invent the wheel. Prefer a well-known library
   over a custom engine. Prefer one clear way over a configurable way.
4. **Ship finished things.** Every phase in `ROADMAP.md` ends with a working,
   deployable state. Never leave the app broken on `main`.
5. **Update `CHANGELOG.md`** in the same commit as any user-visible change.
6. **Templates must look outstanding without edits.** A user who only uploads a
   card image and types the numbers must get a graphic as good as the reference.
   At the same time **everything must be changeable** — every colour, font, size
   and position. Defaults are opinions, not constraints.
7. **Never 1:1 copy the reference images.** Same look and feel, same structure,
   own execution (spacing, fonts, glow, chart rendering are ours).
8. **No backend, no secrets, no server-side rendering of user data.** Uploaded
   images never leave the browser.
9. Open questions go into `USER_QUESTIONS.md`; wait for answers when the answer
   changes the work materially, otherwise decide and note the assumption.

## 3. Tech stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | First-class on Vercel, landing page gets static rendering/SEO, editor is a pure client component. |
| Styling | **Tailwind CSS v4** + small set of hand-written UI primitives (Radix UI primitives where accessibility matters: dialog, popover, select, slider, tooltip) | Fast, consistent, premium look without a heavy component library. |
| Canvas / render engine | **Konva + react-konva** | Pixel-exact export (`stage.toCanvas`), drag/resize/rotate via `Transformer`, text, images, bezier lines for charts, works identically for still and animated frames. |
| State | **Zustand** (+ `zundo` for undo/redo) | Tiny, no boilerplate, easy undo history. |
| Persistence | **IndexedDB via `idb-keyval`** (presets, autosave, uploaded images) + `localStorage` for tiny UI prefs | Images are too large for localStorage. Browser-only storage is the only option without a backend. |
| Still export | Konva `toCanvas` → `canvas.toBlob` (PNG / JPEG) | Built-in, high quality, 1x / 2x scale. |
| GIF export | **`gifenc`** (encoding in a Web Worker) | Small, fast, good quantisation. |
| MP4 export | **WebCodecs `VideoEncoder` + `mp4-muxer`** (H.264); fallback **WebM via `MediaRecorder`** where WebCodecs is unavailable | Pure client-side, no ffmpeg.wasm (30 MB+) download. |
| Fonts | Self-hosted OFL fonts in `public/fonts` (see `docs/TEMPLATES.md`), loaded with `FontFace` and awaited before any render/export | Canvas needs fonts to be fully loaded; self-hosting avoids CORS/CSP issues. |
| Icons | `lucide-react` | Consistent, tree-shakable. |
| Package manager | **pnpm** | Fast, strict. |
| Lint / format | ESLint (next config) + Prettier | Standard. |
| Tests | **Vitest** for pure logic (chart scales, number formatting, layout math). Playwright only for one export smoke test if time allows. | Keep tests where bugs actually hide. |
| Hosting | **Vercel Hobby**, static + client-side only, no API routes, no edge functions, no image optimisation of user content | Free plan limits respected. |

Nothing else gets added without a reason written in a commit message.

## 4. Repository layout (target)

```
CardGraph/
├── CLAUDE.md                 ← you are here
├── ROADMAP.md                ← phases, status, definition of done
├── CHANGELOG.md              ← keep-a-changelog format
├── USER_QUESTIONS.md         ← open questions for the Director (+ answers)
├── docs/
│   ├── ARCHITECTURE.md       ← document model, engine, export pipeline
│   └── TEMPLATES.md          ← template spec + catalogue + how to add one
├── assets/template_examples/ ← Director's reference images (input only, never shipped)
├── public/
│   ├── fonts/                ← self-hosted .woff2
│   ├── previews/             ← rendered template thumbnails for gallery + landing
│   └── placeholders/         ← neutral placeholder slab images for demos
├── src/
│   ├── app/                  ← Next.js routes
│   │   ├── page.tsx          ← landing page  (/)
│   │   ├── app/page.tsx      ← template gallery (/app)
│   │   └── app/edit/[templateId]/page.tsx ← editor (/app/edit/:id)
│   ├── components/
│   │   ├── ui/               ← buttons, inputs, dialogs, sliders…
│   │   ├── landing/          ← hero, template showcase, feature grid, footer
│   │   └── editor/           ← canvas, panels, toolbar, export dialog
│   ├── engine/               ← Konva rendering of the document model (framework-agnostic)
│   │   ├── nodes/            ← one renderer per node type (text, image, chart, divider, badge, group)
│   │   ├── background.ts     ← blur + gradient overlay pipeline
│   │   ├── animation.ts      ← loop presets (hover, sway, float, tilt) → per-frame transforms
│   │   └── fonts.ts          ← font registry + loader
│   ├── export/               ← png/jpg, gif (worker), mp4/webm
│   ├── templates/            ← one folder per template (definition + defaults + preview)
│   ├── store/                ← zustand stores (document, ui, presets)
│   └── lib/                  ← formatting (currency, dates), math (nice ticks), ids, storage
└── tests/                    ← vitest
```

## 5. Core concepts (short version, details in `docs/ARCHITECTURE.md`)

- **Document**: `{ templateId, format, theme: 'dark' | 'light', data, nodes[], background }`.
  This is what gets saved, undone/redone, and exported.
- **Template**: pure function `build(ctx) → nodes[]` plus a `fields` schema
  (what the left "Content" panel shows) and `defaults`. Templates own layout;
  users own overrides.
- **Node**: positioned element on the canvas (`text`, `image`, `chart`, `stat`,
  `divider`, `badge`, `group`). Every node has `id, x, y, width, height,
  rotation, opacity, locked, visible` plus type-specific props.
- **Bindings**: a node prop can be bound to a `data` field (e.g. the "% change"
  stat is computed from the chart's first/last value). Users can break a binding
  by editing the value directly (a lock icon shows the state).
- **Format**: named aspect ratio + export size (`4:5 → 1080×1350`, `1:1 → 1080×1080`,
  `9:16 → 1080×1920`, `16:9 → 1920×1080`, `4:3 → 1440×1080`, `3:4 → 1080×1440`).
  Changing format re-runs the template layout with the user's content preserved.
- **Theme**: `dark` (black gradient over blurred card, light text) and `light`
  (white gradient, dark text). Every template must render well in both.
- **Palette**: every colour a template uses comes from a document-level palette
  (`accent`, `textPrimary`, `textSecondary`, `positive`, `negative`, `panel`,
  `overlay`, `divider`). The user can change any of them, per document, at any
  time; per-node colour overrides sit on top. Lime `#CCFF00` is only the default
  accent. **Templates never hard-code a colour** — they read `ctx.palette`.
- **Background pipeline**: main card image → cover-scaled → heavy Gaussian blur
  (pre-rendered once to an offscreen canvas) → gradient overlay per theme.
- **Animation**: pure function `(t: 0..1) → transform` per preset applied to the
  main card node(s); `t` wraps, so any duration loops perfectly.

## 6. Coding conventions

- TypeScript `strict`. No `any` unless interfacing with a library that forces it.
- Function components, hooks, no class components. Editor pages are `"use client"`.
- Keep the engine (`src/engine`, `src/templates`, `src/export`) free of React
  imports so it can run in a worker later if needed.
- Every number the user sees goes through `lib/format.ts` (currency, thousands
  separators, dates). Never hand-format in components.
- Filenames: `kebab-case.ts(x)`; components exported in `PascalCase`.
- Colors, radii, shadows, spacing come from CSS variables defined in
  `src/app/globals.css`; do not hard-code hex values in components (templates are
  the exception: they carry their own design tokens).
- Commit messages: imperative, scoped, e.g. `editor: add inline text editing`,
  `templates: add price-trend-up`, `docs: answer Q7`.

## 7. Commands (once scaffolded)

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test
pnpm build        # must pass before every push to main
```

## 8. Adding a template (summary; full guide in `docs/TEMPLATES.md`)

1. Director drops a reference image into `assets/template_examples/` and asks.
2. Create `src/templates/<template-id>/` with `index.ts` (definition),
   `fields.ts` (content schema), `layout.ts` (per-format layout), `preview.ts`.
3. Register it in `src/templates/registry.ts`.
4. Render the preview thumbnail into `public/previews/<template-id>.jpg`
   with the placeholder card image.
5. Check both themes and all formats, add the template to `CHANGELOG.md`.
