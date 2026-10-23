// QA of Ask OPTIMO: asks three questions in the chat and takes screenshots (quick variants).
//   node scripts/qa-assistant.mjs [--base=http://localhost:5311/] [--role=coo|fm] [--out=qa/assistant]
// Writes <out>/assistant-<role>-<theme>-<lang>-<width>.png (viewport) and -all.png (conversation expanded).
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const base = arg('base', 'http://localhost:5311/');
const role = arg('role', 'coo');
const out = arg('out', 'qa/assistant');
mkdirSync(out, { recursive: true });
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = `${b}/${d}/chrome-linux/chrome`; if (existsSync(p)) return p; } })();
const now = String(Date.UTC(2026, 9, 22, 15, 30));
const QS = role === 'fm'
  ? ['How busy is the gym?', 'Which zones are too warm?', 'كم عدد التنبيهات المفتوحة؟']
  : ['Compare Al Malqa and An Nakheel', 'Which machines need service?', 'كم عدد التنبيهات المفتوحة؟'];
const VARIANTS = [
  { theme: 'dark', lang: 'en', w: 1440 }, { theme: 'light', lang: 'ar', w: 1440 },
  { theme: 'dark', lang: 'en', w: 390 }, { theme: 'light', lang: 'ar', w: 390 },
];

const browser = await chromium.launch({ executablePath: exe });
const issues = [];
try {
  for (const v of VARIANTS) {
    const tag = `${role}-${v.theme}-${v.lang}-${v.w}`;
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.w > 500 ? 900 : 844 } });
    await ctx.route(/arcgisonline|cartocdn|openstreetmap|tile\.|anthropic\.com/, (r) => r.abort());
    await ctx.addInitScript(([t, l, ro]) => {
      localStorage.setItem('opt.theme', t); localStorage.setItem('opt.lang', l); localStorage.setItem('opt.role', ro);
      localStorage.setItem('opt.scope', '{"level":"all"}');
      sessionStorage.setItem('opt.auth', JSON.stringify({ email: `${ro}@optimo.demo`, role: ro }));
    }, [v.theme, v.lang, role]);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => issues.push(`${tag}: ${e.message}`));
    page.on('console', (m) => { const x = m.text(); if ((m.type() === 'error' && !x.includes('Failed to load resource')) || x.includes('[i18n]')) issues.push(`${tag}: ${x}`); });
    await page.goto(`${base}?now=${now}#/assistant`, { waitUntil: 'load' });
    await page.evaluate(() => { for (const k of Object.keys(sessionStorage)) if (k.startsWith('opt.assistant.chat')) sessionStorage.removeItem(k); });
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#as-q');
    await page.evaluate(() => document.fonts.ready);
    if (v.w === 1440 && v.lang === 'en') await page.screenshot({ path: `${out}/assistant-${tag}-empty.png` });
    for (const q of QS) {
      const before = await page.locator('.as-msg--bot:not(.as-msg--busy)').count();
      await page.fill('#as-q', q);
      await page.press('#as-q', 'Enter');
      await page.waitForFunction((n) => document.querySelectorAll('.as-msg--bot:not(.as-msg--busy)').length > n, before, { timeout: 30000 });
    }
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) issues.push(`${tag}: horizontal overflow ${overflow}px`);
    await page.screenshot({ path: `${out}/assistant-${tag}.png`, fullPage: true });
    await page.addStyleTag({ content: '.as-log { block-size: auto !important; overflow: visible !important; }' });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/assistant-${tag}-all.png`, fullPage: true });
    if (v.w === 1440 && v.lang === 'en') {
      await page.click('.as-mode');
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}/assistant-${tag}-settings.png` });
    }
    console.log('shot', tag);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(issues.length ? `\nISSUES (${issues.length}):\n${issues.join('\n')}` : '\nno page errors, no missing i18n keys, no horizontal overflow');
