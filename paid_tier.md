# Granting Paid-Tier Access — A Plain-English Guide

This guide shows you how to give a school district access to the **paid activities
(Grades 6, 7, and 8)**. It uses **Ardent ISD** as the example throughout. Just
swap in the real district's details where you see Ardent ISD.

No coding experience needed — you'll copy, paste, and run a few commands.

---

## The 30-second version

To let a district in, you **create an account** for them: one **District ID**
and one **password**. You hand those two things to the district. When their
teachers go to your site's Grades 6–8 section, they sign in once and they're in
for the school day.

- **Free tier** = Grades 3, 4, 5 → anyone can use it, no login.
- **Paid tier** = Grades 6, 7, 8 → login required, one account per district.

There is **no student signup**. The whole district shares one account.

---

## What you need before you start

1. The paid-tier server (the "gateway") is already set up and running on your
   Linode. If it isn't running yet, that's a separate one-time setup — see
   `hosting/README.md`. This guide assumes it's already live.
2. You can log in to that server (usually with a command like
   `ssh you@your-server`). If you don't know what that means, ask whoever set up
   the server — this guide is the part you do *after* you're logged in.

Everything below happens **on the server**, in the gateway folder
(commonly `/opt/digcit-gateway`).

---

## Step 1 — Pick the district's details

You need to decide three things:

| Thing | Ardent ISD example | Rules |
|-------|--------------------|-------|
| **District ID** | `ardent-isd` | Short, all lowercase, no spaces. This is their username. |
| **Password** | `SunnyRiver47!` | Make it strong. You'll give this to the district. |
| **Display name** | `Ardent ISD` | The friendly name, can have spaces. |

> 💡 **Tip:** Write the password down somewhere safe *now*. After the next step
> it gets scrambled and you can't read it back out — you can only reset it.

---

## Step 2 — Create the account entry

Go to the gateway folder and run the `make-account.js` helper. The pattern is:

```
node make-account.js <District ID> '<Password>' "<Display Name>"
```

For Ardent ISD:

```bash
cd /opt/digcit-gateway
node make-account.js ardent-isd 'SunnyRiver47!' "Ardent ISD"
```

It prints something like this (your `hash` will look different — that's the
scrambled password, and that's correct):

```json
{
  "id": "ardent-isd",
  "name": "Ardent ISD",
  "hash": "$2a$12$eImiTXuWVxfM37uY4JANjQ...."
}
```

> The password is **hashed** (scrambled with bcrypt). The real password is never
> stored on the server — only this scrambled version. That's a good thing.

---

## Step 3 — Add the account to the list

All accounts live in a file called **`accounts.json`** in the gateway folder.
It's a list (an "array"), wrapped in square brackets `[ ]`, with each district's
entry separated by a comma.

Open `accounts.json` in a text editor:

```bash
nano accounts.json
```

**If the file is new/empty**, make it look exactly like this (paste the object
from Step 2 between the square brackets):

```json
[
  {
    "id": "ardent-isd",
    "name": "Ardent ISD",
    "hash": "$2a$12$eImiTXuWVxfM37uY4JANjQ...."
  }
]
```

**If there are already other districts in the file**, add a **comma** after the
previous entry, then paste the Ardent ISD object. Example with two districts:

```json
[
  {
    "id": "brookfield-isd",
    "name": "Brookfield ISD",
    "hash": "$2a$12$abc123...."
  },
  {
    "id": "ardent-isd",
    "name": "Ardent ISD",
    "hash": "$2a$12$eImiTXuWVxfM37uY4JANjQ...."
  }
]
```

> ⚠️ **The two most common mistakes:**
> 1. Forgetting the **comma** between entries.
> 2. Leaving a comma *after the last* entry (the last one gets no trailing comma).
>
> The file must be valid JSON. If the server won't start after this, a
> misplaced comma is almost always why.

Save and close (in `nano`: press `Ctrl+O`, `Enter`, then `Ctrl+X`).

---

## Step 4 — Restart the gateway so it sees the new account

The server only reads `accounts.json` when it starts, so restart it:

```bash
sudo systemctl restart digcit-gateway
```

Check it's healthy:

```bash
curl -s localhost:8080/healthz
```

You should see `ok`. That's it — Ardent ISD can now log in.

---

## Step 5 — Give the district their credentials

Send Ardent ISD's administrator two things (through a secure channel — not a
public post):

- **District ID:** `ardent-isd`
- **Password:** `SunnyRiver47!`

Their teachers go to the Grades 6–8 area of your site. They'll see a **"District
sign-in"** page. They enter the ID and password, click **Sign in**, and they're
in. The login lasts about **8 hours** (one school day), then they sign in again.

---

## Optional — Lock a district to its own network

If you want to make credential-sharing harder, you can tie an account to the
district's internet (IP) addresses. Add the IP prefixes as a **fourth argument**,
separated by commas. Ask the district's IT person for their public IP range(s).

```bash
node make-account.js ardent-isd 'SunnyRiver47!' "Ardent ISD" 129.116.,140.168.
```

That produces an entry with an extra `ipAllow` line:

```json
{
  "id": "ardent-isd",
  "name": "Ardent ISD",
  "hash": "$2a$12$....",
  "ipAllow": ["129.116.", "140.168."]
}
```

Now logins for Ardent ISD only work from those networks. Leave the fourth
argument off entirely for **no** restriction (the normal case).

---

## How to change or remove access later

### Reset a district's password
Re-run Step 2 with a new password, then **replace** that district's entry in
`accounts.json` with the new one, and restart the gateway (Step 4).

### Revoke access completely
Delete that district's `{ ... }` object from `accounts.json` (and the comma that
goes with it), then restart the gateway. They can no longer sign in.

---

## Safety rules (please don't skip these)

- 🔒 **Never commit `accounts.json` to git.** It's already git-ignored for a
  reason — it's the key to your paid content.
- 🔑 **Store passwords somewhere safe** (a password manager). The server can't
  show them back to you.
- 🌐 **Send credentials privately** — email/portal to the district admin, not a
  shared doc or chat channel.
- 🧾 **`accounts.example.json`** shows the file's shape with a fake demo account —
  look at it if you're unsure what a valid file looks like.

---

## Quick reference (cheat sheet)

```bash
# 1. Go to the gateway folder
cd /opt/digcit-gateway

# 2. Make the account entry (copy the JSON it prints)
node make-account.js ardent-isd 'SunnyRiver47!' "Ardent ISD"

# 3. Paste that entry into accounts.json (mind the commas!)
nano accounts.json

# 4. Restart and verify
sudo systemctl restart digcit-gateway
curl -s localhost:8080/healthz      # -> ok

# 5. Hand the District ID + password to the district.
```
