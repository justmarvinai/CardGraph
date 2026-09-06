# CardGraph

Premium trading-card graphics in seconds — a browser-only design tool for the
TCG niche. Pick a template, drop in a photo of your card, type the numbers, and
export a finished PNG, JPG, GIF or MP4.

Everything runs client-side. There is no backend, no account, and your card
images never leave your browser.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Production build (must pass before every push to `main`) |
| `pnpm serve` | Serve the static export on :3210 (what the e2e scripts use) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (chart scales, formatting) |
| `pnpm placeholders` | Regenerate the neutral placeholder card art |
| `pnpm previews` | Regenerate `public/previews/*.jpg` (needs `pnpm serve` running) |

## Deploying

The app builds to a **static export** (`output: 'export'` → `out/`): plain HTML,
JS and assets, with no serverless functions and nothing running on a server.
Import the repository in Vercel and accept the defaults — `vercel.json` sets the
framework and the cache headers for fonts and previews; everything else is
detected. The same output will drop onto any static host.

## Where things live

- `src/engine` — Konva rendering, background pipeline, animation, fonts. No
  React imports, so the editor preview and the export share one code path.
- `src/templates` — one folder per template: layout, fields, defaults, bindings.
- `src/export` — PNG/JPG, GIF (Web Worker), MP4 (WebCodecs) and WebM fallback.
- `src/components/editor` — canvas and panels. `src/components/landing` — the marketing page.
- `src/store` — Zustand document store with undo/redo.

## Documentation

- `CLAUDE.md` — how CardGraph is built, and the rules for working in this repo.
- `ROADMAP.md` — phases and status.
- `docs/ARCHITECTURE.md` — document model, engine, export pipeline.
- `docs/TEMPLATES.md` — design language, template API, and how to add a template.
- `USER_QUESTIONS.md` — the Director's product decisions.
