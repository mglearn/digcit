# Digital Citizenship Breakouts

A suite of **Critical Thinking Online Breakouts (CTOBs)** for Digital Citizenship,
aligned to the **Texas TEKS Technology Applications** standard (adopted 2022,
required K–8), grades **3–8**, in **7 languages**. Each activity is a self-contained
escape-room: six clues (one a decoy), four locks, and a revealed *reason* after
every lock — the reasoning is the point. Runs entirely in the browser; no logins,
no data collected.

## The activities

| Grade | Title | TEKS | Tier |
|-------|-------|------|------|
| 3 | Your First Digital Footprint | §126.8 | free |
| 4 | The Permanent Record | §126.9 | free |
| 5 | Track the Trackers | §126.10 | free |
| 6 | Fair Use Detective | §126.17 | licensed |
| 7 | Spot the Spin | §126.18 | licensed |
| 8 | Evaluate the Source | §126.19 | licensed |

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

## Hosting

Free tier (Grades 3–5 + top-level pages) is static (nginx). Paid tier (Grades 6–8)
sits behind a session-auth Node gateway so paid HTML never leaves the server
without a valid district login. See [`hosting/README.md`](hosting/README.md).

## License / content

All activity content is 100% original / OER / public-domain — no copyrighted
media, no real platform UIs, no photos of children. TEKS skills are paraphrased;
cite the § and read the source at [tea.texas.gov](https://tea.texas.gov). Alignment
is a good-faith mapping for planning, not legal advice.
