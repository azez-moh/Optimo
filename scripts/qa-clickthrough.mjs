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
const sideMain = async () => (await page.locator('.shell__side .sidenav__list--branch .sidenav__text').allTextContents()).map((x) => x.trim());
const sideShown = async () => page.locator('.shell__side').isVisible();
const topActive = async () => (await page.locator('.topnav .topnav__link.active').allTextContents()).map((x) => x.trim()).join('|');
const TOP = 'Overview|Ask OPTIMO|Branches';
const TOP_BRANCH = 'Overview|Branch overview|Ask OPTIMO|Branches';
const noLeftMenu = async () => {
  if (await sideShown()) throw new Error('left menu shown at network level');
  if (!(await page.locator('.shell--network').count())) throw new Error('shell not at network level');
  if (await page.locator('.topbar__menu').isVisible()) throw new Error('menu button shown at network level');
  const w = (await page.locator('.shell__main').boundingBox()).width;
  if (w < 1400) throw new Error(`page not full width: ${w}`);
};
const branchMenus = async () => {
  if ((await topItems()).join('|') !== TOP_BRANCH) throw new Error(`top ${await topItems()}`);
  if (!(await page.locator('.topnav .topnav__link--back').count())) throw new Error('no back item');
  if (!(await sideShown())) throw new Error('no left menu at branch level');
  if ((await sideMain()).join('|') !== 'Branch settings') throw new Error(`side ${await sideMain()}`);
  if ((await sideGroups()).join('|') !== 'BMS Core|AI Vision') throw new Error(`groups ${await sideGroups()}`);
  const all = (await page.locator('.shell__side .sidenav__list:not(.sidenav__list--top) .sidenav__text').allTextContents()).map((x) => x.trim());
  for (const bad of ['Map', 'Branch overview']) if (all.includes(bad)) throw new Error(`left menu shows ${bad}`);
};

await step('sign in as COO lands on the Kingdom map (/map) with no left menu', async () => {
  await page.goto(`${base}#/signin`); await page.getByRole('radio', { name: /COO/ }).click();
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/map')) throw new Error(`at ${await hash()}`);
  await page.locator('.mapall').waitFor({ timeout: 4000 });
  await noLeftMenu();
});
await step('network level: top menu Overview, Ask OPTIMO, Branches (no Map anywhere); "All branches" by the logo; no left menu', async () => {
  if ((await topItems()).join('|') !== TOP) throw new Error(`menu ${await topItems()}`);
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  if ((await sideGroups()).length) throw new Error(`groups at network level ${await sideGroups()}`);
  if (await page.locator('a[href="#/map"]').count()) throw new Error('Map link in a menu');
  if (await page.locator('.topnav__link--back, .topnav__trigger, .topnav__dd').count()) throw new Error('back item or old gym controls at network level');
  for (const sel of ['.bell__btn', '.lang-btn', '.topbar__gear', 'button[aria-label="Sign out"]']) if (!(await page.locator(sel).isVisible())) throw new Error(`missing ${sel}`);
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
  if ((await topActive()) !== 'Overview') throw new Error(`active ${await topActive()}`);
  await noLeftMenu();
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
  if (!(await hash()).startsWith('#/branch')) throw new Error(`not on Branch overview ${await hash()}`);
  results.push(`  -> landed on ${await hash()}`);
});
await step('branch level: top menu ← Overview, Branch overview (active), Ask OPTIMO, Branches; gym name by the logo; left menu Branch settings + BMS Core (7) + AI Vision (13)', async () => {
  await branchMenus();
  if ((await topActive()) !== 'Branch overview') throw new Error(`active ${await topActive()}`);
  if (!/^OPTIMO /.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
  const bms = (await page.locator('#navgroup-bms .sidenav__text').allTextContents()).map((x) => x.trim());
  if (bms.join('|') !== 'BMS Overview|HVAC|Lights|AI Agents|Control|BMS Settings|Integration') throw new Error(`bms ${bms}`);
  const vis = (await page.locator('#navgroup-vision .sidenav__text').allTextContents()).map((x) => x.trim());
  if (vis.length !== 13 || vis[0] !== 'AI Vision overview' || vis[2] !== 'Live Floor' || vis[3] !== 'Heatmap') throw new Error(`vision ${vis}`);
  const counts = (await page.locator('.shell__side .sidenav__groupcount').allTextContents()).map((x) => x.trim()).join(',');
  if (counts !== '7,13') throw new Error(`counts ${counts}`);
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
  await noLeftMenu();
});
await step('branch switcher: picking a gym keeps a network page (Ask OPTIMO) and shows its groups', async () => {
  await page.locator('.topnav__link', { hasText: 'Ask OPTIMO' }).click(); await page.waitForTimeout(800);
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'An Nakheel' }).click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/assistant')) throw new Error(`at ${await hash()}`);
  if (!/An Nakheel/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
  await branchMenus();
  if ((await topActive()) !== 'Ask OPTIMO') throw new Error(`active ${await topActive()}`);
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
await step('Branches: gym list only (no Map/List toggle), network level; Open gym sets the gym and opens its Branch overview', async () => {
  await page.locator('.topnav__link', { hasText: 'Branches' }).click(); await page.waitForTimeout(800);
  if (await page.locator('.br-view, .segmented').count()) throw new Error('view toggle still there');
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  await noLeftMenu();
  await page.locator('.br-card', { hasText: 'An Nakheel' }).locator('.br-card__btn--go').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/branch')) throw new Error(`at ${await hash()}`);
  if (!/An Nakheel/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
});
await step('pick Al Malqa from the switcher on Overview opens its Branch overview (This gym, gym heatmap); Branch overview active on top, left menu Branch settings / BMS Core / AI Vision', async () => {
  await page.locator('.topnav__link--back').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`back at ${await hash()}`);
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'Al Malqa' }).click(); await page.waitForTimeout(1500);
  if (!(await hash()).startsWith('#/branch')) throw new Error(`at ${await hash()}`);
  if (!/Al Malqa/.test(await scopeName())) throw new Error(`scope ${await scopeName()}`);
  await page.locator('.tg').waitFor({ timeout: 4000 });
  if ((await topActive()) !== 'Branch overview') throw new Error(`active ${await topActive()}`);
  await branchMenus();
  if (!(await page.locator('.cmp__table tbody tr.is-scope', { hasText: 'Al Malqa' }).count())) throw new Error('this gym not highlighted');
});
await step('Branch settings: change crowding threshold to 30%, save with confirmation, Heatmap and AI Vision overview use it', async () => {
  await page.locator('.shell__side a', { hasText: 'Branch settings' }).click(); await page.waitForTimeout(1000);
  if (!(await hash()).startsWith('#/branch-settings')) throw new Error(`at ${await hash()}`);
  const before = await page.locator('.bs-savebar__line').innerText();
  if (!/Not saved yet/.test(before)) throw new Error(`line ${before}`);
  const inp = page.locator('.bs-th__row[data-k=crowdPct] input'); await inp.fill('30');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor({ timeout: 2000 });
  await dlg.getByRole('button', { name: 'Save changes' }).click(); await page.waitForTimeout(500);
  const line = await page.locator('.bs-savebar__line').innerText();
  if (!/Last saved by COO/.test(line)) throw new Error(`line ${line}`);
  await page.goto(`${base}#/heatmap`); await page.waitForTimeout(1500);
  if (!(await page.getByText('Areas above 30%').count())) throw new Error('Heatmap does not show 30%');
});
await step('AI Vision overview: 4 KPIs, heatmap, families, cameras, alerts (crowding at 30%), links; no scroll at 1440x900', async () => {
  await page.locator('#navgroup-vision a', { hasText: 'AI Vision overview' }).click(); await page.waitForTimeout(800);
  // fixed evening clock (Riyadh 18:30) so the busiest areas are above 30%
  await page.goto(`${base}?now=${Date.UTC(2026, 9, 22, 15, 30)}#/vision-overview`); await page.waitForTimeout(1500);
  if (!(await hash()).startsWith('#/vision-overview')) throw new Error(`at ${await hash()}`);
  if ((await page.locator('.vo-kpis .kpi').count()) !== 4) throw new Error('not 4 KPIs');
  for (const sel of ['.vo-heat', '.vo-fam', '.vo-health', '.vo-links']) if (!(await page.locator(sel).count())) throw new Error(`missing ${sel}`);
  if (!(await page.locator('.vo-alerts', { hasText: 'Heatmap, above 30%' }).count())) throw new Error('no crowding alert at 30%');
  const sc = await page.evaluate(() => document.scrollingElement.scrollHeight - window.innerHeight);
  if (sc > 1) throw new Error(`page scrolls ${sc}`);
  const cut = await page.locator('.vo-link span').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  if (cut.length) throw new Error(`quick links cut off: ${cut}`);
});
await step('"← Overview" returns to the network: All branches, all gyms, no left menu', async () => {
  await page.locator('.topnav__link--back').click(); await page.waitForTimeout(1500);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  if ((await scopeName()) !== 'All branches') throw new Error(`scope ${await scopeName()}`);
  await page.locator('.ov-asat', { hasText: '2 gyms' }).waitFor({ timeout: 4000 });
  if (await page.locator('.tg').count()) throw new Error('This gym shown on network overview');
  if ((await topItems()).join('|') !== TOP) throw new Error(`menu ${await topItems()}`);
  if ((await sideGroups()).length) throw new Error('groups shown');
  await noLeftMenu();
});
await step('Settings gear opens Settings', async () => {
  await page.locator('.topbar__gear').click(); await page.waitForTimeout(800);
  if (!(await hash()).startsWith('#/settings')) throw new Error(`at ${await hash()}`);
});
await step('phone, network level: drawer has the top items only', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#/overview`); await page.waitForTimeout(800);
  await page.locator('.topbar__menu').click(); await page.waitForTimeout(400);
  const d = page.locator('.shell.is-drawer-open .shell__side'); await d.waitFor({ timeout: 2000 });
  const top = (await d.locator('.sidenav__list--top .sidenav__text').allTextContents()).map((x) => x.trim());
  if (top.join('|') !== TOP) throw new Error(`top ${top}`);
  if ((await sideGroups()).length) throw new Error('groups at network level');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
});
await step('phone, branch level: menu button opens the drawer with top items, Branch settings and the gym groups', async () => {
  await page.locator('.scopesw__btn').click(); await page.waitForTimeout(200);
  await page.locator('.scopesw__item', { hasText: 'Al Malqa' }).click(); await page.waitForTimeout(800);
  await page.goto(`${base}#/branch`); await page.waitForTimeout(800);
  if (await page.locator('.topnav').isVisible()) throw new Error('centre menu visible on phone');
  if (!(await page.locator('.scopesw__btn').isVisible())) throw new Error('branch name not visible on phone');
  const ov = await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  if (ov > 1) throw new Error(`horizontal overflow ${ov}`);
  await page.locator('.topbar__menu').click(); await page.waitForTimeout(400);
  const d = page.locator('.shell.is-drawer-open .shell__side'); await d.waitFor({ timeout: 2000 });
  const top = (await d.locator('.sidenav__list--top .sidenav__text').allTextContents()).map((x) => x.trim());
  if (top.join('|') !== TOP_BRANCH) throw new Error(`top ${top}`);
  if ((await sideMain()).join('|') !== 'Branch settings') throw new Error(`side ${await sideMain()}`);
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
  await page.locator('tbody tr').first().waitFor({ timeout: 5000 }); await page.waitForTimeout(500);
  const before = await page.locator('tbody tr').count();
  await page.getByRole('button', { name: /Remove/ }).first().click(); await page.waitForTimeout(300);
  const dlg = page.getByRole('dialog'); await dlg.waitFor({ timeout: 2000 });
  await dlg.getByRole('button', { name: 'Cancel' }).click(); await page.waitForTimeout(300);
  if ((await page.locator('tbody tr').count()) !== before) throw new Error(`row removed without confirm (${before} -> ${await page.locator('tbody tr').count()})`);
});
await step('destructive: Usage Report reset asks for confirmation', async () => {
  await page.goto(`${base}#/usage-report`); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Reset usage history/ }).click();
  await page.getByRole('dialog').waitFor({ timeout: 2000 });
});
console.log(results.join('\n')); console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
