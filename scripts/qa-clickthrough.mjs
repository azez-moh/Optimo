// QA click-through (headless): node scripts/qa-clickthrough.mjs [--base=http://localhost:5299/]
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:5299/').slice(7);
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = `${b}/${d}/chrome-linux/chrome`; if (existsSync(p)) return p; } })();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route(/arcgisonline|cartocdn|openstreetmap|tile\./, (r) => r.abort());
await ctx.addInitScript(() => { localStorage.setItem('opt.lang', 'en'); localStorage.setItem('opt.theme', 'dark'); });
const page = await ctx.newPage();
const errors = []; const results = [];
page.on('pageerror', (e) => errors.push(e.message));
const step = async (name, fn) => { try { await fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${e.message.split('\n')[0]}`); } };
const hash = () => page.evaluate(() => location.hash);

await step('sign in as COO lands on map', async () => {
  await page.goto(`${base}#/signin`); await page.getByRole('radio', { name: /COO/ }).click();
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(800);
  if (!(await hash()).includes('/map')) throw new Error(`at ${await hash()}`);
});
await step('map: All branches row opens overview', async () => {
  await page.locator('.mapall').click(); await page.waitForTimeout(800);
  if (!(await hash()).includes('/overview')) throw new Error(`at ${await hash()}`);
  await page.locator('.ov-asat', { hasText: '6 gyms' }).waitFor({ timeout: 4000 });
});
await step('map: Riyadh -> district -> fact card -> Open gym', async () => {
  await page.goto(`${base}#/map`); await page.waitForTimeout(800);
  await page.locator('.maplist__row', { hasText: 'Riyadh' }).first().click(); await page.waitForTimeout(500);
  await page.locator('.maplist__row').first().click(); await page.waitForTimeout(500);
  await page.locator('.maplist__info').first().click(); await page.waitForTimeout(500);
  const card = page.locator('.mapcard'); await card.waitFor();
  const txt = await card.innerText();
  if (/\bclubs?\b|women|demo/i.test(txt)) throw new Error(`card copy: ${txt.slice(0, 200)}`);
  await card.locator('.mapcard__cta').click(); await page.waitForTimeout(800);
  if ((await hash()).includes('/map')) throw new Error(`still on map ${await hash()}`);
  results.push(`  -> landed on ${await hash()}`);
});
await step('machines: expand row -> Show on floor', async () => {
  await page.goto(`${base}#/machines`); await page.waitForTimeout(1200);
  await page.locator('tr[id^=mr-row-]').first().click(); await page.waitForTimeout(400);
  await page.locator('.mr-panel__floor').first().click(); await page.waitForTimeout(1500);
  if (!(await hash()).includes('/live-floor?machine=')) throw new Error(`at ${await hash()}`);
});
await step('destructive: Camera List Remove asks for confirmation', async () => {
  await page.goto(`${base}#/camera-list`); await page.waitForTimeout(1000);
  const before = await page.locator('tbody tr').count();
  await page.getByRole('button', { name: /Remove/ }).first().click(); await page.waitForTimeout(300);
  const dlg = page.getByRole('dialog'); await dlg.waitFor({ timeout: 2000 });
  await dlg.getByRole('button', { name: 'Cancel' }).click(); await page.waitForTimeout(300);
  if ((await page.locator('tbody tr').count()) !== before) throw new Error('row removed without confirm');
});
await step('destructive: Usage Report reset asks for confirmation', async () => {
  await page.goto(`${base}#/usage-report`); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Reset usage history/ }).click();
  await page.getByRole('dialog').waitFor({ timeout: 2000 });
});
console.log(results.join('\n')); console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
