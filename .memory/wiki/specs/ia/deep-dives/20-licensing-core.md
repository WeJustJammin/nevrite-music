# Deep Dive 20 — Licensing core and instrument lifecycle

**Status:** Complete
**Parent:** [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]

## Scope

This deep dive owns clearance precedence, evidence/consent boundaries, policy folding, atomic issuance saga, exclusivity and immutable lifecycle.

## Deepening Record

| Pass | Result |
|---|---|
| Consistency | Scope, snapshot, consent, quote, transaction and instrument pin independent versions. |
| What-if | Erasure, grammar growth, veto races, MFN failure, payment ambiguity, render failure and indeterminate expiry terminate safely. |
| Adversarial | Owner override, silence-as-consent, self-dealing, partial dual licence, charge-only success and retroactive revocation fail closed. |

## Scope and Clearance Algorithm

1. Validate complete scope under pinned grammar. Unspecified carried axes are non-permissive; data-use omission means none.
2. Expand territory label to explicit countries and scope point to exact required master/publishing/performer/other sides.
3. Load bitemporal rights/administration, consent graph, ownership disputes, attestations, encumbrances, holds/exclusives and policy versions.
4. Determine consent parties, not merely share holders. Administrators and unreleased performers may have standing; credits alone do not.
5. Evaluate each side and fold precedence `unknown > blocked > contested > encumbered > incomplete > consent_needed > clearable_now`.
6. Buyer projection shows verdict/snapshot age/remedy class only; co-owner projection may attribute blocker.
7. One-stop requires one unique transacting counterparty over every side. Otherwise state clearable counterparty count.
8. Issuance repeats steps 1–7 inside protected transaction with current expected versions.

## Evidence, Encumbrance and Consent Algorithm

1. Completeness attestation pins immutable party-list version, side, knowledge statement, verified attestor and authority basis.
2. At least one valid uncontested attestation per gating side is floor; grade/corroboration disclose quality but do not replace consent.
3. Listed party contest invalidates immediately; credible unlisted claim marks contested and blocks new issuance.
4. Encumbrance is a declaration about own work/material. Fingerprints may suggest privately but cannot declare.
5. Scope ceiling is intersection of upstream clearance instruments; retraction supersedes and remains attributable.
6. Route all consent parties simultaneously. One human receives one request naming all stakes.
7. Plain-language scope/price/deadline is primary; legal grammar appendix remains exact.
8. Non-response, expired identity or unavailable party never improves clearance.

## Policy and Pricing Algorithm

1. Owner policy attaches to share; owner default may have per-work override. Transfer ends prior policy.
2. Apply refusal/category/buyer blocks first. AI training defaults refused; new grammar values remain inert.
3. Test eligibility, dispute/MFN/self-dealing/live-principal rules and conjunctive scope containment.
4. Auto-approve is explicit opt-in, non-exclusive only and requires every owner's share-specific policy to pass.
5. Evaluate each owner's absolute currency threshold against their own share value and trailing 90-day share-denominated approvals.
6. Failure/budget excess falls through to human, never approval. Fold output remains order-independent and attributed.
7. Policy passes before price. Quote pins rate-card/policy/scope/grammar versions and TTL.
8. Negotiation records asks in money; consent remains separate. MFN evaluates complete settled set at one point, producing agreed and owed values.

## Issuance and Consideration Saga

1. Freeze buyer, licensee, purchaser authority, end client, scope, required sides, quotes/consents and idempotency key.
2. Re-evaluate clearance, blocks, holds, exclusivity and policy fresh. At most one overlapping exclusive can commit.
3. Determine payee topology. Paid multi-counterparty topology returns B3-disabled before provider side effect; £0 remains valid.
4. For allowed single-payee consideration, obtain provider-authorized commitment and reconcile amount/currency/account.
5. One PostgreSQL transaction records commitment reference, required-side instrument pair, rights-side/revenue registration, audit/idempotency and outbox. No partial pair.
6. If transaction fails, void/refund provider commitment. If provider state is ambiguous, keep pending and reconcile; never claim charged or issued prematurely.
7. issued-at is server time; effective-from and term-start remain distinct, with unresolved trigger allowed.
8. Render certificate asynchronously. Render/notification/whitelist/cue-sheet failure cannot erase instrument.

## Lifecycle Algorithm

1. Instrument is immutable and active according to term trigger/duration.
2. Administrative correction or narrowing creates superseding amendment with required affected-party authority.
3. Widening is a new grant: fresh scope grammar, clearance, consent, quote and consideration. Refusal leaves original untouched.
4. Later policy/veto/ownership/encumbrance changes affect new requests only and notify changer when prior licence exists.
5. Expiry warns buyer and owners. Non-computable term remains `expiry_indeterminate`, not absent.
6. Breach termination requires instrument-authorized remedy plus Shard 06 evidence/case; regret is not breach.
7. Verifier resolves pinned grammar/instrument/lifecycle live, gives checked-at/validity window and unguessable reference.
8. Outage returns cannot-verify; superseded/terminated response points to safe current status without exposing private terms.

## Abuse and Recovery Verification

| Risk | Proof |
|---|---|
| Cached clear badge issues licence | Gate loads fresh versions under issuance transaction. |
| Silence becomes approval | Consent state machine has no timeout-to-approved transition. |
| Owner bypasses blocker | No override contract/role; database gate owns issuance. |
| Self-dealing auto-approves others | Affiliate/co-owner tests suspend other shares. |
| Partial dual-side issue | Transaction invariant requires complete required-side set. |
| Charge without licence | Provider commitment reconciliation and void/refund recovery tests. |
| Second exclusive race | Database exclusion constraint and conflict test. |
| Certificate treated as source | Verifier/instrument lookup ignores projection authority. |
| Later veto revokes licence | Lifecycle tests preserve issued instrument. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Provider commitment, Storage/render jobs, settings, audit/outbox and B3 feature gate. |
| Shard 01 | Buyer/licensee/purchaser/owner identity, administration and mandates. |
| Shard 02 | Verified identities and evidence quality. |
| Shard 06 | Contest, breach, dispute and protected evidence. |
| Shard 09 | Works/assets/briefs/pitches and project media. |
| Shard 10 | Rights sides, shares, consent graph, administration, encumbrance dependencies and licence effects. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [20-licensing-core § Contracts](../20-licensing-core.md#contracts) defines commands/queries and [20-licensing-core § Event Schemas](../20-licensing-core.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened clearance, evidence, policy fold, issuance saga, exclusivity and lifecycle | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/20-licensing-core|Shard 20]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/10-rights-ownership|Shard 10]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
