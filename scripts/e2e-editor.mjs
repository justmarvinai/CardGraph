/**
 * End-to-end editor smoke test: selection, dragging, undo, palette, theme,
 * format switching, live chart edits and presets, driven through the real UI.
 *
 * Usage: pnpm build && pnpm serve & node scripts/e2e-editor.mjs <outDir>
 */
import { chromium } from 'playwright';
const dir = process.argv[2];
const B = 'http://localhost:3210';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 250)));
page.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 200)); });
const step = async (name, fn) => { try { await fn(); console.log('✓', name); } catch (e) { console.log('✗', name, String(e).slice(0, 200)); } };

await page.goto(`${B}/app/edit/price-trend--up`, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForTimeout(2000);

const canvas = page.locator('canvas').first();
const box = await canvas.boundingBox();
const at = (fx, fy) => ({ x: box.x + box.width * fx, y: box.y + box.height * fy });

await step('upload card', async () => {
  await page.locator('aside input[type=file]').first().setInputFiles('public/placeholders/slab-a.png');
  await page.waitForTimeout(2200);
});

await step('select headline by clicking it', async () => {
  const p = at(0.42, 0.12);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(500);
  const label = await page.locator('aside').last().locator('p').first().textContent();
  if (!label?.toLowerCase().includes('headline')) throw new Error(`selected "${label}"`);
});

await step('drag the headline and undo it', async () => {
  const from = at(0.42, 0.12), to = at(0.46, 0.17);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const moved = await page.locator('aside').last().locator('input[type=number]').first().inputValue();
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  const back = await page.locator('aside').last().locator('input[type=number]').first().inputValue();
  if (moved === back) throw new Error(`undo did not restore x (${moved} → ${back})`);
});

await step('change the accent colour', async () => {
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.waitForTimeout(400);
  await page.locator('button[title="Cyan"]').click();
  await page.waitForTimeout(700);
});
await page.screenshot({ path: `${dir}/ix-accent.png` });

await step('switch to light theme', async () => {
  await page.getByRole('tab', { name: 'Light' }).click();
  await page.waitForTimeout(800);
});
await page.screenshot({ path: `${dir}/ix-light.png` });

await step('switch format to 9:16', async () => {
  await page.locator('button[title*="Story"]').click();
  await page.waitForTimeout(900);
});
await page.screenshot({ path: `${dir}/ix-916.png` });

await step('edit a chart value and see the percentage follow', async () => {
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.waitForTimeout(400);
  const values = page.locator('aside input[inputmode="decimal"]');
  await values.last().fill('1500');
  await page.waitForTimeout(900);
});
await page.screenshot({ path: `${dir}/ix-chart-edit.png` });

await step('save and list a preset', async () => {
  await page.getByRole('button', { name: 'Presets' }).click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('My style').fill('Test preset');
  await page.getByRole('button', { name: /Save current design/ }).click();
  await page.waitForTimeout(900);
  if (!(await page.getByText('Test preset').count())) throw new Error('preset not listed');
  await page.keyboard.press('Escape');
});

console.log('ERRORS:', errs.length ? errs : 'none');
await browser.close();
