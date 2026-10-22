// QA for WebGL pages: swiftshader flags so three.js renders headless.
// node src/pages/LiveFloor/__qa__/shoot3d.mjs <label> <route[,route]> [--base=http://localhost:5206/] [--variants=quick|all] [--role=admin] [--wait=6000] [--act=<js>]
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || 'true']; }));
const [label = 'qa3d', routeArg = 'live-floor'] = args.filter((a) => !a.startsWith('--'));
const out = path.resolve('qa', label); mkdirSync(out, { recursive: true });
const base = flags.base || 'http://localhost:5206/';
const ALL = [
  { theme: 'dark', lang: 'en', w: 1440 }, { theme: 'light', lang: 'en', w: 1440 }, { theme: 'dark', lang: 'ar', w: 1440 }, { theme: 'light', lang: 'ar', w: 1440 },
  { theme: 'dark', lang: 'en', w: 390 }, { theme: 'light', lang: 'en', w: 390 }, { theme: 'dark', lang: 'ar', w: 390 }, { theme: 'light', lang: 'ar', w: 390 },
];
const variants = flags.variants === 'all' ? ALL : flags.variants === 'one' ? [ALL[0]] : [ALL[0], ALL[3], ALL[4], ALL[7]];
const role = flags.role === 'admin' ? 'admin' : 'coo';
const nowMs = String(Date.UTC(2026, 9, 22, 15, 30));
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = path.join(b, d, 'chrome-linux', 'chrome'); if (existsSync(p)) return p; } })();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
for (const v of variants) {
  const tag = `${v.theme}-${v.lang}-${v.w}`;
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.w > 500 ? 900 : 844 }, acceptDownloads: true });
  await ctx.addInitScript(([t, l, ro, sc]) => { localStorage.setItem('opt.theme', t); localStorage.setItem('opt.lang', l); localStorage.setItem('opt.role', ro); localStorage.setItem('opt.scope', sc); sessionStorage.setItem('opt.auth', JSON.stringify({ email: `${ro}@optimo.com.sa`, name: ro, role: ro })); }, [v.theme, v.lang, role, flags.scope || '{"level":"all"}']);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
  page.on('console', (m) => { const x = m.text(); if ((m.type() === 'error' && !x.includes('Failed to load resource')) || x.includes('[i18n]')) errors.push(`${tag}: ${x}`); });
  for (const route of routeArg.split(',')) {
    await page.goto(`${base}?now=${nowMs}&r=${encodeURIComponent(route)}#/${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(Number(flags.wait || 6000));
    if (flags.act) { await page.evaluate(flags.act); await page.waitForTimeout(Number(flags.actwait || 2500)); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`${route}/${tag}: horizontal overflow ${overflow}px`);
    const file = path.join(out, `${route.replace(/[/?=&]/g, '_')}-${tag}.png`);
    try { await page.screenshot({ path: file, fullPage: flags.full === 'true', timeout: 60000 }); } catch { await page.screenshot({ path: file, timeout: 60000 }); errors.push(`${route}/${tag}: full-page shot timed out, viewport shot instead`); }
    console.log('shot', file);
  }
  await ctx.close();
}
await browser.close();
const uniq = [...new Set(errors)]; console.log(uniq.length ? `ISSUES (${uniq.length}):\n${uniq.join('\n')}` : 'no issues');
