/* bake.js — assemble a browser locale file from a per-grade content source.
   ---------------------------------------------------------------------------
   Uses the verified Grade 3 locale as the canonical chrome/translation template
   so every activity shares byte-identical shared chrome (sect.*, ui.*, fb.*,
   footer.*, crumb.*) and the 21 shared non-English COMMON strings. A per-grade
   JSON source (grade{band}/src/dc-gradeN.json) supplies only:
     - the 10 grade-specific English chrome strings,
     - header.eyebrow in all 7 languages,
     - the English CONTENT (6 clues incl. >=1 decoy, 4 locks each with a reason).
   CONTENT[es..zh] is left empty ([]) until the translation pass; the engine
   falls back to English for untranslated locales.

   Run:  node scripts/bake.js            (bakes every src/*.json it finds)
         node scripts/bake.js dc-grade4  (bakes one)
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NONEN = ['es', 'vi', 'ar', 'hi', 'ur', 'zh'];
const BANDS = { grade35: [3, 4, 5], grade68: [6, 7, 8] };

// grade -> band
function bandOf(grade) {
  for (const [b, gs] of Object.entries(BANDS)) if (gs.includes(grade)) return b;
  throw new Error('no band for grade ' + grade);
}

// canonical chrome template = verified Grade 3 locale
function loadTemplate() {
  const code = fs.readFileSync(path.join(ROOT, 'grade35', 'locales', 'dc-grade3.js'), 'utf8');
  const fn = new Function('window', code + '\nreturn window.BREAKOUT;');
  return fn({});
}

// maps source.chrome.* -> UI.en key
const CHROME_MAP = {
  eyebrowEn: 'header.eyebrow', h1: 'header.h1', sub: 'header.sub',
  briefLabel: 'brief.label', briefH: 'brief.h', briefP: 'brief.p',
  footerText: 'footer.text', winStamp: 'win.stamp', winH: 'win.h', winP: 'win.p',
};

// overlay.chrome.* -> UI[lang] key
function applyChrome(ui, ch) {
  const map = { h1: 'header.h1', sub: 'header.sub', briefLabel: 'brief.label', briefH: 'brief.h',
    briefP: 'brief.p', footerText: 'footer.text', winStamp: 'win.stamp', winH: 'win.h', winP: 'win.p', crumbSuite: 'crumb.suite' };
  for (const [k, key] of Object.entries(map)) if (ch[k] != null) ui[key] = ch[k];
}

// Build a localized CONTENT[lang] by cloning the EN structure and swapping ONLY
// text fields from the overlay. Structure (id, type, color, answerIndex, strong
// flags, pad keys/order, seq answer order, digit answers) always comes from EN.
function pick(t, fallback) { return (t == null || t === '') ? fallback : t; }
function localizeContent(en, ov) {
  const oc = ov.clues || [], ol = ov.locks || [];
  const clues = en.clues.map((c, i) => {
    const t = oc[i] || {};
    return Object.assign({}, c, { nm: pick(t.nm, c.nm), title: pick(t.title, c.title), body: pick(t.body, c.body) });
  });
  const locks = en.locks.map((l, i) => {
    const t = ol[i] || {};
    const nl = Object.assign({}, l, { title: pick(t.title, l.title), q: pick(t.q, l.q), reason: pick(t.reason, l.reason) });
    if (l.type === 'mc' && Array.isArray(t.options)) nl.options = l.options.map((o, j) => pick(t.options[j], o));
    if (l.type === 'multi' && Array.isArray(t.items)) nl.items = l.items.map((it, j) => Object.assign({}, it, { t: pick(t.items[j], it.t) }));
    if (l.type === 'seq' && Array.isArray(t.pads)) nl.pads = l.pads.map((p, j) => Object.assign({}, p, { e: pick(t.pads[j], p.e) }));
    if (l.type === 'word' && Array.isArray(t.answer)) nl.answer = [...new Set([...l.answer, ...t.answer].map(String))];
    return nl;
  });
  return { clues, locks };
}

function bakeOne(srcPath, template) {
  const S = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const T = template;
  const UI = { en: Object.assign({}, T.UI.en) };
  const c = S.chrome;
  UI.en['header.eyebrow'] = c.eyebrow.en;
  UI.en['header.h1'] = c.h1;
  UI.en['header.sub'] = c.sub;
  UI.en['brief.label'] = c.briefLabel;
  UI.en['brief.h'] = c.briefH;
  UI.en['brief.p'] = c.briefP;
  UI.en['footer.text'] = c.footerText;
  UI.en['win.stamp'] = c.winStamp;
  UI.en['win.h'] = c.winH;
  UI.en['win.p'] = c.winP;
  const enContent = { clues: S.clues, locks: S.locks };
  const CONTENT = { en: enContent };
  const i18nDir = path.join(path.dirname(path.dirname(srcPath)), 'i18n');
  for (const lg of NONEN) {
    UI[lg] = Object.assign({}, T.UI[lg]);           // 21 COMMON + eyebrow from template
    UI[lg]['header.eyebrow'] = c.eyebrow[lg];        // override eyebrow for this grade
    // Default this activity's own chrome to ENGLISH (so an untranslated activity
    // never inherits the template Grade 3's translations); overlay overrides below.
    for (const k of ['header.h1', 'header.sub', 'brief.h', 'brief.p', 'win.stamp', 'win.h', 'win.p']) UI[lg][k] = UI.en[k];
    // text-only translation overlay, if present — structure always comes from EN
    const ovPath = path.join(i18nDir, S.id + '.' + lg + '.json');
    if (fs.existsSync(ovPath)) {
      const ov = JSON.parse(fs.readFileSync(ovPath, 'utf8'));
      applyChrome(UI[lg], ov.chrome || {});
      CONTENT[lg] = localizeContent(enContent, ov);
    } else {
      CONTENT[lg] = { clues: [], locks: [] };        // untranslated — engine falls back to EN
    }
  }

  const B = { id: S.id, grade: S.grade, tier: S.tier || 'free', icon: S.icon || '', teks: S.teks || '', confetti: S.confetti, UI, CONTENT };
  const out = 'window.BREAKOUT = ' + JSON.stringify(B, null, 1) + ';\n';
  const band = bandOf(S.grade);
  const dest = path.join(ROOT, band, 'locales', S.id + '.js');
  fs.writeFileSync(dest, out);
  return path.relative(ROOT, dest);
}

const template = loadTemplate();
const srcDir = (g) => path.join(ROOT, bandOf(g), 'src');
const only = process.argv[2];
const sources = [];
for (const band of Object.keys(BANDS)) {
  const d = path.join(ROOT, band, 'src');
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith('.json') && (!only || f === only + '.json')) sources.push(path.join(d, f));
}
if (!sources.length) { console.error('No source JSON found' + (only ? ' for ' + only : '')); process.exit(1); }
for (const s of sources.sort()) console.log('baked', bakeOne(s, template));
