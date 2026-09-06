# ROADMAP — CardGraph

Status legend: ⬜ not started · 🟨 in progress · ✅ done · ⏸ waiting on Director

The Director answered all questions and gave the go on 2026-09-06.
Phases are ordered so that `main` is deployable after each one.

---

## Phase 0 — Planning  ✅

- ✅ Read the brief and all six reference graphics.
- ✅ Decide tech stack (`CLAUDE.md` §3).
- ✅ Define document model, engine, export pipeline (`docs/ARCHITECTURE.md`).
- ✅ Define template spec and catalogue the six launch templates (`docs/TEMPLATES.md`).
- ✅ Write `USER_QUESTIONS.md`.
- ✅ Director answered all 18 questions and approved the start of development.

---

## Phase 1 — Scaffold & foundation  ✅

- Next.js 15 + TypeScript + Tailwind v4 + pnpm, ESLint/Prettier, Vitest.
- Design tokens (dark UI, lime accent as *default*), base UI primitives (button,
  input, select, slider, dialog, tooltip, tabs, colour picker).
- Self-hosted fonts + font loader.
- Routes: `/` (placeholder landing), `/app` (gallery shell), `/app/edit/[id]`.
- Vercel project connected to `main`, first deploy.

**Done when:** `pnpm build` passes, site is live on Vercel with the shell UI.

---

## Phase 2 — Editor engine  ✅

- Document model + Zustand store + undo/redo.
- Konva stage: zoom (fit / 50–400 %), pan, rulers-free clean canvas, safe-area.
- Node renderers: `text`, `image`, `divider`, `group`.
- Selection, multi-select, drag, resize, rotate, snap to canvas centre/edges,
  arrow-key nudge, duplicate, delete, lock, hide, z-order.
- Inline text editing (double-click → textarea overlay, same font metrics).
- Properties panel: position/size/rotation/opacity; text: font family, weight,
  size, letter spacing, line height, alignment, color, uppercase, shadow/glow.
- Image props: fit, corner radius, shadow, replace image.
- Keyboard shortcuts (⌘Z/⇧⌘Z, ⌘D, Delete, arrows, ⌘0 fit, Esc).

**Done when:** a blank document can be freely edited like a lightweight Figma.

---

## Phase 3 — Card image & background pipeline  ✅

- Upload (drag & drop, file picker, paste) → stored in IndexedDB.
- Auto-trim transparent padding for PNG slab cut-outs.
- Background: cover-scale + heavy blur (pre-rendered offscreen) + theme gradient
  overlay (dark / light), blur amount and overlay strength adjustable.
- Theme toggle (dark / light) re-styles every node via template tokens.
- Editable document palette (accent, text, positive, negative, panel, overlay,
  divider) with presets and a colour picker; per-node colour overrides.
- Additional small images (logos, icons) anywhere on the canvas.

**Done when:** uploading a card produces the reference-style backdrop in both themes.

---

## Phase 4 — Template system + first template  ✅

- Template definition API (`build`, `fields`, `defaults`, per-format layout).
- "Content" panel generated from `fields` (the simple, form-driven editing path).
- Bindings (auto-computed % change, dates, locks/overrides).
- `chart` node: editable data table (date, value), nice y-ticks, month/day
  x-labels, smooth curve, auto up/down colour, optional glow.
- `stat` node (label + value + source badge + date).
- `badge` node (marketplace/grader source: built-in set + custom text/upload).
- Template **`price-trend`** ("Positive graph movers" / "Negative card movers"),
  up and down variants, all formats, both themes.
- Template gallery page with real rendered previews.

**Done when:** the Mew ex / Pikachu ex references can be reproduced end-to-end
from a fresh upload without touching the canvas manually.

---

## Phase 5 — Remaining launch templates  ✅

- `grade-comparison` (CGC vs PSA, pop counts, latest sales, price difference).
- `sale-comparison` (same card, previous vs latest sale over time).
- `most-graded` (giant watermark number, single slab, total graded / pop / latest sale).
- `top-sales-duo` (two cards, rank labels, two sale prices).
- Preview thumbnails for all templates.

**Done when:** all six reference graphics have a shipping template.

---

## Phase 6 — Formats  ✅

- Format switcher (4:5, 1:1, 9:16, 16:9, 4:3, 3:4) with per-format layout
  in every template.
- Safe-area guides for Stories/Reels (9:16).

**Done when:** every template looks intentional in every format and both themes.

---

## Phase 7 — Export  ✅

- PNG / JPG at 1x and 2x, quality slider for JPG, transparent PNG off by design
  (background is always rendered).
- Animation presets for the main card(s): `hover` (vertical bob), `sway`
  (rotation), `float` (bob + sway + shadow), `tilt` (3-D-ish skew), `none`.
  Duration 2–6 s, fps 24/30, amplitude slider; live preview in the canvas.
- GIF export (worker, progress bar, size estimate).
- MP4 export via WebCodecs + mp4-muxer; WebM fallback via MediaRecorder;
  clear message when a browser supports neither.

**Done when:** a looping MP4/GIF exported from the editor plays seamlessly.

---

## Phase 8 — Presets & persistence  ✅

- Autosave current document to IndexedDB, restore on reload.
- "My presets": save current document as a named preset (layout + styles +
  content, images optional), apply to a new card, rename, delete.
- Export/import presets as `.cardgraph.json` for backup/transfer.
- "Recent projects" list on `/app`.

**Done when:** a user can reproduce their own style on a new card in under a minute.

---

## Phase 9 — Landing page  ✅

- Minimal, premium single page: hero with animated template showcase, template
  gallery, three-step "how it works", feature grid (formats, themes, animation,
  presets, privacy: "your images never leave your browser"), CTA, footer.
- OpenGraph image, favicon, metadata, Lighthouse ≥ 95.

**Done when:** the landing page ships and links straight into the editor.

---

## Phase 10 — Polish & QA  🟨

- ✅ Empty states and error states (unsupported file, oversized image, export
  failure, no video encoder).
- ✅ No imprint/privacy pages (Q15): a one-line privacy note in the footer only.
- ✅ Performance pass: images downscaled to 2400 px on import, blurred backdrop
  cached per settings, node list memoised on the document.
- ✅ Responsive editor: full three-panel layout on desktop, bottom sheet below
  `lg`, header fits a 390 px screen.
- ✅ Accessibility: focus-visible rings, labelled icon buttons, `role`/`aria`
  on the switches, tabs and sliders.
- ✅ Every template reviewed against its reference in both themes and all six
  formats, by rendering the full matrix.
- ⬜ Cross-browser check on real Safari and Firefox (only Chromium is available
  in this environment — see the note below).
- ⬜ `CHANGELOG.md` → `1.0.0` once the Director signs off.

**Verified so far** (Chromium, via `scripts/e2e-editor.mjs` and
`scripts/e2e-export.mjs`): upload, selection, dragging with snapping, undo,
palette changes, theme and format switching, live chart edits, presets, and
PNG / JPG / GIF / WebM export end to end. MP4 could not be exercised here
because the container's Chromium ships no H.264 encoder — which is exactly the
case the WebM fallback now covers.

**Done when:** the Director signs off on 1.0.

---

## Backlog (not planned for 1.0 — needs Director decision)

- Automatic background removal for raw card photos (client-side model, heavy download).
- Multi-card carousels / multi-page export.
- Custom font upload.
- Share links (would need a backend or very long URLs).
- More animation styles (holo shimmer, light sweep).
- Localised number/date formats beyond US/EU.
