# Deployment Guide

## How it works — the big picture

Every app in this monorepo is a **static export** (plain HTML/JS/CSS files). There is no server to manage. When you deploy, you:

1. Build the app locally → produces a folder of static files
2. Upload that folder to **Cloudflare Pages** via `wrangler`
3. Cloudflare serves those files globally from its CDN

---

## The three apps

| App | Package name | Build output | Live URL |
|-----|-------------|--------------|----------|
| Landing page | `@finventree/web` | `apps/web/out/` | `finventree.com` |
| Web/mobile app | `@finventree/app` | `apps/app/dist/` | `app.finventree.com` |
| Admin panel | `@finventree/admin` | `apps/admin/out/` | `admin.finventree.com` |

---

## What is Wrangler?

Wrangler is Cloudflare's official CLI tool. In this project it does one thing: **uploads your build output folder to a Cloudflare Pages project**.

It is installed as a dev dependency at the monorepo root (`package.json`) and authenticated once per machine via `pnpm exec wrangler login` (opens a browser).

Each app has a `wrangler.toml` that tells wrangler which Pages project to target and which folder to upload:

```toml
# apps/web/wrangler.toml
name = "finventree-web"
compatibility_date = "2025-01-01"
pages_build_output_dir = "out"
```

---

## Deploying after making changes

### Deploy a single app

```bash
# Landing page only
pnpm deploy:web

# Main app only
pnpm deploy:app

# Admin panel only
pnpm deploy:admin
```

Each of these scripts (defined in the root `package.json`) does two things in sequence:
1. Builds the app
2. Runs `wrangler pages deploy` to upload to Cloudflare

### Deploy all three at once

```bash
pnpm deploy
```

Turborepo runs all three builds in parallel (using caching — if nothing changed in an app, it skips the rebuild), then uploads each one.

### Deploy a preview (doesn't affect the live domain)

```bash
pnpm deploy:preview
```

This uploads to a temporary preview URL (`*.pages.dev`) that you can share for review before it goes live. Useful for QA.

---

## Step-by-step: typical code change → production

```
1. Make your code changes in apps/web, apps/app, or apps/admin

2. Test locally:
   pnpm dev:web      # http://localhost:5175
   pnpm dev:app      # http://localhost:5173 (or whichever port Vite picks)
   pnpm dev:admin    # http://localhost:3000

3. Deploy:
   pnpm deploy:web   # or :app or :admin, or just `pnpm deploy` for all

4. Done — live within ~30 seconds of upload completing
```

No git push required to deploy. Wrangler uploads directly from your machine.

---

## What each deploy command runs internally

### `pnpm deploy:web`
```bash
next build          # compiles React → static HTML/JS in apps/web/out/
wrangler pages deploy out --project-name finventree-web
```

### `pnpm deploy:app`
```bash
tsc && vite build   # type-checks + compiles → apps/app/dist/
wrangler pages deploy dist --project-name finventree-app
```

### `pnpm deploy:admin`
```bash
next build          # compiles React → static HTML/JS in apps/admin/out/
wrangler pages deploy out --project-name finventree-admin
```

---

## Turborepo caching (why builds are sometimes instant)

Turborepo hashes your source files. If nothing has changed since the last build, it restores the output from cache instead of rebuilding. This means:

- Change only `apps/web` → only `finventree-web` rebuilds; the other two are instant cache hits
- Change a shared package → all apps that depend on it rebuild

The cache is stored locally in `.turbo/`. On a fresh machine, the first build is always a full build.

---

## One-time machine setup

If you're deploying from a new machine or a new terminal session, you need to authenticate wrangler first:

```bash
pnpm exec wrangler login
```

This opens a browser. Log in to your Cloudflare account and click **Allow**. The token is stored at `~/.config/.wrangler/config.toml` — it persists across terminal sessions.

Verify you're logged in:
```bash
pnpm exec wrangler whoami
```

---

## Cloudflare Pages projects

Three projects were created in the account `imdtaha8@gmail.com`:

| Project | Pages URL | Custom domain |
|---------|-----------|---------------|
| `finventree-web` | `finventree-web.pages.dev` | `finventree.com` + `www.finventree.com` |
| `finventree-app` | `finventree-app.pages.dev` | `app.finventree.com` |
| `finventree-admin` | `finventree-admin.pages.dev` | `admin.finventree.com` |

The `*.pages.dev` URLs always work as a fallback even if the custom domain has an issue.

---

## Environment variables

The apps/app and apps/admin read Supabase credentials at runtime. These are set in local `.env.local` files (never committed to git) and must also be added to Cloudflare Pages if the build step needs them.

To add env vars to a Pages project:
> Cloudflare Dashboard → Workers & Pages → [project] → Settings → Environment variables → Add variable

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` | `@finventree/app` |
| `VITE_SUPABASE_ANON_KEY` | `@finventree/app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `@finventree/admin` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `@finventree/admin` |

> **Note:** The landing page (`@finventree/web`) does not use Supabase and requires no environment variables.

---

## Rollback

Every deployment is versioned in Cloudflare. To roll back:

> Cloudflare Dashboard → Workers & Pages → [project] → Deployments → find the previous deployment → **Rollback to this deployment**

Or re-deploy an older git commit locally:
```bash
git checkout <old-commit-hash>
pnpm deploy:web   # re-uploads the old build
git checkout chore/monorepo-setup   # go back to current branch
```

---

## Continuous deployment (optional future setup)

Currently deployments are triggered manually from the command line. If you want automatic deploys on every `git push`, connect the GitHub repo in the Cloudflare dashboard:

> Workers & Pages → [project] → Settings → Build & deployments → Connect to Git

Set:
- **Branch**: `chore/monorepo-setup` (or `main` once you merge)
- **Build command**: `pnpm --filter @finventree/web build` (adjust per project)
- **Build output directory**: `apps/web/out` (adjust per project)

With this configured, every push to the branch auto-triggers a build and deploy on Cloudflare's servers — no local action needed.
