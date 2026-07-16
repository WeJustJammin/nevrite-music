# Project Constraints — WeJammin

> Status: `[PARTIAL]` — locked constraints recorded during `/ideate-extract`.
> Remaining sections are filled by `/ideate-validate`.

## Locked Technical Constraints (user-declared)

> These were declared by the owner up front and are **inputs** to `/create-prd`, not open
> decisions for it. `/create-prd-stack` must treat these as fixed unless the owner reopens them.

| Constraint | Value | Source |
|---|---|---|
| **Frontend architecture** | Astro islands | User directive, 2026-07-16 |
| **Hosting — static/edge** | Cloudflare Pages | User directive, 2026-07-16 |
| **Compute** | Cloudflare Workers | User directive, 2026-07-16 |
| **Backend / data** | Supabase (Postgres, Auth, Storage, Realtime) | User directive, 2026-07-16 |
| **Canonical domain** | `https://wejamm.in` | User directive, 2026-07-16 |

### Stack Decisions Still Open

> The locked table above is settled. These remain open and belong to `/create-prd-stack`.

| Concern | Status |
|---|---|
| Auth provider | `[PENDING — /create-prd]` (Supabase Auth is the natural default given the locked backend) |
| File / media storage | `[PENDING — /create-prd]` — must account for audio assets at scale |
| Client state management | `[PENDING — /create-prd]` |
| Styling system | `[PENDING — /create-prd]` |
| Payments / payouts provider | `[PENDING — /create-prd]` — multi-vendor payouts and escrow materially constrain this choice |

### Repository

| Item | Value |
|---|---|
| Origin | `https://github.com/WeJustJammin/nevrite-music.git` (WeJustJammin business org) |
| Default branch | `main` (no commits yet as of 2026-07-16) |

### CI/CD Constraints (user-declared, 2026-07-16)

> Locked directives. Not product domains — inputs to `/setup-workspace-cicd`.

| Constraint | Value |
|---|---|
| **Deployment flow** | GitHub → Cloudflare (owner's stated preference) |
| **Runner strategy** | **Self-hosted local runners**, 2–3 of them |
| **Runner lifecycle** | Installed as a **systemd service**, **autostart on boot**, always ready |
| **Motivation** | Avoid consuming GitHub Actions minutes on the account |

**Why the motivation is sound**: `WeJustJammin/nevrite-music` is a **private** repo, so Actions
minutes are metered against the account's allowance (they are only unlimited on public repos).
Self-hosted runners bypass the meter entirely.

**Security note for `/setup-workspace-cicd`**: self-hosted runners are safe on this repo
*because it is private*. If the repo is ever made public, self-hosted runners must be
reconfigured or removed first — a fork's pull request would otherwise execute untrusted code
on the host. Record this as a gate on any future public-visibility change.

### Self-Hosted Runner Fleet — BUILT & VERIFIED (2026-07-16)

| Property | Value |
|---|---|
| Runners | `wejammin-1`, `wejammin-2`, `wejammin-3` — all **online** |
| Runner version | `actions/runner` v2.335.1 (linux-x64) |
| Install path | `/home/rob/actions-runners/wejammin-{1,2,3}` |
| Labels | `self-hosted`, `Linux`, `X64`, `wejammin`, `cachyos` |
| Service | `github-runner@wejammin-{1,2,3}.service` (**systemd `--user`**, templated unit) |
| Unit file | `/home/rob/.config/systemd/user/github-runner@.service` |
| Autostart | ✅ `enabled` + `Linger=yes` → starts at boot **without login** |
| Restart policy | `Restart=always`, `RestartSec=5s`, burst-limited 5/300s |
| Shutdown | `SIGTERM` + `TimeoutStopSec=5min` → in-flight jobs finish before exit |
| Host | CachyOS (Arch), 8 cores, 15 GiB RAM |

**Deviation from GitHub's documented install — and why**: the official `svc.sh install` writes
to `/etc/systemd/system` and needs root. `sudo` requires a password on this host, so that path
was unavailable to automation. **`systemd --user` units were used instead.** This is not a
downgrade: `svc.sh` configures the service to run as the invoking user anyway, so the runtime
identity is identical, and `Linger=yes` (already enabled) delivers the same boot-autostart
guarantee. It also keeps the fleet entirely within the user's own systemd scope — no root
surface at all.

**Dependency note (Arch)**: `icu`, `krb5`, `zlib`, `openssl` present. `lttng-ust` is **absent**
— it is optional (.NET tracing only) and the runner operates without it. GitHub's
`installdependencies.sh` targets Debian/RHEL and must not be run on this host.

**Verification performed** (`.github/workflows/runner-smoke-test.yml`, temporary scaffolding):
3 matrix jobs fanned across all 3 runners, one each — proving fleet distribution, not just a
single live runner. Toolchain reachable, Cloudflare API egress confirmed **from the runner**,
checkout succeeded, **0 minutes billable**.

**Operator commands**:
```bash
systemctl --user status  'github-runner@wejammin-*'   # health
systemctl --user restart 'github-runner@wejammin-1'   # bounce one
journalctl --user -u 'github-runner@*' -f             # live logs
gh api repos/WeJustJammin/nevrite-music/actions/runners --jq '.runners[].status'
```

**Capacity note for `/setup-workspace-cicd`**: 3 runners on 8 cores / 15 GiB. Concurrent
heavy builds (3× Node/Astro at once) will contend for RAM — ~5.8 GiB was available at install
time. If builds start thrashing, reduce to 2 runners rather than adding memory pressure.

### Open Infrastructure Actions

| Item | Status | Owner | Blocks |
|---|---|---|---|
| Point `wejamm.in` DNS at Cloudflare | **NOT DONE** — domain not yet forwarding to Cloudflare | User | `/setup-workspace-hosting` |
| `gh auth login` as `WeJustJammin` | **NOT DONE** — currently authed as personal account `NEVRITERob` | User (interactive; agent cannot handle credentials) | Initial `git push`; self-hosted runner registration |
| Install 2–3 self-hosted runners as systemd services | **NOT DONE** — blocked on gh reauth | User + Agent | `/setup-workspace-cicd` |
| Convert `WeJustJammin` from User account → Organization | **OPEN QUESTION** — currently `type: User` (id 305953066). Orgs give teams, scoped repo roles, and runner groups. Cheapest to do now while the repo is empty. | User | — |

## Architecture Concerns Reclassified Out of the Product

> These appeared as "features" in the predecessor README (`idea.md`) but are **not product
> domains**. They are recorded here as inputs to `/create-prd`, per the Node Classification Gate
> anti-pattern rule ("Creating 'Data Architecture' or 'Tech Stack' as product domains").

| README bullet | Reclassified as | Routed to |
|---|---|---|
| 🔒 **Enterprise Security** — "multi-layer security with real-time threat detection and compliance monitoring" | Security architecture (NFR + architecture concern). Its **product-facing** half (reporting, disputes, DMCA, account security, moderation) remains a product domain. | `/create-prd-security` |
| 🌐 **Global CDN** — "fast, reliable access worldwide with 99.9% uptime" | Availability + performance budget (NFR). Note: largely satisfied by the Cloudflare Pages/Workers constraint already locked above. | `/create-prd-compile` (performance budget) |
| **Technology Stack** section | Architecture decisions — superseded by the locked constraints above. | `/create-prd-stack` |

## Budget

`[PENDING — /ideate-validate]`

## Timeline

`[PENDING — /ideate-validate]`

## Team

`[PENDING — /ideate-validate]`

## Compliance

> Not yet interviewed. Flagged early because the owner's directives (multi-vendor marketplace
> with physical + digital goods, payouts to multiple parties, UGC) trigger obligations that
> materially shape architecture. `/ideate-validate` must resolve these.

| Area | Trigger | Status |
|---|---|---|
| PCI-DSS scope | Payments / marketplace checkout | `[PENDING]` |
| KYC / AML | Vendor payouts, escrow | `[PENDING]` |
| Marketplace facilitator tax / VAT / GST | Multi-vendor sales, digital goods cross-border | `[PENDING]` |
| Tax reporting (1099-K / W-9 / W-8BEN) | Vendor + service-provider payouts | `[PENDING]` |
| GDPR / CCPA | User data, DSAR, deletion, portability | `[PENDING]` |
| DMCA / copyright | UGC audio, rights disputes | `[PENDING]` |
| Consumer protection / distance selling | Physical goods sales, returns | `[PENDING]` |
| Age gating | UGC + commerce | `[PENDING]` |

## Performance

`[PENDING — /ideate-validate]`

> Prior claim from predecessor README: "99.9% uptime". Unvalidated — treat as aspiration, not
> a locked budget, until `/create-prd-compile` sets a real one.

## Project Surfaces

| Surface | Type | Cross-Platform? | Notes |
|---------|------|----------------|-------|
| Web app | Astro islands — static + SSR via Workers | N/A | **Primary and only declared surface.** Responsive; must serve on-the-go use (gig/venue/studio contexts). |
| Desktop | — | — | Not in scope. No directive. |
| Mobile | — | — | **Open question** — no native surface declared. Live/event and studio workflows are strongly mobile-context. `/ideate-validate` should confirm whether responsive web is sufficient or a PWA/native surface is wanted. Changing this alters the Structural Classification. |
| API | `[PENDING — /create-prd]` | N/A | Multi-vendor marketplace + integrations may require a public API. |
| CLI | No | No | Not applicable. |

> Surface classification drives tech stack in `/create-prd`, folder structure in
> `/decompose-architecture`, and spec shapes downstream.
