# Decisions

## Summary

- **Total decisions**: 49
- **Unique decision titles**: 49

## DEC-001: The rights stack is the thesis, not an adjacency (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: Rights & Ownership, Royalties, Licensing and Distribution emerged as 4 domains / ~70 sub-domains that **no user directive asked for**. The owner named a marketplace, digital goods, a directory and events. Marking them `core` was an agent inference and needed owner ratification.
- **Options considered**: (1) Thesis — all four `core`, platform holds the ownership record end-to-end. (2) Adjacency — all four `important`, ship directed scope first. (3) Partial — Rights `core`, the rest `important` (agent recommendation).
- **Decision**: **Option 1 — thesis.** All four `core`. Owner overrode the agent's "partial" recommendation, consistent with the maximal brief ("a platform musicians cannot live without").
- **Downstream**: Adds the most regulated, most integration-heavy scope in the industry (PRO/society registration, CWR exchange, DDEX conformance, statement ingestion) before any user liquidity exists. Massively raises `/create-prd-security` compliance surface. `/plan-phase` must not treat these as deferrable.
- **Reversibility**: Medium — priority can be lowered later, but the split-at-creation capture must exist from day one or the data is permanently lost for sessions that already happened.

## DEC-002: Fans are first-class users, not CRM records (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: Does WeJammin have a fan-facing surface, or are fans objects inside an artist's CRM?
- **Options considered**: (1) B2B-only — fans are records. (2) Fan surface — fans get accounts. (3) Deferred — model the fan properly now, build the surface later (agent recommendation).
- **Decision**: **Option 2 — fans are users.** Fans get accounts, follow artists, receive gig alerts, discover shows. Owner overrode the agent's "deferred" recommendation.
- **Downstream**: (a) Consumer-scale traffic — fans outnumber professionals by orders of magnitude → rewrites the performance budget; (b) a second moderation population with different failure modes → Trust & Safety (24) load; (c) statutory duties that scale with consumer reach (age assurance / children's access, DSA thresholds) → `/create-prd-security`; (d) strengthens the open mobile-surface question — gig alerts are push notifications and show discovery is phone-shaped.
- **Reversibility**: Low — a consumer surface changes the growth model, the compliance posture and the architecture. Hard to unwind once fans exist.

## DEC-003: Structural classification remains `single-surface` despite the fan decision (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: The sweep's synthesis asserted that a fan audience forces a multi-surface classification. This would have restructured the entire ideation folder tree.
- **Options considered**: (1) Accept the synthesis and reclassify multi-surface. (2) Verify against the kit's own reference first.
- **Decision**: **Verified and rejected the claim.** Per `prd-templates/references/surface-model.md`, a *surface* is a **deployment target** (web/mobile/desktop/cli/api/extension), not an audience. Fans + professionals on one Astro web app = one surface. Classification stays `single-surface`.
- **Downstream**: Folder layout unchanged (domains stay top-level children of `ideation/`, no `surfaces/` folder). Real consequence is an expanded Role Matrix in all 24 domain indexes. The **mobile surface question remains genuinely open** and is now more pressing — see `meta/constraints.md`.
- **Reversibility**: High — but reclassifying later means restructuring the tree, so getting it right pre-seeding mattered.
- **See also**: PAT-001.

## DEC-004: Three separate marketplace domains, not one (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: Physical gear, digital plugins and human services — one "Marketplace" domain or three?
- **Options considered**: (1) Three domains (agent recommendation). (2) One Marketplace with heavy sub-domains. (3) Two — Goods + Services.
- **Decision**: **Option 1 — three domains** (05 Services, 13 Gear, 14 Digital Goods).
- **Downstream**: Everything genuinely shared (cart, payments, messaging, search, reviews, disputes, tax, shipping) is already a **cross-cut** — the merge would buy nothing. Everything that differs is irreconcilable at schema level: gear is qty=1 non-fungible stock where condition is ~40% of price; digital is licence keys + a format×OS×DAW matrix with refunds that cannot be un-given (colliding with EU withdrawal law); services are scoped human output with briefs and taste disputes. A merge yields a `listing` entity with ~40 nullable columns. `/write-be-spec` must not collapse these.
- **Reversibility**: Medium.

## DEC-005: Commit identity is the business account, set repo-local (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: No git identity was configured at all (`user.name`/`user.email` unset globally and locally) — any commit would have failed. Repo ownership had moved from `NEVRITERob` to `WeJustJammin`.
- **Options considered**: (1) Business account + GitHub noreply. (2) Business account + real business email. (3) Keep the personal Gmail.
- **Decision**: **Option 1.** `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, set **repo-local** so other projects are unaffected. `WeJustJammin` verified as `type: User`, id `305953066`.
- **Downstream**: Commits attribute to the business. **`gh` transport is still the personal account** — see BLOCKER-001. Open question raised: `WeJustJammin` is a User account, not an Organization — no teams, no scoped repo roles, no runner groups. Converting is cheapest now while the repo is empty.
- **Reversibility**: High.

## DEC-006: Firebase removed entirely from project documents (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: The predecessor (SoundBytez) ran Next.js + Firebase App Hosting. Initial constraints capture documented the migration as a was/is table.
- **Options considered**: (1) Keep migration context for traceability. (2) Remove — document only the stack in use.
- **Decision**: **Option 2 — removed.** Owner: "that's from an old plan we don't even need that entry in the documents; we are going to move forward with the stack we use."
- **Downstream**: `meta/constraints.md` states only the locked stack (Astro islands, Cloudflare Pages + Workers, Supabase) plus what remains open for `/create-prd` (auth provider, media storage, styling, payments). **Supabase is the only element carried forward from the predecessor** — Firebase Auth, App Hosting and its deploy pipeline have no equivalent and must not be assumed by `/create-prd-stack`.
- **Reversibility**: High.

## DEC-007: 08 Real-Time Jamming is the only genuine domain-merge candidate (2026-07-18)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-18T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: Step 6 flagged 101 boundary problems across the 24-domain map. Are any real merge candidates, or is the high cross-domain connectivity (76%) evidence the map is over-split (D-17)?
- **Options considered**: (1) Keep 24 domains — connectivity is structural. (2) Merge the high-tension seams. (3) Case-by-case.
- **Decision**: **Keep 24 domains.** ~85 of 101 boundary problems are legitimate seam-work between near-mirror domains; the universal hubs were lifted into the 25-mechanism cross-cut registry rather than left as domain edges. **Only `08 Real-Time Jamming` → `07 Music Projects` is a genuine merge candidate** (Overdub machinery could dissolve 08 into 07; rejected only narrowly). Escalated to `/create-prd` for explicit keep-or-fold.
- **Downstream**: High-tension seams (17/18 tour object, 17/19 ticket count, 13/15 serial unit, 14/20 delivery, 04/05 demand/supply anchors) get a **named shared owner or an extracted cross-cut**, NOT a merge. `/create-prd` must decide 08's fate before architecture locks.
- **Reversibility**: Medium — merging 08 later is cheaper than splitting a merged domain.

## DEC-008: The identifier-binding seam is an unowned architectural gap (2026-07-18)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-18T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Problem**: Step 6 surfaced that splits and titles attach to a work in Services (domain 05) — often years before an ISRC/ISWC identifier exists — but Royalties (domain 10) collects against those identifiers. No mechanism or domain owns the step that binds the early split-record to the later identifier.
- **Options considered**: (implicit) leave it to emerge in BE spec vs flag it now.
- **Decision**: **Flag and persist now.** Recorded in `meta/cross-cut-emergent-capabilities.md` and D-27. This is the highest-risk of 52 emergent cross-cuts / 76 emergent features found in Step 6.
- **Downstream**: `/create-prd` and `/write-be-spec` must assign an owner to the binding step; a schema that assumes work↔identifier was always linked will be wrong. Intersects the provenance thesis (D-18) directly — the split captured at creation must survive until the identifier exists to collect against it.
- **Reversibility**: Low if missed (retrofitting the binding after royalty flows exist is expensive); High if handled at architecture time.

## DEC-009: Taxonomy selection and proposals use constrained Config access (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Service taxonomy `05.01.02` marked all personas Read-only while credits taxonomy `02.06` marked the identical select/propose action Config for Musician, Producer, and Operator. The conflict left taxonomy-proposal writes without a platform-wide RBAC contract.
- **Options considered**: (1) Read-only for all personas. (2) Config for Musician, Producer, and Operator; Read-only for Fan. (3) New standalone Propose permission.
- **Decision**: **Option 2.** Musician, Producer, and Operator receive Config solely to select permitted values and submit a missing-value proposal to the curation queue; Fan remains Read-only. No persona can create, promote, deprecate, map, or edit vocabulary — those remain exclusive to the non-persona admin/governance role.
- **Downstream**: Aligns the service and credit taxonomy Role Lenses and parent Role Matrices. A proposal does not block publication and must not be mistaken for vocabulary curation. Resolves ledger `r-09[0]` / queue CQ-01.
- **Reversibility**: Medium — permission changes are structurally reversible before implementation, but every consumer's authorization checks must preserve the select/propose-versus-curate boundary.

## DEC-010: Collusion evidence uses a constrained versioned edge contract (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Credit-dispute resolution needed a defined interface to consume collusion detection without converting statistical topology into an accusation, witness exclusion, or automatic Trust & Safety case.
- **Options considered**: (1) Per-edge negative multiplier only. (2) Per-edge multiplier plus a typed `requiresNonTopologicalCorroboration` constraint. (3) Per-witness trust score plus ring flag.
- **Decision**: **Option 2.** `CollusionEvidenceConstraintV1` contains only `contractVersion`, opaque `attestationEdgeId`, per-edge `negativeMultiplier`, and literal `requiresNonTopologicalCorroboration: true`. Unknown versions are excluded. No raw score, topology signal, cluster/witness identity, trust score, ring flag, hard exclusion, or enforcement recommendation crosses the boundary.
- **Downstream**: `02.05` weights only the referenced attested-evidence edge. The collusion signal cannot itself create or advance a Domain 24 factual-dispute case; separately captured non-topological corroboration is required for any transition that relies on it. Contract persisted in `02.04.04`, `02.05`, the `02.04` index, Credits CX-18, and Domain 24 intake routing. Resolves ledger `r-20[2]` / queue CQ-03.
- **Reversibility**: Medium — a future interface version can add explicitly governed fields, but v1 consumers must reject unknown versions and preserve the prohibition on topology-only action.

## DEC-011: Ownership-ledger ordering uses a portable bytewise party-ID collation (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Domain 09 had already locked the total row key for reproducible Domain 10 cent allocation as `(pool, party-id, role, contribution-basis)`, but left `party-id` collation unresolved across Supabase Postgres, Cloudflare Workers, exports, and replay jobs.
- **Options considered**: (1) Explicit Postgres binary collation. (2) Platform-defined unsigned UTF-8 bytewise comparison of immutable canonical serialized internal party IDs.
- **Decision**: **Option 2.** The platform compares `party-id` as unsigned UTF-8 byte sequences in lexicographic order. Locale, display name, case-folding, Unicode normalization, and database-default behaviour are prohibited. Every runtime uses the same comparator or a persisted equivalent binary sort key.
- **Downstream**: The source-locked four-field tuple now produces the same portable, content-derived allocation order for every consented ledger. Database insertion/retrieval order and `entered-by` remain prohibited inputs; Domain 10 retains sole ownership of cent remainder policy. Resolves ledger `r-34[0]` / queue CQ-05.
- **Reversibility**: Medium — a future comparator must be explicitly versioned and historical ledger allocations must retain this v1 ordering contract for reproducibility.

## DEC-012: V1 feedback contradictions use bounded positional candidates and human flags (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Multi-stakeholder feedback required a practical v1 way to surface contradictions without enabling the platform to judge creative conflicts, introduce undeclared AI processing, or turn ambiguous language into a system verdict.
- **Options considered**: (1) Positional candidates plus manual flags. (2) Model-backed semantic detection. (3) Manual flags only.
- **Decision**: **Option 1.** Sort same-version timestamped comments ascending by offset. Seed each cluster with the earliest unassigned comment and include only later unassigned comments at most 5,000 ms from that seed; a Producer manually flags two or more comment IDs in a positional cluster or song-level bin as a contradiction. No topic extraction, semantic inference, AI request, ranking, recommendation, adjudication, or automatic notification occurs in v1.
- **Downstream**: Producers receive reproducible candidate groupings while retained contradiction flags remain attached to comment IDs through cluster split/merge. Human creative authority stays intact; a later semantic capability requires an explicit privacy, evaluation, and architecture decision. Resolves ledger `r-45[0]` / queue A-01.
- **Reversibility**: High — a later version may add an independently governed semantic detector, but must preserve the v1 no-adjudication boundary and auditable manual flags.

## DEC-013: Reaffirmed 24-domain ideation map after independent recovery audit (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: An interrupted workflow required recovery of WeJammin's proposed domain classification before advancing pipeline state. The recovered 24-domain tree already existed in the working tree, so replacement or reseeding without inspection would risk invalidating extensive ideation work.
- **Options considered**: (1) Confirm all 24 domains. (2) Review domain boundaries before confirmation. (3) Confirm map while reducing v1 scope. (4) Replace map.
- **Decision**: **Option 1 — confirm all 24.** The owner reaffirmed the complete map after an independent recovery: 14 lenses swept 1,545 concepts; 24 candidates were synthesized; four fresh audits found no missing required domain, cross-cut, blocker, or major boundary defect. The existing 24-folder fractal tree remains authoritative. Scope is not reduced by domain deletion; existing MoSCoW and release sequencing control v1.
- **Downstream**: `/ideate` proceeds from the already-complete 24-domain tree rather than reseeding it. The recovery proposal is retained as ratified evidence. The current accepted architecture remains Astro islands + Cloudflare Pages/Workers + Supabase; Firebase is excluded. Recorded as ideation D-35.
- **Reversibility**: Medium — individual domain boundaries can be evolved through the decision-propagation process, but replacing the 24-domain structure would cascade through 1,120 ideation files.

## DEC-014: Ratified immutable private-link recipient isolation for review feedback (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: `r-51[0]` classified the review-link permission intersection as unresolved despite existing Domain 07 cross-cut and child contracts defining recipient isolation.
- **Options considered**: (1) Ratify the existing asymmetric permission intersection: recipient sees only their own thread and replies. (2) Expose a shared recipient-visible feedback stream. (3) Allow owner-configured per-thread visibility.
- **Decision**: **Option 1.** The owner ratified, without redesign, CX-01, D-13, D-14, and D-10 as authoritative. An unauthenticated/private-link recipient may comment only in their own thread and see replies in it; they see no roster or internal comments, other recipient or their comments, other versions, project content, hidden-comment count, teaser, or hidden affordance. Audience is selected at post time and immutable; scope crossing requires a deliberate, attributed new comment. Link-recipient comments notify the roster, and listen-recording failure never blocks posting.
- **Downstream**: Domain 07 keeps one append-only, version-anchored comment stream with asymmetric recipient visibility. `/create-prd-architecture` must enforce the ratified intersection without adding a separate recipient ACL, mutable audience, or v1 scope expansion. Queue A-02 and ledger `r-51[0]` record the resolved ratification; no source-contract redesign occurred. Recorded as ideation D-36.
- **Reversibility**: Medium — a future, separately specified and authenticated sharing mode may be introduced only through a new decision; v1 isolation and every existing comment's post-time audience remain immutable.

## DEC-015: DAW parsing support is validation-gated before selection (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The capture-at-source thesis depends on DAW session parsing, but proprietary formats, silent parser rot, DAW-specific EULAs, and person-free track names made broad support an unvalidated premise.
- **Options considered**: (1) Validate supported DAWs first and define the person-free fallback. (2) Commit to broad parser coverage immediately. (3) Use manually mapped tracks only.
- **Decision**: **Option 1.** A candidate DAW must pass representative real-session validation and a DAW-specific legal review before WeJammin selects its parser or track-mapping integration. Person-free names retain available track/instrument context but create no contributor guess; the existing Producer prompt asks explicitly. Ambiguity asks, never infers; unsupported or unreadable formats remain non-blocking.
- **Downstream**: `07.09.02` and the DAW bridge index record the validation gate. `/create-prd-architecture` may choose candidates and delivery shape only after validation; it must preserve visible confidence, counter-attestation, parser-health monitoring, and non-blocking ingest. This does not choose DAWs, require a broad parser, or alter the web-only surface classification. Queue A-03 and ledger `r-52[0]` are resolved. Recorded as ideation D-37.
- **Reversibility**: Medium — later support expansion requires the same validation and legal gate; the no-inference and non-blocking boundaries remain required unless superseded through a new decision.

## DEC-016: Rights-aware vault defaults require practitioner validation (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The vault's role × asset-class profiles encode sensitive least-privilege defaults, but their fit with real producer and engineer workflows remained unvalidated.
- **Options considered**: (1) Validate proposed profiles with practitioners, then lock them. (2) Lock the current matrix immediately. (3) Replace defaults with owner-configured access only.
- **Decision**: **Option 1.** The proposed profiles are candidates only until practitioners performing each affected song role validate them and an approved profile version is recorded. Validation may refine grants per sensitivity class; it cannot introduce manual per-asset ACLs, project-wide grants, or an owner-configured-only access model.
- **Downstream**: `07.03.03` and its parent index record the validation gate. `/create-prd-security` defines validation evidence, profile versioning, and enforcement rollout while retaining per-song, role-derived least privilege; first-access NDA evidence; immediate fail-closed revocation; terms-not-grants separation; version-pinned ordinary acceptance; and explained denial. In-product NDA legal enforceability and master-owner precedence remain separate unresolved decisions. Queue A-04 and ledger `r-53[0]` are resolved. Recorded as ideation D-38.
- **Reversibility**: Medium — later default changes require new practitioner validation and profile versioning; existing approved-profile decisions remain auditable.

## DEC-017: Mixed DSP acceptance uses attached rejected-item details (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A DSP may accept some tracks in a release and reject others. The existing `(release × store × territory)` status identity must remain truthful without hiding actionable per-track evidence.
- **Options considered**: (1) Add a track axis to status identity. (2) Retain release-level identity with structured rejected-item detail. (3) Collapse to a release accepted/rejected result.
- **Decision**: **Option 2.** One `(release × store × territory)` row projects `Partial acceptance` while partner evidence is mixed. Each rejected-item detail retains stable affected-item ID, partner and original delivery/message correlation, evidence timestamp and normalized reason, triage/remediation state, and successor-delivery correlation after redelivery. The parent shows accepted/rejected/pending counts and actionable items; it never reports wholly `Accepted` or wholly `Rejected` until full-release evidence supports that claim.
- **Downstream**: `12.03.02`, its parent index, rejection triage, and DDEX cross-cuts record the contract. `/create-prd-architecture` defines persistence/query mechanics but must preserve evidence-labelled status, store-side `Live` truth, discard-not-amend in-flight messages, and rejecting-partner-only redelivery. Queue A-05 and ledger `r-54[1]` are resolved. Recorded as ideation D-39.
- **Reversibility**: Medium — future track-level status rows require an explicit identity migration and parent roll-up contract; historical mixed results retain the v1 attached-detail representation.

## DEC-018: Hold ladders use optimistic version checks and reject-and-reoffer (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Concurrent operators, expiry/release actions, challenges, and confirmation can mutate one ordered hold ladder. Last-write-wins, hidden merges, or locks would either silently demote a live party or block time-sensitive inventory.
- **Options considered**: (1) Optimistic per-ladder version check with reject-and-reoffer. (2) Serialized command queue. (3) Pessimistic edit lock. (4) Last write wins.
- **Decision**: **Option 1.** The owner ratified the existing source contract. Every mutation carries the current bookable-slot ladder version; the server alone assigns dense positions and receipt-time order. A stale version rejects before write, returns the authoritative ladder, and re-offers the intent. No merge, automatic replay, queue-behind, lock, or last-write-wins path exists.
- **Downstream**: Domain 17 source, parent CX, and parent index record the contract. `/create-prd-architecture` supplies compare-and-swap storage, idempotency, durable expiry execution, dual-ladder confirmation boundaries, and notification-outbox mechanics. It must atomically preserve ordering/version, required reorder attribution, audit/notification intent, and terminal semantics: expiry/release promote; withdrawal/date passage/confirmation void; release wins over a simultaneous challenge. Queue DQ-04.06 and ledger `r-78[0]` are resolved. Recorded as ideation D-40.
- **Reversibility**: Medium — implementation substrate may evolve only if it preserves version-conditional stale rejection and the resulting observable ordering/audit contract.

## DEC-019: Public comped-out credits retain transparent qualification (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A session contribution can be real while absent from the delivered master. D-09 retained the credit and outcome qualifier but left the public-discography treatment unresolved, risking either silent erasure or a misleading unqualified public credit.
- **Options considered**: (1) Keep the qualified record owner-only. (2) Render it publicly with a plain-language `not in final master` qualifier. (3) Render it publicly without a qualifier.
- **Decision**: **Option 2.** An otherwise publicly eligible retained credit renders once in its ordinary role family with the plain-language qualifier `not in final master`. Normal publication, per-credit visibility, embargo, and public-work-identity gates take precedence. The owner sees the trigger date; visitors see neither that date, the comp-out reason, nor delivery history. The record and provenance tier remain unchanged.
- **Downstream**: `02.01.01` D-09/Q-05 and `02.01.02` D-15/Q-07 record the contract. Viewer-relative counts include a visible qualified line once and a suppressed line zero times. The public qualifier does not determine ownership, union reporting, rights, registration, royalties, payment, or Domain 10 neighbouring-rights treatment; that registration question remains open. Queue CQ-02 and ledger `r-19[1]` are resolved. Recorded as ideation D-41.
- **Reversibility**: Medium — changing what a public credit means later requires an explicit product decision and matching source/audit migration, but does not require changing the preserved contribution record.

## DEC-020: Suspected-ring demotion changes traversal rank, not presentation (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A suspected attestation ring can silently lower one attestation edge's derived traversal weight, while the prior traversal contract left unresolved whether a still-eligible edge should be hidden, marked, or presented normally.
- **Options considered**: (1) Hide the edge. (2) Mark the edge as suspected. (3) Render the edge normally while silently applying the existing per-edge tier-weight demotion.
- **Decision**: **Option 3.** An otherwise eligible edge follows ordinary publication, viewer-visibility, embargo, provenance-floor, role, query-shape, fan-safety, and normal result-window gates. If returned, its path renders normally while the existing per-attestation-edge-derived demotion affects only ordinary ranking. No collusion-specific threshold, hiding, label, annotation, rationale, tooltip, notification, detector metadata, or unweighted bypass exists.
- **Downstream**: `02.01.03` D-05/Q-03 and `02.04` D-06/CX-03 record this presentation contract. Ring detection stays internal to every persona; CQ-03's constrained evidence interface stays per-edge with no score, flag, identity, hard exclusion, or topology-only escalation. The signal cannot create, advance, adjudicate, or notify a Domain 24 case without separately captured non-topological corroboration. Queue CQ-04 and ledger `r-25[0]` are resolved. Recorded as ideation D-42.
- **Reversibility**: Medium — a change to traversal presentation requires a new product decision and synchronized safety/audit review, but does not alter the underlying credit, detector, or dispute-evidence contract.

## DEC-021: Recorded master majority requires strictly more than half (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The master registry allowed parties to record `majority-by-share` but did not define the exact threshold, leaving a 50/50 ownership split and other consent outcomes ambiguous.
- **Options considered**: (1) Strictly more than 50% of consented ownership share. (2) At least 50%. (3) A higher recorded supermajority such as two-thirds.
- **Decision**: **Option 1.** For an expressly recorded master `majority-by-share` rule, a specific action authorizes only when affirmative **exact nominal master-owner share is strictly greater than 50%** of the full current consented master pool. Exactly 50% fails closed. Shares aggregate by owner stake rather than headcount; points, encumbrances, effective net, display rounding, silence, unreachability, and stale/invalid records cannot create or enlarge approval.
- **Downstream**: `09.01.03` owns the predicate, scope/version binding, Control Summary routing, and concrete tie/rounding/absence examples. `09.01.02` remains authority for exact shares, whole-ledger consent, versions, and states. An absent rule remains unanimous; `any-owner-non-exclusive` remains separate. The rule neither replaces amendment re-consent nor overrides a policy veto, encumbrance, publishing/performer/sample right, release/takedown policy, payout calculation, or Domain 24 case. Queue CQ-06 and ledger `r-35[0]` are resolved. Recorded as ideation D-43.
- **Reversibility**: Medium — threshold changes require an explicit owner decision and action-authorization migration, while established ledger versions and action approval history remain evidence.

## DEC-022: Overlapping mashup work weights require declarant allocation (2026-07-20)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-20T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A multi-work recording needs exact `Recording→Work` weights totaling 100%, but duration cannot determine allocation when a mashup's embodied works sound simultaneously. A universal duration default would normalize an arbitrary contribution claim into a royalty input.
- **Options considered**: (1) Prorate each work's full overlapping duration, then normalize. (2) Require declarant-entered exact weights totaling 100%. (3) Offer equal shares.
- **Decision**: **Option 2.** For temporal overlap, each embodied work receives a declarant-entered positive exact-rational weight and all weights total exactly 100%. No duration calculation, normalization, equal-share fallback, inferred remainder, or display-rounded validation exists. Duration proration remains an editable proposal only for declared disjoint medley/live-set spans.
- **Downstream**: `09.01.01` owns the link allocation; works remain separate and a mashup still requires independent source-master lineage/sample and embodied-work declarations. `10.03.01` consumes the valid as-of Domain 09 allocation before each separate work ledger and blocks invalid/incomplete allocation rather than inventing or repairing it. The weight declaration is neither ledger consent nor a master-action approval, and it does not decide licensing, release permission, or royalty entitlement beyond this allocation input. Queue CQ-07 and ledger `r-36[0]` are resolved. Recorded as ideation D-44.
- **Reversibility**: Medium — changing the default later requires a new owner decision and calculation-version treatment, while previously declared allocations and their calculation inputs remain historical evidence.

## DEC-023: Unclaimed stubs merge only on exact canonical writer-name sets (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The unclaimed-stub exception prevents duplicate work records from proliferating, but raw-string equality misses harmless presentation differences while fuzzy, identifier, or identity matching risks silently treating distinct people or assertions as the same.
- **Options considered**: (1) Exact stored-string equality. (2) Canonical asserted-text set equality. (3) Legal/stage identity resolution. (4) Fuzzy name similarity.
- **Decision**: **Option 2.** `writer-name-canonical-v1` evaluates each retained asserted writer string with pinned Unicode 15.1 data: NFC → Default Case Folding → trim/collapse Unicode whitespace → NFD/remove marks/NFC. The resulting order-independent sets must be exactly equal. An atomic merge occurs only while both works are distinct current unclaimed, unconsented, conflict-free stubs with no distinct-person or unresolved identity/alias evidence. Canonical text equality never resolves people, aliases, legal/stage identities, accounts, or authorship.
- **Downstream**: `09.01.01` solely owns the predicate, candidate/action split, raw-evidence retention, atomic recheck, lineage, and recording-owner notification. ISWC/ISRC, audio, fuzzy text/title, aliases, and identity signals may nominate candidates but cannot authorize merging. `09.01` CX-01 forbids link movement, ledger reconciliation, or partial mutation when recheck fails. A later incompatible assertion uses `09.04.01` ordinary claim-time detection/notification/dispute routing — no auto-unmerge, auto-case, fund freeze, or identity adjudication. Queue CQ-08 and ledger `r-36[1]` are resolved. Recorded as ideation D-45.
- **Reversibility**: Medium — changing a future canonicalization profile requires explicit versioning and migration review; retained original strings, source IDs, provenance, and merge lineage preserve evidence without asserting an identity conclusion.

## DEC-024: Term and moral-right status is bounded to four v1 jurisdictions (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Copyright term/public-domain and moral-right status vary by territory, but the product lacked a v1 coverage boundary for term rules, death-date facts, moral-right applicability, and waiver treatment. A global answer would falsely imply complete legal coverage; US-only would omit the central non-waivable/waiver distinctions the rights model already identifies.
- **Options considered**: (1) United States only. (2) United States plus France, Germany, and the United Kingdom. (3) Global per-territory status wherever evidence exists.
- **Decision**: **Option 2.** V1 supports determinate status only for `US`, `FR`, `DE`, and `GB`. A result requires source-attributed applicable-rule and required facts: work/category/authorship and death/publication/creation facts for term; author/estate standing plus transfer/waiver facts for moral rights. Every other territory or missing/insufficient fact is explicitly `unknown` / not determined. Territory remains an explicit model dimension, never a global boolean.
- **Downstream**: `09.03.05` owns source-backed term/public-domain status; `09.03.06` owns jurisdiction-scoped moral-right applicability/waivability; `09.03.04` remains authority for estate/death facts. Economic transfers never transfer moral rights. FR/DE non-waivability, GB waiver treatment, and US music non-applicability stay jurisdiction-scoped. No output is legal advice, clearance, licence, ownership adjudication, or release authorization; Domain 11 licensing and Domain 12 release gates remain independent. Queue CQ-09 and ledger `r-40[0]` are resolved. Recorded as ideation D-46.
- **Reversibility**: Medium — adding jurisdictions requires an explicit owner decision plus jurisdiction-specific rule/evidence validation. Historical results retain their jurisdiction, inputs, sources, and rule version; the four-jurisdiction boundary prevents a silent global expansion.

## DEC-025: Production-stage vocabulary is validation-gated before approval (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The existing production-stage labels are credible candidate evidence but unvalidated for recurring beatmaker delivery and contribution-centric session-player workflows. Hardening labels early could misplace Songs, fire provenance prompts at incorrect moments, or make release readiness depend on an unfit terminal stage.
- **Options considered**: (1) Lock the current ten-stage draft. (2) Practitioner-validate one shared fixed vocabulary, then have the product owner approve a version. (3) Split vocabulary by production model.
- **Decision**: **Option 2.** One platform-owned, fixed, music-specific vocabulary remains the sole permissible stage model. A candidate becomes enforceable only after two eligible beatmakers and two eligible session players map the required redacted workflow traces, every mismatch has a disposition, no critical mismatch or split-state-machine request remains, the gate passes, and the product owner explicitly approves one immutable enum version with its initial semantic, approved-master terminal semantic, and non-blocking prompt mappings.
- **Downstream**: `Song.current_stage` remains authoritative and the board remains its projection. Until approval, labels, order, initial state, terminal stage, prompt mappings, release predicate, reporting, and migration stay provisional. Validation may refine a candidate but cannot introduce user-configurable columns, production-model enums, a second machine, or unnormalised exceptions. Queue P-01 and ledger `r-44[0]` — see DEC-047 for the close. Recorded as ideation D-47.
- **Reversibility**: Medium — a future vocabulary requires a separately validated immutable version and migration plan; no unapproved candidate silently becomes historical contract.

## DEC-026: Large catalogues get a dense table, never a second lifecycle (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The production board had no defined behavior for a project or label catalogue at scale. A kanban of hundreds of cards stops being scannable, but a second view risks forking `Song.current_stage`, duplicating a Song per Release membership, or introducing bulk writes that bypass per-Song capture and authorization.
- **Options considered**: (1) Paginated board only. (2) Board below a threshold, dense catalogue table above it. (3) Exclude large catalogues from the feature.
- **Decision**: **Option 2, with a `60`-Song boundary.** Count unique visible authorized Songs in the selected scope **before** local search, sort, or table-only filters: `0–59` renders the craft board, `60+` renders the dense catalogue table. Selection is automatic — no v1 user override, saved preference, or URL mode. A local filter never switches a large scope back to board. A Song on several Releases counts once; sequence, selected master, and release-specific edits stay on the membership edge.
- **Downstream**: Both views are projections of the same `Song.current_stage` and a table row action invokes the identical per-Song authorized transition — same optimistic rollback, non-blocking capture prompt, dismissal completeness debt, roster notification, last-write-wins attributed notice, and derived readiness recomputation for every linked Release. V1 has **no bulk stage transition**; the table adds no configurable columns, per-card assignee, table-owned stage, or Release-local state. Pagination/cursor shape, page size, ordering, responsive behavior, and cache semantics are deferred to `/write-be-spec` and `/write-fe-spec`. Queue P-02 and ledger `r-44[1]` are resolved. Recorded as ideation D-48.
- **Reversibility**: High — the threshold is presentation policy over an unchanged state model, so a later value or an added manual override needs no data migration.

## DEC-027: Superseded approvals reinstate on version identity, never on judgement (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A backward stage transition marks later-stage approvals superseded. Nothing defined what happens when the song re-advances to that gate. Re-collecting every time punishes a mis-drag; auto-reviving would present an approval nobody gave for the current artifact.
- **Options considered**: (1) Always re-collect. (2) Auto-revive superseded approvals. (3) Re-collect only after a material change — either as a semantic judgement or as version identity.
- **Decision**: **Option 3, read as version identity.** Superseded approvals reinstate on re-advance **iff no new immutable version landed on the song in between**; any intervening version means the gate re-collects against its **current** approver set. The predicate is the append-only version timeline (`07.04.01` D-01 immutability, D-08 ingest order). The platform never asks a human whether a change was "material" and never certifies that nothing changed (`07.04.01` D-12).
- **Downstream**: `07.05.04` D-07 owns the rule; the `Reinstated` state and re-advance edge cases live there. The new-version branch is not a new rule — `07.05.04` D-01 already prevents an approval from transferring to a later version, so only the byte-identical administrative-reversion case needed deciding. Supersession and reinstatement are both **appended** events, preserving D-04's append-only trail and D-03's pinned comment state; nothing is retracted or rewritten. Already-pinned approvals are never rewritten when the approver set changes, and a departed approver still stalls the gate. The rule is presentation-agnostic across the P-02 board/table split, and Release re-readiness recomputes from the resulting stage without its own re-approval rule. Rejecting the semantic reading also avoids minting a third project-wide materiality definition alongside `07.03.03` D-07 and `02.04.01` D-10. Queue P-03 and ledger `r-44[2]` are resolved. Recorded as ideation D-49.
- **Reversibility**: Medium — a later semantic-materiality model would need its own classifier, judge, appeal path, and reconciliation with the two existing materiality definitions; historical supersede/reinstate events remain valid evidence either way.

## DEC-028: A handoff spec is authored where owned and referenced where not (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: `07.08.01` advertises six recipient specs — mastering, mix, sync, live, remix, archive — but only two have real contents on disk. Authoring all six would have the handoff builder originate requirements that domains 11, 12 and 05 already own, and invent `live` from no source at all.
- **Options considered**: (1) Define all six now. (2) Define the highest-frequency two first, others as follow-ons. (3) Ship a generic package with optional fields.
- **Decision**: **Option 2, re-cut on authority rather than frequency.** `07.08.01` originates `mastering`, `mix`, and `archive`'s asset half — the specs it provably owns per `07.08.03` Q-02. It **references** every spec owned elsewhere: `sync` → domain 11, DSP destination → domain 12, engagement-purchased handover → `05.04.02`/`05.04.04`. Referencing validates presence and surfaces the owner's verdict; it never restates the requirement. `live` and `remix` get no invented contents and become an ownership question.
- **Downstream**: Generalises `07.07.03` D-04 ("two copies of third-party requirements would drift, and one would be wrong") from destination specs to all referenced requirements. Preserves D-01 (specs are the product, not config) and D-02 (a spec is a least-privilege boundary — the mastering spec excludes stems *because the engineer should not have them*), both of which option 3 would have deleted. Severity is explicit: every requirement warns; integrity failure remains the sub-domain's only hard stop under domain D-04's "non-blocking is absolute". Also repaired a pre-existing contradiction where the no-canonical edge case asserted a second block citing a source that says the opposite. The Empty state now advertises only specs with contents behind them. Queue P-04 and ledger `r-46[0]` are resolved; `07.08.01` Q-01 is partly resolved and Q-04 opened for `live`/`remix` ownership. Recorded as ideation D-50.
- **Reversibility**: High for the set (adding a spec once a domain owns it is additive); Low for the ownership rule, which is now load-bearing across domains 05, 07, 11 and 12.

## DEC-029: Readiness targets follow the same ownership rule, and pin-vs-live is dissolved (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The readiness score computes against four targets — mix-handoff, mastering, DSP-release, sync-pitch — but no file enumerated any target's facts or thresholds. Separately, the score needed a *live* target while the handoff package *pins* its contents, which looked like two lifetimes on one object.
- **Options considered**: (1) Define every target fact now. (2) Evaluate externally owned specs only, deferring targets whose specs don't exist. (3) A generic score independent of target.
- **Decision**: **Option 2, re-cut per target on authority.** This is DEC-028's rule applied again: the score's targets and the handoff builder's recipient specs are one list under two names. `07.08.01` authors mastering and mix-handoff; DSP-release references domain 12 and sync-pitch references domain 11, consuming their severity classes as this feature's weights rather than re-deriving them. An unowned target is **not offerable**. "Block shipping" is recorded as **feature sequencing, never user-blocking** — the latter would breach domain D-04's absolute non-blocking rule and contradict DEC-028's own handling of the identical condition.
- **Downstream**: `07.08.03` D-07 records the ownership rule and D-08 dissolves pin-vs-live — one target-spec store with one version identity, the score a live **view**, the package a pinned **record** that now also pins the spec version it validated against. Domain 12 resolved the identical shape this way (`12.02.02` D-01, `12.01.02` D-07/DT-09); 07 does not inherit 12's authority to hold dispatch. Only `ready-for-DSP-release` is fully scoreable today. A set mismatch is recorded rather than hidden: eight recipient specs, four targets. Option 3 was foreclosed, not weighed — `07.08.03` DT-01 rejects a target-independent score "twice over". Also corrected a mis-routing: ISWC is `09.06.01`'s (captured, never issued), not domain 12's. Queue P-05 and ledger `r-47[0]` are resolved; whether readiness ever hard-blocks remains separately open. Recorded as ideation D-51.
- **Reversibility**: High per target (each becomes scoreable as its owner publishes); Medium for the store-and-version model, which now underpins both the score and every pinned package.

## DEC-030: A mis-typed source declaration is flagged, never reclassified (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A contributor may declare a "preset" that is really a full melodic loop — a different clearance obligation. The line is genuinely blurry and, as the source notes, the user will not know it either.
- **Options considered**: (1) Reclassify as a library-loop class and route to clearance review. (2) Keep the declared class and flag it. (3) Reject until resubmitted.
- **Decision**: **Option 2.** The declaration stands as made. A disputed type uses the existing attributed type-conflict path where both types are kept and surfaced, never auto-merged. Mitigation moves upstream: the capture prompt asks enumeratively — loop, one-shot, drum hit, vocal, break, stem, bought beat — so ambiguity surfaces at declaration time rather than hiding behind a bare "preset". Recorded as `07.08.04` D-08.
- **Downstream**: Reclassifying would have breached `07.08.04` D-03 (07 owns capture; 09/11 own clearance), the P-04/P-05 originate-vs-reference rule (the type axes belong to domain 14, the clearance consequence to `11.05.01`), and domain D-05 ("measure and show; never judge") — and would have required a detector that four separate decisions reject, "the honest posture is declaration, not detection". Rejection was foreclosed by domain D-04, which names "the capture prompt never blocks" as an enumerated instance, and is self-defeating: a rejected declaration reverts the region to `sources not reviewed`, destroying the fact it demanded. Queue P-06 and ledger `r-48[0]` are resolved. Recorded as ideation D-52.
- **Reversibility**: High — the enumerated prompt vocabulary can be extended without changing the no-adjudication rule, which is the load-bearing part.

## DEC-031: Vault re-gating fires only on an owner-declared material change (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: When access terms are re-versioned, it was unclear which existing holders must acknowledge the new version. Blanket re-gating interrupts live work; never re-gating leaves people operating under terms they never accepted.
- **Options considered**: (1) Re-gate every current holder. (2) Re-gate only on an owner-flagged material change. (3) Never re-gate.
- **Decision**: **Option 2 — confirming `07.03.03` D-07 at owner level rather than inventing policy.** Existing holders are not re-gated by default and acceptance records stay version-pinned; only an owner-flagged material change re-gates, at the holder's next access and never mid-transfer. Denial stays explained.
- **Downstream**: Materiality is **owner-declared, never platform-detected** — the owner authored the change, so the correct party judges. This is why it does not repeat the semantic reading DEC-027 rejected, where the only available judge was the wrong party, and it reuses D-07's existing definition rather than minting a fourth materiality concept. Option 1 was a recorded reversal: `07.03.03` DT-04 already rejected blanket re-gating for interrupting live work and training users to click through gates. The finding's real defect was a stale `[PENDING]` marker in the parent CX file contradicting its own resolved child. **The vault's fail-closed revocation is a locked security property and is not touched** — domain D-04's absolute non-blocking rule governs creative surfaces and enumerates no vault entry. Queue P-07a and ledger `r-50[0]` are resolved; what the flag records became `07.03.03` Q-05. Recorded as ideation D-53.
- **Reversibility**: Medium — the acceptance-record model is version-pinned and immutable, so changing the trigger later does not invalidate existing evidence.

## DEC-032: An access downgrade notifies the affected person and the roster (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T13:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A downgrade already notified the affected person, but no rule said whether anyone else is told. The queue's standing recommendation was to tell only the affected party.
- **Options considered**: (1) Affected contributor only. (2) Affected person plus the roster. (3) Only when they encounter denial.
- **Decision**: **Option 2, scoped.** A downgrade is an instance of D-09 ("every roster write is announced — to the named party, and to the existing roster"), not an exception to it. The roster audience is scoped by D-16 to members who can already see that person's entry, so a confidentiality-restricted roster discloses nothing it deliberately hides. Recorded as `07.03.01` D-18.
- **Downstream**: **This reversed the queue's own prior recommendation on evidence** — its "sensitive demotion" premise has no source anywhere in the tree, and D-16 makes personnel default-visible. The coordination argument decides it: work is *rostered*, not assigned, so the roster is the team's only coordination record, and `07.03.03` D-04 has already killed the downgraded party's live URLs — under option 1 co-contributors keep routing stems to someone whose access is dead. Option 3 contradicts written `[DEEP]` behavior and locked copy, and makes the first notice a mid-work lockout. Audience only: cadence and batching stay with the notification cross-cut per the reference-never-restate rule. Queue P-07b and ledger `r-50[1]` are resolved; actorless band-derived downgrades became `07.03.01` Q-05. Recorded as ideation D-54.
- **Reversibility**: High — audience is a fan-out rule over an unchanged access model.

## DEC-033: Originality aggregates into a nominal enum for comp matching (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: The gear comp key is locked as `model × condition × originality` in four places, but nothing defined what fills the originality slot — only a per-component vector existed.
- **Options considered**: (1) Derive an enumerated aggregate. (2) Component vector only. (3) Seller-entered label.
- **Decision**: **Option 1, constrained to a nominal enum.** `13.02.03` D-05 derives an enumerated aggregate from the component vector — explicitly unordered, because D-04 locks originality as "a factual axis, not a quality scale" (a mod raises studio-gear value and lowers vintage value). It partitions comp sets; it never ranks units.
- **Downstream**: Authored on the owning axis and consumed by `13.04.01`, per the reference-never-restate rule; a value derived inside matching logic would be the forbidden second copy. The component vector is untouched. Option 2 contradicts the locked comp key and leaves nearly every bucket at n≤1 across 3ⁿ cells, forcing constant disclosed widening; option 3 makes the comp key manipulable by the incentivised party. Derivation inputs, the Unknown mapping, a completeness predicate and enum versioning are `13.02.03` Q-03/Q-04. Queue P-08a and ledger `r-56[0]` are resolved. Recorded as ideation D-55.
- **Reversibility**: Medium — the enum's definitions and mapping must be versioned, since a copy edit corrupts a price time series invisibly.

## DEC-034: An originality change voids a live offer in either direction (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A seller can edit an originality disclosure while an offer is live. Nothing said whether the offer survives.
- **Options considered**: (1) Void on downgrade, preserve on upgrade. (2) Preserve all with a notice. (3) Void on any change.
- **Decision**: **Option 3.** `13.02.03` D-06: any originality change voids the live offer, versioned and disclosed. `13.03.02` principle 3 already voids an offer on any material change to the stated listing.
- **Downstream**: Option 1 was unratifiable as worded — "downgrade" presumes an ordering DEC-033 just declined to create, and its "evidence worsens" rationale has no substrate since this axis mandates no photos. Option 2 contradicts principle 3 and would make originality weaker than the post-purchase case. Option 3 needs neither an ordering nor a materiality definition, so it is the only option with zero invention. Per `13.02.02` D-04/D-11 it is framed as seller-protection with a re-offer path, so late honest disclosure is not punished. The offer's missing disclosure-version pin is routed to `/write-be-spec`. Queue P-08b and ledger `r-56[1]` are resolved. Recorded as ideation D-56.
- **Reversibility**: High — a narrower trigger can replace it once an ordering or evidence substrate exists.

## DEC-035: Local-pickup settlement is a per-listing seller choice (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Whether money moves through the platform on a local pickup was called the most consequential open question in its file — it determines fee revenue, escrow protection, and whether the ownership chain has a hole at a common transaction shape.
- **Options considered**: (1) Platform-settled always. (2) Off-platform always. (3) Seller chooses per listing.
- **Decision**: **Option 3.** `13.11` D-04 confirms what the tree already implements: a per-listing pickup boolean, a ship/pickup/both selector, and four downstream files already branching on where money moved.
- **Downstream**: A global settled rule would impose marketplace-facilitator sales-tax and 1099-K duties on every cash handshake plus custody and refund liability; a global off-platform rule would strand escrow, evidence and ownership-chain machinery already specified. **The chain follows the money**: settled writes the transfer at settlement, off-platform uses the manual handshake `15.01.03` D-01 already names as the fallback for off-platform trade. Two sources currently disagree about whether an off-platform chain entry is possible; that conflict is recorded as `13.11` Q-04 rather than silently resolved, with settled-branch residuals as Q-05. Queue P-09 and ledger `r-59[0]` are resolved. Recorded as ideation D-57.
- **Reversibility**: High — the branch is per listing, so policy can narrow later without migrating existing sales.

## DEC-036: A rights takedown preserves the holder record; a revision appends (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Two adjacent questions — what a rights takedown does to existing holders, and what an ordinary revision does. Both risked collapsing into one lifecycle path.
- **Options considered**: For takedown — preserve record + notice, treat as revision, or remove record. For revision — append + archive + notify, replace in place, or require repurchase.
- **Decision**: **Preserve for takedown; append for revision** — two paths, never one. `14.03.02` D-04 states both, joining `14.09.03` D-02/D-04, `14.04.01` D-08/D-09, and `14.03.02`'s own D-01/D-02.
- **Downstream**: Both were confirmations: `14.04.01` already carries the heading "Removal is not deletion, and a rights takedown is not a revision", and permanent fetchability was already locked. Treating a takedown as a revision would reuse a path that does not exist singly; removing the holder record contradicts at least seven locked decisions and leaves counter-notice put-back undefined; replace-in-place contradicts five; repurchase-per-revision contradicts "updates are offered" plus the displayed version range. Archive-fetch posture after a takedown and takedown granularity are `14.03.02` Q-04; retention cost/duration remains Q-01. Queue P-10a/P-10b and ledger `r-62[0]`/`r-62[1]` are resolved. Recorded as ideation D-58.
- **Reversibility**: Low for the two-path separation, which is now load-bearing across delivery, catalogue and refunds; High for retention parameters.

## DEC-037: A departed contributor's confirmed split row survives unchanged (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: What happens to a confirmed contributor's share when they leave or are erased — asked as a question about an *accruing* balance.
- **Options considered**: (1) Escrow for future claim. (2) Redistribute among remaining. (3) Forfeit to seller/platform.
- **Decision**: **Resolved as scoped.** `14.10.03` D-05: the confirmed split row survives unchanged — never zeroed, redistributed, or forfeited. **The accruing premise is out of scope**: pool funding and download attribution/accrual are both WONT, and the splits feature is explicitly decoupled from the pool, so no accrual exists to escrow.
- **Downstream**: Both alternatives were already foreclosed elsewhere — `09.02.04` D-14 makes a 0% row the removal-without-consent loophole, and `10.04.03` D-01 with `royalties-collections-index.md` D-09 forbid unpayable money becoming platform float or revenue. No escrow contract was created, because the premise requiring one is cut. GDPR erasure versus payout retention is `14.10.03` Q-04, a security question. **If the WONT features are ever promoted, the accruing half returns.** Queue P-11 and ledger `r-63[0]` are resolved. Recorded as ideation D-59.
- **Reversibility**: High — the split row is unchanged, so any future accrual model attaches to it without migration.

## DEC-038: A host-update break is an external change — flag, disclose, never revoke (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: When a host update breaks a purchased preset bank, nothing said who owes remediation.
- **Options considered**: (1) External compatibility, flag the entry, no default refund. (2) Vendor conformity defect. (3) Platform goodwill remedy.
- **Decision**: **Option 1.** `14.04.02` D-04 ratifies into the preset catalogue the pattern already locked at `14.07.01` D-04 ("'perpetual' is a promise about the entitlement and the artifact, not a guarantee of function") and D-06 (third-party state change → permit + mandatory disclosure + never revoke).
- **Downstream**: Gives OS drift, lapsed dependencies and host breaks one consistent story instead of three. Vendor-defect classification would assign liability for a third party's act against supply-time conformity scope; a goodwill remedy creates discretionary cost with no source-defined trigger on a low-value product. **What triggers the flag is undecided** (`14.04.02` Q-04): the compatibility matrix records *declared* host-version facts, not observed breakage, so only a buyer-reported path exists today, and asserting a break without evidence would be the platform judging a third party's product. Queue P-12 and ledger `r-64[0]` are resolved. Recorded as ideation D-60.
- **Reversibility**: High — a detection mechanism can be added later without changing who owes what.

## DEC-039: Several queue entries were mis-framed, and the ratifications correct them (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T14:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Across the marketplace block, four entries asked the owner to choose among options for questions that were already answered, mis-cited, or built on a cut premise — a pattern first seen in Domain 07's stale CX markers.
- **Options considered**: Ratify as framed, or correct the framing and record why.
- **Decision**: **Correct and record.** P-10a/P-10b were confirmations of contracts already locked in files the entries never cited; P-11's premise depends on two WONT features; P-08a cited the wrong CX (a flaw/evidence cross-cut, not the comp key) and the wrong sibling decision (P-08b's offer-void asymmetry); the P-08a interim rule suspended a locked comp key rather than describing the status quo.
- **Downstream**: Each ratification names the defect it corrects, so the queue stops teaching a false open/closed state. Reinforces the standing check: verify a queue recommendation's *premise* exists in the tree, and read the child before treating a parent marker as open. Adjacent stale markers found but deliberately not folded in (grade auto-downgrade, post-purchase disclosure change, `14.04.02` Q-03 against `14.09.02` DT-05) are recorded as separate reconciliations.
- **Reversibility**: N/A — this is a record-keeping correction, not a product policy.

## DEC-040: The bulk-import quality bar does not bend — the evidence moment moves (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Bulk gear import appeared to force a choice between relaxing the quality bar and failing the Operator persona. The queue collapsed four independently-locked axes into one scalar.
- **Options considered**: (1) Keep the normal per-unit bar, no publish until complete. (2) Allow disclosed lower-evidence bulk publication. (3) Restrict to specified seller classes.
- **Decision**: **Per-axis confirmation — the dilemma was false.** Model binding does not relax (bulk *raises* it); grading relaxes in a bounded, disclosed way with reduced comp weight and never an exemption; disclosure does not relax and admits no substitute; unit media does not relax but its capture moment moves to label print. In one line: the bar does not bend, the evidence moment moves, absence is disclosed and never gated.
- **Downstream**: A scalar answer would have silently overwritten at least one axis and, per `13.03` CX-03, created the prohibited shadow listing tier. Option 2's wording ("lower-evidence", "two-tier") reversed the meaning of the decisions it claimed to confirm, and two of its stated costs were inventions — no "trust weight" exists anywhere, and "unit handling" is not a state or event. Also repaired the false-dilemma prose surviving in `gear-marketplace-index.md` Q-13 and `13.03-listings-inventory-cx.md` — the unapplied half of this finding's own prescribed fix. Queue DQ-MG-01 and ledger `r-57[0]` are resolved. Recorded as ideation D-61.
- **Reversibility**: Medium per axis; the four are independently adjustable, which is the point of refusing the scalar.

## DEC-041: Stolen-serial review consumes domain 24's severity, and authors none (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: A false-positive stolen-serial hit blocks an innocent seller, and the source promised only a "fast human resolution path" — unmeasurable.
- **Options considered**: (1) Expedited SLA with mandatory updates. (2) Standard severity with escalation on evidence of imminent sale or hardship. (3) Provisional release after a short window.
- **Decision**: **Option 2 with its escalation clause struck.** The listing stays held, never deleted, and neither party is accused. Severity, SLA and escalation are consumed from `24.01.03`, which owns routing skill, severity and clock; domain 13 authors no number of its own.
- **Downstream**: The seller's substantive remedy already exists as the locked `reported → contested` dispute path in `15.02.04` — a dispute lane, not a support queue. The struck clause was the only inventive part: no source defines how the platform would observe "imminent sale or hardship", and doing so would mean adjudicating a fact nobody has. Option 1 would author a severity domain 24 owns; option 3 contradicts hold-not-delete. Queue DQ-MG-02 and ledger `r-58[0]` are resolved. Recorded as ideation D-62.
- **Reversibility**: High — severity is consumed, so a change in domain 24 propagates without a decision here.

## DEC-042: Approval-required licence transfers freeze on vendor exit (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: When a vendor exits, transfers their policy required them to approve have no approver.
- **Options considered**: (1) Platform substitutes for the vendor. (2) Auto-approve where recorded terms contain objective eligibility rules. (3) Freeze.
- **Decision**: **Option 3, recorded as resolved-as-scoped** — the same disposition shape as DEC-037. The platform never substitutes its judgement for a departed vendor's discretionary approval and never invents consent; the freeze is what the locked exit behaviour already produces once no approver exists.
- **Downstream**: Option 2 would commission a mechanism that does not exist — `14.06.01` stores a policy, not an evaluator, with no criteria slot, no evaluator and no appeal path. Two stale `[PENDING]` markers repaired, and the entry's miscitation of `14.03.03` D-03 (a stale-cache rule, unrelated) noted. **Recorded friction:** `14.02.05` D-09 promises tombstoned terms "remain in force", so one clause is permanently inoperative while displayed as active. Queue DQ-MG-03 and ledger `r-65[0]` are resolved. Recorded as ideation D-63.
- **Reversibility**: High — if the transfer machinery is promoted from its current scope, options 1 and 2 return as live.

## DEC-043: Theft-report standing binds to enumerated custody states (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Who may file a theft report when ownership and physical custody differ.
- **Options considered**: (1) Owner or documented holder/custodian. (2) Legal owner only. (3) Any witness, provisionally.
- **Decision**: **Option 1, amended.** The owner **or** a party in a custody state `15.08` already enumerates may file, with filing capacity recorded; a second filer joins the existing flag; the platform still never adjudicates title.
- **Downstream**: The word "documented" was deliberately not adopted — it is a custody-evidence threshold no source defines and maps to none of the six enumerated states, so the option as literally worded resolved its own motivating loan/consignment case to "nobody may file". Option 2 is foreclosed by `15.02.01` DT-02, which explicitly rejects the owner as the natural trigger — the deeper node answered its parent in the opposite direction. Option 3 invents a seventh state outside the locked set. Standing under `stale` and `disputed` custody remains open. Queue DQ-MG-04 and ledger `r-69[0]` are resolved. Recorded as ideation D-64.
- **Reversibility**: High — standing is a predicate over states that already exist.

## DEC-044: Identity-confidence and collision rules move to the file that owns them (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Two gear-registry questions — which identity-confidence vocabulary is canonical, and what happens when two records resolve to one identity key.
- **Options considered**: For vocabulary — adopt the render set, a smaller set, or a richer evidence-derived set. For collisions — never auto-merge, first-minted-wins, or threshold auto-merge.
- **Decision**: **Re-cut both as authority decisions.** `15.01.05` D-03 authors the canonical confidence set (the six values already in use) and `15.01.01` renders without defining its own. `15.01.05` D-04: colliding records **never auto-merge** — both retained, both claim-holders notified, merge only on mutual consent.
- **Downstream**: The queue's vocabulary recommendation was circular — its premise described the option it rejected. Collapsing the set risks contradicting D-01 ("a WJ-ID is never presented as equivalent to a serial"); the richer set was three orthogonal fields wearing one enum's clothes. The collision answer follows DEC-023's CQ-08 precedent: nothing probabilistic merges records asserting independent provenance. The entry's interim rule described the wrong mechanism — CX-01 **blocks the mint pending disambiguation**, it does not fork. Queue DQ-MG-05/06 and ledger `r-70[0]`/`r-71[0]` are resolved. Recorded as ideation D-65.
- **Reversibility**: Medium — relocating an enum is cheap now because no downstream literal binds to it.

## DEC-045: Unclaimed-record suggestions auto-apply by field class (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: What happens to a community suggestion on an unclaimed venue or studio record — the majority case at launch.
- **Options considered**: (1) Auto-apply all eligible edits. (2) Queue everything. (3) Auto-apply by field class, queue the rest.
- **Decision**: **Option 3.** Factual classes apply immediately with community provenance retained; higher-stakes classes queue; commercial fields stay Operator-only. The classification already exists — `16.01.01` defines Statutory / Anchor / Fact / Commercial / Structural with "who writes" and "beats" per class.
- **Downstream**: Mirrors `13.01.02`'s ratified posture that automation may propose but never dispose. Option 1 gives consequential facts no protection; option 2 leaves the unclaimed majority stale, defeating community correction exactly when the registry needs it. The entry's "requires field classification" con was stale, and it cited the wrong question (the ignored-suggestion timeout, a claimed-record concern) rather than the load-bearing one. Class cut line and freshness effects are `16.05.03` Q-05. Queue DQ-MG-07 and ledger `r-72[0]` are resolved. Recorded as ideation D-66.
- **Reversibility**: High — the cut line moves within an existing class model.

## DEC-046: The live-booking block resolves by consuming rules its own files already point to (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: Six live-booking questions — soft-hold availability, default offer approval, offer expiry mid-approval, reconciliation conflict, verified-draw count, and gig-alert eligibility.
- **Options considered**: The canonical option sets for each; several proved unratifiable as worded.
- **Decision**: **Soft holds** — the date stays available with an aggregate hold state, never identities, scoped to the parties the ladder already exposes it to (`17.01.02` D-14). **Offer approval** — consume domain 01's governance model; with no rule configured, no offer is approved (`17.02.03` D-07). **Expiry** — the offer expires with no implicit grace; an extension is explicit, pre-expiry, by the offering side, as a new version (D-08). **Reconciliation** — the count stays provisional and undisputed portions settle (`17.09.02` D-16). **Draw** — `scanned_paid` is the verified draw, confirming D-08's three-count model. **Alerts** — announced first-party shows at on-sale (`20.06.02` D-09).
- **Downstream**: Four were confirmations of locked source. Two entries were bound to the wrong finding: `r-76[0]` actually holds the verified-draw question, and `r-79[0]` actually holds an alert-radius contradiction (25 mi vs 80 km, neither file citing the other) now carried as `20.06.02` Q-04. One was misrouted — the band governance rule belongs to domain 01, which already defines unanimity / majority / any-one-member. Third-party alerts were rejected mechanically: no external listing produces an on-sale instant the platform can observe. Ledger `r-74[0]`, `r-75[0]`, `r-75[1]`, `r-76[0]`, `r-77[0]`, `r-79[0]` are resolved. Recorded as ideation D-67.
- **Reversibility**: High for the confirmations; Medium for the domain-01 consumption, which is now load-bearing across 01 and 17.

## DEC-047: P-01 closes on its policy; validation evidence is implementation work (2026-07-22)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-22T15:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Problem**: `r-44[0]` was the last open ledger identity. Its policy was ratified on 2026-07-21, but the validation packet's practitioner trace register was empty — and the evidence it requires (redacted workflow traces from two beatmakers and two session players) cannot be authored from inside the repository without fabricating research.
- **Options considered**: (1) Close the finding on the decided policy, tracking evidence collection downstream. (2) Hold the finding open until four practitioners have been interviewed and an enum approved. (3) Reverse to Option A and lock the unvalidated ten-stage draft now.
- **Decision**: **Option 1.** The finding's text was "exact stage vocabulary still explicitly owner-open", and it is no longer open: the model, the gate, its cohort minima, its pass conditions and the owner-approval requirement are all decided and propagated. Candidate labels remain non-enforceable **because the gate is in force**, not because a decision is pending.
- **Downstream**: Matches the disposition already applied to **A-03** (DAW parsing) and **A-04** (vault profiles), both of which closed on their validation gate rather than on their evidence — consistent precedent, not a new leniency. Option 3 was rejected because it discards the reason Option B was chosen: the draft is explicitly unvalidated for beatmakers and session players. Fabricating traces was never available — the packet's only purpose is to prove the vocabulary was tested against reality, so inventing its contents would destroy the artifact it is meant to be. `Song.current_stage` keeps its semantic roles, no draft label is a downstream contract, and the packet remains the authority for when an enum becomes enforceable. **The ledger now reads 107/107 `verified-fixed`.** Recorded as ideation D-68.
- **Reversibility**: High — if validation fails or the owner rejects every candidate, the packet records the failure and the next iteration; nothing downstream hardened in the meantime.

## DEC-048: All 57 blocking sub-decisions ratified and propagated to source (2026-07-23)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-23T03:00:00.000Z
- **Agents**: claude
- **Sources**: audit-ambiguity
- **Index**: [[index]]

- **Problem**: A fresh full ambiguity audit of all 1,121 ideation documents confirmed 20 blocking findings — contradictions where two ratified specs give an implementer opposite instructions. Each had to be decided by the owner and then made true in the source.
- **Options considered**: Present all findings at once for bulk review; work domain by domain; or decompose each finding into independently-lockable axes first. The third was chosen after an adversarial challenge round found that nearly every first-pass entry collapsed several axes into one scalar question.
- **Decision**: **20 blocking findings → 2 already-resolved → 18 entries → 94 axes → 57 open sub-decisions, all ratified** (43 owner-decided, 14 agent-decided as spec hygiene or technically determined, each flagged). Full record with reasoning, preserved invariants and downstream commitments: `.memory/wiki/specs/audits/decision-ratification-log.md`. Options each was chosen from: `blocking-decision-queue.md`.
- **Downstream**: The 37 axes found already-locked are the load-bearing result — a scalar answer to any of them would have silently reversed a ratified decision. Propagated into source across three passes (144 files, then 144, then 41). Verification: every decision findable in source, zero broken invariants, and the two invented values that appeared were removed. Notable outcomes: v1 positioning restated from "capture at source" to "capture at the first sharing moment" (domain 07 D-06 made this obligatory, not optional); the UK statutory vocabulary retired to an unauthored profile yielding explicit `unknown`; `scanned` renamed to `admissions_total`/`admissions_paid` because one name could not carry two quantities.
- **Reversibility**: Medium. Each sub-decision is individually recorded with its rejected alternatives, so any one can be revisited; but several are now load-bearing across domains.

## DEC-049: DQ-R2-01 representation scope is two flat axes conjoined at the call site (2026-07-29)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-30T00:38:30.695Z
- **Agents**: claude
- **Sources**: propagate-decision (DQ-R2-01)
- **Index**: [[index]]

- **Problem**: `01.03.02`:25 lists a five-item commercial-domain scope and the ratified seven-verb
  mandate as siblings on one representation edge; `01.03.02`:76 and `01.03-cx` CX-02 both assert
  "scope **is** the mandate". The identity reading is unsatisfiable — the activity enum is closed at
  seven (D-01, DQ-02.3, global D-69) and none of the five domains is in it. Three normative
  statements, no open marker on any of them. The word "activities" was filled with two different
  vocabularies nine lines apart in one file (`:16` verbs, `:25` domains).
- **Options considered**: A full cross-product (7x5=35 cells, the draft's recommendation);
  A-prime two flat axes ANDed at the call site; A-double-prime domain as edge identity (one edge per
  domain); B domains-for-representation/verbs-for-membership; C collapse to one vocabulary;
  D domains as presets expanding to verbs; G defer to `/create-prd`.
- **Decision**: **A-prime**, owner-ratified 2026-07-29. A representation edge carries two
  independent flat axes — `activities` (subset of the closed seven) and `domains` (subset of live
  booking / recording / publishing / sync / merch) — ANDed at the moment of the action. At most
  7+5=12 plain-language statements per edge, never 35 cells, which is what keeps `01.03.03` DT-02
  (permission matrix REJECTED) and D-02 (plain language, not a grid) intact. A membership edge
  carries the activity axis only and resolves to ALL domains, which is what keeps `01.03-cx` CX-03:
  both edge types present one shape, `{activities, domains}`, to the enforcement cross-cut.
  Territory, term and commission stay edge-level and do not vary per domain (accepted cost).
  `administer` does not reach naming a publisher over a share the party did not write (`09.01.04`
  D-06 stands over the mandate).
- **Why the draft's Option A was rejected**: a 35-cell grid *is* the artefact DT-02 rejects by name;
  its cross-type asymmetry breaks the CX-03 union the sub-domain merge exists to protect; and its
  "book for live but not publishing" justification is only half-sourced — the verb half is real at
  `01.03.02`:16 ("my manager can book but not sign"), the domain half appears nowhere in 1,122 files.
  The five-domain list occurs on exactly **one line** tree-wide.
- **Downstream**: `01.03.02` D-02 restated + new D-05; `01.03.03` D-11 + `:25` scope dimensions;
  `01.03.01` D-19 (membership universal-domain); `01.03-cx` CX-02 + CX-03; parent index D-05;
  `ideation-cx.md`:27 Roles/Permissions cross-cut; `ideation-index.md` D-75; `09.01.04` D-17
  carve-out; domain 17 booking authority (+ its `publishing authority` wording collision);
  domains 04, 05, 07, 20 local authority vocabularies.
- **Reversibility**: Medium. The rename and the conjunction are cheap to revise; the eliminated
  options are not — B, C and G were each independently refuted against source.
- **Left open (tracked)**: are the five domains identical to domain 17's ratified work-type enum, or
  a fourth vocabulary? `01.03.02`:25 lists sync as publishing's *sibling*; `09.01.04`:102 carves sync
  *inside* publishing as a right type. Tracked as `01.03.02` Q-03, targeted at `/create-prd`.

## Full Log

### DEC-001: The rights stack is the thesis, not an adjacency (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: Rights & Ownership, Royalties, Licensing and Distribution emerged as 4 domains / ~70 sub-domains that **no user directive asked for**. The owner named a marketplace, digital goods, a directory and events. Marking them `core` was an agent inference and needed owner ratification.
- **Options considered**: (1) Thesis — all four `core`, platform holds the ownership record end-to-end. (2) Adjacency — all four `important`, ship directed scope first. (3) Partial — Rights `core`, the rest `important` (agent recommendation).
- **Decision**: **Option 1 — thesis.** All four `core`. Owner overrode the agent's "partial" recommendation, consistent with the maximal brief ("a platform musicians cannot live without").
- **Downstream**: Adds the most regulated, most integration-heavy scope in the industry (PRO/society registration, CWR exchange, DDEX conformance, statement ingestion) before any user liquidity exists. Massively raises `/create-prd-security` compliance surface. `/plan-phase` must not treat these as deferrable.
- **Reversibility**: Medium — priority can be lowered later, but the split-at-creation capture must exist from day one or the data is permanently lost for sessions that already happened.

### DEC-002: Fans are first-class users, not CRM records (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: Does WeJammin have a fan-facing surface, or are fans objects inside an artist's CRM?
- **Options considered**: (1) B2B-only — fans are records. (2) Fan surface — fans get accounts. (3) Deferred — model the fan properly now, build the surface later (agent recommendation).
- **Decision**: **Option 2 — fans are users.** Fans get accounts, follow artists, receive gig alerts, discover shows. Owner overrode the agent's "deferred" recommendation.
- **Downstream**: (a) Consumer-scale traffic — fans outnumber professionals by orders of magnitude → rewrites the performance budget; (b) a second moderation population with different failure modes → Trust & Safety (24) load; (c) statutory duties that scale with consumer reach (age assurance / children's access, DSA thresholds) → `/create-prd-security`; (d) strengthens the open mobile-surface question — gig alerts are push notifications and show discovery is phone-shaped.
- **Reversibility**: Low — a consumer surface changes the growth model, the compliance posture and the architecture. Hard to unwind once fans exist.

### DEC-003: Structural classification remains `single-surface` despite the fan decision (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: The sweep's synthesis asserted that a fan audience forces a multi-surface classification. This would have restructured the entire ideation folder tree.
- **Options considered**: (1) Accept the synthesis and reclassify multi-surface. (2) Verify against the kit's own reference first.
- **Decision**: **Verified and rejected the claim.** Per `prd-templates/references/surface-model.md`, a *surface* is a **deployment target** (web/mobile/desktop/cli/api/extension), not an audience. Fans + professionals on one Astro web app = one surface. Classification stays `single-surface`.
- **Downstream**: Folder layout unchanged (domains stay top-level children of `ideation/`, no `surfaces/` folder). Real consequence is an expanded Role Matrix in all 24 domain indexes. The **mobile surface question remains genuinely open** and is now more pressing — see `meta/constraints.md`.
- **Reversibility**: High — but reclassifying later means restructuring the tree, so getting it right pre-seeding mattered.
- **See also**: PAT-001.

### DEC-004: Three separate marketplace domains, not one (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: Physical gear, digital plugins and human services — one "Marketplace" domain or three?
- **Options considered**: (1) Three domains (agent recommendation). (2) One Marketplace with heavy sub-domains. (3) Two — Goods + Services.
- **Decision**: **Option 1 — three domains** (05 Services, 13 Gear, 14 Digital Goods).
- **Downstream**: Everything genuinely shared (cart, payments, messaging, search, reviews, disputes, tax, shipping) is already a **cross-cut** — the merge would buy nothing. Everything that differs is irreconcilable at schema level: gear is qty=1 non-fungible stock where condition is ~40% of price; digital is licence keys + a format×OS×DAW matrix with refunds that cannot be un-given (colliding with EU withdrawal law); services are scoped human output with briefs and taste disputes. A merge yields a `listing` entity with ~40 nullable columns. `/write-be-spec` must not collapse these.
- **Reversibility**: Medium.

### DEC-005: Commit identity is the business account, set repo-local (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: No git identity was configured at all (`user.name`/`user.email` unset globally and locally) — any commit would have failed. Repo ownership had moved from `NEVRITERob` to `WeJustJammin`.
- **Options considered**: (1) Business account + GitHub noreply. (2) Business account + real business email. (3) Keep the personal Gmail.
- **Decision**: **Option 1.** `WeJustJammin <305953066+WeJustJammin@users.noreply.github.com>`, set **repo-local** so other projects are unaffected. `WeJustJammin` verified as `type: User`, id `305953066`.
- **Downstream**: Commits attribute to the business. **`gh` transport is still the personal account** — see BLOCKER-001. Open question raised: `WeJustJammin` is a User account, not an Organization — no teams, no scoped repo roles, no runner groups. Converting is cheapest now while the repo is empty.
- **Reversibility**: High.

### DEC-006: Firebase removed entirely from project documents (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: The predecessor (SoundBytez) ran Next.js + Firebase App Hosting. Initial constraints capture documented the migration as a was/is table.
- **Options considered**: (1) Keep migration context for traceability. (2) Remove — document only the stack in use.
- **Decision**: **Option 2 — removed.** Owner: "that's from an old plan we don't even need that entry in the documents; we are going to move forward with the stack we use."
- **Downstream**: `meta/constraints.md` states only the locked stack (Astro islands, Cloudflare Pages + Workers, Supabase) plus what remains open for `/create-prd` (auth provider, media storage, styling, payments). **Supabase is the only element carried forward from the predecessor** — Firebase Auth, App Hosting and its deploy pipeline have no equivalent and must not be assumed by `/create-prd-stack`.
- **Reversibility**: High.

### DEC-007: 08 Real-Time Jamming is the only genuine domain-merge candidate (2026-07-18)

- **Timestamp**: 2026-07-18T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: Step 6 flagged 101 boundary problems across the 24-domain map. Are any real merge candidates, or is the high cross-domain connectivity (76%) evidence the map is over-split (D-17)?
- **Options considered**: (1) Keep 24 domains — connectivity is structural. (2) Merge the high-tension seams. (3) Case-by-case.
- **Decision**: **Keep 24 domains.** ~85 of 101 boundary problems are legitimate seam-work between near-mirror domains; the universal hubs were lifted into the 25-mechanism cross-cut registry rather than left as domain edges. **Only `08 Real-Time Jamming` → `07 Music Projects` is a genuine merge candidate** (Overdub machinery could dissolve 08 into 07; rejected only narrowly). Escalated to `/create-prd` for explicit keep-or-fold.
- **Downstream**: High-tension seams (17/18 tour object, 17/19 ticket count, 13/15 serial unit, 14/20 delivery, 04/05 demand/supply anchors) get a **named shared owner or an extracted cross-cut**, NOT a merge. `/create-prd` must decide 08's fate before architecture locks.
- **Reversibility**: Medium — merging 08 later is cheaper than splitting a merged domain.

### DEC-008: The identifier-binding seam is an unowned architectural gap (2026-07-18)

- **Timestamp**: 2026-07-18T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: decision, ideation, recovered

- **Problem**: Step 6 surfaced that splits and titles attach to a work in Services (domain 05) — often years before an ISRC/ISWC identifier exists — but Royalties (domain 10) collects against those identifiers. No mechanism or domain owns the step that binds the early split-record to the later identifier.
- **Options considered**: (implicit) leave it to emerge in BE spec vs flag it now.
- **Decision**: **Flag and persist now.** Recorded in `meta/cross-cut-emergent-capabilities.md` and D-27. This is the highest-risk of 52 emergent cross-cuts / 76 emergent features found in Step 6.
- **Downstream**: `/create-prd` and `/write-be-spec` must assign an owner to the binding step; a schema that assumes work↔identifier was always linked will be wrong. Intersects the provenance thesis (D-18) directly — the split captured at creation must survive until the identifier exists to collect against it.
- **Reversibility**: Low if missed (retrofitting the binding after royalty flows exist is expensive); High if handled at architecture time.

### DEC-009: Taxonomy selection and proposals use constrained Config access (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Service taxonomy `05.01.02` marked all personas Read-only while credits taxonomy `02.06` marked the identical select/propose action Config for Musician, Producer, and Operator. The conflict left taxonomy-proposal writes without a platform-wide RBAC contract.
- **Options considered**: (1) Read-only for all personas. (2) Config for Musician, Producer, and Operator; Read-only for Fan. (3) New standalone Propose permission.
- **Decision**: **Option 2.** Musician, Producer, and Operator receive Config solely to select permitted values and submit a missing-value proposal to the curation queue; Fan remains Read-only. No persona can create, promote, deprecate, map, or edit vocabulary — those remain exclusive to the non-persona admin/governance role.
- **Downstream**: Aligns the service and credit taxonomy Role Lenses and parent Role Matrices. A proposal does not block publication and must not be mistaken for vocabulary curation. Resolves ledger `r-09[0]` / queue CQ-01.
- **Reversibility**: Medium — permission changes are structurally reversible before implementation, but every consumer's authorization checks must preserve the select/propose-versus-curate boundary.

### DEC-010: Collusion evidence uses a constrained versioned edge contract (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Credit-dispute resolution needed a defined interface to consume collusion detection without converting statistical topology into an accusation, witness exclusion, or automatic Trust & Safety case.
- **Options considered**: (1) Per-edge negative multiplier only. (2) Per-edge multiplier plus a typed `requiresNonTopologicalCorroboration` constraint. (3) Per-witness trust score plus ring flag.
- **Decision**: **Option 2.** `CollusionEvidenceConstraintV1` contains only `contractVersion`, opaque `attestationEdgeId`, per-edge `negativeMultiplier`, and literal `requiresNonTopologicalCorroboration: true`. Unknown versions are excluded. No raw score, topology signal, cluster/witness identity, trust score, ring flag, hard exclusion, or enforcement recommendation crosses the boundary.
- **Downstream**: `02.05` weights only the referenced attested-evidence edge. The collusion signal cannot itself create or advance a Domain 24 factual-dispute case; separately captured non-topological corroboration is required for any transition that relies on it. Contract persisted in `02.04.04`, `02.05`, the `02.04` index, Credits CX-18, and Domain 24 intake routing. Resolves ledger `r-20[2]` / queue CQ-03.
- **Reversibility**: Medium — a future interface version can add explicitly governed fields, but v1 consumers must reject unknown versions and preserve the prohibition on topology-only action.

### DEC-011: Ownership-ledger ordering uses a portable bytewise party-ID collation (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Domain 09 had already locked the total row key for reproducible Domain 10 cent allocation as `(pool, party-id, role, contribution-basis)`, but left `party-id` collation unresolved across Supabase Postgres, Cloudflare Workers, exports, and replay jobs.
- **Options considered**: (1) Explicit Postgres binary collation. (2) Platform-defined unsigned UTF-8 bytewise comparison of immutable canonical serialized internal party IDs.
- **Decision**: **Option 2.** The platform compares `party-id` as unsigned UTF-8 byte sequences in lexicographic order. Locale, display name, case-folding, Unicode normalization, and database-default behaviour are prohibited. Every runtime uses the same comparator or a persisted equivalent binary sort key.
- **Downstream**: The source-locked four-field tuple now produces the same portable, content-derived allocation order for every consented ledger. Database insertion/retrieval order and `entered-by` remain prohibited inputs; Domain 10 retains sole ownership of cent remainder policy. Resolves ledger `r-34[0]` / queue CQ-05.
- **Reversibility**: Medium — a future comparator must be explicitly versioned and historical ledger allocations must retain this v1 ordering contract for reproducibility.

### DEC-012: V1 feedback contradictions use bounded positional candidates and human flags (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Multi-stakeholder feedback required a practical v1 way to surface contradictions without enabling the platform to judge creative conflicts, introduce undeclared AI processing, or turn ambiguous language into a system verdict.
- **Options considered**: (1) Positional candidates plus manual flags. (2) Model-backed semantic detection. (3) Manual flags only.
- **Decision**: **Option 1.** Sort same-version timestamped comments ascending by offset. Seed each cluster with the earliest unassigned comment and include only later unassigned comments at most 5,000 ms from that seed; a Producer manually flags two or more comment IDs in a positional cluster or song-level bin as a contradiction. No topic extraction, semantic inference, AI request, ranking, recommendation, adjudication, or automatic notification occurs in v1.
- **Downstream**: Producers receive reproducible candidate groupings while retained contradiction flags remain attached to comment IDs through cluster split/merge. Human creative authority stays intact; a later semantic capability requires an explicit privacy, evaluation, and architecture decision. Resolves ledger `r-45[0]` / queue A-01.
- **Reversibility**: High — a later version may add an independently governed semantic detector, but must preserve the v1 no-adjudication boundary and auditable manual flags.

### DEC-013: Reaffirmed 24-domain ideation map after independent recovery audit (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: An interrupted workflow required recovery of WeJammin's proposed domain classification before advancing pipeline state. The recovered 24-domain tree already existed in the working tree, so replacement or reseeding without inspection would risk invalidating extensive ideation work.
- **Options considered**: (1) Confirm all 24 domains. (2) Review domain boundaries before confirmation. (3) Confirm map while reducing v1 scope. (4) Replace map.
- **Decision**: **Option 1 — confirm all 24.** The owner reaffirmed the complete map after an independent recovery: 14 lenses swept 1,545 concepts; 24 candidates were synthesized; four fresh audits found no missing required domain, cross-cut, blocker, or major boundary defect. The existing 24-folder fractal tree remains authoritative. Scope is not reduced by domain deletion; existing MoSCoW and release sequencing control v1.
- **Downstream**: `/ideate` proceeds from the already-complete 24-domain tree rather than reseeding it. The recovery proposal is retained as ratified evidence. The current accepted architecture remains Astro islands + Cloudflare Pages/Workers + Supabase; Firebase is excluded. Recorded as ideation D-35.
- **Reversibility**: Medium — individual domain boundaries can be evolved through the decision-propagation process, but replacing the 24-domain structure would cascade through 1,120 ideation files.

### DEC-014: Ratified immutable private-link recipient isolation for review feedback (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: `r-51[0]` classified the review-link permission intersection as unresolved despite existing Domain 07 cross-cut and child contracts defining recipient isolation.
- **Options considered**: (1) Ratify the existing asymmetric permission intersection: recipient sees only their own thread and replies. (2) Expose a shared recipient-visible feedback stream. (3) Allow owner-configured per-thread visibility.
- **Decision**: **Option 1.** The owner ratified, without redesign, CX-01, D-13, D-14, and D-10 as authoritative. An unauthenticated/private-link recipient may comment only in their own thread and see replies in it; they see no roster or internal comments, other recipient or their comments, other versions, project content, hidden-comment count, teaser, or hidden affordance. Audience is selected at post time and immutable; scope crossing requires a deliberate, attributed new comment. Link-recipient comments notify the roster, and listen-recording failure never blocks posting.
- **Downstream**: Domain 07 keeps one append-only, version-anchored comment stream with asymmetric recipient visibility. `/create-prd-architecture` must enforce the ratified intersection without adding a separate recipient ACL, mutable audience, or v1 scope expansion. Queue A-02 and ledger `r-51[0]` record the resolved ratification; no source-contract redesign occurred. Recorded as ideation D-36.
- **Reversibility**: Medium — a future, separately specified and authenticated sharing mode may be introduced only through a new decision; v1 isolation and every existing comment's post-time audience remain immutable.

### DEC-015: DAW parsing support is validation-gated before selection (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The capture-at-source thesis depends on DAW session parsing, but proprietary formats, silent parser rot, DAW-specific EULAs, and person-free track names made broad support an unvalidated premise.
- **Options considered**: (1) Validate supported DAWs first and define the person-free fallback. (2) Commit to broad parser coverage immediately. (3) Use manually mapped tracks only.
- **Decision**: **Option 1.** A candidate DAW must pass representative real-session validation and a DAW-specific legal review before WeJammin selects its parser or track-mapping integration. Person-free names retain available track/instrument context but create no contributor guess; the existing Producer prompt asks explicitly. Ambiguity asks, never infers; unsupported or unreadable formats remain non-blocking.
- **Downstream**: `07.09.02` and the DAW bridge index record the validation gate. `/create-prd-architecture` may choose candidates and delivery shape only after validation; it must preserve visible confidence, counter-attestation, parser-health monitoring, and non-blocking ingest. This does not choose DAWs, require a broad parser, or alter the web-only surface classification. Queue A-03 and ledger `r-52[0]` are resolved. Recorded as ideation D-37.
- **Reversibility**: Medium — later support expansion requires the same validation and legal gate; the no-inference and non-blocking boundaries remain required unless superseded through a new decision.

### DEC-016: Rights-aware vault defaults require practitioner validation (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The vault's role × asset-class profiles encode sensitive least-privilege defaults, but their fit with real producer and engineer workflows remained unvalidated.
- **Options considered**: (1) Validate proposed profiles with practitioners, then lock them. (2) Lock the current matrix immediately. (3) Replace defaults with owner-configured access only.
- **Decision**: **Option 1.** The proposed profiles are candidates only until practitioners performing each affected song role validate them and an approved profile version is recorded. Validation may refine grants per sensitivity class; it cannot introduce manual per-asset ACLs, project-wide grants, or an owner-configured-only access model.
- **Downstream**: `07.03.03` and its parent index record the validation gate. `/create-prd-security` defines validation evidence, profile versioning, and enforcement rollout while retaining per-song, role-derived least privilege; first-access NDA evidence; immediate fail-closed revocation; terms-not-grants separation; version-pinned ordinary acceptance; and explained denial. In-product NDA legal enforceability and master-owner precedence remain separate unresolved decisions. Queue A-04 and ledger `r-53[0]` are resolved. Recorded as ideation D-38.
- **Reversibility**: Medium — later default changes require new practitioner validation and profile versioning; existing approved-profile decisions remain auditable.

### DEC-017: Mixed DSP acceptance uses attached rejected-item details (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A DSP may accept some tracks in a release and reject others. The existing `(release × store × territory)` status identity must remain truthful without hiding actionable per-track evidence.
- **Options considered**: (1) Add a track axis to status identity. (2) Retain release-level identity with structured rejected-item detail. (3) Collapse to a release accepted/rejected result.
- **Decision**: **Option 2.** One `(release × store × territory)` row projects `Partial acceptance` while partner evidence is mixed. Each rejected-item detail retains stable affected-item ID, partner and original delivery/message correlation, evidence timestamp and normalized reason, triage/remediation state, and successor-delivery correlation after redelivery. The parent shows accepted/rejected/pending counts and actionable items; it never reports wholly `Accepted` or wholly `Rejected` until full-release evidence supports that claim.
- **Downstream**: `12.03.02`, its parent index, rejection triage, and DDEX cross-cuts record the contract. `/create-prd-architecture` defines persistence/query mechanics but must preserve evidence-labelled status, store-side `Live` truth, discard-not-amend in-flight messages, and rejecting-partner-only redelivery. Queue A-05 and ledger `r-54[1]` are resolved. Recorded as ideation D-39.
- **Reversibility**: Medium — future track-level status rows require an explicit identity migration and parent roll-up contract; historical mixed results retain the v1 attached-detail representation.

### DEC-018: Hold ladders use optimistic version checks and reject-and-reoffer (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Concurrent operators, expiry/release actions, challenges, and confirmation can mutate one ordered hold ladder. Last-write-wins, hidden merges, or locks would either silently demote a live party or block time-sensitive inventory.
- **Options considered**: (1) Optimistic per-ladder version check with reject-and-reoffer. (2) Serialized command queue. (3) Pessimistic edit lock. (4) Last write wins.
- **Decision**: **Option 1.** The owner ratified the existing source contract. Every mutation carries the current bookable-slot ladder version; the server alone assigns dense positions and receipt-time order. A stale version rejects before write, returns the authoritative ladder, and re-offers the intent. No merge, automatic replay, queue-behind, lock, or last-write-wins path exists.
- **Downstream**: Domain 17 source, parent CX, and parent index record the contract. `/create-prd-architecture` supplies compare-and-swap storage, idempotency, durable expiry execution, dual-ladder confirmation boundaries, and notification-outbox mechanics. It must atomically preserve ordering/version, required reorder attribution, audit/notification intent, and terminal semantics: expiry/release promote; withdrawal/date passage/confirmation void; release wins over a simultaneous challenge. Queue DQ-04.06 and ledger `r-78[0]` are resolved. Recorded as ideation D-40.
- **Reversibility**: Medium — implementation substrate may evolve only if it preserves version-conditional stale rejection and the resulting observable ordering/audit contract.

### DEC-019: Public comped-out credits retain transparent qualification (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A session contribution can be real while absent from the delivered master. D-09 retained the credit and outcome qualifier but left the public-discography treatment unresolved, risking either silent erasure or a misleading unqualified public credit.
- **Options considered**: (1) Keep the qualified record owner-only. (2) Render it publicly with a plain-language `not in final master` qualifier. (3) Render it publicly without a qualifier.
- **Decision**: **Option 2.** An otherwise publicly eligible retained credit renders once in its ordinary role family with the plain-language qualifier `not in final master`. Normal publication, per-credit visibility, embargo, and public-work-identity gates take precedence. The owner sees the trigger date; visitors see neither that date, the comp-out reason, nor delivery history. The record and provenance tier remain unchanged.
- **Downstream**: `02.01.01` D-09/Q-05 and `02.01.02` D-15/Q-07 record the contract. Viewer-relative counts include a visible qualified line once and a suppressed line zero times. The public qualifier does not determine ownership, union reporting, rights, registration, royalties, payment, or Domain 10 neighbouring-rights treatment; that registration question remains open. Queue CQ-02 and ledger `r-19[1]` are resolved. Recorded as ideation D-41.
- **Reversibility**: Medium — changing what a public credit means later requires an explicit product decision and matching source/audit migration, but does not require changing the preserved contribution record.

### DEC-020: Suspected-ring demotion changes traversal rank, not presentation (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A suspected attestation ring can silently lower one attestation edge's derived traversal weight, while the prior traversal contract left unresolved whether a still-eligible edge should be hidden, marked, or presented normally.
- **Options considered**: (1) Hide the edge. (2) Mark the edge as suspected. (3) Render the edge normally while silently applying the existing per-edge tier-weight demotion.
- **Decision**: **Option 3.** An otherwise eligible edge follows ordinary publication, viewer-visibility, embargo, provenance-floor, role, query-shape, fan-safety, and normal result-window gates. If returned, its path renders normally while the existing per-attestation-edge-derived demotion affects only ordinary ranking. No collusion-specific threshold, hiding, label, annotation, rationale, tooltip, notification, detector metadata, or unweighted bypass exists.
- **Downstream**: `02.01.03` D-05/Q-03 and `02.04` D-06/CX-03 record this presentation contract. Ring detection stays internal to every persona; CQ-03's constrained evidence interface stays per-edge with no score, flag, identity, hard exclusion, or topology-only escalation. The signal cannot create, advance, adjudicate, or notify a Domain 24 case without separately captured non-topological corroboration. Queue CQ-04 and ledger `r-25[0]` are resolved. Recorded as ideation D-42.
- **Reversibility**: Medium — a change to traversal presentation requires a new product decision and synchronized safety/audit review, but does not alter the underlying credit, detector, or dispute-evidence contract.

### DEC-021: Recorded master majority requires strictly more than half (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The master registry allowed parties to record `majority-by-share` but did not define the exact threshold, leaving a 50/50 ownership split and other consent outcomes ambiguous.
- **Options considered**: (1) Strictly more than 50% of consented ownership share. (2) At least 50%. (3) A higher recorded supermajority such as two-thirds.
- **Decision**: **Option 1.** For an expressly recorded master `majority-by-share` rule, a specific action authorizes only when affirmative **exact nominal master-owner share is strictly greater than 50%** of the full current consented master pool. Exactly 50% fails closed. Shares aggregate by owner stake rather than headcount; points, encumbrances, effective net, display rounding, silence, unreachability, and stale/invalid records cannot create or enlarge approval.
- **Downstream**: `09.01.03` owns the predicate, scope/version binding, Control Summary routing, and concrete tie/rounding/absence examples. `09.01.02` remains authority for exact shares, whole-ledger consent, versions, and states. An absent rule remains unanimous; `any-owner-non-exclusive` remains separate. The rule neither replaces amendment re-consent nor overrides a policy veto, encumbrance, publishing/performer/sample right, release/takedown policy, payout calculation, or Domain 24 case. Queue CQ-06 and ledger `r-35[0]` are resolved. Recorded as ideation D-43.
- **Reversibility**: Medium — threshold changes require an explicit owner decision and action-authorization migration, while established ledger versions and action approval history remain evidence.

### DEC-022: Overlapping mashup work weights require declarant allocation (2026-07-20)

- **Timestamp**: 2026-07-20T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A multi-work recording needs exact `Recording→Work` weights totaling 100%, but duration cannot determine allocation when a mashup's embodied works sound simultaneously. A universal duration default would normalize an arbitrary contribution claim into a royalty input.
- **Options considered**: (1) Prorate each work's full overlapping duration, then normalize. (2) Require declarant-entered exact weights totaling 100%. (3) Offer equal shares.
- **Decision**: **Option 2.** For temporal overlap, each embodied work receives a declarant-entered positive exact-rational weight and all weights total exactly 100%. No duration calculation, normalization, equal-share fallback, inferred remainder, or display-rounded validation exists. Duration proration remains an editable proposal only for declared disjoint medley/live-set spans.
- **Downstream**: `09.01.01` owns the link allocation; works remain separate and a mashup still requires independent source-master lineage/sample and embodied-work declarations. `10.03.01` consumes the valid as-of Domain 09 allocation before each separate work ledger and blocks invalid/incomplete allocation rather than inventing or repairing it. The weight declaration is neither ledger consent nor a master-action approval, and it does not decide licensing, release permission, or royalty entitlement beyond this allocation input. Queue CQ-07 and ledger `r-36[0]` are resolved. Recorded as ideation D-44.
- **Reversibility**: Medium — changing the default later requires a new owner decision and calculation-version treatment, while previously declared allocations and their calculation inputs remain historical evidence.

### DEC-023: Unclaimed stubs merge only on exact canonical writer-name sets (2026-07-21)

- **Timestamp**: 2026-07-21T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The unclaimed-stub exception prevents duplicate work records from proliferating, but raw-string equality misses harmless presentation differences while fuzzy, identifier, or identity matching risks silently treating distinct people or assertions as the same.
- **Options considered**: (1) Exact stored-string equality. (2) Canonical asserted-text set equality. (3) Legal/stage identity resolution. (4) Fuzzy name similarity.
- **Decision**: **Option 2.** `writer-name-canonical-v1` evaluates each retained asserted writer string with pinned Unicode 15.1 data: NFC → Default Case Folding → trim/collapse Unicode whitespace → NFD/remove marks/NFC. The resulting order-independent sets must be exactly equal. An atomic merge occurs only while both works are distinct current unclaimed, unconsented, conflict-free stubs with no distinct-person or unresolved identity/alias evidence. Canonical text equality never resolves people, aliases, legal/stage identities, accounts, or authorship.
- **Downstream**: `09.01.01` solely owns the predicate, candidate/action split, raw-evidence retention, atomic recheck, lineage, and recording-owner notification. ISWC/ISRC, audio, fuzzy text/title, aliases, and identity signals may nominate candidates but cannot authorize merging. `09.01` CX-01 forbids link movement, ledger reconciliation, or partial mutation when recheck fails. A later incompatible assertion uses `09.04.01` ordinary claim-time detection/notification/dispute routing — no auto-unmerge, auto-case, fund freeze, or identity adjudication. Queue CQ-08 and ledger `r-36[1]` are resolved. Recorded as ideation D-45.
- **Reversibility**: Medium — changing a future canonicalization profile requires explicit versioning and migration review; retained original strings, source IDs, provenance, and merge lineage preserve evidence without asserting an identity conclusion.

### DEC-024: Term and moral-right status is bounded to four v1 jurisdictions (2026-07-21)

- **Timestamp**: 2026-07-21T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Copyright term/public-domain and moral-right status vary by territory, but the product lacked a v1 coverage boundary for term rules, death-date facts, moral-right applicability, and waiver treatment. A global answer would falsely imply complete legal coverage; US-only would omit the central non-waivable/waiver distinctions the rights model already identifies.
- **Options considered**: (1) United States only. (2) United States plus France, Germany, and the United Kingdom. (3) Global per-territory status wherever evidence exists.
- **Decision**: **Option 2.** V1 supports determinate status only for `US`, `FR`, `DE`, and `GB`. A result requires source-attributed applicable-rule and required facts: work/category/authorship and death/publication/creation facts for term; author/estate standing plus transfer/waiver facts for moral rights. Every other territory or missing/insufficient fact is explicitly `unknown` / not determined. Territory remains an explicit model dimension, never a global boolean.
- **Downstream**: `09.03.05` owns source-backed term/public-domain status; `09.03.06` owns jurisdiction-scoped moral-right applicability/waivability; `09.03.04` remains authority for estate/death facts. Economic transfers never transfer moral rights. FR/DE non-waivability, GB waiver treatment, and US music non-applicability stay jurisdiction-scoped. No output is legal advice, clearance, licence, ownership adjudication, or release authorization; Domain 11 licensing and Domain 12 release gates remain independent. Queue CQ-09 and ledger `r-40[0]` are resolved. Recorded as ideation D-46.
- **Reversibility**: Medium — adding jurisdictions requires an explicit owner decision plus jurisdiction-specific rule/evidence validation. Historical results retain their jurisdiction, inputs, sources, and rule version; the four-jurisdiction boundary prevents a silent global expansion.

### DEC-025: Production-stage vocabulary is validation-gated before approval (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The existing production-stage labels are credible candidate evidence but unvalidated for recurring beatmaker delivery and contribution-centric session-player workflows. Hardening labels early could misplace Songs, fire provenance prompts at incorrect moments, or make release readiness depend on an unfit terminal stage.
- **Options considered**: (1) Lock the current ten-stage draft. (2) Practitioner-validate one shared fixed vocabulary, then have the product owner approve a version. (3) Split vocabulary by production model.
- **Decision**: **Option 2.** One platform-owned, fixed, music-specific vocabulary remains the sole permissible stage model. A candidate becomes enforceable only after two eligible beatmakers and two eligible session players map the required redacted workflow traces, every mismatch has a disposition, no critical mismatch or split-state-machine request remains, the gate passes, and the product owner explicitly approves one immutable enum version with its initial semantic, approved-master terminal semantic, and non-blocking prompt mappings.
- **Downstream**: `Song.current_stage` remains authoritative and the board remains its projection. Until approval, labels, order, initial state, terminal stage, prompt mappings, release predicate, reporting, and migration stay provisional. Validation may refine a candidate but cannot introduce user-configurable columns, production-model enums, a second machine, or unnormalised exceptions. Queue P-01 and ledger `r-44[0]` — see DEC-047 for the close. Recorded as ideation D-47.
- **Reversibility**: Medium — a future vocabulary requires a separately validated immutable version and migration plan; no unapproved candidate silently becomes historical contract.

### DEC-026: Large catalogues get a dense table, never a second lifecycle (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The production board had no defined behavior for a project or label catalogue at scale. A kanban of hundreds of cards stops being scannable, but a second view risks forking `Song.current_stage`, duplicating a Song per Release membership, or introducing bulk writes that bypass per-Song capture and authorization.
- **Options considered**: (1) Paginated board only. (2) Board below a threshold, dense catalogue table above it. (3) Exclude large catalogues from the feature.
- **Decision**: **Option 2, with a `60`-Song boundary.** Count unique visible authorized Songs in the selected scope **before** local search, sort, or table-only filters: `0–59` renders the craft board, `60+` renders the dense catalogue table. Selection is automatic — no v1 user override, saved preference, or URL mode. A local filter never switches a large scope back to board. A Song on several Releases counts once; sequence, selected master, and release-specific edits stay on the membership edge.
- **Downstream**: Both views are projections of the same `Song.current_stage` and a table row action invokes the identical per-Song authorized transition — same optimistic rollback, non-blocking capture prompt, dismissal completeness debt, roster notification, last-write-wins attributed notice, and derived readiness recomputation for every linked Release. V1 has **no bulk stage transition**; the table adds no configurable columns, per-card assignee, table-owned stage, or Release-local state. Pagination/cursor shape, page size, ordering, responsive behavior, and cache semantics are deferred to `/write-be-spec` and `/write-fe-spec`. Queue P-02 and ledger `r-44[1]` are resolved. Recorded as ideation D-48.
- **Reversibility**: High — the threshold is presentation policy over an unchanged state model, so a later value or an added manual override needs no data migration.

### DEC-027: Superseded approvals reinstate on version identity, never on judgement (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A backward stage transition marks later-stage approvals superseded. Nothing defined what happens when the song re-advances to that gate. Re-collecting every time punishes a mis-drag; auto-reviving would present an approval nobody gave for the current artifact.
- **Options considered**: (1) Always re-collect. (2) Auto-revive superseded approvals. (3) Re-collect only after a material change — either as a semantic judgement or as version identity.
- **Decision**: **Option 3, read as version identity.** Superseded approvals reinstate on re-advance **iff no new immutable version landed on the song in between**; any intervening version means the gate re-collects against its **current** approver set. The predicate is the append-only version timeline (`07.04.01` D-01 immutability, D-08 ingest order). The platform never asks a human whether a change was "material" and never certifies that nothing changed (`07.04.01` D-12).
- **Downstream**: `07.05.04` D-07 owns the rule; the `Reinstated` state and re-advance edge cases live there. The new-version branch is not a new rule — `07.05.04` D-01 already prevents an approval from transferring to a later version, so only the byte-identical administrative-reversion case needed deciding. Supersession and reinstatement are both **appended** events, preserving D-04's append-only trail and D-03's pinned comment state; nothing is retracted or rewritten. Already-pinned approvals are never rewritten when the approver set changes, and a departed approver still stalls the gate. The rule is presentation-agnostic across the P-02 board/table split, and Release re-readiness recomputes from the resulting stage without its own re-approval rule. Rejecting the semantic reading also avoids minting a third project-wide materiality definition alongside `07.03.03` D-07 and `02.04.01` D-10. Queue P-03 and ledger `r-44[2]` are resolved. Recorded as ideation D-49.
- **Reversibility**: Medium — a later semantic-materiality model would need its own classifier, judge, appeal path, and reconciliation with the two existing materiality definitions; historical supersede/reinstate events remain valid evidence either way.

### DEC-028: A handoff spec is authored where owned and referenced where not (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: `07.08.01` advertises six recipient specs — mastering, mix, sync, live, remix, archive — but only two have real contents on disk. Authoring all six would have the handoff builder originate requirements that domains 11, 12 and 05 already own, and invent `live` from no source at all.
- **Options considered**: (1) Define all six now. (2) Define the highest-frequency two first, others as follow-ons. (3) Ship a generic package with optional fields.
- **Decision**: **Option 2, re-cut on authority rather than frequency.** `07.08.01` originates `mastering`, `mix`, and `archive`'s asset half — the specs it provably owns per `07.08.03` Q-02. It **references** every spec owned elsewhere: `sync` → domain 11, DSP destination → domain 12, engagement-purchased handover → `05.04.02`/`05.04.04`. Referencing validates presence and surfaces the owner's verdict; it never restates the requirement. `live` and `remix` get no invented contents and become an ownership question.
- **Downstream**: Generalises `07.07.03` D-04 ("two copies of third-party requirements would drift, and one would be wrong") from destination specs to all referenced requirements. Preserves D-01 (specs are the product, not config) and D-02 (a spec is a least-privilege boundary — the mastering spec excludes stems *because the engineer should not have them*), both of which option 3 would have deleted. Severity is explicit: every requirement warns; integrity failure remains the sub-domain's only hard stop under domain D-04's "non-blocking is absolute". Also repaired a pre-existing contradiction where the no-canonical edge case asserted a second block citing a source that says the opposite. The Empty state now advertises only specs with contents behind them. Queue P-04 and ledger `r-46[0]` are resolved; `07.08.01` Q-01 is partly resolved and Q-04 opened for `live`/`remix` ownership. Recorded as ideation D-50.
- **Reversibility**: High for the set (adding a spec once a domain owns it is additive); Low for the ownership rule, which is now load-bearing across domains 05, 07, 11 and 12.

### DEC-029: Readiness targets follow the same ownership rule, and pin-vs-live is dissolved (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The readiness score computes against four targets — mix-handoff, mastering, DSP-release, sync-pitch — but no file enumerated any target's facts or thresholds. Separately, the score needed a *live* target while the handoff package *pins* its contents, which looked like two lifetimes on one object.
- **Options considered**: (1) Define every target fact now. (2) Evaluate externally owned specs only, deferring targets whose specs don't exist. (3) A generic score independent of target.
- **Decision**: **Option 2, re-cut per target on authority.** This is DEC-028's rule applied again: the score's targets and the handoff builder's recipient specs are one list under two names. `07.08.01` authors mastering and mix-handoff; DSP-release references domain 12 and sync-pitch references domain 11, consuming their severity classes as this feature's weights rather than re-deriving them. An unowned target is **not offerable**. "Block shipping" is recorded as **feature sequencing, never user-blocking** — the latter would breach domain D-04's absolute non-blocking rule and contradict DEC-028's own handling of the identical condition.
- **Downstream**: `07.08.03` D-07 records the ownership rule and D-08 dissolves pin-vs-live — one target-spec store with one version identity, the score a live **view**, the package a pinned **record** that now also pins the spec version it validated against. Domain 12 resolved the identical shape this way (`12.02.02` D-01, `12.01.02` D-07/DT-09); 07 does not inherit 12's authority to hold dispatch. Only `ready-for-DSP-release` is fully scoreable today. A set mismatch is recorded rather than hidden: eight recipient specs, four targets. Option 3 was foreclosed, not weighed — `07.08.03` DT-01 rejects a target-independent score "twice over". Also corrected a mis-routing: ISWC is `09.06.01`'s (captured, never issued), not domain 12's. Queue P-05 and ledger `r-47[0]` are resolved; whether readiness ever hard-blocks remains separately open. Recorded as ideation D-51.
- **Reversibility**: High per target (each becomes scoreable as its owner publishes); Medium for the store-and-version model, which now underpins both the score and every pinned package.

### DEC-030: A mis-typed source declaration is flagged, never reclassified (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A contributor may declare a "preset" that is really a full melodic loop — a different clearance obligation. The line is genuinely blurry and, as the source notes, the user will not know it either.
- **Options considered**: (1) Reclassify as a library-loop class and route to clearance review. (2) Keep the declared class and flag it. (3) Reject until resubmitted.
- **Decision**: **Option 2.** The declaration stands as made. A disputed type uses the existing attributed type-conflict path where both types are kept and surfaced, never auto-merged. Mitigation moves upstream: the capture prompt asks enumeratively — loop, one-shot, drum hit, vocal, break, stem, bought beat — so ambiguity surfaces at declaration time rather than hiding behind a bare "preset". Recorded as `07.08.04` D-08.
- **Downstream**: Reclassifying would have breached `07.08.04` D-03 (07 owns capture; 09/11 own clearance), the P-04/P-05 originate-vs-reference rule (the type axes belong to domain 14, the clearance consequence to `11.05.01`), and domain D-05 ("measure and show; never judge") — and would have required a detector that four separate decisions reject, "the honest posture is declaration, not detection". Rejection was foreclosed by domain D-04, which names "the capture prompt never blocks" as an enumerated instance, and is self-defeating: a rejected declaration reverts the region to `sources not reviewed`, destroying the fact it demanded. Queue P-06 and ledger `r-48[0]` are resolved. Recorded as ideation D-52.
- **Reversibility**: High — the enumerated prompt vocabulary can be extended without changing the no-adjudication rule, which is the load-bearing part.

### DEC-031: Vault re-gating fires only on an owner-declared material change (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: When access terms are re-versioned, it was unclear which existing holders must acknowledge the new version. Blanket re-gating interrupts live work; never re-gating leaves people operating under terms they never accepted.
- **Options considered**: (1) Re-gate every current holder. (2) Re-gate only on an owner-flagged material change. (3) Never re-gate.
- **Decision**: **Option 2 — confirming `07.03.03` D-07 at owner level rather than inventing policy.** Existing holders are not re-gated by default and acceptance records stay version-pinned; only an owner-flagged material change re-gates, at the holder's next access and never mid-transfer. Denial stays explained.
- **Downstream**: Materiality is **owner-declared, never platform-detected** — the owner authored the change, so the correct party judges. This is why it does not repeat the semantic reading DEC-027 rejected, where the only available judge was the wrong party, and it reuses D-07's existing definition rather than minting a fourth materiality concept. Option 1 was a recorded reversal: `07.03.03` DT-04 already rejected blanket re-gating for interrupting live work and training users to click through gates. The finding's real defect was a stale `[PENDING]` marker in the parent CX file contradicting its own resolved child. **The vault's fail-closed revocation is a locked security property and is not touched** — domain D-04's absolute non-blocking rule governs creative surfaces and enumerates no vault entry. Queue P-07a and ledger `r-50[0]` are resolved; what the flag records became `07.03.03` Q-05. Recorded as ideation D-53.
- **Reversibility**: Medium — the acceptance-record model is version-pinned and immutable, so changing the trigger later does not invalidate existing evidence.

### DEC-032: An access downgrade notifies the affected person and the roster (2026-07-21)

- **Timestamp**: 2026-07-21T13:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A downgrade already notified the affected person, but no rule said whether anyone else is told. The queue's standing recommendation was to tell only the affected party.
- **Options considered**: (1) Affected contributor only. (2) Affected person plus the roster. (3) Only when they encounter denial.
- **Decision**: **Option 2, scoped.** A downgrade is an instance of D-09 ("every roster write is announced — to the named party, and to the existing roster"), not an exception to it. The roster audience is scoped by D-16 to members who can already see that person's entry, so a confidentiality-restricted roster discloses nothing it deliberately hides. Recorded as `07.03.01` D-18.
- **Downstream**: **This reversed the queue's own prior recommendation on evidence** — its "sensitive demotion" premise has no source anywhere in the tree, and D-16 makes personnel default-visible. The coordination argument decides it: work is *rostered*, not assigned, so the roster is the team's only coordination record, and `07.03.03` D-04 has already killed the downgraded party's live URLs — under option 1 co-contributors keep routing stems to someone whose access is dead. Option 3 contradicts written `[DEEP]` behavior and locked copy, and makes the first notice a mid-work lockout. Audience only: cadence and batching stay with the notification cross-cut per the reference-never-restate rule. Queue P-07b and ledger `r-50[1]` are resolved; actorless band-derived downgrades became `07.03.01` Q-05. Recorded as ideation D-54.
- **Reversibility**: High — audience is a fan-out rule over an unchanged access model.

### DEC-033: Originality aggregates into a nominal enum for comp matching (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: The gear comp key is locked as `model × condition × originality` in four places, but nothing defined what fills the originality slot — only a per-component vector existed.
- **Options considered**: (1) Derive an enumerated aggregate. (2) Component vector only. (3) Seller-entered label.
- **Decision**: **Option 1, constrained to a nominal enum.** `13.02.03` D-05 derives an enumerated aggregate from the component vector — explicitly unordered, because D-04 locks originality as "a factual axis, not a quality scale" (a mod raises studio-gear value and lowers vintage value). It partitions comp sets; it never ranks units.
- **Downstream**: Authored on the owning axis and consumed by `13.04.01`, per the reference-never-restate rule; a value derived inside matching logic would be the forbidden second copy. The component vector is untouched. Option 2 contradicts the locked comp key and leaves nearly every bucket at n≤1 across 3ⁿ cells, forcing constant disclosed widening; option 3 makes the comp key manipulable by the incentivised party. Derivation inputs, the Unknown mapping, a completeness predicate and enum versioning are `13.02.03` Q-03/Q-04. Queue P-08a and ledger `r-56[0]` are resolved. Recorded as ideation D-55.
- **Reversibility**: Medium — the enum's definitions and mapping must be versioned, since a copy edit corrupts a price time series invisibly.

### DEC-034: An originality change voids a live offer in either direction (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A seller can edit an originality disclosure while an offer is live. Nothing said whether the offer survives.
- **Options considered**: (1) Void on downgrade, preserve on upgrade. (2) Preserve all with a notice. (3) Void on any change.
- **Decision**: **Option 3.** `13.02.03` D-06: any originality change voids the live offer, versioned and disclosed. `13.03.02` principle 3 already voids an offer on any material change to the stated listing.
- **Downstream**: Option 1 was unratifiable as worded — "downgrade" presumes an ordering DEC-033 just declined to create, and its "evidence worsens" rationale has no substrate since this axis mandates no photos. Option 2 contradicts principle 3 and would make originality weaker than the post-purchase case. Option 3 needs neither an ordering nor a materiality definition, so it is the only option with zero invention. Per `13.02.02` D-04/D-11 it is framed as seller-protection with a re-offer path, so late honest disclosure is not punished. The offer's missing disclosure-version pin is routed to `/write-be-spec`. Queue P-08b and ledger `r-56[1]` are resolved. Recorded as ideation D-56.
- **Reversibility**: High — a narrower trigger can replace it once an ordering or evidence substrate exists.

### DEC-035: Local-pickup settlement is a per-listing seller choice (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Whether money moves through the platform on a local pickup was called the most consequential open question in its file — it determines fee revenue, escrow protection, and whether the ownership chain has a hole at a common transaction shape.
- **Options considered**: (1) Platform-settled always. (2) Off-platform always. (3) Seller chooses per listing.
- **Decision**: **Option 3.** `13.11` D-04 confirms what the tree already implements: a per-listing pickup boolean, a ship/pickup/both selector, and four downstream files already branching on where money moved.
- **Downstream**: A global settled rule would impose marketplace-facilitator sales-tax and 1099-K duties on every cash handshake plus custody and refund liability; a global off-platform rule would strand escrow, evidence and ownership-chain machinery already specified. **The chain follows the money**: settled writes the transfer at settlement, off-platform uses the manual handshake `15.01.03` D-01 already names as the fallback for off-platform trade. Two sources currently disagree about whether an off-platform chain entry is possible; that conflict is recorded as `13.11` Q-04 rather than silently resolved, with settled-branch residuals as Q-05. Queue P-09 and ledger `r-59[0]` are resolved. Recorded as ideation D-57.
- **Reversibility**: High — the branch is per listing, so policy can narrow later without migrating existing sales.

### DEC-036: A rights takedown preserves the holder record; a revision appends (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Two adjacent questions — what a rights takedown does to existing holders, and what an ordinary revision does. Both risked collapsing into one lifecycle path.
- **Options considered**: For takedown — preserve record + notice, treat as revision, or remove record. For revision — append + archive + notify, replace in place, or require repurchase.
- **Decision**: **Preserve for takedown; append for revision** — two paths, never one. `14.03.02` D-04 states both, joining `14.09.03` D-02/D-04, `14.04.01` D-08/D-09, and `14.03.02`'s own D-01/D-02.
- **Downstream**: Both were confirmations: `14.04.01` already carries the heading "Removal is not deletion, and a rights takedown is not a revision", and permanent fetchability was already locked. Treating a takedown as a revision would reuse a path that does not exist singly; removing the holder record contradicts at least seven locked decisions and leaves counter-notice put-back undefined; replace-in-place contradicts five; repurchase-per-revision contradicts "updates are offered" plus the displayed version range. Archive-fetch posture after a takedown and takedown granularity are `14.03.02` Q-04; retention cost/duration remains Q-01. Queue P-10a/P-10b and ledger `r-62[0]`/`r-62[1]` are resolved. Recorded as ideation D-58.
- **Reversibility**: Low for the two-path separation, which is now load-bearing across delivery, catalogue and refunds; High for retention parameters.

### DEC-037: A departed contributor's confirmed split row survives unchanged (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: What happens to a confirmed contributor's share when they leave or are erased — asked as a question about an *accruing* balance.
- **Options considered**: (1) Escrow for future claim. (2) Redistribute among remaining. (3) Forfeit to seller/platform.
- **Decision**: **Resolved as scoped.** `14.10.03` D-05: the confirmed split row survives unchanged — never zeroed, redistributed, or forfeited. **The accruing premise is out of scope**: pool funding and download attribution/accrual are both WONT, and the splits feature is explicitly decoupled from the pool, so no accrual exists to escrow.
- **Downstream**: Both alternatives were already foreclosed elsewhere — `09.02.04` D-14 makes a 0% row the removal-without-consent loophole, and `10.04.03` D-01 with `royalties-collections-index.md` D-09 forbid unpayable money becoming platform float or revenue. No escrow contract was created, because the premise requiring one is cut. GDPR erasure versus payout retention is `14.10.03` Q-04, a security question. **If the WONT features are ever promoted, the accruing half returns.** Queue P-11 and ledger `r-63[0]` are resolved. Recorded as ideation D-59.
- **Reversibility**: High — the split row is unchanged, so any future accrual model attaches to it without migration.

### DEC-038: A host-update break is an external change — flag, disclose, never revoke (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: When a host update breaks a purchased preset bank, nothing said who owes remediation.
- **Options considered**: (1) External compatibility, flag the entry, no default refund. (2) Vendor conformity defect. (3) Platform goodwill remedy.
- **Decision**: **Option 1.** `14.04.02` D-04 ratifies into the preset catalogue the pattern already locked at `14.07.01` D-04 ("'perpetual' is a promise about the entitlement and the artifact, not a guarantee of function") and D-06 (third-party state change → permit + mandatory disclosure + never revoke).
- **Downstream**: Gives OS drift, lapsed dependencies and host breaks one consistent story instead of three. Vendor-defect classification would assign liability for a third party's act against supply-time conformity scope; a goodwill remedy creates discretionary cost with no source-defined trigger on a low-value product. **What triggers the flag is undecided** (`14.04.02` Q-04): the compatibility matrix records *declared* host-version facts, not observed breakage, so only a buyer-reported path exists today, and asserting a break without evidence would be the platform judging a third party's product. Queue P-12 and ledger `r-64[0]` are resolved. Recorded as ideation D-60.
- **Reversibility**: High — a detection mechanism can be added later without changing who owes what.

### DEC-039: Several queue entries were mis-framed, and the ratifications correct them (2026-07-21)

- **Timestamp**: 2026-07-21T14:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Across the marketplace block, four entries asked the owner to choose among options for questions that were already answered, mis-cited, or built on a cut premise — a pattern first seen in Domain 07's stale CX markers.
- **Options considered**: Ratify as framed, or correct the framing and record why.
- **Decision**: **Correct and record.** P-10a/P-10b were confirmations of contracts already locked in files the entries never cited; P-11's premise depends on two WONT features; P-08a cited the wrong CX (a flaw/evidence cross-cut, not the comp key) and the wrong sibling decision (P-08b's offer-void asymmetry); the P-08a interim rule suspended a locked comp key rather than describing the status quo.
- **Downstream**: Each ratification names the defect it corrects, so the queue stops teaching a false open/closed state. Reinforces the standing check: verify a queue recommendation's *premise* exists in the tree, and read the child before treating a parent marker as open. Adjacent stale markers found but deliberately not folded in (grade auto-downgrade, post-purchase disclosure change, `14.04.02` Q-03 against `14.09.02` DT-05) are recorded as separate reconciliations.
- **Reversibility**: N/A — this is a record-keeping correction, not a product policy.

### DEC-040: The bulk-import quality bar does not bend — the evidence moment moves (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Bulk gear import appeared to force a choice between relaxing the quality bar and failing the Operator persona. The queue collapsed four independently-locked axes into one scalar.
- **Options considered**: (1) Keep the normal per-unit bar, no publish until complete. (2) Allow disclosed lower-evidence bulk publication. (3) Restrict to specified seller classes.
- **Decision**: **Per-axis confirmation — the dilemma was false.** Model binding does not relax (bulk *raises* it); grading relaxes in a bounded, disclosed way with reduced comp weight and never an exemption; disclosure does not relax and admits no substitute; unit media does not relax but its capture moment moves to label print. In one line: the bar does not bend, the evidence moment moves, absence is disclosed and never gated.
- **Downstream**: A scalar answer would have silently overwritten at least one axis and, per `13.03` CX-03, created the prohibited shadow listing tier. Option 2's wording ("lower-evidence", "two-tier") reversed the meaning of the decisions it claimed to confirm, and two of its stated costs were inventions — no "trust weight" exists anywhere, and "unit handling" is not a state or event. Also repaired the false-dilemma prose surviving in `gear-marketplace-index.md` Q-13 and `13.03-listings-inventory-cx.md` — the unapplied half of this finding's own prescribed fix. Queue DQ-MG-01 and ledger `r-57[0]` are resolved. Recorded as ideation D-61.
- **Reversibility**: Medium per axis; the four are independently adjustable, which is the point of refusing the scalar.

### DEC-041: Stolen-serial review consumes domain 24's severity, and authors none (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: A false-positive stolen-serial hit blocks an innocent seller, and the source promised only a "fast human resolution path" — unmeasurable.
- **Options considered**: (1) Expedited SLA with mandatory updates. (2) Standard severity with escalation on evidence of imminent sale or hardship. (3) Provisional release after a short window.
- **Decision**: **Option 2 with its escalation clause struck.** The listing stays held, never deleted, and neither party is accused. Severity, SLA and escalation are consumed from `24.01.03`, which owns routing skill, severity and clock; domain 13 authors no number of its own.
- **Downstream**: The seller's substantive remedy already exists as the locked `reported → contested` dispute path in `15.02.04` — a dispute lane, not a support queue. The struck clause was the only inventive part: no source defines how the platform would observe "imminent sale or hardship", and doing so would mean adjudicating a fact nobody has. Option 1 would author a severity domain 24 owns; option 3 contradicts hold-not-delete. Queue DQ-MG-02 and ledger `r-58[0]` are resolved. Recorded as ideation D-62.
- **Reversibility**: High — severity is consumed, so a change in domain 24 propagates without a decision here.

### DEC-042: Approval-required licence transfers freeze on vendor exit (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: When a vendor exits, transfers their policy required them to approve have no approver.
- **Options considered**: (1) Platform substitutes for the vendor. (2) Auto-approve where recorded terms contain objective eligibility rules. (3) Freeze.
- **Decision**: **Option 3, recorded as resolved-as-scoped** — the same disposition shape as DEC-037. The platform never substitutes its judgement for a departed vendor's discretionary approval and never invents consent; the freeze is what the locked exit behaviour already produces once no approver exists.
- **Downstream**: Option 2 would commission a mechanism that does not exist — `14.06.01` stores a policy, not an evaluator, with no criteria slot, no evaluator and no appeal path. Two stale `[PENDING]` markers repaired, and the entry's miscitation of `14.03.03` D-03 (a stale-cache rule, unrelated) noted. **Recorded friction:** `14.02.05` D-09 promises tombstoned terms "remain in force", so one clause is permanently inoperative while displayed as active. Queue DQ-MG-03 and ledger `r-65[0]` are resolved. Recorded as ideation D-63.
- **Reversibility**: High — if the transfer machinery is promoted from its current scope, options 1 and 2 return as live.

### DEC-043: Theft-report standing binds to enumerated custody states (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Who may file a theft report when ownership and physical custody differ.
- **Options considered**: (1) Owner or documented holder/custodian. (2) Legal owner only. (3) Any witness, provisionally.
- **Decision**: **Option 1, amended.** The owner **or** a party in a custody state `15.08` already enumerates may file, with filing capacity recorded; a second filer joins the existing flag; the platform still never adjudicates title.
- **Downstream**: The word "documented" was deliberately not adopted — it is a custody-evidence threshold no source defines and maps to none of the six enumerated states, so the option as literally worded resolved its own motivating loan/consignment case to "nobody may file". Option 2 is foreclosed by `15.02.01` DT-02, which explicitly rejects the owner as the natural trigger — the deeper node answered its parent in the opposite direction. Option 3 invents a seventh state outside the locked set. Standing under `stale` and `disputed` custody remains open. Queue DQ-MG-04 and ledger `r-69[0]` are resolved. Recorded as ideation D-64.
- **Reversibility**: High — standing is a predicate over states that already exist.

### DEC-044: Identity-confidence and collision rules move to the file that owns them (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Two gear-registry questions — which identity-confidence vocabulary is canonical, and what happens when two records resolve to one identity key.
- **Options considered**: For vocabulary — adopt the render set, a smaller set, or a richer evidence-derived set. For collisions — never auto-merge, first-minted-wins, or threshold auto-merge.
- **Decision**: **Re-cut both as authority decisions.** `15.01.05` D-03 authors the canonical confidence set (the six values already in use) and `15.01.01` renders without defining its own. `15.01.05` D-04: colliding records **never auto-merge** — both retained, both claim-holders notified, merge only on mutual consent.
- **Downstream**: The queue's vocabulary recommendation was circular — its premise described the option it rejected. Collapsing the set risks contradicting D-01 ("a WJ-ID is never presented as equivalent to a serial"); the richer set was three orthogonal fields wearing one enum's clothes. The collision answer follows DEC-023's CQ-08 precedent: nothing probabilistic merges records asserting independent provenance. The entry's interim rule described the wrong mechanism — CX-01 **blocks the mint pending disambiguation**, it does not fork. Queue DQ-MG-05/06 and ledger `r-70[0]`/`r-71[0]` are resolved. Recorded as ideation D-65.
- **Reversibility**: Medium — relocating an enum is cheap now because no downstream literal binds to it.

### DEC-045: Unclaimed-record suggestions auto-apply by field class (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: What happens to a community suggestion on an unclaimed venue or studio record — the majority case at launch.
- **Options considered**: (1) Auto-apply all eligible edits. (2) Queue everything. (3) Auto-apply by field class, queue the rest.
- **Decision**: **Option 3.** Factual classes apply immediately with community provenance retained; higher-stakes classes queue; commercial fields stay Operator-only. The classification already exists — `16.01.01` defines Statutory / Anchor / Fact / Commercial / Structural with "who writes" and "beats" per class.
- **Downstream**: Mirrors `13.01.02`'s ratified posture that automation may propose but never dispose. Option 1 gives consequential facts no protection; option 2 leaves the unclaimed majority stale, defeating community correction exactly when the registry needs it. The entry's "requires field classification" con was stale, and it cited the wrong question (the ignored-suggestion timeout, a claimed-record concern) rather than the load-bearing one. Class cut line and freshness effects are `16.05.03` Q-05. Queue DQ-MG-07 and ledger `r-72[0]` are resolved. Recorded as ideation D-66.
- **Reversibility**: High — the cut line moves within an existing class model.

### DEC-046: The live-booking block resolves by consuming rules its own files already point to (2026-07-21)

- **Timestamp**: 2026-07-21T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: Six live-booking questions — soft-hold availability, default offer approval, offer expiry mid-approval, reconciliation conflict, verified-draw count, and gig-alert eligibility.
- **Options considered**: The canonical option sets for each; several proved unratifiable as worded.
- **Decision**: **Soft holds** — the date stays available with an aggregate hold state, never identities, scoped to the parties the ladder already exposes it to (`17.01.02` D-14). **Offer approval** — consume domain 01's governance model; with no rule configured, no offer is approved (`17.02.03` D-07). **Expiry** — the offer expires with no implicit grace; an extension is explicit, pre-expiry, by the offering side, as a new version (D-08). **Reconciliation** — the count stays provisional and undisputed portions settle (`17.09.02` D-16). **Draw** — `scanned_paid` is the verified draw, confirming D-08's three-count model. **Alerts** — announced first-party shows at on-sale (`20.06.02` D-09).
- **Downstream**: Four were confirmations of locked source. Two entries were bound to the wrong finding: `r-76[0]` actually holds the verified-draw question, and `r-79[0]` actually holds an alert-radius contradiction (25 mi vs 80 km, neither file citing the other) now carried as `20.06.02` Q-04. One was misrouted — the band governance rule belongs to domain 01, which already defines unanimity / majority / any-one-member. Third-party alerts were rejected mechanically: no external listing produces an on-sale instant the platform can observe. Ledger `r-74[0]`, `r-75[0]`, `r-75[1]`, `r-76[0]`, `r-77[0]`, `r-79[0]` are resolved. Recorded as ideation D-67.
- **Reversibility**: High for the confirmations; Medium for the domain-01 consumption, which is now load-bearing across 01 and 17.

### DEC-047: P-01 closes on its policy; validation evidence is implementation work (2026-07-22)

- **Timestamp**: 2026-07-22T15:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: decision, ideation, remediation, recovered

- **Problem**: `r-44[0]` was the last open ledger identity. Its policy was ratified on 2026-07-21, but the validation packet's practitioner trace register was empty — and the evidence it requires (redacted workflow traces from two beatmakers and two session players) cannot be authored from inside the repository without fabricating research.
- **Options considered**: (1) Close the finding on the decided policy, tracking evidence collection downstream. (2) Hold the finding open until four practitioners have been interviewed and an enum approved. (3) Reverse to Option A and lock the unvalidated ten-stage draft now.
- **Decision**: **Option 1.** The finding's text was "exact stage vocabulary still explicitly owner-open", and it is no longer open: the model, the gate, its cohort minima, its pass conditions and the owner-approval requirement are all decided and propagated. Candidate labels remain non-enforceable **because the gate is in force**, not because a decision is pending.
- **Downstream**: Matches the disposition already applied to **A-03** (DAW parsing) and **A-04** (vault profiles), both of which closed on their validation gate rather than on their evidence — consistent precedent, not a new leniency. Option 3 was rejected because it discards the reason Option B was chosen: the draft is explicitly unvalidated for beatmakers and session players. Fabricating traces was never available — the packet's only purpose is to prove the vocabulary was tested against reality, so inventing its contents would destroy the artifact it is meant to be. `Song.current_stage` keeps its semantic roles, no draft label is a downstream contract, and the packet remains the authority for when an enum becomes enforceable. **The ledger now reads 107/107 `verified-fixed`.** Recorded as ideation D-68.
- **Reversibility**: High — if validation fails or the owner rejects every candidate, the packet records the failure and the next iteration; nothing downstream hardened in the meantime.

### DEC-048: All 57 blocking sub-decisions ratified and propagated to source (2026-07-23)

- **Timestamp**: 2026-07-23T03:00:00.000Z
- **Agent**: claude
- **Source**: audit-ambiguity
- **Tags**: decision, ideation, audit, remediation

- **Problem**: A fresh full ambiguity audit of all 1,121 ideation documents confirmed 20 blocking findings — contradictions where two ratified specs give an implementer opposite instructions. Each had to be decided by the owner and then made true in the source.
- **Options considered**: Present all findings at once for bulk review; work domain by domain; or decompose each finding into independently-lockable axes first. The third was chosen after an adversarial challenge round found that nearly every first-pass entry collapsed several axes into one scalar question.
- **Decision**: **20 blocking findings → 2 already-resolved → 18 entries → 94 axes → 57 open sub-decisions, all ratified** (43 owner-decided, 14 agent-decided as spec hygiene or technically determined, each flagged). Full record with reasoning, preserved invariants and downstream commitments: `.memory/wiki/specs/audits/decision-ratification-log.md`. Options each was chosen from: `blocking-decision-queue.md`.
- **Downstream**: The 37 axes found already-locked are the load-bearing result — a scalar answer to any of them would have silently reversed a ratified decision. Propagated into source across three passes (144 files, then 144, then 41). Verification: every decision findable in source, zero broken invariants, and the two invented values that appeared were removed. Notable outcomes: v1 positioning restated from "capture at source" to "capture at the first sharing moment" (domain 07 D-06 made this obligatory, not optional); the UK statutory vocabulary retired to an unauthored profile yielding explicit `unknown`; `scanned` renamed to `admissions_total`/`admissions_paid` because one name could not carry two quantities.
- **Reversibility**: Medium. Each sub-decision is individually recorded with its rejected alternatives, so any one can be revisited; but several are now load-bearing across domains.

### DEC-049: DQ-R2-01 representation scope is two flat axes conjoined at the call site (2026-07-29)

- **Timestamp**: 2026-07-30T00:38:30.695Z
- **Agent**: claude
- **Source**: propagate-decision (DQ-R2-01)
- **Tags**: decision, dq-r2-01, domain-01, authority, ratified

- **Problem**: `01.03.02`:25 lists a five-item commercial-domain scope and the ratified seven-verb
  mandate as siblings on one representation edge; `01.03.02`:76 and `01.03-cx` CX-02 both assert
  "scope **is** the mandate". The identity reading is unsatisfiable — the activity enum is closed at
  seven (D-01, DQ-02.3, global D-69) and none of the five domains is in it. Three normative
  statements, no open marker on any of them. The word "activities" was filled with two different
  vocabularies nine lines apart in one file (`:16` verbs, `:25` domains).
- **Options considered**: A full cross-product (7x5=35 cells, the draft's recommendation);
  A-prime two flat axes ANDed at the call site; A-double-prime domain as edge identity (one edge per
  domain); B domains-for-representation/verbs-for-membership; C collapse to one vocabulary;
  D domains as presets expanding to verbs; G defer to `/create-prd`.
- **Decision**: **A-prime**, owner-ratified 2026-07-29. A representation edge carries two
  independent flat axes — `activities` (subset of the closed seven) and `domains` (subset of live
  booking / recording / publishing / sync / merch) — ANDed at the moment of the action. At most
  7+5=12 plain-language statements per edge, never 35 cells, which is what keeps `01.03.03` DT-02
  (permission matrix REJECTED) and D-02 (plain language, not a grid) intact. A membership edge
  carries the activity axis only and resolves to ALL domains, which is what keeps `01.03-cx` CX-03:
  both edge types present one shape, `{activities, domains}`, to the enforcement cross-cut.
  Territory, term and commission stay edge-level and do not vary per domain (accepted cost).
  `administer` does not reach naming a publisher over a share the party did not write (`09.01.04`
  D-06 stands over the mandate).
- **Why the draft's Option A was rejected**: a 35-cell grid *is* the artefact DT-02 rejects by name;
  its cross-type asymmetry breaks the CX-03 union the sub-domain merge exists to protect; and its
  "book for live but not publishing" justification is only half-sourced — the verb half is real at
  `01.03.02`:16 ("my manager can book but not sign"), the domain half appears nowhere in 1,122 files.
  The five-domain list occurs on exactly **one line** tree-wide.
- **Downstream**: `01.03.02` D-02 restated + new D-05; `01.03.03` D-11 + `:25` scope dimensions;
  `01.03.01` D-19 (membership universal-domain); `01.03-cx` CX-02 + CX-03; parent index D-05;
  `ideation-cx.md`:27 Roles/Permissions cross-cut; `ideation-index.md` D-75; `09.01.04` D-17
  carve-out; domain 17 booking authority (+ its `publishing authority` wording collision);
  domains 04, 05, 07, 20 local authority vocabularies.
- **Reversibility**: Medium. The rename and the conjunction are cheap to revise; the eliminated
  options are not — B, C and G were each independently refuted against source.
- **Left open (tracked)**: are the five domains identical to domain 17's ratified work-type enum, or
  a fourth vocabulary? `01.03.02`:25 lists sync as publishing's *sibling*; `09.01.04`:102 carves sync
  *inside* publishing as a right type. Tracked as `01.03.02` Q-03, targeted at `/create-prd`.
