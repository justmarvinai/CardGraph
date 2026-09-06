/**
 * Renders every gallery entry into `public/previews/<key>.jpg` using the real
 * engine and the neutral placeholder slabs — never a copyrighted card image.
 *
 * Usage: pnpm build && pnpm serve & node scripts/render-previews.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:3210';
const KEYS = process.argv.slice(2);

const keys = KEYS.length
  ? KEYS
  : [
      'price-trend--up',
      'price-trend--down',
      'grade-comparison',
      'sale-comparison',
      'most-graded',
      'top-sales-duo',
    ];

mkdirSync('public/previews', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

for (const key of keys) {
  const theme = process.env.PREVIEW_THEME ?? 'dark';
  await page.goto(`${BASE}/preview?key=${key}&theme=${theme}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelector('#preview-stage[data-ready="true"] canvas') !== null,
    undefined,
    { timeout: 20_000 },
  );
  await page.waitForTimeout(400);
  const buffer = await page.locator('#preview-stage canvas').screenshot({ type: 'jpeg', quality: 88 });
  writeFileSync(`public/previews/${key}.jpg`, buffer);
  console.log(`✓ ${key}.jpg  ${(buffer.length / 1024).toFixed(0)} KB`);
}

await browser.close();
