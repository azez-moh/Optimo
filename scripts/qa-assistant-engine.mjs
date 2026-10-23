// Unit check of the Ask OPTIMO built-in engine: prints question -> intent and answer text.
//   node scripts/qa-assistant-engine.mjs [--role=coo|fm] [--lang=en|ar] [--full]
// Loads the TypeScript sources through Vite's SSR loader (no browser), on the same fixed clock as scripts/shoot.mjs.
import { createServer } from 'vite';

const flag = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const role = flag('role', 'coo');
const full = process.argv.includes('--full');
const nowMs = Number(flag('now', String(Date.UTC(2026, 9, 22, 15, 30))));

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buildStatic } = await server.ssrLoadModule('/src/data/build.ts');
  const { buildLive } = await server.ssrLoadModule('/src/data/dynamics.ts');
  const { answer, blocksToText } = await server.ssrLoadModule('/src/pages/Assistant/engine.ts');
  const stat = buildStatic();
  const data = {
    ...stat, now: new Date(nowMs), tick: 0, live: buildLive(stat, nowMs),
    patch() {}, remove() {}, add() {}, reset() {}, patches: { set: {}, removed: {}, added: {} },
  };
  const scopeClubs = role === 'fm' ? stat.clubs.filter((c) => c.id === 'optimo-malqa-men') : stat.clubs;
  const fmPages = ['overview', 'assistant', 'bms-overview', 'hvac', 'lights', 'ai-agents', 'control', 'bms-settings', 'live-floor', 'machines', 'reports'];
  const can = (path) => role === 'coo' || fmPages.includes(path.replace(/^[#/]+/, '').split(/[/?#]/)[0]);
  const QS = [
    ['en', 'Compare Al Malqa and An Nakheel'],
    ['en', 'Which machines need service?'],
    ['en', 'How busy are the gyms?'],
    ['en', 'What should I do about the rowers?'],
    ['en', 'How much energy did we save this month?'],
    ['en', 'Which zones are too warm at Malqa?'],
    ['ar', 'كم عدد التنبيهات المفتوحة؟'],
    ['ar', 'قارن استهلاك الطاقة بين الملقا والنخيل'],
    ['ar', 'ما الأجهزة الأقل استخدامًا؟'],
    ['ar', 'ما وضع المبنى والتكييف؟'],
    ['ar', 'متى أوقات الذروة في النخيل؟'],
    ['ar', 'ما الطقس غدًا؟'],
  ];
  const langArg = flag('lang', '');
  for (const [qLang, q] of QS) {
    const lang = langArg || qLang;
    const a = answer(q, { data, lang, role, scopeClubs, can });
    const text = blocksToText(a.blocks);
    const lines = text.split('\n');
    console.log(`\nQ [${role}/${lang}] ${q}\n  -> intent=${a.intent} understood=${a.understood}`);
    console.log((full ? lines : lines.slice(0, 6)).map((l) => `     ${l}`).join('\n') + (!full && lines.length > 6 ? `\n     ... (${lines.length - 6} more lines)` : ''));
  }
} finally {
  await server.close();
}
