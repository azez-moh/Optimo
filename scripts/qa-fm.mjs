// Facility Manager click-through (headless): node scripts/qa-fm.mjs [--base=http://localhost:5299/]
// Signs in as Facility Manager, sets the building to Night, checks HVAC, the route guard and the top bar menu,
// then signs in as COO and checks that every page and the map are still open to him.
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:5299/').slice(7);
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = `${b}/${d}/chrome-linux/chrome`; if (existsSync(p)) return p; } })();
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route(/arcgisonline|cartocdn|openstreetmap|tile\./, (r) => r.abort());
await ctx.addInitScript(() => { if (!sessionStorage.getItem('qa.init')) { localStorage.clear(); localStorage.setItem('opt.lang', 'en'); localStorage.setItem('opt.theme', 'dark'); sessionStorage.setItem('qa.init', '1'); } });
const page = await ctx.newPage();
const errors = []; const results = [];
page.on('pageerror', (e) => errors.push(e.message));
const step = async (name, fn) => { try { await fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${e.message.split('\n')[0]}`); } };
const hash = () => page.evaluate(() => location.hash);
// Top bar menu: top-level labels and the pages inside each dropdown (read from the DOM, menus may be closed).
const menuText = async () => (await page.locator('.topnav').allTextContents()).join(' ');
const groupCounts = async () => {
  const out = [];
  for (const dd of await page.locator('.topnav__dd').all()) out.push(await dd.locator('.topnav__menu a').count());
  return out.join(',');
};

await step('sign in as Facility Manager lands on Al Malqa overview', async () => {
  await page.goto(`${base}#/signin`); await page.getByRole('radio', { name: /Facility Manager/ }).click();
  const email = await page.locator('input[type=email]').inputValue();
  if (email !== 'fm@optimo.demo') throw new Error(`email ${email}`);
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(1000);
  if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  const h1 = await page.locator('h1').first().innerText();
  if (!/Al Malqa \(Men\)/.test(h1)) throw new Error(`title ${h1}`);
});
await step('menu: gym level, 6 BMS + 4 AI Vision, no back control/Branches/Settings/Cameras', async () => {
  const links = (await page.locator('.topnav a').allTextContents()).map((x) => x.trim());
  for (const bad of ['Cameras', 'Settings', 'Branches', 'Integration', 'Monitor', 'Usage Report']) if (links.includes(bad)) throw new Error(`menu shows ${bad}`);
  const vision = (await page.locator('.topnav__dd', { hasText: 'AI Vision' }).locator('.topnav__menu a').allTextContents()).map((x) => x.trim());
  if (vision.join('|') !== 'Live Floor|Heatmap|Reports|Machines and Devices') throw new Error(`AI Vision ${vision}`);
  if (await groupCounts() !== '6,4') throw new Error(`counts ${await groupCounts()}`);
  if (await page.locator('.topnav__back, .topbar__gear').count()) throw new Error('back control or Settings gear shown');
  if (!/OPTIMO Al Malqa \(Men\)/.test(await menuText())) throw new Error('gym name missing');
});
await step('building mode Night (confirm) sets 26 °C', async () => {
  await page.getByRole('radio', { name: 'Night' }).click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor({ timeout: 2000 });
  await dlg.getByRole('button', { name: /Switch to Night/ }).click(); await page.waitForTimeout(500);
  const log = await page.locator('.fm-log').innerText();
  if (!/Building mode set to Night/.test(log) || !/Facility Manager/.test(log)) throw new Error(`log: ${log}`);
});
await step('HVAC page shows the new setpoints', async () => {
  await page.locator('.topnav__trigger', { hasText: 'BMS Core' }).click(); await page.waitForTimeout(200);
  await page.locator('.topnav__menu').getByRole('link', { name: 'HVAC' }).click(); await page.waitForTimeout(1000);
  const sp = await page.locator('.apl-set__v').allInnerTexts();
  if (!sp.length || sp.some((x) => !x.includes('26'))) throw new Error(`setpoints ${sp.slice(0, 5)}`);
});
for (const r of ['cameras', 'map', 'branches', 'settings', 'settings/site-entities', 'usage-report']) {
  await step(`#/${r} redirects to overview`, async () => {
    await page.goto(`${base}#/${r}`); await page.waitForTimeout(800);
    if (!(await hash()).startsWith('#/overview')) throw new Error(`at ${await hash()}`);
  });
}
await step('menu has no Cameras; no way to change the gym', async () => {
  if ((await menuText()).includes('Cameras')) throw new Error('Cameras in menu');
  if (await page.locator('.topnav__back, .drawer__back').count()) throw new Error('back control shown');
});
await step('live floor: no camera toggle, no edit layout', async () => {
  await page.goto(`${base}#/live-floor`); await page.waitForTimeout(1500);
  if (await page.getByText('Edit layout').count()) throw new Error('Edit layout visible');
  if (await page.locator('.lf-toggle', { hasText: 'Camera' }).count()) throw new Error('Camera toggle visible');
});

await step('COO: sign in lands on Branches map, sees every page', async () => {
  await page.locator('button[aria-label="Sign out"]').click(); await page.waitForTimeout(500);
  await page.getByRole('radio', { name: /COO/ }).click();
  await page.locator('button[type=submit]').click(); await page.waitForTimeout(1000);
  if (!(await hash()).startsWith('#/branches?view=map')) throw new Error(`at ${await hash()}`);
  for (const r of ['cameras', 'settings', 'branches', 'usage-report', 'integration', 'library-management']) {
    await page.goto(`${base}#/${r}`); await page.waitForTimeout(600);
    if (!(await hash()).startsWith(`#/${r}`)) throw new Error(`${r} -> ${await hash()}`);
  }
  await page.goto(`${base}#/cameras`); await page.waitForTimeout(600); // gym level
  if (await groupCounts() !== '7,12') throw new Error(`counts ${await groupCounts()}`);
});
console.log(results.join('\n')); console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
