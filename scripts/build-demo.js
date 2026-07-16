/* build-demo.js — assemble _site/demo/ : a SHAREABLE, password-gated demo that
   includes EVERY lesson fully playable (free + licensed), for showing the whole
   product. A client-side password overlay gates each page (session-remembered).
   This is DEMO-ONLY security — it lives under /demo/ so the real public site
   (built by build-pages.js) stays clean and never ships licensed content.
   Run:  DEMO_PASSWORD='choose' node scripts/build-demo.js   (output: _site/demo/)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_site', 'demo');

const PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';
const HASH = crypto.createHash('sha256').update(PASSWORD, 'utf8').digest('hex');

// Full content EXCEPT build sources and dev files.
function copyTree(relDir) {
  const abs = path.join(ROOT, relDir);
  for (const name of fs.readdirSync(abs)) {
    const rel = path.join(relDir, name);
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) {
      if (/(^|\/)(src|i18n|_site|node_modules|scripts|hosting|\.git|\.github|docs)$/.test(rel)) continue;
      fs.mkdirSync(path.join(OUT, rel), { recursive: true });
      copyTree(rel);
    } else if (/\.(html|js|css|png|ico|svg|webmanifest)$/.test(name)) {
      fs.mkdirSync(path.join(OUT, path.dirname(rel)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), path.join(OUT, rel));
    }
  }
}

// The gate: a full-screen overlay injected before </body>; SHA-256 check,
// remembered per session so it's entered once.
const GATE = `<div id="demoGate" style="position:fixed;inset:0;z-index:99999;background:#0a2e63;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:16px">
<form id="demoForm" style="background:#fff;color:#14203a;padding:26px 24px;border-radius:16px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)">
<div style="font-size:1.6rem">🔓</div><h2 style="margin:.2rem 0;font-family:system-ui,sans-serif">Demo access</h2>
<p style="font-size:.88rem;color:#4b5a78;margin:.3rem 0 .8rem">Enter the demo password to explore every lesson, including the licensed ones.</p>
<input id="demoPw" type="password" autocomplete="off" placeholder="Demo password" style="width:100%;box-sizing:border-box;padding:11px;border:2px solid #dbe6f5;border-radius:9px;font-size:1rem">
<button type="submit" style="width:100%;padding:11px;border:0;border-radius:9px;background:#0a2e63;color:#fff;font-weight:700;font-size:1rem;cursor:pointer;margin-top:10px">Enter</button>
<div id="demoMsg" style="color:#e03131;font-size:.8rem;min-height:16px;margin-top:6px;font-weight:700"></div>
<p style="font-size:.72rem;color:#94a3b8;margin-top:10px">Demonstration build — not for distribution.</p>
</form></div>
<script>(function(){var HASH=${JSON.stringify(HASH)};function done(){var g=document.getElementById('demoGate');if(g)g.remove();}
try{if(sessionStorage.getItem('demoAuth')==='1'){done();return;}}catch(e){}
async function sha(s){var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
document.addEventListener('DOMContentLoaded',function(){var f=document.getElementById('demoForm');if(!f)return;f.addEventListener('submit',async function(e){e.preventDefault();var h=await sha(document.getElementById('demoPw').value);if(h===HASH){try{sessionStorage.setItem('demoAuth','1');}catch(e){}done();}else{document.getElementById('demoMsg').textContent='Wrong password — try again.';}});});})();</script>`;

function injectGates(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) injectGates(p);
    else if (name.endsWith('.html')) {
      let html = fs.readFileSync(p, 'utf8');
      if (html.includes('</body>')) html = html.replace('</body>', GATE + '\n</body>');
      else html += GATE;
      fs.writeFileSync(p, html);
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(ROOT)) {
  if (/\.(html)$/.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
for (const d of ['assets', 'gradek2', 'grade35', 'grade68', 'arcade']) if (fs.existsSync(path.join(ROOT, d))) { fs.mkdirSync(path.join(OUT, d), { recursive: true }); copyTree(d); }
injectGates(OUT);

const count = (d) => fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).length;
console.log('Built _site/demo/ (' + count(OUT) + ' files, all lessons playable, password-gated).');
console.log('Demo password: ' + (process.env.DEMO_PASSWORD ? '(from DEMO_PASSWORD env)' : "default 'demo1234' — set DEMO_PASSWORD to change"));
