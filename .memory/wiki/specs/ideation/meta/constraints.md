# Project Constraints — WeJammin

> Status: `[DEEP]` — all constraint categories resolved during `/ideate-validate` 2026-07-18.
> Budget, Timeline, Team, V1 Scope, Compliance, Performance, and Surfaces all confirmed with owner.

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
| Service | `actions.runner.WeJustJammin-nevrite-music.wejammin-{1,2,3}.service` (**system**, via official `svc.sh`) |
| Unit files | `/etc/systemd/system/actions.runner.WeJustJammin-nevrite-music.wejammin-*.service` |
| Autostart | ✅ `enabled`, `WantedBy=multi-user.target`, 3 boot symlinks present |
| Runs as | `rob` (svc.sh sets `User=`) |
| Host | CachyOS (Arch), 8 cores, 15 GiB RAM |

**Install path — official.** Uses GitHub's documented `svc.sh install`. An earlier interim
build used `systemd --user` units (because `sudo` requires a password here); that approach has
been **fully removed** — see the incident note below, which records a real defect it caused.

**Scoped sudo**: `/etc/sudoers.d/10-wejammin-runners` grants passwordless `systemctl`/`journalctl`
**only** for `actions.runner.*` units. Source of truth for the entry, including the scoping
rationale, is version-controlled at `.github/10-wejammin-runners.sudoers`. It deliberately does
**not** cover `svc.sh` (user-writable ⇒ NOPASSWD there would be equivalent to passwordless root).

### ⚠️ Incident: orphaned listeners locked out the real services (2026-07-16)

Recorded because the failure mode is non-obvious and would be expensive to rediscover.

**What happened**: the interim user-unit had `KillMode=process`, chosen so in-flight jobs could
finish on shutdown. Side effect: on stop, systemd killed only the main process and **left
`run-helper.sh` + `Runner.Listener` alive as orphans**. Those orphans kept holding their GitHub
runner sessions. When the official `svc.sh` units then started, they collided:

```
A session for this runner already exists.
Runner connect error: Error: Conflict. Retrying until reconnected.
```

**Two of the three system services gave up and exited.** Meanwhile the GitHub API still
reported all 3 runners `online` (its status lags ~60s), so the control plane looked healthy
while the fleet was two-thirds dead.

**Lessons for `/setup-workspace-cicd`**:
1. `KillMode=process` on a runner unit **leaks supervised children**. The runner's own
   `run-helper.sh` is a respawner — killing a listener while its helper lives just relaunches it.
   Kill supervisors before children, or don't use `KillMode=process`.
2. **A runner session is exclusive.** Two listeners registered under one runner name will
   conflict, and the loser exits. Never leave a second supervisor running.
3. **Never verify a runner fleet from the GitHub API alone** — cross-check `systemctl is-active`
   and the process table, then prove it with a real workflow run.

**Resolution**: orphans killed, sessions freed, dead units restarted via the scoped sudo entry,
interim user unit file deleted, `systemctl --user daemon-reload` confirms no residue.

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

> Confirmed 2026-07-18, `/ideate-validate`.

- **Posture**: **Lean — minimize monthly spend.** Prefer free-tier / usage-based / scale-to-zero
  services. Pre-revenue.
- **Implication for `/create-prd-stack`**: the locked stack (Cloudflare Pages + Workers, Supabase)
  already fits this well. Bias toward managed services that scale to zero over anything
  self-operated. Avoid fixed monthly costs (dedicated instances, always-on search clusters)
  where a usage-based equivalent exists. Any capability that would add a fixed monthly floor
  (e.g. a hosted search cluster, a media-transcode pipeline) must be justified against a
  cheaper edge/managed alternative.
- **Not a hard ceiling number** — "keep it cheap" is the rule, no fixed $/month cap set.

## Timeline

> Confirmed 2026-07-18, `/ideate-validate`.

- **Target**: **Wedge-first, fast — 3–6 months to a first shippable v1.**
- **Strategy**: ship the provenance wedge + consolidation core; defer the rest to later phases.
- **Implication**: `/plan-phase` must sequence aggressively. The 195 Musts (D-20) are NOT all v1 —
  see **V1 Scope** below. Phasing is now a hard planning input, not a deferred question.

## Team

> Confirmed 2026-07-18, `/ideate-validate`.

- **Composition**: **Solo — the owner plus AI agents** (this pipeline and successors).
- **Implication**: no parallel human workstreams. Everything is sequential build by one person
  with AI leverage. This makes ruthless phasing essential and strongly favors managed services
  (Supabase/Cloudflare do the operational heavy lifting) over anything requiring ops attention.
  A 24-domain platform is a multi-year road solo; v1 must be a tight, buildable slice.

## Release Plan (planning constraint — derived, owner-confirmed)

> Confirmed 2026-07-18, **revised same day** to split the release. This is the single most
> important input to `/plan-phase`. Derived from Team=solo + Timeline=3–6mo wedge-first + owner's
> explicit two-release decision (D-31).

**The v1 marketplace risk was accepted then mitigated by splitting the release into two.**

### v1 — the session spine (first release, ~45 Musts, 5 domains)

The irreducible wedge: hire → do the work → capture credit + split at source → on one identity.
This is what's genuinely buildable solo in 3–6mo AND delivers the unrepeatable provenance wedge.

| # | Domain | Role in v1 | Musts |
|---|---|---|---|
| 01 | Identity, Profiles & Organizations | the account everything hangs off | 10 |
| 02 | Credits & Attribution | the wedge — capture at source | 9 |
| 05 | Services Marketplace | hiring = the funnel into the room | 10 |
| 07 | Music Projects & Collaboration | where the work happens | 9 |
| 09 | Rights & Ownership | **split CAPTURE only** (not collection) | 7 |
| | **v1 total** | | **~45 Musts** |

### v1.5 — the marketplaces (soon after v1, ~26 Musts, 3 domains)

Released shortly after v1. Physical + digital commerce plus gear provenance. Kept separate because
the three marketplaces have different physics and their own compliance load — they should not gate
the wedge's launch.

| # | Domain | Role | Musts |
|---|---|---|---|
| 13 | Gear Marketplace (physical) | traffic + first directive | 15 |
| 14 | Digital Goods & Plugins | digital marketplace | 10 |
| 15 | Gear Registry & Ownership | provenance-follows-instrument | 1 |
| | **v1.5 total** | | **~26 Musts** |

### Phase 2+ (stay `Must` per D-20, later releases, ~124 Musts)

Royalties/Collection (10), Licensing (11), Release/Distribution (12), Live/Events (16–19),
Fanbase (20), Promotion (21), Analytics (22), Career/Finance (23), Community (03), Opportunities
(04), Education (06), Real-Time Jamming (08). Trust & Safety (24) product surface phases in, but a
**baseline moderation capability is needed from v1** (UGC exists the moment Projects ships).

**Why the split resolves the risk** (D-31): the original single-v1 (~71 Musts, 8 domains, all
marketplace physics at once, solo, 3–6mo) was flagged as over-aggressive. Splitting lets the
session spine (the thing that proves the thesis) ship first and fast, with the marketplaces
following as a focused second release rather than gating the wedge.

**Rights nuance (unchanged)**: v1 includes split **capture** (cheap — a signed document at creation,
the unrepeatable wedge), NOT royalty **collection** (PRO/society registration, CWR, DDEX — heavy
integration, phase 2+). Resolves the D-10 thesis tension: capture now, collect later.

## Compliance

> Confirmed 2026-07-18, `/ideate-validate`. **Primary market: UNITED STATES to start** (owner
> revised from an initial "global from day one" to US-first, resolving the flagged tension).

**Tension resolved**: the initial global-from-day-one choice was flagged as the heaviest possible
compliance surface, in tension with solo + 3–6mo. The owner revised to **US-first** — one coherent
federal framework (with a state-privacy patchwork) instead of every jurisdiction at once. Expansion
to other markets is a later decision; `/create-prd-security` should design the data model so
international expansion is additive (field-level data-residency awareness) but not build for it now.

**US compliance model** (baseline for `/create-prd-security`):

| Area | Trigger | Phase | Posture (US) |
|---|---|---|---|
| CCPA/CPRA + state privacy patchwork | All user data | **v1** | Design for access/deletion/opt-out of sale/portability. CA is strictest — build to CCPA and most states are covered. Keep the model jurisdiction-parameterized for later GDPR without a rewrite. |
| PCI-DSS scope | Service payments (05), marketplace checkout (v1.5) | **v1** | Minimize scope — provider (Stripe/equiv) keeps card data off WeJammin servers (SAQ-A). `/create-prd-stack`. |
| Contracts / e-signature (ESIGN Act / UETA) | Split sheets (09), service contracts (05) | **v1** | Core to the wedge. US ESIGN/UETA make click-through + audit-trail e-signatures enforceable — lighter than qualified e-sign. |
| DMCA §512 notice-and-takedown | UGC audio in Projects (07) | **v1 (baseline)** | Register a DMCA agent, notice-and-takedown + repeat-infringer policy needed the moment UGC ships. Full system scales with v1.5/phase 2. |
| Marketplace facilitator sales tax (state-by-state) | Multi-vendor sales | **v1.5** | Use the payments/tax provider's marketplace-facilitator handling (Stripe Tax / equiv) — economic-nexus rules vary by state; do NOT build this. `/create-prd-stack`. |
| Tax reporting (1099-K / W-9) | Seller + service-provider payouts | **v1 (via provider)** | Provider-handled (Stripe Connect issues 1099-Ks). Note the 2024+ lowered 1099-K thresholds. |
| Consumer protection / returns | Physical + digital goods | **v1.5** | US has no federal 14-day withdrawal right (unlike EU) — returns are policy-driven per seller. Digital-goods no-refund is simpler in the US than the EU CRD path already specified in 14.09.01 (keep that logic, gate it by jurisdiction). |
| KYC / AML | At-scale payouts, escrow | **phase 2** | Minimal KYC via the payments provider's Connect onboarding covers v1/v1.5 seller payouts; full AML deferred. |
| COPPA / age gating | Fan surface, UGC with minors | **phase 2** | US COPPA (under-13) deferred with the Fanbase domain (20). v1/v1.5 are professional-facing. |

## Performance

> Confirmed posture 2026-07-18. Hard budget set at `/create-prd-compile`.

- **Scale expectation (v1)**: professional users, not consumer scale — thousands, not millions.
  Fan/consumer scale (D-13) arrives in phase 2 with domain 20, and *that* is when the budget
  must account for orders-of-magnitude more traffic.
- **Latency**: real numbers set at `/create-prd-compile`. Note the one hard physical constraint
  already surfaced: Real-Time Jamming (08, phase 2) has a ~25–30ms desync ceiling — but that's
  out of v1 scope.
- **Availability**: the predecessor's "99.9% uptime" claim is aspiration, not a locked budget.
  The Cloudflare edge already provides strong baseline availability. Real target at
  `/create-prd-compile`.
- **Lean implication**: performance work should ride the edge platform's built-in capabilities
  (Cloudflare caching, Workers) before adding paid performance infrastructure.

## Project Surfaces

| Surface | Type | Cross-Platform? | Notes |
|---------|------|----------------|-------|
| Web app | Astro islands — static + SSR via Workers | N/A | **Primary and only declared surface.** Responsive; must serve on-the-go use (gig/venue/studio contexts). |
| Desktop | — | — | Not in scope. No directive. |
| Mobile (PWA) | PWA over the Astro web app | N/A | **v1**: web is installable as a PWA (home-screen, web push for gig alerts). Serves the phone-shaped workflows without a separate surface. |
| Mobile (native) | Native app | Yes | **Phase 2** (owner-confirmed 2026-07-18). Web-first now; a native surface is planned for phase 2, primarily serving Live/Events (16–19) and Fanbase (20) — the phone-context domains. Tracked as a **future surface**, so v1 classification stays `single-surface`; the native port is a separate future project. Per `vertical-slices.md` surface-first strategy. |
| API | `[PENDING — /create-prd]` | N/A | Marketplace + integrations + a future native mobile client all imply a public/internal API. `/create-prd` should design the data layer API-first so the phase-2 native app consumes the same contracts. |
| CLI | No | No | Not applicable. |

> **Structural Classification remains `single-surface` for v1** (one Astro web app + PWA). The
> phase-2 native mobile surface is a tracked FUTURE addition, not a current surface — it does not
> change today's folder structure (no `surfaces/` folder). When phase 2 begins, the native app is
> added as a second surface consuming the same backend. Confirmed 2026-07-18. See D-28.
>
> **Design-now implication**: because a native surface is coming, `/create-prd` should keep the
> backend API-first and avoid web-only coupling in the data/API layers, so the phase-2 port is an
> additive surface rather than a re-architecture.
>
> Surface classification drives tech stack in `/create-prd`, folder structure in
> `/decompose-architecture`, and spec shapes downstream.
