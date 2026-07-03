# Hosting the Digital Citizenship Breakouts

Two tiers, deployed so the paid content can never leave the server without auth
(see `plan.md` §7).

| Tier | Content | Served by |
|------|---------|-----------|
| **Free** | Grades 3–5, suite landing, correlation, guide, answer key (password-gated) | nginx, static |
| **Paid** | Grades 6–8 (`grade68/`) | Node auth gateway (`server.js`), session-gated |

## Architecture

```
                          ┌─────────────── nginx (:80/:443) ───────────────┐
  browser  ───────────▶   │  /            → static  /var/www/digcit         │
                          │  /grade35/…   → static                          │
                          │  /assets/…    → static                          │
                          │  /grade68/…   ┐                                 │
                          │  /login /logout ├─ proxy ─▶ Node app (:8080)    │
                          └─────────────────┘         serves /srv/digcit-paid│
                                                       only if session valid │
```

The free tree (`/var/www/digcit`) is deployed **without** `grade68/`. The paid
tree is deployed to `/srv/digcit-paid` (outside the web root) where only the
gateway process can read it. A misconfigured static route therefore cannot leak
paid files.

## 1. Build the static site

From the repo root:

```bash
npm install                 # jsdom, for the test harness
node scripts/bake.js        # (re)build locales from src + translation overlays
node scripts/gen-html.js    # student HTML skeletons
node scripts/gen-site.js    # hubs, landing, teacher pages, correlation, guide, policy
ANSWER_KEY_PASSWORD='choose-one' node scripts/build-answer-key.js
node solve-test.js          # must print ALL PASS
```

## 2. Deploy the free tier (nginx)

```bash
# free tree WITHOUT grade68/
rsync -av --delete \
  --exclude 'grade68/' --exclude 'node_modules/' --exclude 'hosting/' \
  --exclude 'scripts/' --exclude '*/src/' --exclude '*/i18n/' --exclude '.git/' \
  ./  user@your-linode:/var/www/digcit/

sudo cp hosting/nginx/digcit.conf /etc/nginx/sites-available/digcit
sudo ln -sf /etc/nginx/sites-available/digcit /etc/nginx/sites-enabled/digcit
sudo nginx -t && sudo systemctl reload nginx
```

Edit `server_name` (and add TLS) in `digcit.conf` first. Use Certbot for HTTPS
and redirect port 80 → 443 in production; set `COOKIE_SECURE=1` for the app.

## 3. Deploy the paid tier (gateway)

```bash
# protected tree OUTSIDE the web root
rsync -av --delete ./grade68/ user@your-linode:/srv/digcit-paid/
rsync -av ./assets/ user@your-linode:/var/www/digcit/assets/   # assets stay free

# on the server
cd /opt/digcit-gateway            # copy hosting/ here
npm install --omit=dev

# create district accounts (NEVER commit the result)
node make-account.js austin-isd 'a-strong-password' "Austin ISD" >> /tmp/acct.json
# paste the printed object into accounts.json as a JSON array element
```

Run it under a process manager (systemd shown; pm2 works too):

```ini
# /etc/systemd/system/digcit-gateway.service
[Unit]
Description=Digital Citizenship paid-tier gateway
After=network.target
[Service]
WorkingDirectory=/opt/digcit-gateway
ExecStart=/usr/bin/node server.js
Environment=PORT=8080
Environment=PAID_DIR=/srv/digcit-paid
Environment=ACCOUNTS_FILE=/opt/digcit-gateway/accounts.json
Environment=SESSION_SECRET=REPLACE_WITH_LONG_RANDOM_STRING
Environment=COOKIE_SECURE=1
Restart=on-failure
User=www-data
[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now digcit-gateway
curl -s localhost:8080/healthz    # -> ok
```

## Environment variables (gateway)

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8080` | must match `upstream` in nginx conf |
| `PAID_DIR` | `../grade68` | protected tree; set to `/srv/digcit-paid` in prod |
| `ACCOUNTS_FILE` | `./accounts.json` | JSON array of `{id, name, hash, ipAllow?}` |
| `SESSION_SECRET` | dev placeholder | **set a long random value in prod** |
| `COOKIE_SECURE` | off | `1` behind HTTPS |

## Accounts

`accounts.json` is a JSON array; generate hashed entries with `make-account.js`.
Optional `ipAllow` is a list of IP prefixes (e.g. `"129.116."`) to slow
credential sharing — leave `[]` for no restriction. `accounts.json` is
git-ignored; `accounts.example.json` shows the shape (demo password: `demo1234`).

## Rotating the answer-key password

Rebuild and redeploy `answer-key.html`:

```bash
ANSWER_KEY_PASSWORD='new-password' node scripts/build-answer-key.js
```
