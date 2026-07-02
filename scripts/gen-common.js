// Extract the shared-chrome COMMON dictionary from the verified Grade 3 locale.
// COMMON = every non-English UI key that is identical across all activities
// (i.e. everything except the per-grade header.eyebrow). Emits assets/build-ml.js.
const fs = require('fs');
const path = require('path');
const g3 = fs.readFileSync(path.join(__dirname, '..', 'grade35', 'locales', 'dc-grade3.js'), 'utf8');
global.window = {};
eval(g3);
const B = global.window.BREAKOUT;
const LANGS = ['es', 'vi', 'ar', 'hi', 'ur', 'zh'];
const SHARED = [
  'sect.clues','sect.cluesHint','sect.locks','sect.locksHint','crumb.teacher',
  'ui.reset','ui.check','ui.gotit','ui.playagain','ui.solved','ui.pcount','ui.wordph','ui.clear',
  'fb.digit','fb.word','fb.mc','fb.multiExtra','fb.multiMissing','fb.seq',
  'footer.privacy','footer.disclaimer'
];
const COMMON = {};
for (const k of SHARED) {
  COMMON[k] = {};
  for (const lg of LANGS) {
    if (B.UI[lg][k] === undefined) throw new Error(`missing ${k} in ${lg}`);
    COMMON[k][lg] = B.UI[lg][k];
  }
}
const banner = `/* build-ml.js — shared chrome translations for Digital Citizenship Breakouts.
   COMMON holds the ${SHARED.length} chrome/feedback keys that are identical across every
   activity, in 6 non-English languages (es, vi, ar, hi, ur, zh). Generated from the
   verified Grade 3 locale by scripts/gen-common.js — do not hand-edit; re-run the
   generator instead. Merge into a new locale's UI[es..zh] before authoring the
   per-grade keys (header.eyebrow + the 10 breakout-specific chrome strings):

     const {COMMON, mergeCommon} = require('./build-ml.js');
     mergeCommon(B);   // fills UI[es..zh] with the shared keys

   Non-English text is AI-seeded and pending native-speaker review. */
`;
const out = banner +
  'const COMMON = ' + JSON.stringify(COMMON, null, 1) + ';\n\n' +
  `const LANGS = ${JSON.stringify(LANGS)};\n\n` +
  `function mergeCommon(B) {\n` +
  `  for (const lg of LANGS)\n` +
  `    for (const k of Object.keys(COMMON))\n` +
  `      B.UI[lg][k] = COMMON[k][lg];\n` +
  `  return B;\n}\n\n` +
  `module.exports = { COMMON, LANGS, mergeCommon };\n`;
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'build-ml.js'), out);
console.log('Wrote assets/build-ml.js with', SHARED.length, 'shared keys x', LANGS.length, 'languages');
