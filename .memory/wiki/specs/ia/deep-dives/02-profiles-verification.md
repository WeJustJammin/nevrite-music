# Deep Dive 02 — Profiles, claiming and qualifications

> **Parent IA Shard**: [../02-profiles-verification.md](../02-profiles-verification.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns claiming/projection/qualification mechanics. It does not redefine Shard 01 party authority, Shard 02 credit meaning/rungs, Shard 03+ CMS composition, Shard 15/16 domain requirements, Shard 24 adjudication, payment/KYC, or jurisdictional legal conclusions.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Shadow privacy, claim strength, ownership windows, public projection, EPK disclosure, credential evidence, and trader gating use one fail-closed model. |
| What-if expansion | Missing routes, stale provider proof, duplicate shadows, collusion, contests, forwarding, source changes, expiry, and jurisdiction unknowns converge. |
| Adversarial pass | Spam, bearer-link takeover, self-attestation, denial-of-service contests, provenance spoofing, alias leakage, media-rights laundering, and legal-copy invention fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field, or unresolved implementation choice. |

## Resolved Product and Architecture Choices

| Source ambiguity | Locked resolution |
|---|---|
| Pre-emptive no-shadow registry | Not built. Account-free reactive suppression blocks display/outreach without maintaining a discoverable registry of non-users. |
| Child/minor invitation | Professional v1 is 18+; if source context indicates a minor/school/child performer, retain protected fact but suppress outreach pending safeguarding evolution. |
| Counter-attestation collusion | Tier C alone never grants full control. Full attestation eligibility requires active fully claimed person, verified login, no provisional/suspended state, independence checks, and no self/mandated-self path. |
| Claim proof provider selection | Adapter registry; no provider assumed. Tier A appears only when configured and healthy; Tier B/C remain universal fallbacks. |
| Contest adjudicator | Credible two-sided contests freeze and route Shard 24. Before that capability ships, freeze is terminal-but-reviewable; no identity operator guesses. |
| Contest abuse and windows | No pricing; human review after three/90 days; 14-day response; person claim reversal 30 days, organization transfer 14 days; public handover marker 30 days. |
| Frozen payment | No custom escrow. Preserve provider/local state, prohibit payout changes, and route finance/manual reconciliation under single-payee boundary. |
| Veteran imports | Import early; permanently source-marked low rung; never imply completeness or allow retroactive promotion. |
| Marketplace provenance floor | Prohibited globally. Consumers may display provenance signals but cannot exclude candidates solely by rung. |
| Profile descriptor vocabulary | Protected platform taxonomy governed by Shard 05 configuration/curation; free text is retained; users propose rather than mint canonical values. |
| Mandate-authored biography | `ProfileSectionRevision` records human author and acting party; public may show party authorship while audit preserves human accountability. |
| Reel ownership | Reel stays a section of profile composition; governed media contract plus rights basis is mandatory; no credit-implies-rights shortcut. |
| EPK PDF | Ship accessible derived PDF for adoption, clearly timestamped and linked to live view. |
| EPK link lifetime | Default 90 days, sender-revocable, configurable maximum 365 days; tracking is first-party minimal open count only. |
| Band EPK member credits | Include only band-held credits by default; member-held credits require reusable, revocable member consent naming the band and use, then explicit inclusion per send. |
| Human EPK private aliases | Fail closed. Sender deliberately includes each alias per send after a forwardability warning; no implicit aggregation. |
| Trader mismatch | Move to `review_required`, pause public listings, preserve drafts/orders, and require re-declaration/review; never silently reclassify. |
| US legal instruments/copy | Counsel-authored rule packs are activation gates. Unknown means disabled, not generic copy. |

## Canonical Field Contracts

### Shadow, Claim, and Contest

| Model | Fields and constraints |
|---|---|
| `shadow_party_context` | `id, party_id, creator_person_id, acting_party_id, source_domain, source_entity_id, role_code?, instrument_code?, contact_route_id?, created_at, version`; unique source-domain/entity/party binding. |
| `shadow_suppression` | `id, party_id?, route_fingerprint?, scope outreach|publication|both, state active|revoked, case_id, created_at`; protected lookup; never public name registry. |
| `invitation_dispatch` | `id, shadow_id, route_id, attempt_no 1..6, trigger initial|schedule|new_attester, scheduled_at, sent_at?, state, provider_ref?`; unique shadow/route/attempt. |
| `claim_case` | `id, target_party_id, claimant_person_id, claim_kind self|representation|transfer, state, control_level none|provisional|full, window_ends_at?, version`; one active self claim/person/target. |
| `claim_proof_attempt` | `id, claim_id, tier A|B|C, method, challenge_hash?, evidence_ref?, attester_person_ids[], independence_result, state, expires_at?, created_at`. |
| `ownership_contest` | `id, party_id, incumbent_claim_id, challenger_claim_id, state open|frozen|resolved|withdrawn, response_due_at, resolution_basis?, winner_claim_id?, reversal_ends_at?, version`. |

### Profile, EPK, Credential, and Trader

| Model | Fields and constraints |
|---|---|
| `profile_section_revision` | `id, party_id, section_code, content jsonb, author_person_id, acting_party_id, revision_no, state draft|active|archived, created_at`; active partial unique party/section. |
| `profile_fact_projection` | derived `party_id, source_type/id/version, provenance_state, evidence_class, evidence_count, visibility, occurred_on?, role_codes[], sort_key`; rebuilt, never directly edited. |
| `profile_emphasis` | `party_id, surface public|epk, default_filter?, ordered_refs[], version`; last-write-wins preference, not authority. |
| `reel_item` | `id, party_id, credit_id, media_kind object|approved_embed, media_ref, role_code, rights_basis ownership|licence|provider_publication, rights_ref, state, order, version`. |
| `epk_share` | `id, party_id, creator_person_id, acting_party_id, token_hash, recipient_label, purpose_code, selected_fact_refs[], consent_refs[], expires_at, revoked_at?, version`; token ≥128 bits. |
| `credential_record` | `id, subject_party_id, jurisdiction, profile_type_code, issuer_party/text, external_ref?, issued_on?, expires_on?, method, evidence_ref?, state submitted|reviewing|verified|expired|rejected|revoked|unknown, version`. |
| `trader_assessment` | `id, party_id, jurisdiction, answers jsonb, rule_pack_version, classification private|trader|undetermined|review_required, effective_from, effective_to?, state, version`. |
| `trader_mismatch_signal` | `id, party_id, signal_type, bounded_metrics jsonb, state open|dismissed|confirmed, generated_at, reviewed_at?, reviewer_id?`; no raw buyer/content data. |

## State Machines

| Aggregate | Allowed transitions |
|---|---|
| Shadow | `created → invited|suppressed|claimed|merged`; unclaimed remains non-public; claimed resolves through ownership without replacing party. |
| Invitation | `queued → sent|failed_retryable|stopped`; “not you”, suppression, claim, or lifetime cap stops future attempts. |
| Claim | `started → proving → provisional|full|stalled|withheld|contested`; stalled may resume; provisional → full|contested|revoked; no silent denial. |
| Contest | `open → resolved|frozen|withdrawn`; frozen → resolved only through policy/human evidence; transfer remains blocked. |
| Profile section | `draft → active → archived`; activating one revision archives prior active revision atomically. |
| Reel item | `draft → verifying_rights → active|rejected|takedown`; only active projects publicly. |
| EPK | `active → expired|revoked`; source changes do not change token/state, only live rendering and sender notification. |
| Credential | `submitted → reviewing → verified|rejected|unknown`; verified → expired|revoked|reviewing; expired remains visible as expired. |
| Trader assessment | `undetermined → private|trader|review_required`; private/trader → review_required on signal/rule change; review → private|trader|undetermined. |

## Proof Evaluation

1. Resolve authenticated claimant and target party; reject shadow/suspended/provisional attesters.
2. Reject if target is suppressed for claim contact, frozen, merged without redirect, or under incompatible case.
3. Offer healthy methods ranked by completion speed; do not expose unavailable contact/provider details.
4. Create a fresh challenge. Link/token possession never satisfies proof.
5. For Tier B/C, resolve attester humans and reject claimant equivalence, same session/project, same organization membership, mandate relation, or duplicate human.
6. Tier A success grants full. Tier B one independent designation grants provisional and two same-route independent designations grant full.
7. Tier C one or more independent confirmations grants provisional only; independent Tier A/B evidence is required for full.
8. Full/provisional grant locks party ownership version, writes ownership period, audit, notifications, projection invalidation, idempotency, and outbox atomically.

### Provisional Capability Rule

- Allowed: correct asserted profile, manage reversible availability/spec content, service committed obligations, propose identifiers/credentials, initiate contest.
- Denied: transfer/retire party, change payout/payee, sign/attest/assign rights, create new durable money/right obligation, grant signing/admin authority, disclose private evidence/export, publish media without independently valid rights.

## Contest Resolution

- Both sides retain prior operational access while open; ownership mutations are blocked.
- At 14 days without incumbent response, Tier A or full Tier B challenger evidence may win with the relevant reversal window. Tier C/weak/no evidence freezes.
- With both sides present, withdrawal/consensual transfer can resolve. If evidence clearly fails a typed policy, reject that claim. If both remain credible, freeze and route Shard 24.
- Reversal restores the prior ownership period/projection through a compensating command; it never deletes case evidence or attributed actions.
- Existing orders/bookings continue under operate-only custody; no new obligation or payout destination is allowed until resolution.

## Public Projection Invariants

- Unclaimed shadows have no public page, search document, sitemap entry, social preview, public portfolio, or public object URL.
- Every public fact is selected from a viewer-safe projection with source/version, provenance, visibility, embargo, listing, dispute, and party-lifecycle checks.
- Attester identities and protected evidence never publish. Co-contributors may publish only through their own public relationship projection.
- `disputed` remains unmarked publicly where the owning credit contract requires; participants see the dispute state in protected record views.
- Private aliases are excluded before totals, collaborators, ranges, filters, and counts are calculated; no complete-set computation followed by redaction.
- Error, authorization denial, timeout, and unknown state cannot render as an empty/zero result.
- Legal identity and trader address are structurally absent from profile projection.
- Profile source controls are fixed platform components; user content cannot emit HTML, badge glyphs, CSS, scripts, active URLs, or verification styling.

## EPK and Media Rules

- EPK public default reads the same public projection as the profile at request time.
- Each private alias inclusion requires sender confirmation per share. Each member-credit inclusion requires active consent; revocation removes it from the live EPK and triggers material-change notice.
- Share token grants view of selected projection only and is not authentication. Recipient labels are informational; forwarding is expected and disclosed.
- Opens store only share ID, coarse timestamp/day, and count. No IP retention, fingerprint, email beacon, or cross-site analytics.
- PDF generation snapshots currently rendered data, carries generated timestamp, live URL, source/provenance labels, alt text/tagged structure, and no hidden/protected metadata.
- Governed object/embed must pass media admission, publication, rights-basis, takedown, and accessibility checks. A credit alone never authorizes a clip.

## Credential and Trader Rules

- Credential type definitions are protected jurisdiction-profile registry entries with issuer rules, field schema, expiry semantics, evidence class, and consuming-domain codes.
- `verified` requires current evidence and method; document review identifies reviewer capability, never publishes reviewer identity; adapter outage keeps prior evidence until policy expiry.
- Credential expiry event is deterministic from `expires_on`; consumers must register block/warn/notify behavior and cannot infer it here.
- Trader rule packs contain jurisdiction, effective version, question schema, deterministic classifier, required public fields, disclosure copy/version, and commerce effects.
- Ordinary admins can publish only counsel-approved rule-pack versions through protected workflow. Missing/expired rule pack yields `undetermined` and blocks listing publication.
- Mismatch signals use active-listing count, repeat-category velocity, buy/relist pattern, and bounded revenue concentration; they trigger review but never self-adjudicate legal status.

## Concurrency and Idempotency

- Shadow creation keys on source domain/entity/role/party reference and client idempotency; matching never becomes uniqueness.
- Claim challenge issue/consume, proof completion, grant, contest, transfer, and reversal require target/case expected versions.
- Claim proof provider callbacks are deduplicated by provider event/reference and revalidate current claim/party state.
- Profile edits are per section. Emphasis is intentionally last-write-wins; attested projection is immutable from profile commands.
- EPK creation/revoke and credential/trader submissions require idempotency and expected aggregate version.
- Projection rebuild is version-addressed and idempotent; stale consumers cannot overwrite newer publication.

## Counsel and Release Gates

| Capability | Gate |
|---|---|
| Public unclaimed profiles | Disabled until lawful basis, notice, account-free remedy, indexing, retention, and counsel approval exist; current product choice remains non-public. |
| Minor shadow outreach | Disabled for known/suspected minor contexts until safeguarding/guardian design is approved. |
| Reel media from third-party masters | Requires explicit rights basis and takedown contract; otherwise only approved public provider link/embed. |
| US credentials/statutory names | Unknown slots remain unknown until counsel-authored profile is approved. |
| Trader disclosure and commerce | Listing publication disabled until US seller/buyer jurisdiction rule pack and exact disclosure copy are approved. |
| Multi-party money/escrow | Disabled; contest/frozen-party behavior cannot claim platform-held escrow. |

## Cross-Shard Contracts

| Consumer | Contract supplied |
|---|---|
| Shard 01 | Ownership period, claim/provisional/frozen status, public/suppressed projection state; Shard 02 never changes party authority outside guarded ownership commands. |
| Shards 15/16 | Current profile, qualification, and credential projections for education delivery/institution decisions; consuming shard owns transactional consequence. |
| Shard 24 | Typed claim contest, suppression/correction, false evidence, credential review, and trader mismatch case references. |
| Profile/discovery consumers | Viewer-safe party projection and descriptor taxonomy references; no provenance floor as eligibility gate. |
| Credit/rights consumers | Source credit/provenance/listing/embargo and rights-basis references; Shard 02 does not redefine them. |

## Verification Matrix

| Threat/failure | Required proof |
|---|---|
| Bearer invitation takeover | Link leads only to fresh proof; replay/expiry tests cannot grant control. |
| Self/collusive attestation | Same-human/org/mandate/session checks and Tier-C provisional ceiling pass abuse tests. |
| Contest denial of service | Open contest preserves prior operation, blocks ownership change, limits repeats, and does not strip on accusation. |
| Public non-user leak | Shadow absent from public API/search/sitemap/cache/social preview tests. |
| Alias inference leak | Hidden alias cannot change any public scalar, collaborator, range, filter, count, or timing. |
| Provenance spoofing | User content cannot render reserved styles/glyphs/HTML; asserted text remains structurally separate. |
| Reel rights laundering | Credit without rights basis fails publication; role/source remain visible on valid item. |
| Legal copy invention | Missing credential/trader rule pack returns unknown/blocked, never fallback jurisdiction text. |
| Partial projection failure | Failed/denied source renders explicit state and never zero/absence. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [02-profiles-verification § Contracts](../02-profiles-verification.md#contracts) defines commands/queries and [02-profiles-verification § Event Schemas](../02-profiles-verification.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-02 | Authored proof, contest, projection, EPK, credential, trader, concurrency, counsel and abuse contracts | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
