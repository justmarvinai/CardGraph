/**
 * End-to-end export smoke test: drives the real editor, uploads a card and
 * exports every format, so the pipeline is checked the way a user meets it.
 *
 * Usage: pnpm build && pnpm start -p 3210 & node scripts/e2e-export.mjs <outDir>
 */
import { chromium } from 'playwright';
import { statSync } from 'node:fs';

const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 200)); });

await page.goto('http://localhost:3210/app/edit/price-trend--up', { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);

// Upload a card image through the Content panel.
await page.locator('aside input[type=file]').first().setInputFiles('public/placeholders/slab-a.png');
await page.waitForTimeout(2500);
console.log('uploaded card image');

async function exportAs(label) {
  if (!(await page.locator('[role=dialog]').count())) {
    await page.getByRole('button', { name: 'Export', exact: true }).first().click();
  }
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 180000 }),
    page.locator('button:has-text("Export")').last().click(),
  ]);
  const path = `${out}/${download.suggestedFilename()}`;
  await download.saveAs(path);
  console.log(`✓ ${label.padEnd(4)} → ${download.suggestedFilename()} ${(statSync(path).size / 1024).toFixed(0)} KB`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

await exportAs('PNG');
await exportAs('JPG');

// Turn on a loop, then export the animated formats.
await page.getByRole('tab', { name: 'Motion' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Hover/ }).click();
await page.waitForTimeout(600);
console.log('animation: hover');

await exportAs('GIF');
// This browser may have no H.264 encoder; the dialog then offers WebM instead.
const videoLabel = (await page.getByRole('button', { name: /^MP4/ }).count()) ? 'MP4' : 'WEBM';
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await exportAs(videoLabel);

await browser.close();
