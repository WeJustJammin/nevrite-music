# Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA

**Status:** Complete
**Parent:** [[specs/ia/27-digital-catalog-delivery|Shard 27]]

## Overview

This deep dive closes content/executable admission, artifact truth, entitlement identity, transfer authorization, terms composition and vendor-exit failure modes.

## Interactions

### Submission and QA Algorithm

1. Resolve vendor person/org authority and immutable product type.
2. Validate current type schema, structured terms, sources, AI uses, demos and continuity obligations.
3. Persist artifact master/digest and attributed attestation in one submission transaction.
4. Inspect deterministic archive/audio facts. Declared facts contradicted by bytes block; uncertain musical extraction remains a signal.
5. Exact content match or named third-party recording creates human-review hold; perceptual match does not auto-adjudicate.
6. Reviewer records scoped decision/reason/evidence; vendor may correct through a new immutable submission version.
7. Publish commits listing/artifact/terms/attestation versions and outbox atomically.

### Entitlement and Library Algorithm

1. Confirm synchronous paid order or authorized grant; `pending_payment` may exist but grants nothing.
2. Lock `(product, holder)` and append acquisition epoch instead of creating duplicates.
3. Freeze purchaser, holder, origin, vendor, terms version and entitled version range.
4. Project one library row per entitlement, scoped to one selected holder; never blend person/org.
5. Render entitlement, vendor, management authority and holder as independent axes.
6. As-of view reconstructs history but disables download; current view performs live delivery authorization.
7. Re-purchase reactivates the existing commercially revoked record and appends epoch.

### Delivery and Withdrawal Algorithm

1. Request checks holder control, entitlement, version range, artifact state and withdrawal.
2. Mint configured-lifetime buyer/artifact transfer grant (source default 72h) and disclose packed/unpacked size, master hash and expiry.
3. Every range request rechecks live authority; account/grant concurrency queues rather than denies.
4. Ordinary update never forces migration and leaves each previously entitled version fetchable.
5. `superseded`/`defective` withdrawal stops new selection but may complete in-flight transfer; `malicious` kills it and marks partial unsafe.
6. Rights withdrawal stops onward/archive delivery at smallest valid scope while preserving entitlement record/date/reason.

### Terms Composition

Permissions intersect; obligations union; numeric/territory/time bounds intersect; most restrictive value wins per axis. Unknown or unresolved returns `unknown`, never `clear`. Custom prose is retained but cannot override or propagate as structured permission.

## Contracts

### Content-First Admission

- Audio/content vendors enter through platform account → vendor terms/continuity → KYC/tax/payout.
- Sample/preset packs require a complete-duration `contents_only` audition; `made_with` is separately labeled.
- Pack remains billing unit; individual files are indexed/auditioned assets and are not independently sold at launch.
- Executable publication remains off until reproducible malware/build QA, support matrix verification, incident response, staged rollout, liability terms and continuity dependencies pass.

### Entitlement Invariants

- Purchaser and holder are separate principals; holder may be person/org.
- Issuance fact is indelible; state/holder/management authority may change through explicit commands owned with Shard 28.
- Licence key, activation seat and transfer grant are artifacts/authorizations of entitlement, never entitlement itself.
- Terms text/version remains resolvable after product/vendor retirement.

## Data Models

### Entitlement States

`pending_payment → active → suspended|commercially_revoked|refunded|chargeback|expired`

`commercially_revoked → active` is valid only through successful re-purchase/approved restoration epoch. Trial uses the same record with expiry. State transitions never erase acquisition epochs.

### Artifact Withdrawal Matrix

| Reason | New delivery | In-flight | Library row | Prior versions |
|---|---|---|---|---|
| superseded | current default changes | completes | active/update available | fetchable if entitled |
| defective | stopped for withdrawn build | completes with warning | defective/alternative shown | unaffected versions fetchable |
| malicious | stopped | killed/unsafe | danger/remediation state | affected artifact blocked |
| rights | stopped at scoped asset/container | stopped where required | retained with reason/date | unaffected scope fetchable |

### Musical Metadata

Fields are nullable and carry declared/extracted/agreeing confidence. BPM arithmetic may resolve deterministic loop tempo; key extraction never overrides declaration. Search supports half/double-time and compatible-key relationships without fabricating missing values.

## Access Control

- Org attestation requires current mandate to bind the entity; listing-write alone is insufficient.
- Reviewer cannot decide a submission where personal/commercial conflict exists.
- Emergency malicious withdrawal requires enumerated evidence and configured dual control above blast-radius threshold.
- Vendor cannot enumerate holders, access buyer library, download buyer derivatives or receive watermark mapping.
- Holder cannot access another controlled principal’s library without explicitly switching context and reauthorizing.

## Accessibility

- Submission gates expose a persistent checklist with passed, warning, blocked and review states in text.
- Audition players identify `contents_only` versus `made_with`, support keyboard seeking and disclose processing.
- Compatibility matrices provide row/column headers and a linear per-combination list.
- Library state axes remain separately labeled rather than collapsed into one badge.
- Withdrawal notices state affected assets, safety/legal reason class and concrete next action without accusatory language.

## Event Schemas

### Race Resolution

| Race | Resolution |
|---|---|
| Payment confirmation vs retry | Lock one product/holder record; append one acquisition epoch per proof |
| Re-purchase vs revocation | Aggregate version serializes; later lawful trigger emits compensating state |
| Download range vs withdrawal | Per-range check applies current withdrawal; malicious kills immediately |
| Update publish vs old download | Grant remains artifact-bound; holder chooses new version separately |
| Vendor exit vs committed order | Order resolves owned or refunded through Shard 28; never entitlementless payment |
| Metadata correction vs transfer | New master/version/hash; active old grant remains bound to old bytes unless malicious/rights withdrawal |

All events follow platform idempotency and canonical-refetch rules.

## Edge Cases

| Ambiguity | Locked resolution |
|---|---|
| Does WeJammin sell executables at launch? | No; creator content first |
| Is self-declared rig enough for a badge? | Advisory per-rig verdict only, never guarantee badge |
| Rig profile vs machine authorization? | Separate records linked optionally; pre-purchase convenience cannot mutate enforcement identity |
| Does WeJammin run activation? | No at launch; external activation remains clearly managed outside platform |
| Fail-open or fail-closed future activation? | Bounded fail-open grace default; vendor stricter mode must be disclosed before purchase |
| Gift flow? | Entitlement model supports purchaser ≠ holder; checkout UI deferred to Shard 28 decision |
| Freeware/trials? | Explicit grant/trial origins supported; vendor-set duration bounded by platform policy |
| Per-file sample purchase? | No at launch; pack billing only |
| Owned/store search blending? | Shared vocabulary, separate result bands |
| Buyer-identifying watermark? | Disabled until efficacy/privacy/cost proof and owner approval |
| High-risk content review? | Yes for exact match/named third-party recording; no universal manual queue |
| Vendor removed for malware? | Unsafe delivery stops; entitlement/evidence stays and remediation path is explicit |
| Vendor removed for rights? | Smallest-scope future delivery stops; holders notified with retained acquisition record |
| Perpetual storage cost? | Product admission requires continuity manifest, artifact quotas and versioned cost controls; no unsupported promise |

## Dependency References

- [[specs/ia/28-digital-licensing-commerce|Shard 28]] owns commerce, refund, revocation and revenue state.
- [[specs/ia/10-rights-ownership|Shard 10]] consumes structured rights/obligation composition.
- [[specs/ia/07-credits-core|Shard 07]] supplies public vendor credibility and receives credit obligations.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [27-digital-catalog-delivery § Contracts](../27-digital-catalog-delivery.md#contracts) defines commands/queries and [27-digital-catalog-delivery § Event Schemas](../27-digital-catalog-delivery.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

- 2026-08-03: Deepened content admission, QA authority, entitlement identity, transfer grants, withdrawal scope and vendor continuity.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
