// QA: Live Floor camera pop-up (Build 8.7). Signs in, selects a machine from the list, shoots the pop-up,
// drags the bottom-start grip by (-200,+120) (mirrored in Arabic), toggles Enlarge, repeats in Arabic, then checks 390 px dock.
// node src/pages/LiveFloor/__qa__/campop.mjs [--base=http://localhost:5311/]
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || 'true']; }));
const base = flags.base || 'http://localhost:5311/';
const out = path.resolve('qa', 'campop'); mkdirSync(out, { recursive: true });
const nowMs = String(Date.UTC(2026, 9, 22, 15, 30));
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = path.join(b, d, 'chrome-linux', 'chrome'); if (existsSync(p)) return p; } })();
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
const box = (page) => page.evaluate(() => {
  const p = document.querySelector('.lf-pip'); const s = document.querySelector('.lf-stage-wrap');
  if (!p) return null;
  const r = p.getBoundingClientRect(); const q = s.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left - q.left), right: Math.round(q.right - r.right), top: Math.round(r.top - q.top), stageW: Math.round(q.width) };
});
for (const v of [{ lang: 'en', w: 1440 }, { lang: 'ar', w: 1440 }, { lang: 'en', w: 390 }, { lang: 'ar', w: 390 }]) {
  const tag = `${v.lang}-${v.w}`;
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.w > 500 ? 900 : 844 } });
  await ctx.addInitScript(([l]) => { if (!sessionStorage.getItem('qa.init')) { sessionStorage.setItem('qa.init', '1'); localStorage.clear(); localStorage.setItem('opt.theme', 'dark'); localStorage.setItem('opt.lang', l); localStorage.setItem('opt.scope', '{"level":"all"}'); } }, [v.lang]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
  page.on('console', (m) => { const x = m.text(); if ((m.type() === 'error' && !x.includes('Failed to load resource')) || x.includes('[i18n]')) errors.push(`${tag}: ${x}`); });
  await page.goto(`${base}?now=${nowMs}#/signin`, { waitUntil: 'load' });
  await page.locator('button.signin__submit').click();
  await page.waitForTimeout(800);
  await page.goto(`${base}?now=${nowMs}#/live-floor`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  if (await page.locator('.lf-pip').count()) errors.push(`${tag}: pop-up visible before any selection`);
  await page.locator('.lf-list__item').nth(3).click();
  await page.waitForTimeout(3500);
  const shot = async (n) => { const f = path.join(out, `${tag}-${n}.png`); try { await page.screenshot({ path: f, timeout: 60000 }); } catch { errors.push(`${tag}: screenshot ${n} timed out`); } console.log('shot', f, JSON.stringify(await box(page))); };
  if (!(await page.locator('.lf-pip').count())) { errors.push(`${tag}: pop-up did not open on selection`); await shot('missing'); await ctx.close(); continue; }
  if (v.w < 500) { await page.evaluate(() => { document.querySelector('.lf-pip').scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }); await page.waitForTimeout(500); }
  await shot('1-open');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) errors.push(`${tag}: horizontal overflow ${overflow}px`);
  if (v.w > 500) {
    const before = await box(page);
    const g = await page.locator('.lf-pip__grip').boundingBox();
    const sx = g.x + g.width / 2, sy = g.y + g.height / 2;
    const dx = v.lang === 'ar' ? 200 : -200;
    await page.mouse.move(sx, sy); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(sx + (dx * i) / 10, sy + (120 * i) / 10);
    await page.mouse.up();
    await page.waitForTimeout(400);
    const after = await box(page);
    if (!(after.w > before.w)) errors.push(`${tag}: drag did not grow (${before.w} -> ${after.w})`);
    const anchor = v.lang === 'ar' ? 'left' : 'right';
    if (Math.abs(after[anchor] - before[anchor]) > 1 || Math.abs(after.top - before.top) > 1) errors.push(`${tag}: anchor moved`);
    if (Math.abs(after.w * 9 / 16 + 46 - after.h) > 4) errors.push(`${tag}: aspect off (${after.w}x${after.h})`);
    await shot('2-dragged');
    // keyboard
    await page.locator('.lf-pip__grip').focus();
    await page.keyboard.press(v.lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
    const k = await box(page);
    if (after.w - k.w !== 24) errors.push(`${tag}: arrow key step ${after.w - k.w}`);
    await page.locator('.lf-pip__actions button[aria-pressed]').click();
    await page.waitForTimeout(400);
    const big = await box(page);
    if (Math.abs(big.w - big.stageW * 0.6) > 3 && big.w < big.stageW * 0.6) errors.push(`${tag}: enlarge width ${big.w} vs stage ${big.stageW}`);
    await shot('3-enlarged');
    const hb = await page.locator('.lf-pip__head').boundingBox();
    const under = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${e.className}` : 'none'; }, [hb.x + (v.lang === 'ar' ? hb.width - 30 : 30), hb.y + 10]);
    await page.locator('.lf-pip__name').dblclick();
    await page.waitForTimeout(300);
    const restored = await box(page);
    if (!restored) { errors.push(`${tag}: dblclick closed the pop-up (under: ${under})`); await shot('dbl-missing'); await ctx.close(); continue; }
    if (restored.w !== k.w) errors.push(`${tag}: dblclick restore ${restored.w} vs ${k.w}`);
    // Esc closes the pop-up only; the selection stays
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await page.locator('.lf-pip').count()) errors.push(`${tag}: Esc did not close`);
    if (!(await page.locator('.lf-card').count())) errors.push(`${tag}: Esc also cleared the selection`);
    // re-select another machine re-opens it with remembered size
    await page.locator('.lf-card__back').click();
    await page.locator('.lf-list__item').nth(6).click();
    await page.waitForTimeout(1500);
    const again = await box(page);
    if (!again || again.w !== k.w) errors.push(`${tag}: reopen size ${again?.w} vs ${k.w}`);
  } else {
    if (await page.locator('.lf-pip__grip').count()) errors.push(`${tag}: grip shown on phone`);
  }
  await ctx.close();
}
await browser.close();
const uniq = [...new Set(errors)]; console.log(uniq.length ? `ISSUES (${uniq.length}):\n${uniq.join('\n')}` : 'no issues');
