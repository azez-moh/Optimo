// QA click-through of the COO Overview recommendations and comparison:
//   node scripts/qa-insights.mjs [--base=http://localhost:5299/] [--shots=qa/insights]
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const base = arg('base', 'http://localhost:5299/');
const shots = arg('shots', 'qa/insights');
mkdirSync(shots, { recursive: true });
const exe = (() => { const b = '/opt/pw-browsers'; for (const d of readdirSync(b).filter((x) => x.startsWith('chromium-')).sort().reverse()) { const p = `${b}/${d}/chrome-linux/chrome`; if (existsSync(p)) return p; } })();
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route(/arcgisonline|cartocdn|openstreetmap|tile\./, (r) => r.abort());
const now = String(Date.UTC(2026, 9, 22, 15, 30));
await ctx.addInitScript(() => {
  localStorage.setItem('opt.lang', 'en'); localStorage.setItem('opt.theme', 'dark'); localStorage.setItem('opt.role', 'coo');
  if (!localStorage.getItem('opt.scope')) localStorage.setItem('opt.scope', '{"level":"all"}'); sessionStorage.setItem('opt.auth', JSON.stringify({ email: 'coo@optimo.demo', role: 'coo' }));
});
const page = await ctx.newPage();
const errors = []; const results = [];
page.on('pageerror', (e) => errors.push(e.message));
const step = async (name, fn) => { try { await fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${e.message.split('\n')[0]}`); } };
const hash = () => page.evaluate(() => decodeURIComponent(location.hash));
const num = (s) => Number(String(s).replace(/[^\d.\-−]/g, '').replace('−', '-'));

await page.goto(`${base}?now=${now}#/overview`); await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.removeItem('opt.data.v1')); await page.reload(); await page.waitForTimeout(2500);

let firstAction = '';
await step('recommended actions: move, buy, retire, service and energy all listed', async () => {
  const cards = page.locator('.in-recs .in-row');
  const kinds = new Set(await cards.evaluateAll((els) => els.map((e) => e.dataset.kind)));
  for (const k of ['move', 'buy', 'retire', 'service', 'energy']) if (!kinds.has(k)) throw new Error(`kinds ${[...kinds]}`);
  results.push(`  -> ${await cards.count()} rows: ${(await cards.locator('.in-row__brief').allInnerTexts()).map((x) => x.trim()).join(' | ')}`);
  firstAction = (await cards.first().locator('.in-row__action').textContent()).trim();
  results.push(`  -> first: ${firstAction}`);
});
await step('Show all lists every recommendation (when more than 6)', async () => {
  const more = page.getByRole('button', { name: /Show all/ });
  if (!(await more.count())) { results.push('  -> 6 or fewer, no Show all'); return; }
  await more.click();
  const n = await page.locator('.in-recs .in-row').count();
  if (n <= 6) throw new Error(`only ${n}`);
  results.push(`  -> ${n} recommendations`);
  await page.getByRole('button', { name: 'Show fewer' }).click();
});
await step('Rows are collapsed; Enter opens one (aria-expanded), opening another closes it', async () => {
  const heads = page.locator('.in-recs .in-row__head');
  if ((await heads.evaluateAll((els) => els.filter((e) => e.getAttribute('aria-expanded') === 'true').length)) !== 0) throw new Error('a row starts open');
  await heads.nth(1).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(350);
  if ((await heads.nth(1).getAttribute('aria-expanded')) !== 'true') throw new Error('Enter did not open');
  await heads.nth(2).click(); await page.waitForTimeout(350);
  if ((await heads.nth(1).getAttribute('aria-expanded')) !== 'false') throw new Error('first did not close');
  await heads.nth(2).click(); await page.waitForTimeout(350);
});
await step('Plan the first recommendation -> it shows in the Action plan', async () => {
  await page.locator('.in-recs .in-row__head').first().click(); await page.waitForTimeout(350);
  await page.locator('.in-recs .in-row').first().getByRole('button', { name: 'Plan it' }).click();
  await page.waitForTimeout(300);
  const row = page.locator('.in-plan__row').first();
  const txt = (await row.locator('.in-plan__action').innerText()).trim();
  if (txt !== firstAction) throw new Error(`plan has "${txt}"`);
  if (!(await page.locator('.in-recs .in-row').first().locator('.in-planned').isVisible())) throw new Error('row not marked planned');
});
await step('Action plan status Planned -> In progress persists after reload', async () => {
  await page.locator('.in-plan__row select').first().selectOption('progress');
  await page.reload(); await page.waitForTimeout(2500);
  const v = await page.locator('.in-plan__row select').first().inputValue();
  if (v !== 'progress') throw new Error(`status ${v}`);
  await page.locator('.in-plan').screenshot({ path: `${shots}/action-plan.png` });
});
await step('Dismiss with a reason removes the card and lists it under Dismissed', async () => {
  const card = page.locator('.in-recs .in-row').nth(1);
  await card.locator('.in-row__head').click(); await page.waitForTimeout(350);
  const action = (await card.locator('.in-row__action').innerText()).trim();
  await card.getByRole('button', { name: 'Dismiss' }).click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor();
  await dlg.getByRole('radio', { name: 'Not practical' }).click();
  await dlg.getByRole('button', { name: 'Dismiss' }).click(); await page.waitForTimeout(300);
  const left = await page.locator('.in-recs .in-row__action').evaluateAll((els) => els.map((e) => e.textContent));
  if (left.some((x) => x.trim() === action)) throw new Error('still listed');
  await page.getByRole('button', { name: /Dismissed \(1\)/ }).click();
  if (!(await page.getByText('Dismissed: Not practical').isVisible())) throw new Error('reason missing');
  await page.getByRole('button', { name: 'Restore' }).click();
});
await step('Gym comparison lists both gyms plus the network average, sortable', async () => {
  const rows = await page.locator('.cmp__table tbody tr').count();
  if (rows !== 2) throw new Error(`rows ${rows}`);
  await page.getByRole('button', { name: /Sort by Machine use/ }).click();
  const first = await page.locator('.cmp__table tbody tr').first().locator('.cmp__gymname').innerText();
  if (!/An Nakheel/.test(first)) throw new Error(`top by machine use: ${first}`);
  if (!(await page.locator('.cmp__table tfoot').getByText('Network average').isVisible())) throw new Error('no average');
});
await step('Matrix cell (rowers at An Nakheel) opens its recommendation', async () => {
  await page.locator('.mx__cell.has-rec[aria-label^="Rowers at An Nakheel"]').click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor();
  const a = await dlg.locator('.in-card__action').first().innerText();
  if (!/rowers? .* to .*An Nakheel/i.test(a)) throw new Error(a);
  results.push(`  -> ${a}`);
  await page.keyboard.press('Escape');
});
await step('Compare two gyms: defaults to Al Malqa vs An Nakheel, difference column consistent', async () => {
  await page.getByRole('button', { name: 'Compare two gyms' }).click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor();
  if (!(await hash()).includes('compare=optimo-malqa-men,optimo-nakheel-men')) throw new Error(`default ${await hash()}`);
  await dlg.getByLabel('First gym').selectOption('optimo-nakheel-men');
  await dlg.getByLabel('Second gym').selectOption('optimo-malqa-men');
  await page.waitForTimeout(300);
  if (!(await hash()).includes('compare=optimo-nakheel-men,optimo-malqa-men')) throw new Error(await hash());
  const row = dlg.locator('tr[data-key="machine"]');
  const [a, b, d] = await row.locator('td').allInnerTexts();
  const diff = num(d.split('(')[0]);
  if (Math.abs(num(a) - num(b) - diff) > 0.11) throw new Error(`${a} - ${b} != ${d}`);
  if (!(await row.locator('.two__diff--good').count())) throw new Error('An Nakheel higher use not marked better');
  const e = await dlg.locator('tr[data-key="energy"] .two__diff').getAttribute('class');
  results.push(`  -> machine use ${a} vs ${b}: ${d.replace(/\s+/g, ' ')}; energy diff class ${e}`);
  const recs = await dlg.locator('.two__recs li').count();
  if (!recs) throw new Error('no recommendations listed');
  await dlg.screenshot({ path: `${shots}/compare-nakheel-malqa.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  if ((await hash()).includes('compare=')) throw new Error('compare param kept after close');
});
await step('Row Compare button preselects that gym', async () => {
  await page.locator('.cmp__table tbody tr', { hasText: 'An Nakheel' }).getByRole('button', { name: /Compare/ }).click();
  const dlg = page.getByRole('dialog'); await dlg.waitFor();
  if ((await dlg.getByLabel('First gym').inputValue()) !== 'optimo-nakheel-men') throw new Error('not preselected');
  await page.keyboard.press('Escape');
});
await step('Deep link ?compare=optimo-nakheel-men,optimo-malqa-men opens the drawer', async () => {
  await page.goto(`${base}?now=${now}&r=dl#/overview?compare=optimo-nakheel-men,optimo-malqa-men`); await page.waitForTimeout(2500);
  const dlg = page.getByRole('dialog'); await dlg.waitFor({ timeout: 3000 });
  if ((await dlg.getByLabel('First gym').inputValue()) !== 'optimo-nakheel-men') throw new Error('first');
  if ((await dlg.getByLabel('Second gym').inputValue()) !== 'optimo-malqa-men') throw new Error('second');
});
await step('Single-gym scope: comparison still shows both gyms, scope row highlighted, This gym summary', async () => {
  await page.evaluate(() => localStorage.setItem('opt.scope', '{"level":"club","clubId":"optimo-nakheel-men"}'));
  await page.goto(`${base}?now=${now}&r=club#/branch`); await page.waitForTimeout(2500);
  if ((await page.locator('.cmp__table tbody tr').count()) !== 2) throw new Error('not 2');
  const hl = await page.locator('.cmp__table tbody tr.is-scope .cmp__gymname').innerText();
  if (!/An Nakheel/.test(hl)) throw new Error(hl);
  if (!(await page.locator('.tg').isVisible())) throw new Error('no This gym');
});

console.log(results.join('\n'));
console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
