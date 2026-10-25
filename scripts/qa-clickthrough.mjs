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

const topItems = async () => (await page.locator('.topnav > .topnav__list > .topnav__item > .topnav__link .topnav__group, .topnav > .topnav__list > .topnav__item > a.topnav__link').allTextContents()).map((x) => x.trim());

await step('sign in as COO lands on Branches, map view', async () => {
  await page.goto(`${base}#/signin`); await page.getByRole('radio', { name: /COO/ }).click();
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/branches?view=map')) throw new Error(`at ${await hash()}`);
  await page.locator('.mapall').waitFor({ timeout: 4000 });
});
await step('network menu: Overview, Ask OPTIMO, Branches only; no sidebar, no back control', async () => {
  const items = await topItems();
  if (items.join('|') !== 'Overview|Ask OPTIMO|Branches') throw new Error(`menu ${items}`);
  if (await page.locator('.topnav__back, .topnav__trigger, .sidenav, .shell__side').count()) throw new Error('gym controls or sidebar at network level');
  if (await page.locator('.topnav__link', { hasText: 'Settings' }).count()) throw new Error('Settings in menu');
});
await step('map: All branches row opens network overview', async () => {
  await page.locator('.mapall').click(); await page.waitForTimeout(800);
  if (!(await hash()).includes('/overview')) throw new Error(`at ${await hash()}`);
  await page.locator('.ov-asat', { hasText: '2 gyms' }).waitFor({ timeout: 4000 });
  if (await page.locator('.topnav__back').count()) throw new Error('back control at network level');
});
await step('/map redirects to Branches map; Riyadh -> district -> fact card -> Open gym', async () => {
  await page.goto(`${base}#/map`); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/branches?view=map')) throw new Error(`redirect ${await hash()}`);
  await page.locator('.maplist__row', { hasText: 'Riyadh' }).first().click(); await page.waitForTimeout(500);
  await page.locator('.maplist__row').first().click(); await page.waitForTimeout(500);
  await page.locator('.maplist__info').first().click(); await page.waitForTimeout(500);
  const card = page.locator('.mapcard'); await card.waitFor();
  const txt = await card.innerText();
  if (/\bclubs?\b|women|demo/i.test(txt)) throw new Error(`card copy: ${txt.slice(0, 200)}`);
  await card.locator('.mapcard__cta').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`not on overview ${await hash()}`);
  results.push(`  -> landed on ${await hash()}`);
});
await step('gym menu: back, gym name, Overview, Ask OPTIMO, BMS Core, AI Vision', async () => {
  const items = await topItems();
  if (items.join('|') !== 'Overview|Ask OPTIMO|BMS Core|AI Vision') throw new Error(`menu ${items}`);
  if (!(await page.locator('.topnav__back').isVisible())) throw new Error('no back control');
  const gym = (await page.locator('.topnav__gymname').innerText()).trim();
  if (!/^OPTIMO /.test(gym)) throw new Error(`gym ${gym}`);
});
await step('BMS Core dropdown: 7 pages, keyboard (ArrowDown, Escape)', async () => {
  const trig = page.locator('.topnav__trigger', { hasText: 'BMS Core' });
  await trig.focus(); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200);
  const menu = page.locator('.topnav__dd', { has: trig }).locator('.topnav__menu');
  if (!(await menu.isVisible())) throw new Error('menu not open');
  const names = (await menu.locator('a').allTextContents()).map((x) => x.trim());
  if (names.join('|') !== 'BMS Overview|HVAC|Lights|AI Agents|Control|BMS Settings|Integration') throw new Error(`items ${names}`);
  const f1 = await page.evaluate(() => document.activeElement?.textContent?.trim());
  await page.keyboard.press('ArrowDown');
  const f2 = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (f1 !== 'BMS Overview' || f2 !== 'HVAC') throw new Error(`focus ${f1} -> ${f2}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  if (await menu.isVisible()) throw new Error('menu still open');
  if (!(await trig.evaluate((el) => el === document.activeElement))) throw new Error('focus not back on trigger');
});
await step('AI Vision dropdown: Heatmap right after Live Floor; trigger shows the active page', async () => {
  await page.locator('.topnav__trigger', { hasText: 'AI Vision' }).click(); await page.waitForTimeout(200);
  const names = (await page.locator('.topnav__dd.is-open .topnav__menu a').allTextContents()).map((x) => x.trim());
  if (names[1] !== 'Live Floor' || names[2] !== 'Heatmap' || names.length !== 12) throw new Error(`items ${names}`);
  await page.locator('.topnav__dd.is-open .topnav__menu a', { hasText: 'Heatmap' }).click(); await page.waitForTimeout(1200);
  if (!(await hash()).startsWith('#/heatmap')) throw new Error(`at ${await hash()}`);
  const trig = (await page.locator('.topnav__trigger.active').innerText()).replace(/\s+/g, ' ').trim();
  if (!/AI Vision.*Heatmap/.test(trig)) throw new Error(`trigger ${trig}`);
});
await step('All branches back control returns to network overview', async () => {
  await page.locator('.topnav__back').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  if ((await topItems()).join('|') !== 'Overview|Ask OPTIMO|Branches') throw new Error('menu not at network level');
});
await step('gym page at network scope switches to OPTIMO Al Malqa (Men)', async () => {
  await page.goto(`${base}#/hvac`); await page.waitForTimeout(1200);
  if (!(await hash()).startsWith('#/hvac')) throw new Error(`at ${await hash()}`);
  const gym = (await page.locator('.topnav__gymname').innerText()).trim();
  if (gym !== 'OPTIMO Al Malqa (Men)') throw new Error(`gym ${gym}`);
});
await step('Branches list: Open gym sets the gym and opens its overview', async () => {
  await page.locator('.topnav__back').click(); await page.waitForTimeout(600);
  await page.goto(`${base}#/branches?view=list`); await page.waitForTimeout(800);
  await page.locator('.br-card', { hasText: 'An Nakheel' }).locator('.br-card__btn--go').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  const gym = (await page.locator('.topnav__gymname').innerText()).trim();
  if (!/An Nakheel/.test(gym)) throw new Error(`gym ${gym}`);
});
await step('Settings gear opens Settings', async () => {
  await page.locator('.topbar__gear').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/settings')) throw new Error(`at ${await hash()}`);
});
await step('phone: menu button opens the drawer with the same items', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#/overview`); await page.waitForTimeout(800);
  if (await page.locator('.topnav').isVisible()) throw new Error('centre menu visible on phone');
  await page.locator('.topbar__menu').click(); await page.waitForTimeout(400);
  const d = page.locator('.drawer.is-open'); await d.waitFor({ timeout: 2000 });
  const groups = (await d.locator('.drawer__grouphead').allInnerTexts()).map((x) => x.split('\n')[0].trim());
  if (groups.join('|') !== 'BMS Core|AI Vision') throw new Error(`groups ${groups}`);
  await d.locator('.drawer__grouphead', { hasText: 'AI Vision' }).click();
  await d.getByRole('link', { name: 'Heatmap' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/heatmap')) throw new Error(`at ${await hash()}`);
  if (await page.locator('.drawer.is-open').count()) throw new Error('drawer still open');
  await page.setViewportSize({ width: 1440, height: 900 });
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
