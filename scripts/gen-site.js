/* gen-site.js — generate all non-activity pages of the Digital Citizenship suite
   from the baked locales + a small standards-alignment map. Deterministic, so
   the site stays consistent as content changes. Produces:
     index.html                         suite landing (free cards + locked MORE)
     correlation.html                   TEKS correlation guide (per band)
     guide.html                         suite curriculum guide
     grade35/index.html grade68/index.html   band hubs
     grade35/policy.html grade68/policy.html privacy/compliance
     grade35/implementation.html grade68/implementation.html  band implementation plans
     grade{band}/dc-gradeN.html         per-activity teacher launch pages (NO answers)
   Run:  node scripts/gen-site.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const PALETTE = ':root{--navy:#0a2e63;--navy-d:#061f45;--red:#c1121f;--red-d:#8b0d16;--gold:#f5b800;--gold-d:#c08e00;--paper:#f4f8fd;--ink:#14203a;--ink-soft:#4b5a78;--card:#fff;--line:#dbe6f5;--good:#2f9e44;--bad:#e03131;--c1:#0a2e63;--c2:#2f6fe0;--c3:#1a7a8c;--c4:#f5b800;--c5:#0d47a1;--bg-a:rgba(245,184,0,.12);--bg-b:rgba(10,46,99,.10)}';
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// grade -> {band, icon, teks, tier}. FOCUS[grade] = [[focus, substrand] x4] aligned to L1..L4 order.
const META = {
  3: { band: 'grade35', icon: '👣', teks: '§126.8', tier: 'free' },
  4: { band: 'grade35', icon: '🗂️', teks: '§126.9', tier: 'free' },
  5: { band: 'grade35', icon: '🍪', teks: '§126.10', tier: 'free' },
  6: { band: 'grade68', icon: '⚖️', teks: '§126.17', tier: 'paid' },
  7: { band: 'grade68', icon: '🌀', teks: '§126.18', tier: 'paid' },
  8: { band: 'grade68', icon: '🔎', teks: '§126.19', tier: 'paid' },
};
const FOCUS = {
  3: [['Choosing safe links', '(c)(10)'], ['Recognizing a digital footprint', '(c)(10)'], ['Giving credit for creative work', '(c)(9)'], ['Responding to an unkind message', '(c)(8)']],
  4: [['Digital footprint permanence', '(c)(10)'], ['Etiquette across text, email & chat', '(c)(8)'], ['Creator rights & giving credit', '(c)(9)'], ['Being an upstander to cyberbullying', '(c)(8)']],
  5: [['Components of a digital footprint', '(c)(10)'], ['Audience-appropriate etiquette', '(c)(8)'], ['Secured connections (HTTPS)', '(c)(10)'], ['Copyright consequences & permission', '(c)(9)']],
  6: [['IP terms: public domain & fair use', '(c)(9)'], ['Spotting exaggerated claims; citing sources', '(c)(9)'], ['Phishing, malware & identity theft', '(c)(10)'], ['Legally reusing & citing a work', '(c)(9)']],
  7: [['Consequences of IP law', '(c)(9)'], ['Evaluating media spin & misrepresentation', '(c)(9)'], ['Defending against cyberattacks', '(c)(10)'], ['Impact of & response to cyberbullying', '(c)(8)']],
  8: [['Evaluating source bias & reliability', '(c)(9)'], ['Naming bias in a digital source', '(c)(9)'], ['IP law when creating & publishing', '(c)(9)'], ['Cybersecurity breach response', '(c)(10)']],
};
const SUBSTRANDS = {
  '(c)(8)': 'Social interactions',
  '(c)(9)': 'Ethics & laws',
  '(c)(10)': 'Privacy, safety & security',
};

// ---- CLEAR thinking process (canonical) ----------------------------------
const CLEAR = [
  { L: 'C', k: 'Claim', color: '#7c3aed', q: 'What exactly is being said?', pts: ['Make the claim specific.', 'Make it testable.'] },
  { L: 'L', k: 'Lens', color: '#0891b2', q: 'What assumptions am I bringing?', pts: ['What do I already believe?', 'Am I reacting to evidence or past experience?'] },
  { L: 'E', k: 'Evidence', color: '#2f9e44', q: 'What supports the claim?', pts: ['Strong: facts, data, direct observations', 'Weak: rumors, impressions', 'Missing: what do I still need to know?'] },
  { L: 'A', k: 'Alternatives', color: '#f59e0b', q: 'What else could explain this?', pts: ['Consider other causes.', 'Consider other viewpoints.', 'Avoid oversimplifying.'] },
  { L: 'R', k: 'Response', color: '#2563eb', q: 'What should I do now?', pts: ['Ask a question · gather more information · challenge the claim', 'Document the issue · speak up · wait'] },
];
const CLEAR_REMINDER = 'What do I think? Why do I think it? What might I be missing? What should I do next?';
function clearBlock() {
  const rows = CLEAR.map(s => `<div class="clear-row">
      <div class="clear-badge" style="background:${s.color}">${s.L}</div>
      <div class="clear-body"><h4>${s.k} <span class="clear-q">${esc(s.q)}</span></h4>
      <ul>${s.pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
    </div>`).join('\n    ');
  return `<div class="clear-grid">
    ${rows}
  </div>
  <div class="panel tip" style="margin-top:14px"><strong>Quick reminder:</strong> ${esc(CLEAR_REMINDER)}</div>`;
}
const CLEAR_CSS = `
  .clear-grid{display:flex;flex-direction:column;gap:10px;margin-top:14px}
  .clear-row{display:flex;gap:14px;align-items:flex-start;background:#fff;border:2px solid var(--line);border-radius:14px;padding:14px 16px}
  .clear-badge{flex:0 0 auto;width:46px;height:46px;border-radius:12px;color:#fff;font-family:'Fredoka',sans-serif;font-weight:700;font-size:1.6rem;display:flex;align-items:center;justify-content:center}
  .clear-body h4{margin:.1rem 0 .3rem;font-size:1.05rem;color:var(--navy)}
  .clear-body .clear-q{font-weight:600;color:var(--ink-soft);font-size:.9rem}
  .clear-body ul{margin:.2rem 0 0;padding-left:1.1rem}
  .clear-body li{font-size:.9rem;color:var(--ink);margin:.1rem 0}`;

// ---- Teacher dropdown nav (top-right, near the language switcher) ---------
const TEACHER_CSS = `
  .wrap{position:relative}
  .teacher-menu{position:absolute;top:14px;right:16px;z-index:60;font-family:'Nunito',sans-serif}
  .teacher-menu>summary{list-style:none;cursor:pointer;background:var(--navy);color:#fff;font-weight:800;font-size:.85rem;padding:8px 14px;border-radius:100px;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(10,46,99,.28)}
  .teacher-menu>summary::-webkit-details-marker{display:none}
  .teacher-menu[open]>summary{background:var(--navy-d)}
  .teacher-menu .tm-panel{position:absolute;right:0;margin-top:8px;background:#fff;border:2px solid var(--line);border-radius:14px;box-shadow:0 16px 40px rgba(10,20,60,.18);padding:8px;min-width:236px;display:flex;flex-direction:column;gap:2px}
  .teacher-menu .tm-h{font-size:.66rem;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-soft);font-weight:800;padding:6px 12px 3px}
  .teacher-menu .tm-panel a{display:flex;justify-content:space-between;gap:12px;padding:9px 12px;border-radius:9px;color:var(--ink);font-weight:700;font-size:.9rem;text-decoration:none}
  .teacher-menu .tm-panel a:hover{background:var(--bg-b);color:var(--navy)}
  @media(max-width:680px){.teacher-menu{position:static;margin:0 0 12px;text-align:right}.teacher-menu .tm-panel{left:auto}}`;
function teacherNav(depth) {
  const p = depth ? '../' : '';
  const item = (href, label, ico) => `<a href="${p}${href}">${label}<span aria-hidden="true">${ico}</span></a>`;
  return `<details class="teacher-menu">
  <summary>👩‍🏫 Teachers ▾</summary>
  <div class="tm-panel">
    <div class="tm-h">Teacher resources</div>
    ${item('guide.html', 'Curriculum Guide', '📘')}
    ${item('scope.html', 'Scope &amp; Sequence', '🗺️')}
    ${item('lessons.html', 'Lesson-Plan Guide', '📝')}
    ${item('correlation.html', 'TEKS Correlation', '📊')}
    ${item('udl.html', 'UDL Supports', '♿')}
    ${item('elps.html', 'ELPS Supports', '🌎')}
    ${item('answer-key.html', 'Answer Key', '🔐')}
  </div>
</details>`;
}

// ---- per-activity lesson data (big idea, EQ, objectives, vocab) -----------
const LESSON = {
  3: { big: 'Everything you do online leaves a digital footprint; choosing safe links, giving credit, and being kind keep that footprint positive.', eq: 'What marks do you leave online, and how do you keep your footprint safe and kind?', obj: 'Students will describe what a digital footprint is and identify safe choices for links, credit, and kindness online.', lang: 'Students will use footprint, safe, and credit to explain how to stay safe and kind online, using a sentence stem.', vocab: 'digital footprint, safe link, password, credit, kindness', success: 'I can explain what a digital footprint is and name one way to stay safe and one way to be kind online.' },
  4: { big: 'Your online record can last a long time; good etiquette, giving creators credit, and being an upstander keep it positive.', eq: 'Why does the internet remember, and how should you act because it does?', obj: 'Students will explain why online posts persist and identify etiquette, copyright, and upstander actions.', lang: 'Students will use permanent, etiquette, and copyright to explain responsible online behavior.', vocab: 'permanent record, etiquette, copyright, credit, upstander', success: 'I can explain why posts last and name a kind, respectful, and creator-fair choice.' },
  5: { big: 'A digital footprint has parts (activity, games, social); secure connections and etiquette protect it, and copyright has consequences.', eq: 'What makes up your footprint, and how do trackers and secure sites affect it?', obj: 'Students will identify components of a digital footprint, recognize a secure (HTTPS) connection, and explain copyright consequences.', lang: 'Students will use tracker, secure connection (HTTPS), and permission to explain how data follows them online.', vocab: 'tracker, cookies, HTTPS / secure connection, audience, permission', success: 'I can name parts of my footprint and explain how a secure connection and permission protect me.' },
  6: { big: 'Intellectual-property terms (copyright, fair use, creative commons, public domain) guide reuse; citing sources and spotting scams keep you safe.', eq: 'When can you reuse a creator’s work, and how do you cite it and stay safe online?', obj: 'Students will distinguish IP terms, cite a source, and identify phishing, malware, and identity-theft signs.', lang: 'Students will use fair use, public domain, and citation to explain when and how to reuse work.', vocab: 'copyright, fair use, creative commons, public domain, citation, phishing', success: 'I can tell whether I may reuse a work, cite it, and spot a phishing attempt.' },
  7: { big: 'Media can exaggerate or misrepresent; understanding IP consequences and defending against cyberattacks builds a critical, safe user.', eq: 'How does media spin information, and how do you defend against it and against cyberattacks?', obj: 'Students will evaluate how media exaggerates or misrepresents, explain IP-law consequences, and describe cyberattack defenses.', lang: 'Students will use spin, misrepresent, and evaluate to analyze a media message.', vocab: 'spin, exaggerate, misrepresent, clickbait, cyberattack', success: 'I can spot how a message is spun and name one defense against a cyberattack.' },
  8: { big: 'Strong digital citizens evaluate a source’s bias and reliability, create within IP law, and respond to real cybersecurity situations.', eq: 'How do you judge whether a digital source is reliable, and how do you create and stay secure responsibly?', obj: 'Students will evaluate a source’s bias and reliability, apply IP law when creating, and respond to a cybersecurity scenario.', lang: 'Students will use bias, reliable, and source to evaluate a website or article.', vocab: 'bias, reliability, credibility, source, breach / authentication', success: 'I can judge a source’s reliability and name a responsible way to create and stay secure.' },
};

function loadBreakout(grade) {
  const p = path.join(ROOT, META[grade].band, 'locales', 'dc-grade' + grade + '.js');
  const fn = new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;');
  return fn({});
}
const ACT = {};
for (const g of Object.keys(META)) ACT[g] = { grade: +g, ...META[g], B: loadBreakout(g) };

// ---- shared shell --------------------------------------------------------
// Absolute origin for social/OG image URLs — set via SITE_URL env (see config.js).
const { SITE_URL } = require('./config');
const OG_DESC = 'Critical Thinking Online Breakouts for Digital Citizenship — grades 3–8, TEKS-aligned, in 7 languages. Runs in the browser; no logins, no data collected.';
function assets(depth) { return depth ? '../assets' : 'assets'; }
function headMeta(depth, title, desc) {
  const a = assets(depth);
  return `<link rel="icon" href="${a}/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="${a}/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="${a}/apple-touch-icon.png">
<link rel="manifest" href="${a}/site.webmanifest">
<meta name="theme-color" content="#0a2e63">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Digital Citizenship Breakouts">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_URL}/assets/og.png">`;
}
function shell({ depth = 0, title, extraHead = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
${headMeta(depth, title, OG_DESC)}
${FONTS}
<style>${PALETTE}</style>
<link rel="stylesheet" href="${assets(depth)}/site.css">
<style>${TEACHER_CSS}${CLEAR_CSS}</style>${extraHead}
</head>
<body>
<div class="wrap">
${teacherNav(depth)}
${body}
</div>
</body>
</html>
`;
}
function footer(depth, policyHref) {
  return `<footer>
  Digital Citizenship Breakouts · Aligned to Texas TEKS Technology Applications (adopted 2022, required K–8). Paraphrased alignment — not legal advice.<br>
  <a href="${depth ? '../' : ''}index.html">Suite home</a> · <a href="${depth ? '../' : ''}library.html">Library</a> · <a href="${depth ? '../' : ''}guide.html">Teacher guide</a> · <a href="${depth ? '../' : ''}scope.html">Scope &amp; sequence</a> · <a href="${depth ? '../' : ''}lessons.html">Lesson plans</a> · <a href="${depth ? '../' : ''}correlation.html">TEKS correlation</a> · <a href="${depth ? '../' : ''}udl.html">UDL</a> · <a href="${depth ? '../' : ''}elps.html">ELPS</a>${policyHref ? ` · <a href="${policyHref}">Privacy &amp; compliance</a>` : ''}
</footer>`;
}

// ---- activity card -------------------------------------------------------
function card(grade, { depthToBand }) {
  const a = ACT[grade], U = a.B.UI.en;
  const href = `${depthToBand}dc-grade${grade}-student.html`;
  const teacher = `${depthToBand}dc-grade${grade}.html`;
  const locked = a.tier === 'paid';
  return `<a class="card${locked ? ' locked' : ''}" href="${locked ? teacher : href}">
    <span class="badge">Grade ${grade} · ${a.teks}</span>
    <div class="ico">${a.icon}</div>
    <div class="ctitle">${esc(U['header.h1'])}</div>
    <div class="cdesc">${esc(U['header.sub'])}</div>
    <span class="tier">${locked ? '🔒' : '<span class="freeflag">FREE</span>'}</span>
    <span class="cgo">${locked ? 'Licensed districts →' : 'Start the breakout →'}</span>
  </a>`;
}

// ---- SUITE LANDING -------------------------------------------------------
function suiteLanding() {
  const free = [3, 4, 5].map(g => card(g, { depthToBand: 'grade35/' })).join('\n    ');
  const paid = [6, 7, 8].map(g => card(g, { depthToBand: 'grade68/' })).join('\n    ');
  const body = `  <div class="hero">
    <div class="eyebrow">Digital Citizenship · TEKS Technology Applications</div>
    <h1>Digital Citizenship Breakouts</h1>
    <p class="lede">A suite of Critical Thinking Online Breakouts for grades 3–8. Students read clues, reason through four locks, and learn to think — not just click — online. Multilingual, and it runs entirely in the browser.</p>
    <div class="btnrow">
      <a class="btn" href="grade35/index.html">Grades 3–5 (free)</a>
      <a class="btn ghost" href="grade68/index.html">Grades 6–8</a>
      <a class="btn ghost" href="library.html">🔎 Browse library</a>
      <a class="btn ghost" href="guide.html">Teacher guide</a>
    </div>
  </div>

  <h2>Free tier — Grades 3–5</h2>
  <p class="section-note">Fully free and open. No login, no account, nothing collected. Share the link and go.</p>
  <div class="cards">
    ${free}
  </div>

  <h2>More — Grades 6–8</h2>
  <p class="section-note">The middle-school band is included with a district license. Preview the premise and standards on each activity's teacher page.</p>
  <div class="cards">
    ${paid}
  </div>

  <h2>Why Critical Thinking Online Breakouts (CTOBs)?</h2>
  <div class="panel gold">
    <p>A <strong>Critical Thinking Online Breakout (CTOB)</strong> is a browser-based digital escape room built for <em>reasoning, not recall</em>. Students read six short clues — one a deliberate <strong>decoy</strong> — and use them to open four locks. Each lock reveals a one-sentence <em>reason</em> that names <em>why</em> the answer follows from the evidence. There are no logins, nothing is graded, and <strong>Start over</strong> is always one tap away, so the cost of thinking out loud and being wrong is zero.</p>
    <p>CTOBs run on the <strong>CLEAR thinking process</strong> — a simple critical-thinking checklist students can carry into any claim, message, or source they meet online. Every lock is a small CLEAR rep: the decoy trains students to weigh <em>Evidence</em> and reject a true-but-irrelevant fact; the “strong evidence” lock makes the strong / weak / missing distinction explicit; and the revealed reason models the <em>Response</em>. Digital citizenship is judgment — and CLEAR is how students practice it.</p>
  </div>
  <h3>The CLEAR thinking process</h3>
  <p class="section-note">A simple critical-thinking checklist. Students walk it on every breakout and can carry it into any claim, message, or source they meet online.</p>
  ${clearBlock()}
  <p class="section-note">Full teacher materials: <a href="guide.html">curriculum guide</a> · <a href="scope.html">scope &amp; sequence</a> · <a href="lessons.html">lesson-plan guide</a> · <a href="correlation.html">TEKS correlation</a> · <a href="udl.html">UDL</a> &amp; <a href="elps.html">ELPS</a> supports.</p>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), shell({ depth: 0, title: 'Digital Citizenship Breakouts — Grades 3–8', body }));
}

// ---- BAND HUB ------------------------------------------------------------
function bandHub(band, grades, opts) {
  const cards = grades.map(g => card(g, { depthToBand: '' })).join('\n    ');
  const paidNote = opts.paid ? `<div class="panel tip"><strong>Licensed band.</strong> These activities are served to licensed districts through an authenticated session. Teacher pages (premise + standards) are open to everyone.</div>` : '';
  const body = `  <div class="crumb"><a href="../index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${opts.paid ? ' gold' : ''}">${opts.label}</div>
    <h1>${opts.title}</h1>
    <p class="lede">${opts.lede}</p>
    <div class="btnrow">
      <a class="btn ghost" href="implementation.html">Implementation plan</a>
      <a class="btn ghost" href="../correlation.html">Standards correlation</a>
    </div>
  </div>
  ${paidNote}
  <div class="cards">
    ${cards}
  </div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, band, 'index.html'), shell({ depth: 1, title: opts.title + ' — Digital Citizenship Breakouts', body }));
}

// ---- TEACHER LAUNCH PAGE (no answers) ------------------------------------
function teacherPage(grade) {
  const a = ACT[grade], U = a.B.UI.en, locks = a.B.CONTENT.en.locks, focus = FOCUS[grade];
  const rows = locks.map((l, i) => `<tr><td><span class="lk">Lock ${i + 1}</span><br><span class="small">${esc(l.title)}</span></td>
      <td>${esc(focus[i][0])}</td>
      <td><span class="pill sub">${focus[i][1]} ${SUBSTRANDS[focus[i][1]]}</span></td></tr>`).join('\n    ');
  const substrandsUsed = [...new Set(focus.map(f => f[1]))].sort();
  const decoy = (a.B.CONTENT.en.clues.find(c => c.decoy) || {}).nm || 'the decoy clue';
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(a.band === 'grade35' ? 'Grades 3–5' : 'Grades 6–8')} hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${a.tier === 'paid' ? ' gold' : ''}">Teacher launch · Grade ${grade} · TEKS ${a.teks}</div>
    <h1>${esc(U['header.h1'])}</h1>
    <p class="lede">${esc(U['header.sub'])}</p>
    <div class="btnrow">
      <a class="btn" href="dc-grade${grade}-student.html">${a.tier === 'paid' ? 'Open activity (licensed)' : 'Launch student activity'}</a>
      <a class="btn ghost" href="../correlation.html">Correlation</a>
    </div>
  </div>

  <div class="panel gold">
    <h3>The premise</h3>
    <p>${esc(U['brief.p'])}</p>
  </div>

  <h2>How this breakout builds CLEAR thinking</h2>
  <p class="section-note">Every Critical Thinking Online Breakout runs on the <strong>CLEAR</strong> process — Claim, Lens, Evidence, Alternatives, Response (<a href="../guide.html">full framework</a>). Here is where students practice each step in this activity:</p>
  <div class="panel"><ul>
    <li><strong>Claim</strong> — for each lock, decide what answer it is really asking for, and make it specific.</li>
    <li><strong>Lens</strong> — notice what you already assume before you choose.</li>
    <li><strong>Evidence</strong> — weigh the six clues; “${esc(decoy)}” is true but off-topic, so it is not evidence for any lock.</li>
    <li><strong>Alternatives</strong> — the multiple-choice and multi-select locks force a comparison of competing options.</li>
    <li><strong>Response</strong> — the reason revealed after each lock models the justified answer to act on.</li>
  </ul></div>

  <h2>Standards alignment</h2>
  <p class="section-note">Aligned to Texas TEKS Technology Applications, Grade ${grade}, <strong>${a.teks}</strong>, Digital Citizenship strand — subsections ${substrandsUsed.join(', ')}. Skills are paraphrased; read the official standard at <a href="https://tea.texas.gov" target="_blank" rel="noopener">tea.texas.gov</a>. This page shows the reasoning focus of each lock — <strong>not the answers.</strong></p>
  <div class="tbl-wrap"><table>
    <caption>What each lock asks students to reason about</caption>
    <thead><tr><th>Lock</th><th>Reasoning focus</th><th>DigCit substrand</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table></div>

  <h2>In the classroom</h2>
  <div class="panel">
    <ul>
      <li><strong>Warm up (5 min).</strong> Ask: "${esc(U['brief.h'])}" — what does this mean online? Surface prior experience before the activity.</li>
      <li><strong>Model one clue.</strong> Open a single clue together and think aloud: what does this tell us, and which lock might it help?</li>
      <li><strong>Reason, don't guess.</strong> Require students to say <em>why</em> before checking a lock. After each solve, read the revealed <em>reason</em> and compare it to their thinking.</li>
      <li><strong>Spot the decoy.</strong> One clue is true but useless. Debrief which one and how they knew — a core evaluation skill.</li>
      <li><strong>Language support.</strong> The 🌐 picker offers 7 languages; pair newcomers to discuss clues in their home language, then answer.</li>
      <li><strong>Extend.</strong> Have students write a new clue, or a real-life example, for the focus skill they found hardest.</li>
    </ul>
  </div>
  <div class="disclaimer">Answers are intentionally not shown here. The full answer key (with the reasoning for every lock) is on the password-gated <a href="../answer-key.html">answer-key page</a>. This alignment is a good-faith paraphrase for lesson planning and is not legal advice.</div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, a.band, 'dc-grade' + grade + '.html'), shell({ depth: 1, title: U['header.h1'] + ' — Teacher launch (Grade ' + grade + ')', body }));
}

// ---- CORRELATION GUIDE ---------------------------------------------------
function correlation() {
  function bandTable(label, grades) {
    const rows = grades.map(g => {
      const a = ACT[g], U = a.B.UI.en, locks = a.B.CONTENT.en.locks, focus = FOCUS[g];
      const lockList = locks.map((l, i) => `<div class="lk">Lock ${i + 1}: <span style="font-weight:600">${esc(l.title)}</span> — ${esc(focus[i][0])} <span class="pill sub">${focus[i][1]}</span></div>`).join('');
      return `<tr>
        <td><span class="lk">${esc(U['header.h1'])}</span><br><span class="small">Grade ${g}${a.tier === 'paid' ? ' · licensed' : ' · free'}</span></td>
        <td>${lockList}</td>
        <td><strong>${a.teks}</strong><br><span class="small">(c)(8)(9)(10)</span></td>
      </tr>`;
    }).join('\n    ');
    return `<h2>${label}</h2>
  <div class="tbl-wrap"><table>
    <caption>Activity · locks &amp; reasoning focus · TEKS section</caption>
    <thead><tr><th>Activity</th><th>Locks (reasoning focus · substrand)</th><th>TEKS §</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table></div>`;
  }
  const legend = Object.entries(SUBSTRANDS).map(([k, v]) => `<span class="pill sub">${k}</span> ${v}`).join(' &nbsp; ');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Standards correlation</div>
    <h1>TEKS Correlation Guide</h1>
    <p class="lede">How each breakout aligns to the Texas TEKS Technology Applications Digital Citizenship strand (adopted 2022, implemented 2024–25, required K–8).</p>
  </div>
  <div class="panel tip"><strong>Substrands:</strong> ${legend}</div>
  ${bandTable('Grades 3–5 (free tier)', [3, 4, 5])}
  ${bandTable('Grades 6–8 (licensed tier)', [6, 7, 8])}
  <div class="disclaimer">Skills are <strong>paraphrased</strong> to respect TEA's copyright — no official standard text is reproduced. Cite the § number and read the source at <a href="https://tea.texas.gov" target="_blank" rel="noopener">tea.texas.gov</a>. Alignment is a good-faith mapping for planning and is not legal advice.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'correlation.html'), shell({ depth: 0, title: 'TEKS Correlation Guide — Digital Citizenship Breakouts', body }));
}

// ---- CURRICULUM GUIDE ----------------------------------------------------
function guide() {
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Teacher guide</div>
    <h1>Curriculum Guide</h1>
    <p class="lede">Purpose, design, and how to run the Digital Citizenship Breakouts across grades 3–8.</p>
  </div>

  <h2>Purpose</h2>
  <p>The suite builds <strong>digital citizenship through reasoning</strong>. Every activity aligns to the Texas TEKS Technology Applications Digital Citizenship strand and its three substrands — social interactions; ethics &amp; laws; and privacy, safety &amp; security — but the deeper goal is <em>critical thinking</em>: students weigh evidence, reject a decoy, and justify each answer before they check it.</p>

  <h2>The CLEAR thinking process</h2>
  <p>Each lock is designed so a correct guess is not enough — students should be able to explain the <em>reason</em>, which the activity reveals after every solve. That habit is the <strong>CLEAR thinking process</strong>, a simple critical-thinking checklist students can carry into any claim, message, or source they meet online:</p>
  ${clearBlock()}
  <p>Every breakout is CLEAR practice: the six clues are the <strong>Evidence</strong> (some strong, some weak, one a true-but-irrelevant decoy); choosing which clue opens which lock forces students to name their <strong>Claim</strong> and check their <strong>Lens</strong>; the multi-select lock asks them to sort strong evidence from a plausible distractor; and the revealed reason after each lock models the <strong>Response</strong>. Push students to say <em>why</em> before they check — grade the reasoning, not the click.</p>

  <h2>How to deploy</h2>
  <div class="panel">
    <ul>
      <li><strong>Any device, any time.</strong> Each activity is one self-contained page — no install, no login, no data collected. Share the URL or embed it in your LMS.</li>
      <li><strong>Whole-class or independent.</strong> Project and solve together for younger grades; assign independently or in pairs for older ones.</li>
      <li><strong>Multilingual.</strong> The 🌐 picker offers English, Spanish, Vietnamese, Arabic, Hindi, Urdu, and Chinese (translations are AI-seeded, pending native review).</li>
      <li><strong>Teacher pages first.</strong> Open the activity's teacher launch page for the premise, standards, and classroom moves. It never shows answers.</li>
    </ul>
  </div>

  <h2>Free vs. licensed</h2>
  <div class="panel gold">
    <p><strong>Free tier — Grades 3–5.</strong> Fully open and static. Use them with anyone, anywhere.</p>
    <p><strong>Licensed tier — Grades 6–8</strong> (and future "More" activities). Included with a district license and served through an authenticated session. Teacher pages and this guide remain open so you can evaluate before you buy.</p>
  </div>

  <h2>Assessment</h2>
  <p>These are formative by design. Use the revealed reasons as discussion prompts, ask students to write the reasoning for the lock they found hardest, or have them author a new clue. The gated <a href="answer-key.html">answer key</a> lists every answer with its reasoning for your reference.</p>

  <div class="btnrow">
    <a class="btn" href="grade35/implementation.html">Grades 3–5 plan</a>
    <a class="btn" href="grade68/implementation.html">Grades 6–8 plan</a>
    <a class="btn ghost" href="correlation.html">Correlation guide</a>
  </div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'guide.html'), shell({ depth: 0, title: 'Curriculum Guide — Digital Citizenship Breakouts', body }));
}

// ---- IMPLEMENTATION PLAN (per band) --------------------------------------
function implementation(band, grades, opts) {
  const list = grades.map(g => {
    const U = ACT[g].B.UI.en;
    return `<li><strong>Grade ${g} — ${esc(U['header.h1'])}.</strong> ${esc(U['header.sub'])} <span class="small">(TEKS ${ACT[g].teks})</span></li>`;
  }).join('\n      ');
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(opts.hub)}</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${opts.paid ? ' gold' : ''}">Implementation plan</div>
    <h1>${opts.title}</h1>
    <p class="lede">${opts.lede}</p>
  </div>

  <h2>The activities</h2>
  <div class="panel"><ul>
      ${list}
  </ul></div>

  <h2>Pacing</h2>
  <div class="panel">
    <ul>
      <li><strong>One activity ≈ 25–40 minutes</strong>, including debrief. Younger classes may need two sittings.</li>
      <li>Run one per grading period, or cluster them into a two-week digital-citizenship unit.</li>
      <li>Order matches the grade sequence; each grade deepens footprint, etiquette, IP, and safety themes.</li>
    </ul>
  </div>

  <h2>Prerequisites</h2>
  <div class="panel">
    <ul>
      <li>A browser and the activity link. No accounts, installs, or logins.</li>
      <li>${opts.prereq}</li>
      <li>Teachers: skim the activity's teacher launch page and the <a href="../correlation.html">correlation guide</a> first.</li>
    </ul>
  </div>

  <h2>Extension &amp; differentiation</h2>
  <div class="panel">
    <ul>
      <li><strong>Home-language pairs.</strong> Use the 🌐 picker so newcomers reason in their strongest language, then answer.</li>
      <li><strong>Author-a-clue.</strong> Students write a new clue (or a real-world example) for the skill they found hardest.</li>
      <li><strong>Reason aloud.</strong> Require a spoken/written justification before each lock check; grade the reasoning, not the click.</li>
      <li>${opts.extend}</li>
    </ul>
  </div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, band, 'implementation.html'), shell({ depth: 1, title: opts.title + ' — Digital Citizenship Breakouts', body }));
}

// ---- POLICY --------------------------------------------------------------
function policy(band, label) {
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(label)} hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Privacy &amp; compliance</div>
    <h1>Privacy &amp; Compliance</h1>
    <p class="lede">What these activities do — and, more importantly, do not do — with student data.</p>
  </div>

  <div class="panel tip">
    <h3>The short version</h3>
    <p>Each breakout runs <strong>entirely in the student's browser</strong>. There are no accounts, no logins, and no analytics. We do not collect, transmit, or store any personal information.</p>
  </div>

  <h2>What we collect</h2>
  <div class="panel"><ul>
    <li><strong>Nothing personal.</strong> No names, no emails, no student records — ever.</li>
    <li><strong>No tracking.</strong> No cookies for advertising, no third-party analytics, no fingerprinting.</li>
    <li><strong>Local only.</strong> Your chosen language is remembered in your own browser (localStorage) so the picker stays put. It never leaves the device and you can clear it anytime.</li>
    <li>Every page sends <span class="pill">referrer: no-referrer</span> so navigation is not leaked to other sites.</li>
  </ul></div>

  <h2>Compliance posture</h2>
  <div class="panel"><ul>
    <li>Because no personal data is collected, the activities are designed to sit comfortably within <strong>COPPA</strong> and <strong>FERPA</strong> expectations and Texas student-data-privacy requirements.</li>
    <li>Fonts load from Google Fonts; if your district blocks external font CDNs the pages still work (they fall back to system fonts).</li>
    <li>Content is 100% original / open-licensed. No copyrighted media, no real platform UIs, no photos of children.</li>
  </ul></div>

  <div class="disclaimer">This notice describes the design intent of the activities and is provided for district review; it is not legal advice. Confirm fit with your district's privacy officer.</div>
${footer(1, null)}`;
  fs.writeFileSync(path.join(ROOT, band, 'policy.html'), shell({ depth: 1, title: 'Privacy & Compliance — Digital Citizenship Breakouts', body }));
}

// ---- SEARCHABLE LIBRARY --------------------------------------------------
// Curated, leak-safe search keywords per grade (no answers / no paid content).
const KEYWORDS = {
  3: ['footprint', 'online safety', 'safe links', 'passwords', 'kindness', 'giving credit', 'copyright', 'cyberbullying'],
  4: ['footprint', 'permanence', 'etiquette', 'email', 'chat', 'texting', 'copyright', 'creator credit', 'cookies', 'cyberbullying', 'upstander'],
  5: ['footprint', 'tracking', 'cookies', 'trackers', 'etiquette', 'audience', 'https', 'secure connection', 'copyright', 'permission', 'privacy'],
  6: ['intellectual property', 'copyright', 'fair use', 'creative commons', 'public domain', 'open source', 'citing sources', 'misinformation', 'phishing', 'malware', 'identity theft', 'cyberbullying'],
  7: ['intellectual property', 'copyright', 'media literacy', 'misinformation', 'clickbait', 'bias', 'spin', 'cyberattack', 'security', 'cyberbullying'],
  8: ['source evaluation', 'bias', 'reliability', 'credibility', 'misinformation', 'intellectual property', 'copyright', 'attribution', 'cybersecurity', 'breach', 'authentication', 'cyberbullying'],
};
function buildCatalog() {
  return Object.keys(META).map(g => {
    const a = ACT[g], U = a.B.UI.en, focus = FOCUS[g];
    const subs = [...new Set(focus.map(f => f[1]))].sort();
    const clueNames = a.B.CONTENT.en.clues.map(c => c.nm);
    const lockTitles = a.B.CONTENT.en.locks.map(l => l.title);
    const hay = [U['header.h1'], U['header.sub'], a.teks, ...focus.map(f => f[0]), ...lockTitles, ...clueNames,
      ...(KEYWORDS[g] || []), ...subs.map(s => SUBSTRANDS[s])].join(' ').toLowerCase();
    return {
      grade: +g, band: a.band === 'grade35' ? '3-5' : '6-8', teks: a.teks, tier: a.tier, icon: a.icon,
      title: U['header.h1'], sub: U['header.sub'], focus: focus.map(f => f[0]), subs,
      href: (a.band === 'grade35' ? 'grade35/' : 'grade68/') + (a.tier === 'paid' ? `dc-grade${g}.html` : `dc-grade${g}-student.html`),
      hay,
    };
  });
}
function library() {
  const catalog = buildCatalog();
  const subLegend = Object.entries(SUBSTRANDS).map(([k, v]) => `<button class="chip" data-sub="${k}">${k} ${v}</button>`).join('');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Activity library</div>
    <h1>Find an activity</h1>
    <p class="lede">Search all ${catalog.length} breakouts by title, skill, standard, or keyword — then filter by grade band, tier, and Digital Citizenship substrand.</p>
  </div>

  <div class="panel">
    <input id="q" class="search" type="search" placeholder="Search: footprint, copyright, phishing, bias, §126.17 …" aria-label="Search activities" autocomplete="off">
    <div class="filters">
      <span class="fgroup"><span class="flabel">Band</span>
        <button class="chip" data-band="3-5">Grades 3–5</button>
        <button class="chip" data-band="6-8">Grades 6–8</button></span>
      <span class="fgroup"><span class="flabel">Tier</span>
        <button class="chip" data-tier="free">Free</button>
        <button class="chip" data-tier="paid">Licensed</button></span>
      <span class="fgroup"><span class="flabel">Substrand</span>${subLegend}</span>
      <button id="clear" class="chip clear">Clear</button>
    </div>
  </div>

  <p id="count" class="section-note"></p>
  <div id="grid" class="cards"></div>
  <p id="empty" class="section-note" style="display:none">No activities match. <a href="#" id="reset">Clear filters</a>.</p>
${footer(0)}`;

  const extraHead = `
<style>
  .search{width:100%;border:2px solid var(--line);border-radius:12px;padding:13px 16px;font-size:1.05rem;font-family:inherit;font-weight:700;color:var(--navy)}
  .search:focus{outline:none;border-color:var(--c3)}
  .filters{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:14px}
  .fgroup{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .flabel{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:800;margin-right:2px}
  .chip{background:#fff;border:2px solid var(--line);border-radius:100px;padding:6px 13px;font-family:inherit;font-weight:700;
    font-size:.82rem;color:var(--navy);cursor:pointer;transition:.14s}
  .chip:hover{border-color:var(--c3)}
  .chip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
  .chip.clear{color:var(--ink-soft);border-style:dashed}
  mark{background:var(--gold);color:var(--navy-d);padding:0 2px;border-radius:3px}
</style>`;

  const script = `
<script id="catalog" type="application/json">${JSON.stringify(catalog)}</script>
<script>
(function(){
  'use strict';
  var CAT = JSON.parse(document.getElementById('catalog').textContent);
  var grid = document.getElementById('grid'), count = document.getElementById('count'), empty = document.getElementById('empty');
  var state = { q:'', band:new Set(), tier:new Set(), sub:new Set() };
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function hi(text, q){ if(!q) return esc(text); try{ return esc(text).replace(new RegExp('('+q.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+')','ig'),'<mark>$1</mark>'); }catch(e){ return esc(text); } }
  function matches(a){
    if(state.band.size && !state.band.has(a.band)) return false;
    if(state.tier.size && !state.tier.has(a.tier)) return false;
    if(state.sub.size && ![...state.sub].every(s=>a.subs.indexOf(s)>=0)) return false;
    if(state.q){ var toks=state.q.toLowerCase().split(/\\s+/).filter(Boolean); if(!toks.every(t=>a.hay.indexOf(t)>=0)) return false; }
    return true;
  }
  function render(){
    var list = CAT.filter(matches);
    grid.innerHTML = list.map(function(a){
      var locked = a.tier==='paid';
      return '<a class="card'+(locked?' locked':'')+'" href="'+a.href+'">'
        + '<span class="badge">Grade '+a.grade+' · '+esc(a.teks)+'</span>'
        + '<div class="ico">'+a.icon+'</div>'
        + '<div class="ctitle">'+hi(a.title,state.q)+'</div>'
        + '<div class="cdesc">'+hi(a.sub,state.q)+'</div>'
        + '<div class="small" style="margin-top:8px">'+a.focus.map(f=>'<span class="pill">'+hi(f,state.q)+'</span>').join('')+'</div>'
        + '<span class="tier">'+(locked?'🔒':'<span class="freeflag">FREE</span>')+'</span>'
        + '<span class="cgo">'+(locked?'Licensed districts →':'Start the breakout →')+'</span></a>';
    }).join('');
    count.textContent = list.length + ' of ' + CAT.length + ' activities';
    empty.style.display = list.length ? 'none' : 'block';
  }
  document.getElementById('q').addEventListener('input', function(e){ state.q = e.target.value.trim(); render(); });
  function toggleChip(btn){
    var dim = btn.dataset.band!=null?'band':btn.dataset.tier!=null?'tier':btn.dataset.sub!=null?'sub':null;
    if(!dim) return; var val = btn.dataset[dim];
    if(state[dim].has(val)){ state[dim].delete(val); btn.classList.remove('on'); }
    else { state[dim].add(val); btn.classList.add('on'); }
    render();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-band],.chip[data-tier],.chip[data-sub]'), function(b){ b.addEventListener('click', function(){ toggleChip(b); }); });
  function clearAll(){ state={q:'',band:new Set(),tier:new Set(),sub:new Set()}; document.getElementById('q').value='';
    Array.prototype.forEach.call(document.querySelectorAll('.chip.on'), function(c){c.classList.remove('on');}); render(); }
  document.getElementById('clear').addEventListener('click', clearAll);
  document.getElementById('reset').addEventListener('click', function(e){ e.preventDefault(); clearAll(); });
  render();
})();
</script>`;

  fs.writeFileSync(path.join(ROOT, 'library.html'), shell({ depth: 0, title: 'Activity Library — Digital Citizenship Breakouts', extraHead, body: body + script }));
}

// ---- SCOPE & SEQUENCE ----------------------------------------------------
function scope() {
  const rows = [3, 4, 5, 6, 7, 8].map(g => {
    const a = ACT[g], U = a.B.UI.en, L = LESSON[g], subs = [...new Set(FOCUS[g].map(f => f[1]))].sort();
    return `<tr>
        <td><span class="lk">Grade ${g}</span><br><span class="small">${a.tier === 'paid' ? 'licensed' : 'free'} · ${a.teks}</span></td>
        <td><strong>${esc(U['header.h1'])}</strong><br><span class="small">${esc(L.big)}</span></td>
        <td>${esc(L.eq)}</td>
        <td><span class="small">${esc(L.vocab)}</span></td>
        <td><span class="small">${subs.join(' ')}</span></td>
      </tr>`;
  }).join('\n    ');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Scope &amp; sequence</div>
    <h1>Scope &amp; Sequence</h1>
    <p class="lede">The six breakouts build digital-citizenship judgment across grades 3–8 — from a student’s first footprint to evaluating the bias and reliability of a source. Each grade adds the next layer.</p>
  </div>

  <div class="panel gold"><strong>The learning arc:</strong> your digital footprint (Gr 3) → why the internet remembers, etiquette &amp; credit (Gr 4) → footprint components, tracking &amp; secure connections (Gr 5) → intellectual property &amp; fair use (Gr 6) → evaluating media spin (Gr 7) → judging a source’s bias &amp; reliability (Gr 8). Themes of footprint, etiquette, IP, and safety deepen every year.</div>

  <div class="tbl-wrap"><table>
    <caption>Grade · activity &amp; big idea · essential question · key vocabulary · TEKS substrands</caption>
    <thead><tr><th>Grade</th><th>Activity &amp; big idea</th><th>Essential question</th><th>Key vocabulary</th><th>Substrands</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table></div>

  <h2>Pacing</h2>
  <div class="panel"><ul>
    <li><strong>One breakout ≈ 25–40 minutes</strong> including debrief; it works best as the <em>engage</em> or <em>collaborative-practice</em> phase of a lesson, not the whole lesson.</li>
    <li>Run one per grading period, or cluster a band into a <strong>1–2 week digital-citizenship unit</strong>.</li>
    <li>Grades 3–5 are free and self-contained; Grades 6–8 are the licensed band and assume the earlier vocabulary.</li>
  </ul></div>

  <div class="disclaimer">Standards alignment is a good-faith paraphrase for planning — see the <a href="correlation.html">TEKS correlation guide</a> and cite the § at <a href="https://tea.texas.gov" target="_blank" rel="noopener">tea.texas.gov</a>. Not legal advice.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'scope.html'), shell({ depth: 0, title: 'Scope & Sequence — Digital Citizenship Breakouts', body }));
}

// ---- LESSON-PLAN GUIDE ---------------------------------------------------
function lessons() {
  const sections = [
    ['1 · Basic information', 'Record the essentials so the plan is reusable and reviewable: <b>teacher, campus/district, grade level, course/subject, unit, lesson title, date, duration, instructional setting</b> (whole group / small group / centers / lab / online / blended), <b>number of students,</b> and <b>prerequisite skills or prior learning.</b> A single breakout typically fits a 20–40 minute block.'],
    ['2 · Standards &amp; alignment', 'Name the primary standard the breakout targets and pull the exact citation from the <a href="correlation.html">standards correlation</a> guide. Add the <a href="elps.html">ELPS</a> for your emergent bilingual students (listening, speaking, reading, writing) and a language objective. List any crosswalk standards your campus requires.'],
    ['3 · Lesson purpose', 'State the <b>big idea / concept</b> the breakout reveals, one or two <b>essential questions,</b> and a short <b>rationale</b> — why this matters and how it connects to the unit or the real world. The worked examples below give each grade’s big idea and essential question.'],
    ['4 · Objectives', 'Write measurable objectives: a <b>content objective</b> (“Students will…”), a <b>language objective</b> if applicable, and <b>success criteria</b> students can check themselves against (“I know I am successful when I can…”). Opening all four locks is a natural, visible success marker.'],
    ['5 · Vocabulary &amp; academic language', 'Pre-teach the two or three terms the breakout hinges on (see each grade’s key vocabulary below). Provide student-friendly definitions, a visual, and <b>sentence stems</b> for discussion — for example, “This clue tells me ___, so the lock is ___.”'],
    ['6 · Materials &amp; resources', '<b>Technology:</b> one device per student or pair, a modern browser, and the breakout link — no login and no data collected. <b>Optional:</b> a projector to model the first lock, headphones for read-aloud, and printed clue cards for offline groups.'],
    ['7 · Assessment plan', '<b>Before (activator):</b> a quick prompt or image to surface prior knowledge and misconceptions. <b>During (formative):</b> circulate and listen — which clue are pairs using, where do they stall, how do they handle the decoy? The “locks open” count is a live progress check. <b>After (product):</b> an exit task — students explain in one or two sentences how they cracked one lock, or answer a transfer question.'],
    ['8 · Differentiation &amp; UDL / ELPS supports', 'Plan universal supports first: <b>engagement</b> (choice of language and partner, playful retry), <b>representation</b> (seven languages, chunked clue cards, key vocabulary), and <b>action &amp; expression</b> (four different response modes). See the <a href="udl.html">UDL supports</a> and <a href="elps.html">ELPS supports</a> pages for specific moves by principle and proficiency level.'],
    ['9 · Procedure', 'A workable arc that places the breakout at the center — adjust the timing to your block:<ul><li><b>Opening / Engage (5 min).</b> Pose the essential question with an image or quick prompt. Preview the vocabulary and show the 🌐 language menu. Name the goal: open all four locks using the clues.</li><li><b>Model one lock (5 min).</b> Project the breakout and think aloud through the first clue and one lock. Show how to reopen clues and how “Start over” works. Make the decoy idea explicit: a clue can be true and still not help.</li><li><b>Collaborative practice (15–20 min).</b> Two students per device. Partners read each clue, decide which lock it serves, and justify their choice out loud before answering. Circulate and ask “which clue, which lock, why.” This is the formative window.</li><li><b>Apply &amp; extend (5–10 min).</b> Students replay in a second language, try a related breakout, or answer a short transfer prompt on their own.</li><li><b>Closure (5 min).</b> Students answer: What did you learn? How does it connect to what you knew? Where else could you use this idea? Debrief the decoy as a class.</li></ul>'],
    ['10 · Questioning plan', '<ul><li><b>Recall:</b> What does this clue say? Which lock does it match?</li><li><b>Reasoning:</b> Why does this clue open that lock and not another?</li><li><b>Transfer:</b> Where else would this idea be true — somewhere in your own online life?</li><li><b>Misconceptions:</b> Why is the decoy clue true but not helpful here?</li></ul>'],
    ['11 · Teacher reflection', '<ul><li>What worked, and what evidence showed students learned?</li><li>Who needs reteaching, and who is ready for extension?</li><li>Which clue or lock caused the most productive struggle?</li><li>What will you change next time?</li></ul>'],
  ];
  const secHtml = sections.map(([h, p]) => `<div class="panel"><h3 style="margin-top:0">${h}</h3><p>${p}</p></div>`).join('\n  ');
  const examples = [3, 4, 5, 6, 7, 8].map(g => {
    const a = ACT[g], U = a.B.UI.en, L = LESSON[g];
    return `<div class="akact">
    <h3>Grade ${g} — ${esc(U['header.h1'])} <span class="small">(${a.teks} · ${a.tier === 'paid' ? 'licensed' : 'free'})</span></h3>
    <div class="tbl-wrap"><table><tbody>
      <tr><th style="width:170px">Big idea</th><td>${esc(L.big)}</td></tr>
      <tr><th>Essential question</th><td>${esc(L.eq)}</td></tr>
      <tr><th>Content objective</th><td>${esc(L.obj)}</td></tr>
      <tr><th>Language objective</th><td>${esc(L.lang)}</td></tr>
      <tr><th>Key vocabulary</th><td>${esc(L.vocab)}</td></tr>
      <tr><th>Success criteria</th><td>${esc(L.success)}</td></tr>
    </tbody></table></div>
    <p class="small"><a href="${a.band}/dc-grade${g}.html">Open the Grade ${g} teacher launch page →</a></p>
    </div>`;
  }).join('\n  ');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Lesson-plan guide</div>
    <h1>Building a Lesson Around a Breakout</h1>
    <p class="lede">A ready structure for slotting a Critical Thinking Online Breakout into a full lesson, following a standard Texas lesson-plan format. Use the outline as-is or copy the field list into your campus template. A worked example for every grade appears at the end.</p>
  </div>
  <div class="panel tip">🧑‍🏫 <b>How to use this guide:</b> a breakout works best as the <b>engage</b> or <b>collaborative-practice</b> phase of a lesson — not the whole lesson. The sections below mirror a standard lesson plan; each names what to decide and how the breakout fits. Pair it with the <a href="udl.html">UDL</a> and <a href="elps.html">ELPS</a> supports pages for the differentiation section.</div>

  <h2>Lesson-plan sections</h2>
  ${secHtml}

  <h2>Worked examples — every activity</h2>
  <p class="section-note">Drop-in big ideas, essential questions, and objectives for each breakout. Full standards alignment is on each activity’s teacher launch page and the <a href="correlation.html">correlation guide</a>.</p>
  ${examples}

  <div class="disclaimer">This guide is a planning aid, not an official lesson plan. Adapt it to your campus template and confirm standards before adoption.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'lessons.html'), shell({ depth: 0, title: 'Lesson-Plan Guide — Digital Citizenship Breakouts', body }));
}

// ---- UDL SUPPORTS --------------------------------------------------------
function udl() {
  const principle = (h, sub, cards, apply) => `<h2>${h}</h2>
  <p class="section-note">${sub}</p>
  <div class="cards">${cards.map(c => `<div class="panel"><h3 style="margin-top:0">${c[0]}</h3>${c[1]}</div>`).join('')}</div>
  <div class="panel gold">${apply}</div>`;
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a> · <a href="guide.html">Teacher guide</a></div>
  <div class="hero">
    <div class="eyebrow">Universal Design for Learning</div>
    <h1>UDL Design Suggestions</h1>
    <p class="lede">Practical ways to open these Critical Thinking Online Breakouts to every learner, organized by the three principles of the CAST Universal Design for Learning Guidelines (version 3.0). Each breakout already builds in many of these supports; the suggestions below help you extend them.</p>
  </div>
  <div class="panel tip">🎯 <b>The goal of UDL is learner agency</b> — learners who are purposeful &amp; reflective, resourceful &amp; authentic, and strategic &amp; action-oriented. Design for the edges and the whole class benefits.</div>

  ${principle('Multiple Means of Engagement', 'the “why” of learning — recruit interest, sustain effort, and support self-regulation',
    [['Welcoming interests &amp; identities', '<ul><li>Optimize choice and autonomy <b>(7.1)</b></li><li>Optimize relevance, value, and authenticity <b>(7.2)</b></li><li>Nurture joy and play <b>(7.3)</b></li></ul>'],
     ['Sustaining effort &amp; persistence', '<ul><li>Clarify the meaning and purpose of goals <b>(8.1)</b></li><li>Optimize challenge and support <b>(8.2)</b></li><li>Foster collaboration and community <b>(8.3, 8.4)</b></li><li>Offer action-oriented feedback <b>(8.5)</b></li></ul>'],
     ['Emotional capacity', '<ul><li>Recognize expectations and motivations <b>(9.1)</b></li><li>Develop awareness of self and others <b>(9.2)</b></li><li>Promote individual and collective reflection <b>(9.3)</b></li></ul>']],
    '<b>In these breakouts:</b> the four locks turn content into a playful puzzle to solve, not a test to pass <b>(7.3)</b>. Nothing is graded and students can <b>Start over</b> as often as they like, so mistakes cost nothing and effort is safe <b>(8.2, 9.1)</b>. Let students pick their own language with the 🌐 menu and choose to work solo or with a partner <b>(7.1)</b>. The progress dots and “locks open” count make the goal visible and celebrate each step <b>(8.1, 8.5)</b>. Assign pairs so students reason out loud together <b>(8.3, 8.4)</b>, and close with a quick reflection on which clue cracked each lock <b>(9.3)</b>.')}

  ${principle('Multiple Means of Representation', 'the “what” of learning — perception, language and symbols, and building knowledge',
    [['Perception', '<ul><li>Customize the display of information <b>(1.1)</b></li><li>Support multiple ways to perceive information <b>(1.2)</b></li><li>Represent a diversity of perspectives <b>(1.3)</b></li></ul>'],
     ['Language &amp; symbols', '<ul><li>Clarify vocabulary and symbols <b>(2.1)</b></li><li>Support decoding of text and notation <b>(2.2)</b></li><li>Cultivate understanding across languages <b>(2.3)</b></li><li>Illustrate through multiple media <b>(2.5)</b></li></ul>'],
     ['Building knowledge', '<ul><li>Connect prior knowledge to new learning <b>(3.1)</b></li><li>Highlight patterns, big ideas, and relationships <b>(3.2)</b></li><li>Maximize transfer and generalization <b>(3.4)</b></li></ul>']],
    '<b>In these breakouts:</b> every activity runs in seven languages from the 🌐 menu, so multilingual learners can read the same idea in their home language and in English <b>(2.3, 1.1)</b>. Clue cards chunk information into short, tappable pieces students can reopen any time <b>(1.1, 3.2)</b>. Pre-teach each grade’s key vocabulary to clarify terms and symbols <b>(2.1, 2.2)</b>. The evidence-sort lock asks students to separate strong evidence from a true-but-off-topic decoy, making the “big idea vs. detail” distinction explicit <b>(3.2)</b>. Activate prior knowledge before starting and name where the idea shows up in students’ own online lives to support transfer <b>(3.1, 3.4)</b>.')}

  ${principle('Multiple Means of Action &amp; Expression', 'the “how” of learning — interaction, expression, and strategy',
    [['Interaction', '<ul><li>Vary and honor methods for response and navigation <b>(4.1)</b></li><li>Optimize access to assistive and accessible tools <b>(4.2)</b></li></ul>'],
     ['Expression &amp; communication', '<ul><li>Use multiple media for communication <b>(5.1)</b></li><li>Use multiple tools for construction and creativity <b>(5.2)</b></li><li>Build fluencies with graduated support <b>(5.3)</b></li></ul>'],
     ['Strategy development', '<ul><li>Set meaningful goals <b>(6.1)</b></li><li>Organize information and resources <b>(6.3)</b></li><li>Enhance capacity for monitoring progress <b>(6.4)</b></li></ul>']],
    '<b>In these breakouts:</b> the four lock types ask for the answer in different ways — ordering a sequence, choosing from options, sorting evidence, and typing a word — so students show what they know through more than one channel <b>(5.1, 4.1)</b>. Everything works with mouse, touch, or keyboard and runs in the browser with no login, so it pairs cleanly with a screen reader, zoom, or a district assistive-tech tool <b>(4.2)</b>. The word lock accepts spelling variants, lowering the cost of encoding while students build fluency <b>(5.3)</b>. Have students narrate their strategy — which clue, which lock, why — to make thinking visible and monitor their own progress <b>(6.3, 6.4)</b>.')}

  <h2>Five quick wins</h2>
  <div class="panel"><ul>
    <li><b>Let students choose the language.</b> Show the 🌐 menu before you begin — it is a support, not an accommodation to request.</li>
    <li><b>Pair, don’t isolate.</b> Two students per device turns each lock into a reasoning conversation.</li>
    <li><b>Normalize “Start over.”</b> Say out loud that retrying is how the game is played.</li>
    <li><b>Debrief the decoy.</b> Ask why the off-topic fact was true but did not help — that is the critical-thinking payoff.</li>
    <li><b>Connect it forward.</b> End by naming one place this idea shows up outside the screen.</li>
  </ul></div>

  <div class="disclaimer">The CAST UDL Guidelines are summarized here for planning support and are not endorsed by CAST. Framework: CAST (2024). <i>Universal Design for Learning Guidelines version 3.0</i>. udlguidelines.cast.org. Confirm current guidance before adoption.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'udl.html'), shell({ depth: 0, title: 'UDL Supports — Digital Citizenship Breakouts', body }));
}

// ---- ELPS SUPPORTS -------------------------------------------------------
function elps() {
  const domain = (h, tag, exp, apply) => `<div class="panel"><h3 style="margin-top:0">${h} <span class="pill">${tag}</span></h3>${exp}<p style="margin-bottom:0">${apply}</p></div>`;
  const levels = [
    ['Pre-production', 'Silent period; responses are mostly non-verbal.', 'Display the home language. Accept pointing and gestures. Pair with a bilingual peer. Let the student show the answer, not say it.'],
    ['Beginning', 'One word or short two-to-three-word phrases; repeats keywords.', 'Provide word banks and sentence stems. Ask yes/no or either/or questions about a clue. Celebrate keyword use.'],
    ['Intermediate', 'Short phrases and simple sentences; literal comprehension.', 'Ask “which clue and why” questions. Add visual support for abstract language. Have partners compare reasoning.'],
    ['High intermediate', 'A variety of sentence types; expresses opinions; asks for clarification.', 'Move to English display with the home language as backup. Ask students to justify and predict the next lock. Fade the stems.'],
    ['Advanced', 'Engages with little to no linguistic support; uses content-area vocabulary.', 'Have the student explain their strategy to the group in academic English and mentor a peer. Extend with a transfer question.'],
  ];
  const lvlRows = levels.map(l => `<tr><td><strong>${l[0]}</strong></td><td>${l[1]}</td><td>${l[2]}</td></tr>`).join('\n    ');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a> · <a href="guide.html">Teacher guide</a></div>
  <div class="hero">
    <div class="eyebrow">English Language Proficiency Standards</div>
    <h1>ELPS Supports for Emergent Bilingual Learners</h1>
    <p class="lede">How to use these Critical Thinking Online Breakouts with emergent bilingual (EB) students, aligned to the Texas English Language Proficiency Standards (ELPS). The ELPS span four language domains — listening, speaking, reading, and writing — and five proficiency levels. These activities are built to be linguistically accommodated across all seven languages.</p>
  </div>
  <div class="panel tip">🌱 <b>Start from assets.</b> The ELPS take an asset-based approach: leverage the funds of knowledge, home language, and cultural heritage every student already brings. Cognates and the home-language display build bridges between languages and grow confidence as English develops.</div>

  <h2>Linguistic accommodation, built in</h2>
  <div class="panel"><p>The ELPS require instruction that is <b>communicated, sequenced, and scaffolded</b> to each student’s proficiency level. These breakouts do much of that for you: the 🌐 menu displays every clue and lock in the student’s home language beside English; clue cards chunk information into short pieces students can reopen; the word lock accepts spelling variants; and nothing is graded, so students take risks with new language safely. Turn on the home language during a first pass, then invite an English pass for the same puzzle.</p></div>

  <h2>The four language domains</h2>
  <div class="cards">
  ${domain('Listening', 'receptive', '<p class="small">EB students distinguish sounds and intonation, understand content-area vocabulary, follow oral directions, and show comprehension by responding or asking for clarification.</p>', '<b>Try this:</b> read a clue aloud while the home-language text is displayed, then ask students to point to the lock it helps. Accept gestures or pointing as a valid response on a first pass.')}
  ${domain('Speaking', 'expressive', '<p class="small">EB students pronounce new vocabulary, speak using content-area terms, use appropriate register, and narrate, describe, or explain with increasing detail.</p>', '<b>Try this:</b> give sentence stems — “This clue tells me… so the lock is…” Have each pair explain aloud which clue cracked a lock before moving on. Model the target academic word once, then ask students to use it.')}
  ${domain('Reading', 'receptive', '<p class="small">EB students decode with cognates and word parts, use content-area vocabulary, apply pre-reading strategies, and comprehend text with visual, contextual, and linguistic support.</p>', '<b>Try this:</b> preview the breakout’s theme and each grade’s key vocabulary before starting (pre-reading). Point out cognates on the clue cards. Let students reopen clues as often as they need — rereading is a strategy, not a failure.')}
  ${domain('Writing', 'expressive', '<p class="small">EB students spell using conventional patterns, write with high-frequency and content-area vocabulary, and write to narrate, describe, explain, or respond.</p>', '<b>Try this:</b> the word lock is low-stakes writing — it accepts spelling variants, so students focus on the idea. Afterward, have students write one or two sentences explaining how they solved a lock, using the target vocabulary and a sentence stem.')}
  </div>

  <h2>Supporting each proficiency level</h2>
  <p class="section-note">EB students may be at different levels across the four domains. Match the support to the level; every student can do the cognitively demanding thinking with the right language scaffold.</p>
  <div class="tbl-wrap"><table>
    <thead><tr><th>Proficiency level</th><th>What you may see</th><th>How to scaffold the breakout</th></tr></thead>
    <tbody>
    ${lvlRows}
    </tbody>
  </table></div>

  <div class="disclaimer">ELPS content is summarized and paraphrased for planning support; it is not a substitute for the official standards (Texas Education Agency, <i>English Language Proficiency Standards</i>, 19 TAC Chapter 74). Confirm current TEA guidance before adoption.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'elps.html'), shell({ depth: 0, title: 'ELPS Supports — Digital Citizenship Breakouts', body }));
}

// ---- run -----------------------------------------------------------------
suiteLanding();
library();
bandHub('grade35', [3, 4, 5], { paid: false, label: 'Grades 3–5 · Free', title: 'Grades 3–5', lede: 'The free tier. Digital footprints, kindness, credit, and staying safe — one breakout per grade, ready to share.' });
bandHub('grade68', [6, 7, 8], { paid: true, label: 'Grades 6–8 · Licensed', title: 'Grades 6–8', lede: 'The middle-school band: intellectual property, media literacy, cybersecurity, and source evaluation. Included with a district license.' });
correlation();
guide();
scope();
lessons();
udl();
elps();
implementation('grade35', [3, 4, 5], { paid: false, hub: 'Grades 3–5', title: 'Grades 3–5 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the free elementary band.', prereq: 'Students should be comfortable reading short paragraphs and clicking/tapping tiles.', extend: 'Connect to a class agreement on kindness and credit; revisit the footprint idea across the year.' });
implementation('grade68', [6, 7, 8], { paid: true, hub: 'Grades 6–8', title: 'Grades 6–8 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the licensed middle-school band.', prereq: 'Students should be able to evaluate short arguments and are ready for real IP, security, and media-literacy vocabulary.', extend: 'Bridge to a media-literacy or intro-to-AI unit; have students audit a real (teacher-vetted) source using the Grade 8 criteria.' });
policy('grade35', 'Grades 3–5');
policy('grade68', 'Grades 6–8');
for (const g of Object.keys(META)) teacherPage(+g);

console.log('Generated: index.html, correlation.html, guide.html, scope.html, lessons.html, udl.html, elps.html, band hubs, implementation plans, policy pages, and 6 teacher launch pages.');
