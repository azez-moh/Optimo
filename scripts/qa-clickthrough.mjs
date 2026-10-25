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

const topItems = async () => (await page.locator('.topnav .topnav__link').allTextContents()).map((x) => x.trim());
const scopeName = async () => (await page.locator('.scopesw__name').innerText()).trim();
const sideGroups = async () => (await page.locator('.shell__side .sidenav__grouplabel').allTextContents()).map((x) => x.trim());
const sideMain = async () => (await page.locator('.shell__side .sidenav__list--map .sidenav__text').allTextContents()).map((x) => x.trim());
const TOP = 'Overview|Ask OPTIMO|Branches';

await step('sign in as COO lands on the Kingdom map (/map)', async () => {
  await page.goto(`${base}#/signin`); await page.getByRole('radio', { name: /COO/ }).click();
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/map')) throw new Error(`at ${await hash()}`);
  await page.locator('.mapall').waitFor({ timeout: 4000 });
});
await step('network level: top menu Overview, Ask OPTIMO, Branches; "All branches" by the logo; left menu Map only', async () => {
  if ((await topItems()).join('|') !== TOP) throw new Error(`menu ${await topItems()}`);
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  if ((await sideMain()).join('|') !== 'Map') throw new Error(`side ${await sideMain()}`);
  if ((await sideGroups()).length) throw new Error(`groups at network level ${await sideGroups()}`);
  if (await page.locator('.topnav__back, .topnav__trigger, .topnav__dd').count()) throw new Error('old gym controls in top bar');
  if (await page.locator('.topnav__link', { hasText: 'Settings' }).count()) throw new Error('Settings in menu');
  if (!(await page.locator('.topbar__gear').isVisible())) throw new Error('no Settings gear');
});
await step('map: All branches row first above the regions, opens network overview', async () => {
  const first = await page.locator('.mappanel > *:not(.mappanel__grip)').first().getAttribute('class');
  if (!/mapall/.test(first || '')) throw new Error(`first ${first}`);
  await page.locator('.mapall').click(); await page.waitForTimeout(800);
  if (!(await hash()).includes('/overview')) throw new Error(`at ${await hash()}`);
  await page.locator('.ov-asat', { hasText: '2 gyms' }).waitFor({ timeout: 4000 });
  if ((await topItems()).join('|') !== TOP) throw new Error('menu changed');
});
await step('/branches?view=map redirects to /map; Riyadh -> district -> fact card -> Open gym', async () => {
  await page.goto(`${base}#/branches?view=map`); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/map')) throw new Error(`redirect ${await hash()}`);
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
await step('gym level: same top menu; gym name by the logo; left menu Map + BMS Core (7) + AI Vision (12)', async () => {
  if ((await topItems()).join('|') !== TOP) throw new Error(`menu ${await topItems()}`);
  if (!/^OPTIMO /.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
  if ((await sideMain()).join('|') !== 'Map') throw new Error(`side ${await sideMain()}`);
  if ((await sideGroups()).join('|') !== 'BMS Core|AI Vision') throw new Error(`groups ${await sideGroups()}`);
  const bms = (await page.locator('#navgroup-bms .sidenav__text').allTextContents()).map((x) => x.trim());
  if (bms.join('|') !== 'BMS Overview|HVAC|Lights|AI Agents|Control|BMS Settings|Integration') throw new Error(`bms ${bms}`);
  const vis = (await page.locator('#navgroup-vision .sidenav__text').allTextContents()).map((x) => x.trim());
  if (vis.length !== 12 || vis[1] !== 'Live Floor' || vis[2] !== 'Heatmap') throw new Error(`vision ${vis}`);
  const counts = (await page.locator('.shell__side .sidenav__groupcount').allTextContents()).map((x) => x.trim()).join(',');
  if (counts !== '7,12') throw new Error(`counts ${counts}`);
});
await step('left menu: Heatmap opens and is highlighted; group collapses and expands', async () => {
  await page.locator('#navgroup-vision a', { hasText: 'Heatmap' }).click(); await page.waitForTimeout(1200);
  if (!(await hash()).startsWith('#/heatmap')) throw new Error(`at ${await hash()}`);
  const active = (await page.locator('.shell__side .sidenav__link.active').innerText()).trim();
  if (active !== 'Heatmap') throw new Error(`active ${active}`);
  const head = page.locator('.sidenav__grouphead', { hasText: 'BMS Core' });
  await head.click(); await page.waitForTimeout(150);
  if (await page.locator('#navgroup-bms').isVisible()) throw new Error('BMS group did not collapse');
  await head.click(); await page.waitForTimeout(150);
  if (!(await page.locator('#navgroup-bms').isVisible())) throw new Error('BMS group did not expand');
});
await step('left menu collapses to icons and back', async () => {
  const w0 = (await page.locator('.shell__side').boundingBox()).width;
  await page.locator('.sidenav__collapse').click(); await page.waitForTimeout(300);
  const w1 = (await page.locator('.shell__side').boundingBox()).width;
  if (!(w1 < 80 && w0 > 180)) throw new Error(`widths ${w0} -> ${w1}`);
  if (await page.locator('.shell__side .sidenav__text').first().isVisible()) throw new Error('labels visible when collapsed');
  await page.locator('.sidenav__collapse').click(); await page.waitForTimeout(300);
});
await step('branch switcher: All branches on a gym page falls back to Overview', async () => {
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  const items = (await page.locator('.scopesw__menu .scopesw__text').allTextContents()).map((x) => x.trim());
  if (items[0] !== 'All branches' || items.length !== 3) throw new Error(`items ${items}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  if (await page.locator('.scopesw__menu').isVisible()) throw new Error('Escape did not close');
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'All branches' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  if ((await sideGroups()).length) throw new Error('groups still shown');
});
await step('branch switcher: picking a gym keeps a network page (Ask OPTIMO) and shows its groups', async () => {
  await page.locator('.topnav__link', { hasText: 'Ask OPTIMO' }).click(); await page.waitForTimeout(800);
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'An Nakheel' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/assistant')) throw new Error(`at ${await hash()}`);
  if (!/An Nakheel/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
  if ((await sideGroups()).join('|') !== 'BMS Core|AI Vision') throw new Error(`groups ${await sideGroups()}`);
});
await step('branch switcher: other gym on a gym page stays on that page', async () => {
  await page.locator('#navgroup-bms a', { hasText: 'HVAC' }).click(); await page.waitForTimeout(800);
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'Al Malqa' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/hvac')) throw new Error(`at ${await hash()}`);
  if (!/Al Malqa/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
});
await step('gym page at network scope switches to OPTIMO Al Malqa (Men)', async () => {
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'All branches' }).click(); await page.waitForTimeout(600);
  await page.goto(`${base}#/hvac`); await page.waitForTimeout(1200);
  if (!(await hash()).startsWith('#/hvac')) throw new Error(`at ${await hash()}`);
  if ((await scopeName()) !== 'OPTIMO Al Malqa (Men)') throw new Error(`scope ${await scopeName()}`);
});
await step('Branches: gym list only (no Map/List toggle); Open gym sets the gym and opens its overview', async () => {
  await page.locator('.topnav__link', { hasText: 'Branches' }).click(); await page.waitForTimeout(800);
  if (await page.locator('.br-view, .segmented').count()) throw new Error('view toggle still there');
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  await page.locator('.br-card', { hasText: 'An Nakheel' }).locator('.br-card__btn--go').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  if (!/An Nakheel/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
});
await step('Settings gear opens Settings', async () => {
  await page.locator('.topbar__gear').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/settings')) throw new Error(`at ${await hash()}`);
});
await step('phone: menu button opens the drawer with top items, Map and the gym groups', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#/overview`); await page.waitForTimeout(800);
  if (await page.locator('.topnav').isVisible()) throw new Error('centre menu visible on phone');
  if (!(await page.locator('.scopesw__btn').isVisible())) throw new Error('branch name not visible on phone');
  const ov = await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  if (ov > 1) throw new Error(`horizontal overflow ${ov}`);
  await page.locator('.topbar__menu').click(); await page.waitForTimeout(400);
  const d = page.locator('.shell.is-drawer-open .shell__side'); await d.waitFor({ timeout: 2000 });
  const top = (await d.locator('.sidenav__list--top .sidenav__text').allTextContents()).map((x) => x.trim());
  if (top.join('|') !== TOP) throw new Error(`top ${top}`);
  if ((await sideGroups()).join('|') !== 'BMS Core|AI Vision') throw new Error(`groups ${await sideGroups()}`);
  await d.getByRole('link', { name: 'Heatmap' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/heatmap')) throw new Error(`at ${await hash()}`);
  if (await page.locator('.shell.is-drawer-open').count()) throw new Error('drawer still open');
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
