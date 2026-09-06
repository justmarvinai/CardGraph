# Templates

## 1. Design language (shared by every template)

Derived from `assets/template_examples/`. **These are defaults, not constants.**
Every colour below is a slot in the document palette that the user can change
(`accent`, `textPrimary`, `textSecondary`, `positive`, `negative`, `panel`,
`overlay`, `divider`); templates read `ctx.palette.*` and must never write a
literal colour. "Lime" throughout this document means "the accent colour, which
defaults to lime".

| Token | Dark theme | Light theme |
|---|---|---|
| Backdrop | uploaded card, blurred, black gradient overlay (near-opaque top/bottom, ~55 % middle) | same blur, white gradient overlay |
| Accent | lime `#CCFF00` (headlines, prices, set numbers) | lime-dark `#7FA800` for text on white, `#CCFF00` kept for badges |
| Text primary | `#FFFFFF` | `#0A0A0A` |
| Text secondary | `#D8D8D8` | `#3A3A3A` |
| Positive | `#2EE59D` (chart) / `#22C55E` (percent) | same |
| Negative | `#FF3B30` | same |
| Divider | `#FFFFFF` @ 25 % | `#000000` @ 20 % |
| Chart panel | `#0B0B0B` @ 85 %, radius 28 | `#FFFFFF` @ 85 % |
| Headline font | **Bebas Neue**-style ultra-condensed bold, uppercase, tight tracking (`-0.01em`), lime, soft lime glow | same, no glow |
| Subline font | **Montserrat** Regular/Medium, white; set number in lime bold | same, dark |
| Stat label | Montserrat Medium, letter-spacing `+0.04em`, uppercase | same |
| Stat value | Montserrat Bold, 84–96 px @ 1080 wide | same |
| Chart axis labels | Bebas Neue, `#EDEDED` | Bebas Neue, `#222` |
| Slab image | contain-fit, drop shadow `0 24px 60px rgba(0,0,0,.55)` | shadow `rgba(0,0,0,.25)` |
| Safe margin | 5 % of width | same |

Accent presets offered in the UI (plus a free colour picker): Lime `#CCFF00`,
Cyan `#22D3EE`, Violet `#A78BFA`, Gold `#FFC94A`, Magenta `#FF4D9D`,
White `#FFFFFF`. Changing the accent restyles headline, set number, prices and
badges at once; anything the user overrode per node stays untouched.

Fonts to self-host (all OFL): Bebas Neue, Anton (alt headline), Oswald,
Montserrat, Inter, Poppins, Space Grotesk, Roboto Mono. Users can switch any
text node between them; templates default to Bebas Neue + Montserrat.

Marketplace / grader **badges** ("source" under a price): built-in set
(pending Director decision, see `USER_QUESTIONS.md` Q3): eBay, Fanatics
Collect, ALT, TCGplayer, PWCC, Goldin, Heritage, PSA, CGC, BGS, TAG, ACE,
plus `text` (any name) and `image` (upload). Rendered as a small mark + " · "
+ date.

## 2. Template definition API

```ts
interface Template {
  id: string;                       // 'price-trend'
  name: string;                     // 'Price Trend'
  description: string;
  reference: string;                // 'positive_graph_movers.jpg'
  variants?: { id: string; name: string; data: Partial<Data> }[]; // e.g. up / down
  formats: Format[];                // all supported; default first
  fields: Field[];                  // drives the Content panel
  defaults: Data;                   // sample content used for previews
  bindings?: Binding[];             // computed values (percent change …)
  build(ctx: BuildContext): Node[]; // layout for ctx.format + ctx.theme + ctx.data
}

interface BuildContext { width; height; format; theme; data; tokens; assets }
```

`fields` types: `text`, `textarea`, `number`, `currency`, `date`, `select`,
`image`, `chartRows`, `badge`, `toggle`. Each field has `id`, `label`, `group`
(e.g. "Header", "Card", "Chart", "Stats"), `bindTo?` (node id + prop).

`build()` must be **pure** and lay out with percentages/derived values so it
adapts to every format. Helper functions in `src/templates/_shared/`:
`headerBlock()`, `slab()`, `statRow()`, `divider()`, `chartPanel()`.

## 3. Launch catalogue (from the six references)

### T1 · `price-trend` — reference: `positive_graph_movers.jpg` / `negative_card_movers.jpg`
Layout (4:5): huge headline top-left, subline `GRADE · SET #NUMBER`, left column =
slab image, right column = rounded chart panel with y-axis ticks and month/day
x-labels, bottom = divider, 3 stats (`start date → price · source`,
`N-DAY CHANGE ▲ x.xx %`, `end date → price · source`), divider.
Editable chart: rows `(date, value)`; y-ticks and x-labels auto; curve colour
auto by direction (green up / red down) with manual override; stat 2 auto-bound
to first/last row (percent + arrow), stat 1/3 dates and prices auto-bound to
first/last row too, all overridable. Variants: `up` (Mew ex style), `down`
(Pikachu ex style: labels "Launch price / Price change / Current price").
Other formats: 9:16 stacks chart under the slab; 16:9 widens the chart; 1:1
shrinks the header and stacks stats in one row.

### T2 · `grade-comparison` — reference: `grading_company_price_comparisons.jpg`
Headline centred, vertical lime divider between two slab images, small caption
above each slab (`CGC 10 PRISTINE POP: 46` / `PSA 10 GEM MT POP: 2,069`), bottom
3 stats (`latest sale · source · date`, `price difference +111 %`, `latest sale`).
Percent difference auto-bound to the two prices.

### T3 · `sale-comparison` — reference: `same_card_price_comparison_time.jpg`
Like T2 but with a subline under the headline (`PSA 10 · 1st Edition Neo Genesis #9`),
no captions above the slabs, stats `previous sale / price change / latest sale`.
Percent change auto-bound.

### T4 · `most-graded` — reference: `most_graded_cards.jpg` (4:5, 1080×1350)
Giant translucent watermark number (`10`) top-left behind everything, headline
right-aligned with subline (`2025 · Scarlet & Violet Promo #173`), single centred
slab, bottom 3 stats (`total graded`, `PSA 10 pop`, `latest sale · source · date`,
only the sale value in lime).

### T5 · `top-sales-duo` — reference: `top_card_sales_of_month_day_week_year.jpg`
Two columns separated by a vertical lime divider; each column has headline,
two-line subline (`PSA 10 · Japanese EX Dragon Frontiers Gold Star #52`), slab,
rank label (`TOP 30`), price, `source · date`. A header field selects
`Day / Week / Month / Year` for optional small caption.

### T6 · `price-trend` variant `down` is listed in the gallery as its own card
("Price Drop") so users find it, but shares T1's code.

Every template ships in dark and light and in all six formats.

## 4. How to add a template (for Claude Code)

1. Look at the new reference in `assets/template_examples/` and describe its
   structure in this file (section 3) before coding.
2. Scaffold `src/templates/<id>/` from `src/templates/_example/`.
3. Write `fields.ts` first (what the user edits), then `layout.ts` per format,
   then `index.ts` wiring + bindings + defaults.
4. `pnpm preview <id>` renders `public/previews/<id>.jpg` with the placeholder
   slab in dark theme (script in `scripts/render-previews.ts`, Playwright).
5. Check: both themes, all six formats, long titles (`CHARIZARD VMAX RAINBOW`),
   small numbers (`$12`), large numbers (`$1,250,000`), negative change.
6. Register in `registry.ts`, add to `CHANGELOG.md`, push to `main`.
