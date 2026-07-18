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

## V1 Scope (planning constraint — derived, owner-confirmed)

> Confirmed 2026-07-18. This is the single most important input to `/plan-phase`. Derived from
> Team=solo + Timeline=3–6mo wedge-first + owner's explicit v1 selection.

**v1 = the session spine + all three marketplaces.** Eight domains:

| # | Domain | Role in v1 | Musts |
|---|---|---|---|
| 01 | Identity, Profiles & Organizations | the account everything hangs off | 10 |
| 02 | Credits & Attribution | the wedge — capture at source | 9 |
| 05 | Services Marketplace | hiring = the funnel into the room | 10 |
| 07 | Music Projects & Collaboration | where the work happens | 9 |
| 09 | Rights & Ownership | **split CAPTURE only** (not collection) | 7 |
| 13 | Gear Marketplace (physical) | traffic + first directive | 15 |
| 14 | Digital Goods & Plugins | digital marketplace | 10 |
| 15 | Gear Registry & Ownership | provenance-follows-instrument | 1 |
| | **v1 total** | | **~71 Musts** |

**Explicitly PHASE 2+** (stay `Must` per D-20, but not v1): Royalties/Collection (10),
Licensing (11), Release/Distribution (12), Live/Events (16–19), Fanbase (20), Promotion (21),
Analytics (22), Career/Finance (23), Community (03), Opportunities (04), Education (06),
Real-Time Jamming (08), Trust & Safety product surface (24 — baseline moderation still needed in v1).

**⚠️ RISK FLAGGED for `/plan-phase` and `/create-prd`** (owner-accepted, not blocking): ~71 Musts
across 8 domains, **solo, in 3–6 months**, with three marketplaces of different physics (physical
shipping vs licence-key/DRM vs serial-keyed provenance) AND global-day-one compliance, is a very
aggressive v1. `/plan-phase` should stress-test whether this fits the timeline or whether the
marketplaces should themselves be phased behind the session spine. The wedge (01/02/05/07/09-capture)
is the irreducible core; the marketplaces are additive.

**Rights nuance**: v1 includes split **capture** (cheap — a signed document at the moment of
creation, which is the unrepeatable wedge), NOT royalty **collection** (PRO/society registration,
CWR, DDEX — heavy integration, a different company, phase 2+). This resolves the D-10 "thesis"
tension: capture now, collect later.

## Compliance

> Confirmed 2026-07-18, `/ideate-validate`. **Primary market: GLOBAL from day one** (owner choice).

**⚠️ Tension flagged**: global-from-day-one is the heaviest possible compliance surface and is in
tension with solo + 3–6mo. The agent recommended launching one jurisdiction first; the owner chose
global. Recorded for `/create-prd-security` to confront. Mitigant: v1 scope excludes the highest-
compliance domains (payouts/KYC-AML in Royalties, fan age-gating in Fanbase), so v1's *effective*
compliance load is lighter than the full platform even under a global posture.

| Area | Trigger | v1? | Posture |
|---|---|---|---|
| GDPR / UK-GDPR / CCPA / global DP | All user data | **v1** | Global posture: design for DSAR, deletion, portability, consent from day one. Strictest-wins across jurisdictions. |
| PCI-DSS scope | Marketplace checkout, service payments | **v1** | Minimize scope — use a provider (Stripe/equiv) that keeps card data off WeJammin servers (SAQ-A). `/create-prd-stack`. |
| Consumer protection / distance selling / withdrawal rights | Physical + digital goods (13/14) | **v1** | Digital-goods withdrawal-waiver (EU CRD Art.16(m)) already specified in 14.09.01. Physical returns in 13. Global = strictest-wins. |
| DMCA / copyright takedown | UGC audio in Projects (07), gear listings | **v1 (baseline)** | Notice-and-takedown + repeat-infringer policy needed once UGC exists. Full system phase 2 with the marketplaces at scale. |
| Contracts / e-signature | Split sheets (09), service contracts (05) | **v1** | Core to the wedge — split capture requires enforceable e-sign. |
| KYC / AML | Vendor payouts, escrow | **phase 2** | Deferred with Royalties/collection and at-scale marketplace payouts. Note: marketplace *sales* in v1 still need seller payouts → minimal KYC via the payments provider's Connect onboarding. |
| Marketplace facilitator tax / VAT / GST / MOSS | Multi-vendor + cross-border digital | **v1 (via provider)** | Lean approach: use the payments/tax provider's marketplace tax handling (Stripe Tax / equiv) rather than building it. `/create-prd-stack`. |
| Tax reporting (1099-K / W-9 / W-8BEN) | Provider payouts | **v1 (via provider)** | Provider-handled. |
| Age gating / children's access | Fan surface, UGC | **phase 2** | Deferred with the Fanbase domain (20). v1 is professional-facing. |

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
