/* gen-html.js — generate each activity's student HTML skeleton from its baked
   locale, so the static default text (used before JS/i18n runs, and for SEO)
   matches the English chrome. Clone of the verified Grade 3 skeleton; only the
   <title>, data-i18n default text, and locale <script src> change.

   Run after bake.js:  node scripts/gen-html.js  (regenerates dc-gradeN-student.html
   for every locale EXCEPT grade3, which is the hand-verified reference).
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BANDS = { grade35: [3, 4, 5], grade68: [6, 7, 8] };

function loadBreakout(p) {
  const fn = new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;');
  return fn({});
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(id, U) {
  const t = k => esc(U[k]);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${t('header.h1')} — Digital Citizenship Breakouts</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>:root{--navy:#0a2e63;--navy-d:#061f45;--red:#c1121f;--red-d:#8b0d16;--gold:#f5b800;--gold-d:#c08e00;--paper:#f4f8fd;--ink:#14203a;--ink-soft:#4b5a78;--card:#fff;--line:#dbe6f5;--good:#2f9e44;--bad:#e03131;--c1:#0a2e63;--c2:#2f6fe0;--c3:#1a7a8c;--c4:#f5b800;--c5:#0d47a1;--bg-a:rgba(245,184,0,.12);--bg-b:rgba(10,46,99,.10)}</style>
<link rel="stylesheet" href="../assets/breakout.css">
</head>
<body>
<canvas id="confetti"></canvas>
<div class="wrap">
  <div class="langbar"><span class="globe" aria-hidden="true">🌐</span><div data-i18n-picker></div></div>
  <div class="crumb"><a href="${id}.html" data-i18n="crumb.teacher">‹ Teacher launch</a> · <a href="index.html" data-i18n="crumb.suite">Digital Citizenship Breakouts</a></div>

  <header class="top">
    <div class="eyebrow" data-i18n="header.eyebrow">${t('header.eyebrow')}</div>
    <h1 data-i18n="header.h1">${t('header.h1')}</h1>
    <p class="sub" data-i18n="header.sub">${t('header.sub')}</p>
  </header>

  <div class="progress-wrap">
    <span class="pcount" id="pcount">0 of 4 locks open</span>
    <div class="lockdots" id="lockdots"></div>
    <button class="resetbtn" id="resetBtn" data-i18n="ui.reset">${t('ui.reset')}</button>
  </div>

  <div class="brief">
    <span class="tag" data-i18n="brief.label">${t('brief.label')}</span>
    <h2 data-i18n="brief.h">${t('brief.h')}</h2>
    <p data-i18n="brief.p">${t('brief.p')}</p>
  </div>

  <div class="section-title" data-i18n="sect.clues">${t('sect.clues')}</div>
  <p class="hint" data-i18n="sect.cluesHint">${t('sect.cluesHint')}</p>
  <div class="clue-grid" id="clueGrid"></div>

  <div class="section-title" data-i18n="sect.locks">${t('sect.locks')}</div>
  <p class="hint" data-i18n="sect.locksHint">${t('sect.locksHint')}</p>
  <div class="locks" id="locks"></div>

  <footer>
    <span data-i18n="footer.text">${t('footer.text')}</span> · <a href="policy.html" data-i18n="footer.privacy">${t('footer.privacy')}</a><br>
    <span style="opacity:.7" data-i18n="footer.disclaimer">${t('footer.disclaimer')}</span>
  </footer>
</div>

<div class="modal-bg" id="modalBg"><div class="modal" id="modal"></div></div>
<div class="win" id="win"><div class="win-card">
  <div class="stamp" data-i18n="win.stamp">${t('win.stamp')}</div>
  <h2 data-i18n="win.h">${t('win.h')}</h2>
  <p data-i18n="win.p">${t('win.p')}</p>
  <button id="winReplay" data-i18n="ui.playagain">${t('ui.playagain')}</button>
</div></div>

<script src="locales/${id}.js"></script>
<script src="../assets/i18n.js"></script>
<script src="../assets/breakout.js"></script>
</body>
</html>
`;
}

const only = process.argv[2];
for (const [band, grades] of Object.entries(BANDS)) {
  for (const g of grades) {
    const id = 'dc-grade' + g;
    if (id === 'dc-grade3') continue;                 // hand-verified reference — leave alone
    if (only && id !== only) continue;
    const locale = path.join(ROOT, band, 'locales', id + '.js');
    if (!fs.existsSync(locale)) continue;
    const B = loadBreakout(locale);
    const dest = path.join(ROOT, band, id + '-student.html');
    fs.writeFileSync(dest, page(id, B.UI.en));
    console.log('wrote', path.relative(ROOT, dest));
  }
}
