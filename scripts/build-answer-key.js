/* build-answer-key.js — generate the password-gated answer key.
   ---------------------------------------------------------------------------
   Derives the correct answer + reasoning for every lock from the baked English
   locales, encrypts the whole payload with AES-256-GCM (key = PBKDF2-SHA256,
   250k iterations), and writes answer-key.html with the ciphertext embedded.
   The page decrypts in the browser with Web Crypto once the teacher enters the
   password. Client-side crypto is acceptable HERE (answer keys only) — students
   aren't motivated to crack it, and no paid *curriculum* is exposed this way.

   Password: process.env.ANSWER_KEY_PASSWORD, else the documented default below.
   Rebuild after changing content or the password:
     ANSWER_KEY_PASSWORD='your-password' node scripts/build-answer-key.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PASSWORD = process.env.ANSWER_KEY_PASSWORD || 'teksdetective';
const ITER = 250000;

const META = {
  3: { band: 'grade35', teks: '§126.8', tier: 'free' }, 4: { band: 'grade35', teks: '§126.9', tier: 'free' },
  5: { band: 'grade35', teks: '§126.10', tier: 'free' }, 6: { band: 'grade68', teks: '§126.17', tier: 'paid' },
  7: { band: 'grade68', teks: '§126.18', tier: 'paid' }, 8: { band: 'grade68', teks: '§126.19', tier: 'paid' },
};
function loadBreakout(grade) {
  const p = path.join(ROOT, META[grade].band, 'locales', 'dc-grade' + grade + '.js');
  return new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;')({});
}
// human-readable correct answer for a lock (English)
function answerText(l) {
  switch (l.type) {
    case 'mc': return l.options[l.answerIndex];
    case 'word': return l.answer[0] + (l.answer.length > 1 ? '  (also accepts: ' + l.answer.slice(1).join(', ') + ')' : '');
    case 'digit': return l.answer.join(' or ');
    case 'seq': return l.answer.map(k => l.pads.find(p => p.k === k).e).join('  →  ');
    case 'multi': return l.items.filter(it => it.strong).map(it => it.t).join('  •  ');
    default: return '';
  }
}
const TYPE_LABEL = { mc: 'Multiple choice', word: 'Type the word', digit: 'Number code', seq: 'Order the steps', multi: 'Check all that apply' };

// build plaintext payload
const activities = [3, 4, 5, 6, 7, 8].map(g => {
  const B = loadBreakout(g), U = B.UI.en;
  return {
    grade: g, teks: META[g].teks, tier: META[g].tier, title: U['header.h1'],
    locks: B.CONTENT.en.locks.map((l, i) => ({
      n: i + 1, title: l.title, type: TYPE_LABEL[l.type] || l.type,
      q: l.q, answer: answerText(l), reason: l.reason,
    })),
    decoy: (B.CONTENT.en.clues.find(c => c.decoy) || {}).nm || '',
  };
});
const plaintext = JSON.stringify({ generated: 'Digital Citizenship Breakouts answer key', activities });

// encrypt: PBKDF2-SHA256(250k) -> AES-256-GCM
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(PASSWORD, 'utf8'), salt, ITER, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
const payload = {
  v: 1, iter: ITER, hash: 'SHA-256',
  salt: salt.toString('base64'), iv: iv.toString('base64'),
  data: Buffer.concat([ct, tag]).toString('base64'),   // ciphertext||tag, as Web Crypto expects
};

const PALETTE = ':root{--navy:#0a2e63;--navy-d:#061f45;--red:#c1121f;--red-d:#8b0d16;--gold:#f5b800;--gold-d:#c08e00;--paper:#f4f8fd;--ink:#14203a;--ink-soft:#4b5a78;--card:#fff;--line:#dbe6f5;--good:#2f9e44;--bad:#e03131;--c1:#0a2e63;--c2:#2f6fe0;--c3:#1a7a8c;--c4:#f5b800;--c5:#0d47a1;--bg-a:rgba(245,184,0,.12);--bg-b:rgba(10,46,99,.10)}';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>Answer Key — Digital Citizenship Breakouts</title>
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="assets/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="manifest" href="assets/site.webmanifest">
<meta name="theme-color" content="#0a2e63">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${PALETTE}</style>
<link rel="stylesheet" href="assets/site.css">
<style>
  .gate{max-width:460px;margin:6vh auto 0;text-align:center}
  .gate input{width:100%;border:2px solid var(--line);border-radius:10px;padding:12px 14px;font-size:1.05rem;font-family:inherit;font-weight:700;color:var(--navy);margin-top:14px}
  .gate input:focus{outline:none;border-color:var(--c3)}
  .gate .msg{min-height:22px;color:var(--bad);font-weight:700;margin-top:10px}
  .akact{margin:22px 0}
  .aklock{background:#fff;border:2px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0}
  .aklock .lkq{color:var(--ink-soft);font-weight:600;font-size:.9rem;margin:2px 0 8px}
  .aklock .ans{font-family:'Fredoka',sans-serif;font-weight:600;color:var(--good);font-size:1.02rem}
  .aklock .rsn{background:#fff4f4;border-left:4px solid var(--red);border-radius:8px;padding:8px 12px;font-size:.86rem;color:#6b2330;font-weight:600;margin-top:8px}
  .aktype{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:700}
  @media print{.gate,.crumb,.btnrow{display:none}.aklock{break-inside:avoid}}
</style>
</head>
<body>
<div class="wrap">
  <div class="crumb"><a href="index.html">‹ Suite home</a> · <a href="guide.html">Teacher guide</a></div>
  <div id="gate" class="gate">
    <div class="eyebrow">🔐 Teacher answer key</div>
    <h1>Answer Key</h1>
    <p class="lede">Answers and reasoning for every lock. Enter the teacher password to unlock.</p>
    <form id="gateForm">
      <input id="pw" type="password" placeholder="Teacher password" autocomplete="off" aria-label="Teacher password">
      <button class="btn" type="submit" style="margin-top:12px">Unlock</button>
      <div class="msg" id="msg"></div>
    </form>
    <p class="small" style="margin-top:16px">This page holds only answers, encrypted with AES-256. Full curriculum is never stored here.</p>
  </div>
  <div id="out" style="display:none"></div>
</div>
<script id="payload" type="application/json">${JSON.stringify(payload)}</script>
<script>
(function(){
  'use strict';
  const P = JSON.parse(document.getElementById('payload').textContent);
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function decrypt(password){
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name:'PBKDF2', salt:b64(P.salt), iterations:P.iter, hash:P.hash },
      baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64(P.iv) }, key, b64(P.data));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function render(d){
    const out = document.getElementById('out');
    out.innerHTML = '<div class="hero"><div class="eyebrow gold">🔓 Answer key</div><h1>Answers &amp; reasoning</h1>'
      + '<p class="lede">All six activities. Keep this private. Use <button class="btn ghost" onclick="window.print()" style="margin-left:6px">Print</button></p></div>'
      + d.activities.map(a =>
        '<div class="akact"><h2>Grade '+a.grade+' — '+esc(a.title)+' <span class="small">('+esc(a.teks)+(a.tier==='paid'?' · licensed':' · free')+')</span></h2>'
        + '<p class="small">Decoy clue (unused on purpose): <strong>'+esc(a.decoy)+'</strong></p>'
        + a.locks.map(l =>
            '<div class="aklock"><span class="aktype">Lock '+l.n+' · '+esc(l.type)+'</span>'
            + '<div style="font-family:Fredoka,sans-serif;font-weight:600;color:var(--navy);font-size:1.05rem">'+esc(l.title)+'</div>'
            + '<div class="lkq">'+esc(l.q)+'</div>'
            + '<div class="ans">✔ '+esc(l.answer)+'</div>'
            + '<div class="rsn">'+esc(l.reason)+'</div></div>'
          ).join('')
        + '</div>'
      ).join('');
    document.getElementById('gate').style.display = 'none';
    out.style.display = 'block';
  }
  document.getElementById('gateForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('msg'); msg.textContent = '';
    try { render(await decrypt(document.getElementById('pw').value)); }
    catch(_) { msg.textContent = 'Wrong password — try again.'; }
  });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'answer-key.html'), html);
console.log('Wrote answer-key.html (AES-256-GCM, PBKDF2-SHA256 x' + ITER + ').');
console.log('Password: ' + (process.env.ANSWER_KEY_PASSWORD ? '(from ANSWER_KEY_PASSWORD env)' : "default '" + PASSWORD + "' — rebuild with ANSWER_KEY_PASSWORD to change"));
