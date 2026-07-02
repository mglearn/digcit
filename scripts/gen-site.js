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

function loadBreakout(grade) {
  const p = path.join(ROOT, META[grade].band, 'locales', 'dc-grade' + grade + '.js');
  const fn = new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;');
  return fn({});
}
const ACT = {};
for (const g of Object.keys(META)) ACT[g] = { grade: +g, ...META[g], B: loadBreakout(g) };

// ---- shared shell --------------------------------------------------------
function assets(depth) { return depth ? '../assets' : 'assets'; }
function shell({ depth = 0, title, extraHead = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
${FONTS}
<style>${PALETTE}</style>
<link rel="stylesheet" href="${assets(depth)}/site.css">${extraHead}
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>
`;
}
function footer(depth, policyHref) {
  return `<footer>
  Digital Citizenship Breakouts · Aligned to Texas TEKS Technology Applications (adopted 2022, required K–8). Paraphrased alignment — not legal advice.<br>
  <a href="${depth ? '../' : ''}index.html">Suite home</a> · <a href="${depth ? '../' : ''}correlation.html">Standards correlation</a> · <a href="${depth ? '../' : ''}guide.html">Teacher guide</a>${policyHref ? ` · <a href="${policyHref}">Privacy &amp; compliance</a>` : ''}
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

  <div class="panel gold">
    <h3>Why "breakouts"?</h3>
    <p>Each activity is a mini escape-room: six clues (one is a decoy), four locks, and a short <em>reason</em> revealed after every lock that names <em>why</em> the answer follows from the evidence. The reasoning is the point.</p>
  </div>
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

  <h2>The CLEAR reasoning focus</h2>
  <p>Each lock is designed so a correct guess is not enough — students should be able to explain the <em>reason</em>, which the activity reveals after every solve. Encourage this habit:</p>
  <div class="panel">
    <ul>
      <li><strong>C</strong>ollect — read all six clues first.</li>
      <li><strong>L</strong>ocate — which clue(s) speak to this lock?</li>
      <li><strong>E</strong>valuate — is the evidence strong, or is it the decoy?</li>
      <li><strong>A</strong>rgue — say why before checking.</li>
      <li><strong>R</strong>eflect — compare your reason to the revealed reason.</li>
    </ul>
  </div>

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

// ---- run -----------------------------------------------------------------
suiteLanding();
bandHub('grade35', [3, 4, 5], { paid: false, label: 'Grades 3–5 · Free', title: 'Grades 3–5', lede: 'The free tier. Digital footprints, kindness, credit, and staying safe — one breakout per grade, ready to share.' });
bandHub('grade68', [6, 7, 8], { paid: true, label: 'Grades 6–8 · Licensed', title: 'Grades 6–8', lede: 'The middle-school band: intellectual property, media literacy, cybersecurity, and source evaluation. Included with a district license.' });
correlation();
guide();
implementation('grade35', [3, 4, 5], { paid: false, hub: 'Grades 3–5', title: 'Grades 3–5 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the free elementary band.', prereq: 'Students should be comfortable reading short paragraphs and clicking/tapping tiles.', extend: 'Connect to a class agreement on kindness and credit; revisit the footprint idea across the year.' });
implementation('grade68', [6, 7, 8], { paid: true, hub: 'Grades 6–8', title: 'Grades 6–8 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the licensed middle-school band.', prereq: 'Students should be able to evaluate short arguments and are ready for real IP, security, and media-literacy vocabulary.', extend: 'Bridge to a media-literacy or intro-to-AI unit; have students audit a real (teacher-vetted) source using the Grade 8 criteria.' });
policy('grade35', 'Grades 3–5');
policy('grade68', 'Grades 6–8');
for (const g of Object.keys(META)) teacherPage(+g);

console.log('Generated: index.html, correlation.html, guide.html, band hubs, implementation plans, policy pages, and 6 teacher launch pages.');
