/* solve-test.js — the quality gate for Digital Citizenship Breakouts.
   ---------------------------------------------------------------------------
   For every activity (grade35 + grade68), this harness:
     1. Renders the real student HTML in jsdom with the actual engine
        (locale -> i18n -> breakout), in EN, ZH (fallback) and AR (RTL).
     2. Drives the DOM to solve all four locks and asserts the win screen
        fires, with ZERO console/JS errors.
     3. Asserts structural invariants on each locale:
        6 clues incl. >=1 decoy; 4 locks each with a non-empty reason;
        mc answerIndex in range; seq answers reference existing pads;
        multi has strong + non-strong; UI key parity across languages;
        every translated CONTENT locale is structurally identical to EN.

   Run: node solve-test.js   ->   must print ALL PASS before anything ships.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const LANGS = ['en', 'es', 'vi', 'ar', 'hi', 'ur', 'zh'];
const NONEN = LANGS.filter(l => l !== 'en');

// ---- discover activities -------------------------------------------------
function discover() {
  const acts = [];
  for (const band of ['grade35', 'grade68']) {
    const dir = path.join(ROOT, band);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      const m = f.match(/^(dc-grade\d)-student\.html$/);
      if (!m) continue;
      const id = m[1];
      acts.push({ id, band, html: path.join(dir, f), locale: path.join(dir, 'locales', id + '.js') });
    }
  }
  return acts;
}

// ---- load a locale's BREAKOUT object in isolation ------------------------
function loadBreakout(localePath) {
  const code = fs.readFileSync(localePath, 'utf8');
  const sandbox = { window: {} };
  const fn = new Function('window', code + '\nreturn window.BREAKOUT;');
  return fn(sandbox.window);
}

let failures = 0;
const problems = [];
function check(cond, msg) { if (!cond) { failures++; problems.push('  ✗ ' + msg); return false; } return true; }

// ---- structural assertions ----------------------------------------------
// EN key sets are the reference; every activity must match these exactly.
let EN_KEYS = null, NONEN_KEYS = null;

function structural(act, B) {
  const tag = act.id;
  check(B && B.id === act.id, `${tag}: BREAKOUT.id must equal "${act.id}"`);
  check(Array.isArray(B.confetti) && B.confetti.length >= 3, `${tag}: confetti palette present`);

  // ---- UI key parity
  const enKeys = Object.keys(B.UI.en || {}).sort();
  if (!EN_KEYS) EN_KEYS = enKeys;
  check(enKeys.join(',') === EN_KEYS.join(','),
    `${tag}: EN UI keys match reference set (${EN_KEYS.length})`);
  const nonEnRef = NONEN_KEYS || (NONEN_KEYS = Object.keys(B.UI.es || {}).sort());
  for (const lg of NONEN) {
    const ks = Object.keys(B.UI[lg] || {}).sort();
    check(ks.join(',') === nonEnRef.join(','),
      `${tag}: ${lg} UI keys match reference non-EN set (${nonEnRef.length}); got ${ks.length}`);
  }

  // ---- EN content
  const en = B.CONTENT.en;
  check(en && Array.isArray(en.clues) && en.clues.length === 6, `${tag}: exactly 6 clues`);
  const ids = new Set();
  (en.clues || []).forEach((c, i) => {
    ['id', 'ico', 'nm', 'title', 'body'].forEach(f => check(c[f], `${tag}: clue ${i} has ${f}`));
    check(!ids.has(c.id), `${tag}: clue id "${c.id}" unique`); ids.add(c.id);
  });
  const decoys = (en.clues || []).filter(c => c.decoy === true).length;
  check(decoys >= 1, `${tag}: at least one clue flagged decoy:true (found ${decoys})`);

  check(en && Array.isArray(en.locks) && en.locks.length === 4, `${tag}: exactly 4 locks`);
  (en.locks || []).forEach((l, i) => {
    const lt = `${tag}: lock ${l.id || i}`;
    check(l.id && /^L\d+$/.test(l.id), `${lt}: id like L1`);
    check(typeof l.reason === 'string' && l.reason.trim().length > 10, `${lt}: has a real reason`);
    check(l.title && l.q, `${lt}: has title + question`);
    check(['digit', 'word', 'mc', 'multi', 'seq'].includes(l.type), `${lt}: valid type`);
    if (l.type === 'mc') {
      check(Array.isArray(l.options) && l.options.length >= 2, `${lt}: >=2 options`);
      check(Number.isInteger(l.answerIndex) && l.answerIndex >= 0 && l.answerIndex < l.options.length, `${lt}: answerIndex in range`);
    } else if (l.type === 'word') {
      check(Array.isArray(l.answer) && l.answer.length >= 1 && l.answer.every(a => String(a).length), `${lt}: non-empty answer list`);
    } else if (l.type === 'digit') {
      check(Array.isArray(l.answer) && l.answer.length >= 1, `${lt}: has answers`);
      check(Number.isInteger(l.len) && l.len >= 1, `${lt}: has len`);
      check(l.answer.every(a => new RegExp('^\\d{' + l.len + '}$').test(String(a))), `${lt}: answers are ${l.len}-digit numbers`);
    } else if (l.type === 'seq') {
      check(Array.isArray(l.pads) && l.pads.length >= 2, `${lt}: >=2 pads`);
      const pk = new Set(l.pads.map(p => p.k));
      check(pk.size === l.pads.length, `${lt}: pad keys unique`);
      check(Array.isArray(l.answer) && l.answer.length >= 2, `${lt}: has ordered answer`);
      check(l.answer.every(k => pk.has(k)), `${lt}: every answer key references an existing pad`);
    } else if (l.type === 'multi') {
      check(Array.isArray(l.items) && l.items.length >= 3, `${lt}: >=3 items`);
      check(l.items.some(it => it.strong), `${lt}: has >=1 strong item`);
      check(l.items.some(it => !it.strong), `${lt}: has >=1 non-strong item`);
    }
  });

  // ---- translated CONTENT must be structurally identical to EN (text may differ)
  for (const lg of NONEN) {
    const c = B.CONTENT[lg];
    if (!c || !Array.isArray(c.clues) || c.clues.length === 0) continue; // not translated yet — engine falls back to EN
    check(c.clues.length === en.clues.length, `${tag}[${lg}]: clue count matches EN`);
    check(c.locks.length === en.locks.length, `${tag}[${lg}]: lock count matches EN`);
    en.locks.forEach((l, i) => {
      const t = c.locks[i]; if (!t) return;
      check(t.id === l.id && t.type === l.type, `${tag}[${lg}] lock ${i}: id+type match EN`);
      if (l.type === 'mc') check(t.answerIndex === l.answerIndex && t.options.length === l.options.length, `${tag}[${lg}] ${l.id}: mc structure matches EN`);
      if (l.type === 'seq') check(JSON.stringify(t.answer) === JSON.stringify(l.answer) && t.pads.length === l.pads.length, `${tag}[${lg}] ${l.id}: seq order/pads match EN`);
      if (l.type === 'multi') check(t.items.length === l.items.length && t.items.every((it, j) => !!it.strong === !!l.items[j].strong), `${tag}[${lg}] ${l.id}: multi strong-flags match EN`);
      if (l.type === 'digit') check(JSON.stringify(t.answer) === JSON.stringify(l.answer), `${tag}[${lg}] ${l.id}: digit answers match EN`);
    });
  }
}

// ---- render + drive in a real DOM ---------------------------------------
function resolveContent(B, lang) {
  const d = B.CONTENT[lang];
  return (d && d.clues && d.clues.length) ? d : B.CONTENT.en;
}

async function renderAndSolve(act, lang) {
  const tag = `${act.id}[${lang}]`;
  // Inline the external scripts (locale -> i18n -> breakout) in place, so they
  // run during parse exactly as a browser would and DOMContentLoaded fires
  // naturally. Faithful ordering is what makes render-time bugs surface here.
  const htmlDir = path.dirname(act.html);
  const html = fs.readFileSync(act.html, 'utf8').replace(
    /<script src="([^"]+)"><\/script>/g,
    (_, src) => `<script>\n${fs.readFileSync(path.resolve(htmlDir, src), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`
  );

  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail || e.message || e)));
  vc.sendTo({ error: (...a) => errors.push('console.error: ' + a.join(' ')), warn() {}, log() {}, info() {}, debug() {} });

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: `http://localhost/${act.band}/${act.id}-student.html?lang=${lang}`,
    virtualConsole: vc,
  });
  const w = dom.window, doc = w.document;
  // let DOMContentLoaded fire and the engine initialize
  await new Promise(r => w.setTimeout(r, 0));

  w.addEventListener('error', e => errors.push('window.error: ' + (e.error && e.error.stack || e.message)));
  // stub canvas + timers so confetti/win are synchronous and don't throw
  w.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, save() {}, translate() {}, rotate() {}, fillRect() {}, restore() {}, set fillStyle(v) {},
  });
  w.requestAnimationFrame = () => 0;
  w.setTimeout = (fn) => { try { fn(); } catch (e) { errors.push('setTimeout: ' + e.stack); } return 0; };

  // language wiring assertions
  const expectDir = (lang === 'ar' || lang === 'ur') ? 'rtl' : 'ltr';
  check(doc.documentElement.getAttribute('dir') === expectDir, `${tag}: <html dir> = ${expectDir}`);
  check(doc.documentElement.getAttribute('lang') === lang, `${tag}: <html lang> = ${lang}`);

  const B = w.BREAKOUT;
  const data = resolveContent(B, lang);

  // clues render
  check(doc.querySelectorAll('#clueGrid .clue').length === data.clues.length, `${tag}: all clues rendered`);

  // drive each lock
  for (const l of data.locks) {
    const card = doc.getElementById('card-' + l.id);
    if (!check(card, `${tag}: lock card ${l.id} rendered`)) continue;
    if (l.type === 'mc') {
      card.querySelector(`.mc button[data-i="${l.answerIndex}"]`).click();
    } else if (l.type === 'word') {
      card.querySelector('.wordin').value = l.answer[0];
      card.querySelector('.lk-submit').click();
    } else if (l.type === 'digit') {
      const inputs = [...card.querySelectorAll('.digit')];
      String(l.answer[0]).split('').forEach((d, i) => { if (inputs[i]) inputs[i].value = d; });
      card.querySelector('.lk-submit').click();
    } else if (l.type === 'seq') {
      const pads = card.querySelectorAll('.seqpad');
      l.answer.forEach(k => card.querySelector(`.seqpad[data-k="${k}"]`).click());
      card.querySelector('.lk-submit').click();
    } else if (l.type === 'multi') {
      l.items.forEach((it, i) => { if (it.strong) card.querySelector(`.multi-opt[data-i="${i}"]`).click(); });
      card.querySelector('.lk-submit').click();
    }
    check(card.classList.contains('solved'), `${tag}: lock ${l.id} solved`);
  }

  check(doc.getElementById('win').classList.contains('show'), `${tag}: win screen fired`);
  check(errors.length === 0, `${tag}: zero console/JS errors` + (errors.length ? ' -> ' + errors.slice(0, 3).join(' | ') : ''));
  dom.window.close();
}

// ---- run -----------------------------------------------------------------
(async () => {
  const acts = discover();
  if (!acts.length) { console.error('No activities found.'); process.exit(1); }
  console.log(`Found ${acts.length} activit${acts.length === 1 ? 'y' : 'ies'}: ${acts.map(a => a.id).join(', ')}\n`);

  for (const act of acts) {
    const B = loadBreakout(act.locale);
    structural(act, B);
    for (const lang of ['en', 'zh', 'ar']) await renderAndSolve(act, lang);
    const bad = problems.length;
    console.log(`${bad ? '…' : '✓'} ${act.id}`);
  }

  console.log('');
  if (failures) {
    console.log(problems.join('\n'));
    console.log(`\n${failures} FAILURE(S)`);
    process.exit(1);
  }
  console.log('ALL PASS');
})();
