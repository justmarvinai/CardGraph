/**
 * Generates the neutral placeholder slabs used by previews and demos.
 * Deliberately our own artwork — no real card images ship with CardGraph.
 *
 * Usage: node scripts/render-placeholders.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

/** Neutral graded-slab placeholders — our own artwork, no real card images. */
const slab = (accent, label, art) => `
<html><body style="margin:0;background:transparent">
<svg width="700" height="1000" viewBox="0 0 700 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="case" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2f4f7" stop-opacity=".92"/>
      <stop offset=".45" stop-color="#c9ced6" stop-opacity=".78"/>
      <stop offset="1" stop-color="#eef1f5" stop-opacity=".9"/>
    </linearGradient>
    <linearGradient id="art" x1="0" y1="0" x2="1" y2="1">${art}</linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".18"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="684" height="984" rx="34" fill="url(#case)" stroke="#ffffff" stroke-opacity=".55" stroke-width="3"/>
  <rect x="8" y="8" width="684" height="984" rx="34" fill="url(#sheen)"/>
  <rect x="46" y="46" width="608" height="150" rx="10" fill="#ffffff"/>
  <rect x="46" y="46" width="608" height="150" rx="10" fill="none" stroke="${accent}" stroke-width="7"/>
  <text x="72" y="90" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111">2026 SAMPLE SET EN</text>
  <text x="72" y="127" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111">${label}</text>
  <text x="72" y="164" font-family="Arial,Helvetica,sans-serif" font-size="24" fill="#333">ILLUSTRATION RARE</text>
  <text x="596" y="90" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111" text-anchor="end">#001</text>
  <text x="596" y="127" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111" text-anchor="end">GEM MT</text>
  <text x="596" y="168" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="800" fill="#111" text-anchor="end">10</text>
  <rect x="46" y="228" width="608" height="720" rx="14" fill="#20242b"/>
  <rect x="62" y="244" width="576" height="688" rx="10" fill="url(#art)"/>
  <circle cx="350" cy="520" r="150" fill="#ffffff" fill-opacity=".18"/>
  <circle cx="350" cy="520" r="96" fill="#ffffff" fill-opacity=".22"/>
  <path d="M250 700 Q350 610 450 700 T650 700" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="14" stroke-linecap="round"/>
  <rect x="86" y="800" width="504" height="16" rx="8" fill="#ffffff" fill-opacity=".28"/>
  <rect x="86" y="836" width="380" height="16" rx="8" fill="#ffffff" fill-opacity=".2"/>
  <rect x="86" y="872" width="300" height="16" rx="8" fill="#ffffff" fill-opacity=".14"/>
</svg></body></html>`;

const variants = [
  ['slab-a.png', '#e11d2a', 'SAMPLE CARD', '<stop offset="0" stop-color="#3aa0ff"/><stop offset=".55" stop-color="#59d0c0"/><stop offset="1" stop-color="#8be27a"/>'],
  ['slab-b.png', '#111827', 'SECOND CARD', '<stop offset="0" stop-color="#ff7ab8"/><stop offset=".5" stop-color="#b07cff"/><stop offset="1" stop-color="#ffcb6b"/>'],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 700, height: 1000 }, deviceScaleFactor: 1 });
for (const [file, accent, label, art] of variants) {
  await page.setContent(slab(accent, label, art));
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(`public/placeholders/${file}`, buf);
  console.log('wrote', file, buf.length, 'bytes');
}
await browser.close();
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

/** Neutral graded-slab placeholders — our own artwork, no real card images. */
const slab = (accent, label, art) => `
<html><body style="margin:0;background:transparent">
<svg width="700" height="1000" viewBox="0 0 700 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="case" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2f4f7" stop-opacity=".92"/>
      <stop offset=".45" stop-color="#c9ced6" stop-opacity=".78"/>
      <stop offset="1" stop-color="#eef1f5" stop-opacity=".9"/>
    </linearGradient>
    <linearGradient id="art" x1="0" y1="0" x2="1" y2="1">${art}</linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".18"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="684" height="984" rx="34" fill="url(#case)" stroke="#ffffff" stroke-opacity=".55" stroke-width="3"/>
  <rect x="8" y="8" width="684" height="984" rx="34" fill="url(#sheen)"/>
  <rect x="46" y="46" width="608" height="150" rx="10" fill="#ffffff"/>
  <rect x="46" y="46" width="608" height="150" rx="10" fill="none" stroke="${accent}" stroke-width="7"/>
  <text x="72" y="90" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111">2026 SAMPLE SET EN</text>
  <text x="72" y="127" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111">${label}</text>
  <text x="72" y="164" font-family="Arial,Helvetica,sans-serif" font-size="24" fill="#333">ILLUSTRATION RARE</text>
  <text x="596" y="90" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111" text-anchor="end">#001</text>
  <text x="596" y="127" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#111" text-anchor="end">GEM MT</text>
  <text x="596" y="168" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="800" fill="#111" text-anchor="end">10</text>
  <rect x="46" y="228" width="608" height="720" rx="14" fill="#20242b"/>
  <rect x="62" y="244" width="576" height="688" rx="10" fill="url(#art)"/>
  <circle cx="350" cy="520" r="150" fill="#ffffff" fill-opacity=".18"/>
  <circle cx="350" cy="520" r="96" fill="#ffffff" fill-opacity=".22"/>
  <path d="M250 700 Q350 610 450 700 T650 700" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="14" stroke-linecap="round"/>
  <rect x="86" y="800" width="504" height="16" rx="8" fill="#ffffff" fill-opacity=".28"/>
  <rect x="86" y="836" width="380" height="16" rx="8" fill="#ffffff" fill-opacity=".2"/>
  <rect x="86" y="872" width="300" height="16" rx="8" fill="#ffffff" fill-opacity=".14"/>
</svg></body></html>`;

const variants = [
  ['slab-a.png', '#e11d2a', 'SAMPLE CARD', '<stop offset="0" stop-color="#3aa0ff"/><stop offset=".55" stop-color="#59d0c0"/><stop offset="1" stop-color="#8be27a"/>'],
  ['slab-b.png', '#111827', 'SECOND CARD', '<stop offset="0" stop-color="#ff7ab8"/><stop offset=".5" stop-color="#b07cff"/><stop offset="1" stop-color="#ffcb6b"/>'],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 700, height: 1000 }, deviceScaleFactor: 1 });
for (const [file, accent, label, art] of variants) {
  await page.setContent(slab(accent, label, art));
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(`public/placeholders/${file}`, buf);
  console.log('wrote', file, buf.length, 'bytes');
}
await browser.close();
