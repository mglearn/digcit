# Digital Citizenship CTOBs — Build Plan (Claude Code Handoff)

Continue building a suite of Critical Thinking Online Breakouts (CTOBs) for
**Digital Citizenship, Texas TEKS Technology Applications, grades 3–8**,
multilingual (7 languages), navy/gold themed. A Grade 3 reference activity is
already built and verified. Your job: replicate it across grades 4–8, add teacher
materials, translate, and set up hosting with a real paid-content paywall.

---

## 0. Ground truth (verified — do not re-litigate)

- **Standard:** TX Technology Applications TEKS, **adopted 2022, implemented 2024–25, required K–8.** Digital Citizenship is 1 of 5 strands, with 3 substrands at every grade: *social interactions; ethics & laws; privacy, safety & security.*
- **TAC citations:** Gr3 §126.8, Gr4 §126.9, Gr5 §126.10, Gr6 §126.17, Gr7 §126.18, Gr8 §126.19 — subsection (c)(8)(9)(10) is the DigCit strand.
- **COPYRIGHT RULE (hard):** Align *to* TEKS; **never paste TEA's official standard text** into any deliverable — paraphrase skills, cite the § number, link tea.texas.gov. Every asset must be public-domain / OER / self-authored. No copyrighted screenshots, no real platform UI, no stock photos of children. Clue visuals = emoji or self-made clean SVG only.
- **Bands:** two — `grade35` (3–5) and `grade68` (6–8). NOT the Pack's three-band layout.
- **Path depth:** activities live one level below suite root (`digcit/grade35/…`), so asset refs are `../assets/…` (NOT `../../assets/…`).

## 1. Repo layout (current + target)

```
digcit/
  assets/                 # DONE — copy unchanged, never edit
    i18n.js  breakout.js  breakout.css
  grade35/
    locales/
      dc-grade3.js        # DONE + verified
      dc-grade4.js        # TODO
      dc-grade5.js        # TODO
    dc-grade3-student.html # DONE + verified
    dc-grade4-student.html # TODO
    dc-grade5-student.html # TODO
    dc-grade3.html         # TODO teacher launch page (premise + standards, NO answers)
    dc-grade4.html  dc-grade5.html   # TODO teacher launch pages
    index.html             # TODO band hub (cards → each activity)
    policy.html            # TODO privacy/compliance
  grade68/
    locales/ dc-grade6.js dc-grade7.js dc-grade8.js   # TODO
    dc-grade6-student.html … dc-grade8-student.html   # TODO
    dc-grade6.html … dc-grade8.html                   # TODO teacher pages
    index.html  policy.html                           # TODO
  index.html              # TODO suite landing (3 free cards + locked MORE)
  correlation.html        # TODO standards correlation guide
  answer-key.html         # TODO AES-256 (answers only — fine to keep client-side)
  solve-test.js           # DONE — extend to cover every activity
```

## 2. The per-activity content spec (clone Grade 3 exactly)

Each activity = one `locales/dc-gradeN.js` defining `window.BREAKOUT` + one
`dc-gradeN-student.html` skeleton. The skeleton is nearly identical every time —
only palette stays constant, and the `data-i18n` default text + title + locale
`<script src>` change. **Copy `dc-grade3-student.html` and edit those.**

Locale object shape (match `dc-grade3.js`):
```
window.BREAKOUT = {
  id: 'dc-gradeN',
  confetti: ['#0a2e63','#f5b800','#2f6fe0','#1a7a8c','#ffffff','#0d47a1'],
  UI:      { en:{32 keys}, es:{22}, vi:{22}, ar:{22}, hi:{22}, ur:{22}, zh:{22} },
  CONTENT: { en:{clues:[6],locks:[4]}, es:{clues:[],locks:[]}, …zh }
};
```

Rules per activity:
- **6 clues, exactly one decoy** (true-but-useless, like Grade 3's "Class Pet").
- **4 locks**, each ending in a one-sentence `reason` (why the answer follows from a clue).
- Prefer **click-based locks** (`mc`, `multi`, `seq`) — identical logic in every language. Use `word` sparingly (accept English + localized spellings + reasonable variants); use `digit` only where a number genuinely fits (Gr5+).
- Keep **structural fields identical across languages** (id, ico, type, color, answerIndex, item order + strong flags, seq pads, answer arrays). Translate only text.
- Reading level: **Gr3–5 short sentences; Gr6–8 on-level.**
- Lock types available: `digit`(numeric), `word`(text), `mc`(answerIndex), `multi`(items[].strong), `seq`(pads[]+answer order). See `assets/breakout.js` for exact field names.

### Grade themes (mapped to the real DigCit progression — author English first)

- **Gr4 "The Permanent Record"** §126.9(c)(8)(9)(10): footprint *permanence*; etiquette across text/email/chat; creator rights & copyright; data-collection tools (cookies/pop-ups); advocating against cyberbullying.
- **Gr5 "Track the Trackers"** §126.10: footprint *components* (activity/games/social); audience-appropriate etiquette; copyright consequences; cybersecurity (secured connections); how data tracks navigation. *(Good place for a `digit` lock.)*
- **Gr6 "Fair Use Detective"** §126.17: IP terms (copyright, permission, fair use, creative commons, open source, public domain); citing sources; info exaggerated/misrepresented online; phishing/malware/identity theft; cyberbullying methods.
- **Gr7 "Spot the Spin"** §126.18: IP law consequences; evaluating how media (incl. social) exaggerates/misrepresents; modeling defense vs. cyberattacks; cyberbullying impact. *(Bridge to a future Gen AI Literacy suite.)*
- **Gr8 "Evaluate the Source"** §126.19: evaluating **bias of digital sources incl. websites**; IP law when creating; real-world cybersecurity scenarios; cyberbullying warning signs.

## 3. Shared UI translations (don't re-translate)

`build-ml.js` (from the original TCEA pack, in the langstuff bundle) exports a
`COMMON` dictionary: all shared chrome + feedback strings in 7 languages
(Check, Reset, Got it, fb.digit, fb.word, fb.mc, fb.multiExtra, fb.multiMissing,
fb.seq, ui.pcount, etc.). **Merge COMMON into every locale's UI[es..zh] via
script** — same method used for Grade 3:

```js
const {COMMON} = require('./build-ml.js');
for (const lg of ['es','vi','ar','hi','ur','zh'])
  for (const k of Object.keys(COMMON)) B.UI[lg][k] = COMMON[k][lg];
```

That yields 22 shared keys per non-English lang. The 10 breakout-specific chrome
keys (header.h1, header.sub, brief.*, win.*, footer.text, header.eyebrow,
crumb.suite) are **intentionally English-only until the translation pass** — the
engine falls back to English for missing keys. Pre-translate `header.eyebrow`
only (the standing "Digital Citizenship Breakout · Grade N" label).

## 4. Translation pass (after all 6 English activities exist + verify)

- Fill `CONTENT[es..zh]` (clues + locks) and the 10 breakout chrome keys per language.
- Structural fields **must stay identical** to English; translate text only.
- Mark all non-English **"AI-seeded; native-review pending"** (footer.disclaimer already does this).
- Parallelize: one locale file per agent works well.

## 5. Verification — REQUIRED, do not skip (this is the quality gate)

`solve-test.js` already exists and drives the DOM to solve all 4 locks and assert
the win screen fires with **zero console errors**, in EN + ZH (fallback) + AR (RTL).
**Extend it to loop over every activity.** A lock that never renders (e.g. a
missing `id`) only surfaces here, not in a static check. Also assert, per file:
6 clues incl. ≥1 decoy; 4 locks each with a `reason`; every language's UI key set
consistent; seq answers reference existing pads; mc answerIndex in range.

Run: `node solve-test.js` — must print `ALL PASS` before anything ships.

## 6. Teacher materials (author after Gr3–5 verified)

- **Curriculum guide** (one, suite-level): purpose, CLEAR-style reasoning focus, how to deploy, the free/paid split.
- **Two implementation plans**, one per band (3–5, 6–8): pacing, prerequisites, extension.
- **Per-activity teacher launch pages** (`dc-gradeN.html`): premise + standards alignment + classroom suggestions. **NO answers.**
- **Correlation guide** (`correlation.html`): table per band — Activity | Locks | TEKS § | reasoning focus. Paraphrase skills, cite §, link tea.texas.gov, include "aligned to / not legal advice" disclaimer.
- **Answer key** (`answer-key.html`): AES-256 client-side (PBKDF2-SHA256 250k → AES-256-GCM), password-gated. Client-side crypto is FINE for answer keys (students aren't motivated to crack). See Pack §7 for the exact Node payload recipe.

## 7. Free/paid split + hosting (Linode) — READ THIS CAREFULLY

**Free tier = Grades 3, 4, 5 (fully static, served to anyone).**
**Paid tier = Grades 6, 7, 8 + any future "MORE" activities.**

**Do NOT gate paid content with a client-side password / client-side AES.** Anyone
locked out is motivated to bypass it, and view-source or one shared decrypted file
defeats it permanently. Client-side crypto is only acceptable for *answer keys*,
not for paid curriculum.

**Paid content must never leave the server without server-side auth.** Target
architecture on Linode:
- nginx serves the free static site (`digcit/`, minus `grade68/`).
- A small app (Node/Express or similar) sits in front of a **protected directory**
  containing the paid activities. It checks a **session** (per-district account)
  before serving any paid file. Unauthenticated requests never receive the HTML.
- Per-district accounts (issue credentials on purchase). Sessions, not a shared
  password. Optionally bind to district IP ranges to slow credential sharing.
- Keep the free and paid trees physically separate so a misconfigured static
  route can't leak paid files.
- `<meta name="referrer" content="no-referrer">` on every page (already in skeleton).

Build order for hosting: ship the free static tier first (nginx only), add the
auth app + paid tier second, once Gr6–8 content is verified.

## 8. Suggested execution order

1. Build Gr4 + Gr5 English (clone Gr3) → extend + run `solve-test.js` → free tier content complete.
2. Build band hubs (`grade35/index.html`), suite landing, policy pages.
3. Teacher curriculum guide + correlation table + Gr3–5 teacher launch pages.
4. Build Gr6–8 English (paid tier) → verify.
5. Translation pass (all 6) → re-verify EN+one non-EN+one RTL each.
6. Answer key (AES-256).
7. Hosting: free static on nginx; then auth app + paid tier.
8. (Later) adapt `build-catalog.js` for a searchable top-level library like the hero mock.

## 9. Definition of done (per activity)

- [ ] `locales/dc-gradeN.js`: 6 clues (1 decoy), 4 locks, every lock has a `reason`
- [ ] English chrome (32 UI keys) + shared COMMON merged into es..zh (22 keys each)
- [ ] Student HTML skeleton, navy/gold palette, `../assets/` paths
- [ ] `node solve-test.js` → PASS in EN + ZH + AR, zero console errors
- [ ] 100% original / OER / public-domain content; no copyrighted media
- [ ] Teacher launch page with standards alignment, no answers
