# USER_QUESTIONS — answers needed before development starts

All questions in sections A-C were answered by the Director on 2026-09-06 and
development has started. The answers are binding decisions; anything that
contradicts them needs a new decision here first.

---

## A. Scope & product

### Q1 · Templates: one "Price Trend" template or two?
`positive_graph_movers.jpg` and `negative_card_movers.jpg` share the same
structure. I plan one template engine with two gallery entries ("Price Trend"
and "Price Drop"). The curve and percentage colour switch automatically
(green up / red down) based on the data, and the stat labels differ per entry.
**Default:** one engine, two gallery entries.
**Answer:** One template engine, two gallery entries. **Decided.**

### Q2 · Formats and export sizes
Your references are 1170×1463 (≈4:5) and 1080×1350 (4:5). Planned:
`4:5 1080×1350` (default), `1:1 1080×1080`, `9:16 1080×1920`, `16:9 1920×1080`,
`4:3 1440×1080`, `3:4 1080×1440`, each exportable at 1x or 2x.
**Default:** exactly this list, 4:5 as default.
**Answer:** 4:5 1080x1350 (default), 1:1 1080x1080, 9:16 1080x1920, 16:9 1920x1080, 4:3 1440x1080, 3:4 1080x1440; 1x/2x export. **Decided.**

### Q3 · Marketplace / grader logos (eBay, Fanatics, ALT, PSA, CGC …)
The references show real logos. Options:
(a) built-in set of recreated vector marks (eBay, Fanatics Collect, ALT,
TCGplayer, PWCC, Goldin, PSA, CGC, BGS, TAG) plus a "custom text" and
"upload own logo" option; (b) text-only sources plus upload; (c) nothing built-in.
Note: these are third-party trademarks. Using them in your own graphics is your
call; the tool only offers them as a convenience.
**Default:** (a).
**Answer:** (a) Built-in recreated marks + custom text + own logo upload. **Decided.**

### Q4 · Card images: cut-outs or raw photos?
I assume users upload already-cut-out slab/card images (PNG with transparency,
like in the references) or clean product shots. Automatic background removal
of raw photos is possible client-side but adds a ~40 MB model download and
noticeable delay. I propose to skip it for 1.0 and keep it in the backlog.
**Default:** no background removal in 1.0.
**Answer:** No background removal in 1.0; stays in the backlog. **Decided.**

### Q5 · Light mode direction
All references are dark. For light mode I plan: white gradient over the same
blurred card, near-black text, lime accent darkened to stay readable on white,
badges unchanged. Any preference (e.g. keep bright lime, use a different accent
colour, warmer/cooler whites)?
**Default:** as described.
**Answer:** Light mode as proposed, **but no colour may be hard-coded**. The accent is a
document-level token the user can change at any time (accent, text, positive,
negative, panel, overlay), with per-node overrides on top. Lime is only the
default. A small set of accent presets ships alongside a full colour picker.
**Decided.**

### Q6 · Animation presets
Planned loops for the main card image(s): `hover` (soft vertical bob), `sway`
(gentle rotation), `float` (bob + sway + moving shadow), `tilt` (subtle 3-D
skew). Duration 2–6 s, 24 or 30 fps, amplitude slider. Anything to add or drop
(e.g. holo light-sweep across the card, animated chart draw-in)?
**Default:** these four; chart draw-in and light-sweep go to backlog.
**Answer:** hover, sway, float, tilt; 2-6 s; 24/30 fps; amplitude slider. **Decided.**

### Q7 · Video format details
MP4 export works in Chrome, Edge, Safari 16.4+ and Firefox 130+ (WebCodecs).
Other browsers get WebM instead of MP4 with a clear notice. OK?
Also: GIF quality vs size — cap GIF at 1080 px long edge and 20 fps to keep
files reasonable?
**Default:** yes to both.
**Answer:** MP4 via WebCodecs with WebM fallback and a clear notice; GIF capped at
1080 px long edge and 20 fps. **Decided.**

### Q8 · Presets: what do they store?
A preset = a saved document (template + layout overrides + fonts/colours +
text/prices + chart data) with an option "include images". Stored in the
browser (IndexedDB) because there is no backend, plus export/import as a JSON
file so you can move presets between devices. Fine?
**Default:** yes.
**Answer:** Preset = saved document with optional images, stored in IndexedDB, plus
JSON export/import. **Decided.**

### Q9 · Number & date formatting
References use `$2,760` for prices but `3.600` / `2.500` on chart axes
(dot as thousands separator). Planned: a per-document setting for currency
symbol (`$ € £`, none) and thousands separator (`,` or `.`), applied to prices
and axis ticks consistently, with per-node override. Dates as `AUGUST 28, 2026`
(long) or `AUG 28` (short), selectable.
**Default:** as described, `$` and `,` by default.
**Answer:** Per-document currency symbol and thousands separator with per-node override;
long and short date styles. Defaults `$` and `,`. **Decided.**

### Q10 · Auto-computed values
Percent change (and its arrow colour) is auto-calculated from the first/last
chart row or from the two compared prices, with a lock icon to override. Dates
and start/end prices in the stat row of the Price Trend template are also
auto-filled from the chart rows. Fine?
**Default:** yes.
**Answer:** Auto-computed percent change, arrow colour, dates and start/end prices, each
with a lock icon to override. **Decided.**

### Q11 · Changing the format after editing
When the user switches e.g. from 4:5 to 9:16, the template re-lays-out the
content (text, images, chart data are kept; manual position/size tweaks are
scaled proportionally and can be reset). A true per-format manual layout is
more complex and I'd rather not build it.
**Default:** re-layout with proportional scaling of overrides.
**Answer:** Re-layout on format change with proportional scaling of overrides and a
"reset layout" action. **Decided.**

## B. Brand, landing page, legal

### Q12 · Branding
Product name "CardGraph". Do you have a logo, a tagline, a domain, or brand
colours? Otherwise I create a simple wordmark + icon in the lime/black style of
the templates and use "Premium trading-card graphics in seconds" as tagline.
**Default:** I create it.
**Answer:** I create the wordmark, icon and tagline in the template style. **Decided.**

### Q13 · Landing page content
Minimal: hero with a live animated example, template gallery, 3-step
"how it works", feature grid, CTA, footer. Do you want anything else
(pricing section, newsletter, social links, "made by" credit, Twitter/X or
Instagram handle)?
**Default:** none of the extras.
**Answer:** Hero, template gallery, 3-step how-it-works, feature grid, CTA, footer.
No pricing, newsletter or social links. **Decided.**

### Q14 · Demo content and images
For template previews and the landing page I will create neutral placeholder
slab graphics (no real Pokémon artwork) to avoid using copyrighted card art
publicly. Your reference images stay in the repo only as design input. OK, or
do you want to provide your own demo images that you have the rights to?
**Default:** neutral placeholders.
**Answer:** Neutral placeholder slab graphics for previews and landing page; reference
images stay as design input only. **Decided.**

### Q15 · Legal pages
Do you need an Imprint (Impressum) and Privacy page (e.g. if you are based in
the EU/Germany)? The tool stores nothing on a server, so the privacy page would
be very short. If yes, please provide the imprint details later.
**Default:** add both pages with placeholder text you fill in.
**Answer:** Not needed. The page is private to the Director, so no imprint and no privacy
page. A one-line privacy note in the footer ("your images never leave your
browser") is enough. **Decided.**

### Q16 · Language
English-only UI and landing page?
**Default:** English only.
**Answer:** English only. **Decided.**

## C. Infrastructure

### Q17 · Vercel & repo
Is the GitHub repo already connected to a Vercel project? If not, I will add
the config so you only need to click "Import" once in Vercel. Package manager
will be pnpm; no CI beyond Vercel's build.
**Default:** as described.
**Answer:** Repo is **not** connected to Vercel yet. I add the config so the Director only
has to click "Import" once. pnpm, no CI beyond Vercel s build. **Decided.**

### Q18 · Analytics
Add Vercel Analytics (free tier, cookie-less)? Or nothing?
**Default:** nothing.
**Answer:** No analytics. **Decided.**

---

## Go / no-go

**Answered on 2026-09-06. The Director gave the explicit go: development started
with Phase 1 of `ROADMAP.md`.**

New questions that come up during development are appended below.

## D. Questions raised during development

_(none yet)_
