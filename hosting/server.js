/* server.js — auth gateway for the PAID tier (Grades 6–8) of the Digital
   Citizenship Breakouts. The free tier (grades 3–5 + top-level pages) is served
   directly by nginx as static files; this app sits in front of a PROTECTED
   directory and serves paid activities ONLY to an authenticated district
   session. Unauthenticated requests never receive the paid HTML.

   Design (see plan §7):
     - Per-district accounts (issued on purchase), password-hashed with bcrypt.
     - Server-side sessions (httpOnly cookie), NOT a shared client password.
     - The paid tree lives OUTSIDE the web root (PAID_DIR) so a misconfigured
       nginx static route can't leak it.
     - Optional IP allow-list per district to slow credential sharing.

   Env:
     PORT           (default 8080)
     SESSION_SECRET (required in production)
     PAID_DIR       (default ../grade68) — protected tree to serve at /grade68
     ACCOUNTS_FILE  (default ./accounts.json)
     COOKIE_SECURE  ('1' to require HTTPS cookies; set behind TLS/nginx)
*/
'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 8080;
const PAID_DIR = path.resolve(process.env.PAID_DIR || path.join(__dirname, '..', 'grade68'));
const ACCOUNTS_FILE = path.resolve(process.env.ACCOUNTS_FILE || path.join(__dirname, 'accounts.json'));
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';

function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); }
  catch (_) { console.warn('No accounts file at ' + ACCOUNTS_FILE + ' — nobody can log in yet.'); return []; }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind nginx
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'digcit.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === '1', maxAge: 8 * 60 * 60 * 1000 },
}));

// very light brute-force slowdown: track failed attempts per IP
const fails = new Map();
function tooMany(ip) { const f = fails.get(ip); return f && f.n >= 8 && Date.now() - f.t < 10 * 60 * 1000; }
function noteFail(ip) { const f = fails.get(ip) || { n: 0, t: Date.now() }; f.n++; f.t = Date.now(); fails.set(ip, f); }
function clearFail(ip) { fails.delete(ip); }

function ipAllowed(acct, ip) {
  if (!acct.ipAllow || !acct.ipAllow.length) return true;      // no restriction
  return acct.ipAllow.some(prefix => ip && ip.startsWith(prefix));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.districtId) return next();
  if (req.accepts('html')) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  return res.status(401).send('Authentication required.');
}

const loginPage = (msg, next) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="referrer" content="no-referrer">
<title>District sign-in — Digital Citizenship Breakouts</title>
<style>body{font-family:system-ui,sans-serif;background:#f4f8fd;color:#14203a;display:flex;min-height:100vh;
align-items:center;justify-content:center;margin:0}form{background:#fff;border:2px solid #dbe6f5;border-radius:16px;
padding:28px 26px;width:340px;box-shadow:0 10px 30px rgba(10,36,99,.1)}h1{color:#0a2e63;font-size:1.4rem;margin:0 0 4px}
p{color:#4b5a78;font-size:.9rem;margin:0 0 16px}label{font-weight:700;font-size:.85rem;color:#0a2e63}
input{width:100%;box-sizing:border-box;border:2px solid #dbe6f5;border-radius:9px;padding:11px;margin:6px 0 12px;font-size:1rem}
button{width:100%;background:#0a2e63;color:#fff;border:0;border-radius:9px;padding:12px;font-size:1rem;font-weight:700;cursor:pointer}
.msg{color:#e03131;font-weight:700;font-size:.85rem;min-height:18px;margin-bottom:8px}.small{font-size:.78rem;color:#4b5a78}</style>
</head><body><form method="POST" action="/login">
<h1>District sign-in</h1><p>Grades 6–8 are licensed content. Sign in with your district credentials.</p>
<div class="msg">${msg || ''}</div>
<input type="hidden" name="next" value="${(next || '/grade68/index.html').replace(/"/g, '&quot;')}">
<label>District ID</label><input name="district" autocomplete="username" autofocus>
<label>Password</label><input name="password" type="password" autocomplete="current-password">
<button type="submit">Sign in</button>
<p class="small" style="margin-top:14px">Trouble? Contact your suite administrator. Free Grades 3–5 need no login.</p>
</form></body></html>`;

app.get('/login', (req, res) => {
  if (req.session.districtId) return res.redirect('/grade68/index.html');
  res.set('Content-Type', 'text/html').send(loginPage('', req.query.next));
});

app.post('/login', (req, res) => {
  const ip = req.ip || '';
  const next = typeof req.body.next === 'string' && req.body.next.startsWith('/grade68') ? req.body.next : '/grade68/index.html';
  if (tooMany(ip)) return res.status(429).set('Content-Type', 'text/html').send(loginPage('Too many attempts. Wait a few minutes.', next));
  const accts = loadAccounts();
  const acct = accts.find(a => a.id === String(req.body.district || '').trim());
  const ok = acct && bcrypt.compareSync(String(req.body.password || ''), acct.hash) && ipAllowed(acct, ip);
  if (!ok) { noteFail(ip); return res.status(401).set('Content-Type', 'text/html').send(loginPage('Wrong district ID or password.', next)); }
  clearFail(ip);
  req.session.regenerate(err => {
    if (err) return res.status(500).send('Session error.');
    req.session.districtId = acct.id;
    req.session.districtName = acct.name || acct.id;
    res.redirect(next);
  });
});

app.post('/logout', (req, res) => { req.session.destroy(() => res.redirect('/login')); });

// Protected paid tree. requireAuth runs first, so unauthenticated requests
// never reach express.static and never receive a paid file.
app.use('/grade68', requireAuth, express.static(PAID_DIR, {
  extensions: ['html'], setHeaders: r => r.set('Cache-Control', 'private, no-store'),
}));

app.get('/healthz', (_req, res) => res.type('text').send('ok'));
app.get('/', (_req, res) => res.redirect('/grade68/index.html'));

app.listen(PORT, () => {
  console.log(`digcit paid-tier auth app on :${PORT}`);
  console.log(`  serving protected ${PAID_DIR} at /grade68 (auth required)`);
  console.log(`  accounts: ${ACCOUNTS_FILE}`);
  if (SESSION_SECRET.startsWith('dev-only')) console.warn('  WARNING: set SESSION_SECRET in production.');
});

module.exports = app;
