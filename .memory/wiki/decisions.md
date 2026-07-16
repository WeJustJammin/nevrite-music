# Decisions

## Summary

- **Total decisions**: 6
- **Unique decision titles**: 6

> Full ideation decision log (D-01..D-17) lives in
> `.memory/wiki/specs/ideation/ideation-index.md`. This file records the decisions with
> **downstream ripple effects** beyond ideation.

## Full Log

### DEC-001: The rights stack is the thesis, not an adjacency (2026-07-16)
- **Problem**: Rights & Ownership, Royalties, Licensing and Distribution emerged as 4 domains / ~70 sub-domains that **no user directive asked for**. The owner named a marketplace, digital goods, a directory and events. Marking them `core` was an agent inference and needed owner ratification.
- **Options considered**: (1) Thesis — all four `core`, platform holds the ownership record end-to-end. (2) Adjacency — all four `important`, ship directed scope first. (3) Partial — Rights `core`, the rest `important` (agent recommendation).
- **Decision**: **Option 1 — thesis.** All four `core`. Owner overrode the agent's "partial" recommendation, consistent with the maximal brief ("a platform musicians cannot live without").
- **Downstream**: Adds the most regulated, most integration-heavy scope in the industry (PRO/society registration, CWR exchange, DDEX conformance, statement ingestion) before any user liquidity exists. Massively raises `/create-prd-security` compliance surface. `/plan-phase` must not treat these as deferrable.
- **Reversibility**: Medium — priority can be lowered later, but the split-at-creation capture must exist from day one or the data is permanently lost for sessions that already happened.

### DEC-002: Fans are first-class users, not CRM records (2026-07-16)
- **Problem**: Does WeJammin have a fan-facing surface, or are fans objects inside an artist's CRM?
- **Options considered**: (1) B2B-only — fans are records. (2) Fan surface — fans get accounts. (3) Deferred — model the fan properly now, build the surface later (agent recommendation).
- **Decision**: **Option 2 — fans are users.** Fans get accounts, follow artists, receive gig alerts, discover shows. Owner overrode the agent's "deferred" recommendation.
- **Downstream**: (a) Consumer-scale traffic — fans outnumber professionals by orders of magnitude → rewrites the performance budget; (b) a second moderation population with different failure modes → Trust & Safety (24) load; (c) statutory duties that scale with consumer reach (age assurance / children's access, DSA thresholds) → `/create-prd-security`; (d) strengthens the open mobile-surface question — gig alerts are push notifications and show discovery is phone-shaped.
- **Reversibility**: Low — a consumer surface changes the growth model, the compliance posture and the architecture. Hard to unwind once fans exist.

### DEC-003: Structural classification remains `single-surface` despite the fan decision (2026-07-16)
- **Problem**: The sweep's synthesis asserted that a fan audience forces a multi-surface classification. This would have restructured the entire ideation folder tree.
- **Options considered**: (1) Accept the synthesis and reclassify multi-surface. (2) Verify against the kit's own reference first.
- **Decision**: **Verified and rejected the claim.** Per `prd-templates/references/surface-model.md`, a *surface* is a **deployment target** (web/mobile/desktop/cli/api/extension), not an audience. Fans + professionals on one Astro web app = one surface. Classification stays `single-surface`.
- **Downstream**: Folder layout unchanged (domains stay top-level children of `ideation/`, no `surfaces/` folder). Real consequence is an expanded Role Matrix in all 24 domain indexes. The **mobile surface question remains genuinely open** and is now more pressing — see `meta/constraints.md`.
- **Reversibility**: High — but reclassifying later means restructuring the tree, so getting it right pre-seeding mattered.
- **See also**: PAT-001.

### DEC-004: Three separate marketplace domains, not one (2026-07-16)
- **Problem**: Physical gear, digital plugins and human services — one "Marketplace" domain or three?
- **Options considered**: (1) Three domains (agent recommendation). (2) One Marketplace with heavy sub-domains. (3) Two — Goods + Services.
- **Decision**: **Option 1 — three domains** (05 Services, 13 Gear, 14 Digital Goods).
- **Downstream**: Everything genuinely shared (cart, payments, messaging, search, reviews, disputes, tax, shipping) is already a **cross-cut** — the merge would buy nothing. Everything that differs is irreconcilable at schema level: gear is qty=1 non-fungible stock where condition is ~40% of price; digital is licence keys + a format×OS×DAW matrix with refunds that cannot be un-given (colliding with EU withdrawal law); services are scoped human output with briefs and taste disputes. A merge yields a `listing` entity with ~40 nullable columns. `/write-be-spec` must not collapse these.
- **Reversibility**: Medium.

### DEC-005: Commit identity is the business account, set repo-local (2026-07-16)
- **Problem**: No git identity was configured at all (`user.name`/`user.email` unset globally and locally) — any commit would have failed. Repo ownership had moved from `NEVRITERob` to `WeJustJammin`.
- **Options considered**: (1) Business account + GitHub noreply. (2) Business account + real business email. (3) Keep the personal Gmail.
- **Decision**: **Option 1.** `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, set **repo-local** so other projects are unaffected. `WeJustJammin` verified as `type: User`, id `305953066`.
- **Downstream**: Commits attribute to the business. **`gh` transport is still the personal account** — see BLOCKER-001. Open question raised: `WeJustJammin` is a User account, not an Organization — no teams, no scoped repo roles, no runner groups. Converting is cheapest now while the repo is empty.
- **Reversibility**: High.

### DEC-006: Firebase removed entirely from project documents (2026-07-16)
- **Problem**: The predecessor (SoundBytez) ran Next.js + Firebase App Hosting. Initial constraints capture documented the migration as a was/is table.
- **Options considered**: (1) Keep migration context for traceability. (2) Remove — document only the stack in use.
- **Decision**: **Option 2 — removed.** Owner: "that's from an old plan we don't even need that entry in the documents; we are going to move forward with the stack we use."
- **Downstream**: `meta/constraints.md` states only the locked stack (Astro islands, Cloudflare Pages + Workers, Supabase) plus what remains open for `/create-prd` (auth provider, media storage, styling, payments). **Supabase is the only element carried forward from the predecessor** — Firebase Auth, App Hosting and its deploy pipeline have no equivalent and must not be assumed by `/create-prd-stack`.
- **Reversibility**: High.
