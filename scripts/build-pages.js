/* build-pages.js — assemble _site/ for the PUBLIC GitHub Pages preview.
   Publishes the FREE featured lessons (the six -free activities, one per grade)
   plus every preview/marketing/teacher page, but NEVER the licensed playable
   content: the licensed locale files (real clues/answers) and their
   *-student.html pages are excluded and replaced with an "Available only with a
   paid license" placeholder. Also drops build sources (src/, i18n/).
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

// The LICENSED activities: dc-grade{N} (the full per-grade lessons). The FREE
// featured lessons are dc-grade{N}-free and ARE published.
const bandOf = g => (g <= 2 ? 'gradek2' : g <= 5 ? 'grade35' : 'grade68');
const slugOf = g => (g === 0 ? 'K' : String(g));                       // K == grade 0
const PAID = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(g => ({ g, band: bandOf(g), id: 'dc-grade' + slugOf(g) }));
const isPaidLocale = name => /^dc-grade(?:K|\d)\.js$/.test(name);            // NOT ...-free.js
const isPaidStudent = name => /^dc-grade(?:K|\d)-student\.html$/.test(name); // NOT ...-free-student.html
function loadTitle(band, id) {
  const p = path.join(ROOT, band, 'locales', id + '.js');
  return new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;')({}).UI.en['header.h1'];
}

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
fs.mkdirSync(path.join(OUT, 'assets'));
copyTree('assets', () => false);

// Both bands: drop build sources; drop LICENSED locales + student pages (keep the
// free -free locales/student pages and every teacher page).
for (const band of ['gradek2', 'grade35', 'grade68']) {
  copyTree(band, (rel, isDir) => {
    if (isDir) return /(^|\/)(src|i18n)$/.test(rel);
    const name = path.basename(rel);
    return isPaidLocale(name) || isPaidStudent(name);
  });
}

// Licensed placeholders for the six paid student URLs (no content, no 404).
const BAND_NAME = { gradek2: 'Grades K–2', grade35: 'Grades 3–5', grade68: 'Grades 6–8' };
for (const { g, band, id } of PAID) {
  const title = loadTitle(band, id);
  const gl = slugOf(g);
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
  <div class="crumb"><a href="index.html">‹ ${BAND_NAME[band]} hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow gold">🔒 Available only with a paid license</div>
    <h1>${esc(title)}</h1>
    <p class="lede">This full Grade ${gl} lesson is part of the licensed curriculum and isn't available on the public preview. Play the <a href="../index.html">free featured lesson</a> for this grade, or view this activity's teacher page for its premise and standards alignment.</p>
    <div class="btnrow">
      <a class="btn" href="${id}.html">Teacher page &amp; standards</a>
      <a class="btn ghost" href="../index.html">Free featured lessons</a>
    </div>
  </div>
  <div class="panel tip"><strong>Licensed content.</strong> The full per-grade lessons are served to licensed districts through an authenticated session — never on the public site.</div>
  <footer>Digital Citizenship Breakouts · <a href="../index.html">Suite home</a> · <a href="../library.html">Library</a> · <a href="../guide.html">Teacher guide</a></footer>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, band, id + '-student.html'), html);
}

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// sanity: no licensed locale/student leaked
const leaked = [];
for (const { band, id } of PAID) {
  if (fs.existsSync(path.join(OUT, band, 'locales', id + '.js'))) leaked.push('locale ' + id);
  const sp = path.join(OUT, band, id + '-student.html');
  if (fs.existsSync(sp) && fs.readFileSync(sp, 'utf8').includes('id="clueGrid"')) leaked.push('playable ' + id);
}
if (leaked.length) { console.error('LEAK: licensed content in _site: ' + leaked.join(', ')); process.exit(1); }

const count = (d) => fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).length;
console.log('Built _site/ (' + count(OUT) + ' files). Free featured lessons published; 6 licensed lessons are placeholders.');
