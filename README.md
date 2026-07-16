# Digital Citizenship Breakouts

A suite of **Critical Thinking Online Breakouts (CTOBs)** for Digital Citizenship,
aligned to the **Texas TEKS Technology Applications** standard (adopted 2022,
required K–8), grades **K–8**, in **7 languages**. Each activity is a self-contained
escape-room: six clues (one a decoy), four locks, and a revealed *reason* after
every lock — the reasoning is the point. Runs entirely in the browser; no logins,
no data collected.

**18 activities:** every grade K–8 has one **free featured** lesson (fully playable
on the public site) plus one **licensed** lesson (the full per-grade breakout, shown
as a placeholder publicly and served to licensed districts through the auth gateway).

**Live:** https://mglearn.github.io/digcit/ — free featured lessons + the
[🕹️ Critical Thinking Arcade](https://mglearn.github.io/digcit/arcade/) (three free,
no-login sorting games, one per grade band, in 7 languages).

Sibling suite: [Gen AI Literacy Breakouts](https://mglearn.github.io/genailit/)
(same engine, AI-adjacent TEKS strands).

## The activities

Each grade has a free featured lesson and a licensed lesson (TEKS Digital
Citizenship strand):

| Band | Grades | TEKS | Example themes |
|------|--------|------|----------------|
| K–2 | K, 1, 2 | §126.5–.7 | trusted grown-ups, kind words, private info, passwords, first digital trail |
| 3–5 | 3, 4, 5 | §126.8–.10 | digital footprint, etiquette & credit, trackers & secure connections |
| 6–8 | 6, 7, 8 | §126.17–.19 | intellectual property, media spin, source bias & reliability |

## The arcade

Three free, no-login **sorting games** (one per grade band), fully translated into
all 7 languages, sharing one engine (`assets/arcade.js`):
**Kindness Catcher** (K–2), **Safe or Sketchy** (3–5), and **Phish Tank** (6–8).

Languages: English, Spanish, Vietnamese, Arabic (RTL), Hindi, Urdu, Chinese.
Non-English text is AI-seeded and pending native-speaker review.

## Layout

```
assets/            shared engine — i18n.js, breakout.js, breakout.css, site.css, build-ml.js
grade35/           free band (Grades 3–5)
  src/*.json         English content sources (author here)
  i18n/*.<lang>.json text-only translation overlays
  locales/*.js       BAKED locale files (do not hand-edit)
  *-student.html     GENERATED student activity pages
  *.html             teacher launch / hub / policy / implementation pages
grade68/           licensed band (Grades 6–8) — same shape
index.html         suite landing        correlation.html  TEKS correlation
guide.html         curriculum guide     answer-key.html   AES-256 password-gated
scope.html         scope & sequence     lessons.html      lesson-plan guide
udl.html           UDL supports         elps.html         ELPS supports
scripts/           build + verification tooling
hosting/           nginx config + Node auth gateway for the paid tier
solve-test.js      the quality gate (renders every activity, drives every lock)
```

## Build pipeline

Content flows **src JSON + translation overlays → baker → locale JS → student HTML**.
Structure always comes from English, so a translation can never break a lock.

```bash
npm install                                   # jsdom (test harness only)
node scripts/bake.js                          # src/*.json + i18n/*.json -> locales/*.js
node scripts/gen-html.js                      # -> *-student.html
node scripts/gen-site.js                      # -> hubs, landing, teacher, correlation, guide, policy
python3 scripts/gen-images.py                 # -> favicons, PWA icons, og.png
ANSWER_KEY_PASSWORD='choose' node scripts/build-answer-key.js   # -> answer-key.html
node solve-test.js                            # QUALITY GATE — must print ALL PASS
node scripts/check-links.js                   # internal links resolve
node scripts/qa-translations.js               # -> docs/translation-qa.md (native-review queue)
```

**Deploy domain.** Absolute Open Graph / social-image URLs come from one place —
`scripts/config.js`, overridable with the `SITE_URL` env var (default matches the
nginx `server_name` placeholder). Set it once when building for your domain:

```bash
SITE_URL=https://breakouts.yourdistrict.org node scripts/gen-site.js
SITE_URL=https://breakouts.yourdistrict.org node scripts/gen-html.js
SITE_URL=https://breakouts.yourdistrict.org node scripts/gen-nginx.js   # server_name + cert paths
```

### Authoring a new activity

1. Write `grade{band}/src/dc-gradeN.json` (see an existing one — 6 clues incl. one
   `"decoy": true`, 4 locks each with a `reason`).
2. Add translation overlays `grade{band}/i18n/dc-gradeN.<lang>.json` (text only).
3. Run the pipeline above. `solve-test.js` enforces: 6 clues + ≥1 decoy, 4 locks
   each with a reason, mc `answerIndex` in range, seq answers reference real pads,
   multi has strong + non-strong, translated locales structurally identical to
   English, UI key parity across all 7 languages, and that every lock renders and
   solves to the win screen with zero console errors.

## Teacher resources

A **Teachers** dropdown (top-right of every page, by the 🌐 language switcher)
links a full teacher set, all generated by `scripts/gen-site.js`:

| Page | What it is |
|------|------------|
| `guide.html` | Curriculum guide + the **CLEAR** thinking process (Claim · Lens · Evidence · Alternatives · Response) |
| `scope.html` | Scope & sequence — the 3→8 learning arc, per-grade big idea / essential question / vocabulary / substrands, pacing |
| `lessons.html` | Lesson-plan guide (standard Texas format) + a worked example for every activity |
| `correlation.html` | TEKS correlation — each lock mapped to its Digital Citizenship substrand |
| `udl.html` | UDL supports (CAST 3.0), organized by the three principles |
| `elps.html` | ELPS supports — four language domains + a proficiency-level scaffolding table |
| `answer-key.html` | AES-256, password-gated answers + reasoning for every lock |

The landing opens with **"Why Critical Thinking Online Breakouts (CTOBs)?"** and
the CLEAR process, and every activity's teacher launch page maps that breakout to
CLEAR — a CTOB always addresses the framework.

## Hosting

Free tier (Grades 3–5 + top-level pages) is static (nginx). Paid tier (Grades 6–8)
sits behind a session-auth Node gateway so paid HTML never leaves the server
without a valid district login. See [`hosting/README.md`](hosting/README.md).

## License / content

All activity content is 100% original / OER / public-domain — no copyrighted
media, no real platform UIs, no photos of children. TEKS skills are paraphrased;
cite the § and read the source at [tea.texas.gov](https://tea.texas.gov). Alignment
is a good-faith mapping for planning, not legal advice.
