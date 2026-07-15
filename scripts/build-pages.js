/* build-pages.js — assemble _site/ for the PUBLIC GitHub Pages preview.
   Publishes the FREE tier + all preview/marketing pages, but never the paid
   Grades 6-8 playable content: grade68 locales (the actual clues/answers) and
   the grade68 *-student.html pages are excluded. The three paid student URLs are
   replaced with a "licensed" placeholder so nothing 404s and nothing leaks.
   Also excludes build sources (src/, i18n/) and dev files.
   Run: node scripts/build-pages.js   (output: _site/)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_site');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PALETTE = ':root{--navy:#0a2e63;--navy-d:#061f45;--red:#c1121f;--red-d:#8b0d16;--gold:#f5b800;--gold-d:#c08e00;--paper:#f4f8fd;--ink:#14203a;--ink-soft:#4b5a78;--card:#fff;--line:#dbe6f5;--good:#2f9e44;--bad:#e03131;--c1:#0a2e63;--c2:#2f6fe0;--c3:#1a7a8c;--c4:#f5b800;--c5:#0d47a1;--bg-a:rgba(245,184,0,.12);--bg-b:rgba(10,46,99,.10)}';
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">';

function loadTitle(g) {
  const p = path.join(ROOT, 'grade68', 'locales', 'dc-grade' + g + '.js');
  return new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;')({}).UI.en['header.h1'];
}

// recursive copy with a skip predicate (rel path from ROOT, and isDir)
function copyTree(relDir, skip) {
  const abs = path.join(ROOT, relDir);
  for (const name of fs.readdirSync(abs)) {
    const rel = path.join(relDir, name);
    const st = fs.statSync(path.join(ROOT, rel));
    if (skip(rel, st.isDirectory())) continue;
    if (st.isDirectory()) { fs.mkdirSync(path.join(OUT, rel), { recursive: true }); copyTree(rel, skip); }
    else { fs.mkdirSync(path.join(OUT, path.dirname(rel)), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), path.join(OUT, rel)); }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// top-level public pages
for (const f of ['index.html', 'library.html', 'correlation.html', 'guide.html', 'scope.html', 'lessons.html', 'udl.html', 'elps.html', 'answer-key.html']) {
  fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
// shared assets (engine, styles, icons, og, manifest)
fs.mkdirSync(path.join(OUT, 'assets'));
copyTree('assets', () => false);
// FREE band — keep locales + html, drop build sources
copyTree('grade35', (rel, isDir) => isDir && /(^|\/)(src|i18n)$/.test(rel));
// PAID band — keep only the preview pages; drop locales + build sources + student pages
copyTree('grade68', (rel, isDir) => {
  if (isDir) return /(^|\/)(src|i18n|locales)$/.test(rel);
  return /-student\.html$/.test(rel);        // never publish playable paid pages
});

// licensed placeholders for the three paid student URLs (no content, no 404)
for (const g of [6, 7, 8]) {
  const title = loadTitle(g);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${esc(title)} — Licensed activity</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0a2e63">
${FONTS}
<style>${PALETTE}</style>
<link rel="stylesheet" href="../assets/site.css">
</head>
<body>
<div class="wrap">
  <div class="crumb"><a href="index.html">‹ Grades 6–8 hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow gold">🔒 Licensed activity</div>
    <h1>${esc(title)}</h1>
    <p class="lede">This Grades 6–8 breakout is part of the licensed tier and isn't available on the public preview. Explore the free Grades 3–5 activities, or view this activity's teacher page for its premise and standards alignment.</p>
    <div class="btnrow">
      <a class="btn" href="dc-grade${g}.html">Teacher page &amp; standards</a>
      <a class="btn ghost" href="../grade35/index.html">Try the free activities</a>
    </div>
  </div>
  <div class="panel tip"><strong>Licensed content.</strong> The full Grades 6–8 activities are served to licensed districts through an authenticated session — never on the public site.</div>
  <footer>Digital Citizenship Breakouts · <a href="../index.html">Suite home</a> · <a href="../library.html">Library</a> · <a href="../guide.html">Teacher guide</a></footer>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'grade68', 'dc-grade' + g + '-student.html'), html);
}

// GitHub Pages: skip Jekyll processing
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// sanity: no paid content leaked
const leaked = [];
for (const g of [6, 7, 8]) {
  if (fs.existsSync(path.join(OUT, 'grade68', 'locales', 'dc-grade' + g + '.js'))) leaked.push('locale ' + g);
}
if (fs.existsSync(path.join(OUT, 'grade68', 'locales'))) leaked.push('grade68/locales dir');
if (leaked.length) { console.error('LEAK: paid content in _site: ' + leaked.join(', ')); process.exit(1); }

const count = (d) => fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).length;
console.log('Built _site/ (' + count(OUT) + ' files). Paid locales excluded; grade68 student pages are licensed placeholders.');
