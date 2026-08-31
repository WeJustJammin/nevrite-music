# Local bootstrap

This guide verifies the WeJammin scaffold on a local machine. It stops at
local validation. It does not log in to a provider, provision hosted resources,
apply a hosted migration, or deploy an artifact.

## Prerequisites

Install Git, Node.js `v22.23.1`, and pnpm `11.24.0`. Docker is not required for
the scaffold check. Database verification is a later workflow and uses local
Supabase tooling only.

## Exact commands

For a fresh checkout:

```sh
git clone https://github.com/WeJustJammin/nevrite-music.git
cd nevrite-music
```

Run the remaining commands from the checkout root, where `package.json` is
present:

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm validate
```

To inspect each local surface after validation, use separate terminals:

```sh
pnpm dev:web
pnpm dev:worker
```

Stop either development server with `Ctrl-C`. Do not run a deploy command as
part of local bootstrap.

## Expected output

The version checks print exactly:

```text
v22.23.1
11.24.0
```

`pnpm install --frozen-lockfile` exits with code 0 and reports that the
lockfile is current. It must not rewrite `pnpm-lock.yaml`.

`pnpm validate` exits with code 0 after format checking, linting, type-checking,
coverage, browser tests, and builds complete successfully. The web server
reports `http://localhost:4321`; the Worker reports its local Wrangler URL,
normally `http://localhost:8787`.

## Troubleshooting

### Node or pnpm version mismatch

Run the two version checks again. Select Node `v22.23.1` with the machine's
approved version manager, then activate pnpm `11.24.0` through Corepack. Do not
silence an engine error or bypass the frozen lockfile.

### Frozen install reports lockfile drift

Run `git diff -- package.json pnpm-lock.yaml` to identify the changed input.
Restore the approved dependency files from the branch or have the dependency
change reviewed, then rerun `pnpm install --frozen-lockfile`. A local bootstrap
must never hide drift with `--no-frozen-lockfile`.

### A local port is already in use

Stop the process holding the port, or start the web server on another local
port with `pnpm --filter @wejammin/web dev -- --port 4322`. Keep the Worker and
web terminals separate so their logs remain attributable.

### Playwright cannot find Chromium

Install the pinned local browser with `pnpm exec playwright install chromium`,
then rerun `pnpm validate`. This downloads a test dependency to the local
machine; it creates no hosted account or subscription.

### Wrangler asks for login or a deploy fails

That is outside local bootstrap. Stop and use the dedicated hosting setup
workflow only after its provider, environment, and budget decisions are
explicitly approved. No Cloudflare API token is needed for the commands in
this guide.

### Supabase or Docker is unavailable

That does not block the scaffold check. Do not substitute a hosted Supabase
connection. Local database start, migrations, RLS tests, and type generation
belong to the dedicated data setup workflow.

## Cost and provider boundary

This guide performs no Cloudflare, Supabase, DNS, GitHub, or hosted-provider
API action. It creates no billing relationship, payment method, trial, hosted
database, monitoring account, or production secret. It installs no Sentry or
other third-party monitoring service.

Cloudflare Workers Paid is the sole paid exception authorized for this project.
Its account and deployment actions remain in the dedicated hosting workflow;
local bootstrap does not activate or change that plan. Supabase and every
other provider remain free or local unless the owner approves a separate
decision with an exact price.
