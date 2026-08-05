# Deep Dive 22 — Release and distribution lifecycle

**Status:** Complete
**Parent:** [[specs/ia/22-release-distribution|Shard 22]]

## Scope

This deep dive owns snapshot gating, partner-knowledge certification, delivery choreography, store-local reconciliation, lifecycle recovery, identifiers and export continuity.

## Deepening Record

| Pass | Result |
|---|---|
| Consistency | Composition, readiness, delivery snapshot/message, store state and lifecycle command pin distinct versions. |
| What-if | Rights drift, profile gaps, out-of-order acks, partial acceptance, early/late live, destructive updates and exit have terminal recovery. |
| Adversarial | Canonical mutation, false live, blind resend, ID duplication, silent claim response and export lock-in fail closed. |

## Readiness and Snapshot Algorithm

1. Resolve release version/memberships, recording origins, rights/licensed inclusion, co-owner consent, conflicts, third-party rights and target set.
2. Run machine eligibility per target: complete canonical facts, profile/rules, asset analysis, artist links, identifiers and destination rights.
3. Build social chase list only for machine-eligible items; name actor/action/deadline to owner and own item to contributor.
4. Master consent/conflict and third-party clearance block delivery. Publishing split routes registration; percentage dispute may ship with held accounting evidence where source policy permits.
5. Exhausted/override is explicit and visible to affected parties. Override changes delivery decision, never source record.
6. At handoff re-resolve rights/destination and pin one partner-knowledge version with canonical input versions.
7. Any drift before dispatch halts and shows diff. No stale readiness result authorizes delivery.

## Partner Knowledge and Delivery Algorithm

1. Profile key is partner×destination/release type×message version×deal shape, optionally territory.
2. Immutable profile/rule/spec version is attributed, second-reviewed for structural edits and admitted only after conformance certification.
3. Weekly harness keeps offerability live; suspension blocks new deliveries but permits updates/takedowns against pinned versions.
4. Generator is pure projection. It retains exact message bytes, input/profile versions, thread/supersession and human receipt.
5. Regeneration diffs prior message; artist-unrequested deltas require acknowledgement.
6. Dispatch is idempotent by message+step. Retry is sequence-aware; unrecognized/out-of-order acks quarantine.
7. Response windows use evidenced partner-business-day statistics/SLA/seeded internal clocks without unsupported artist-facing promises.
8. Overdue triggers human chase, never blind redelivery.

## Store, Date and Notification Algorithm

1. Availability resolves per recording×territory×commercial model×destination from complete rights and profile capability.
2. Complete no-encumbrance record may derive worldwide; missing/unresolved record blocks. Basis is shown.
3. Date plan distinguishes delivery/release/live/original-release/first-live, territory/destination and editorial/pre-save windows.
4. User chooses costed date; system never preselects/moves it. Change after announcement is plainly a broken promise.
5. Partner ack advances choreography only. Store-side evidence advances preorder/live using store-local time and exact territory/items.
6. Acks order by partner timestamp; status cannot regress. Partial outcomes retain rejected-item detail.
7. Interrupt only actionable rejection/overdue/mismatch/zero-play/early-live under bounded dedupe; otherwise digest/summary.
8. One delivery contact receives interrupts; collaborators receive scoped digest.

## Lifecycle, Claims and Exit Algorithm

1. Classify update per field/store into metadata update, redelivery, takedown or new release before authorization.
2. Destructive plan requires owner Full approval, persists each destination step and retries idempotently.
3. Voluntary takedown lists concrete irreversible losses; provenance remains. Re-entry is new release/UPC with existing ISRCs.
4. Involuntary suspension is evidence-scoped, explains claimant/basis/contest and permits append-only claim evidence.
5. Fingerprint registration rechecks stronger rights/sample/ownership gates. Whitelist is reviewed before provider registration.
6. UGC disputes show held evidence; platform never auto-responds. Conflict blocks new registrations.
7. ISRC assignment is recording-idempotent/atomic within registrant-year batch; ambiguity resolves by lookup. Supplied IDs remain assertions.
8. Export contains canonical records, partner/message/status history, IDs, assets/evidence manifests and checksums. Imports state witnessed-data loss and never fabricate attestations.

## Abuse and Recovery Verification

| Risk | Proof |
|---|---|
| Delivery changes canonical metadata | Projection-only generator and canonical-version checks. |
| Profile author self-deals | Second-review and interest-conflict audit. |
| Ack implies live | Separate choreography/store-evidence state tests. |
| Blind retry duplicates release | Message thread/idempotent step/supersession tests. |
| Rights drift ignored | Dispatch expected-version and re-derivation tests. |
| Takedown erases provenance | Lifecycle/event retention tests. |
| ISRC allocated twice | Unique recording/identifier constraint plus reconciliation lookup. |
| Claim auto-response | No service transition without user decision/case authority. |
| Exit package withheld | Always-available export authorization and portability tests. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Partner admission, Storage/media jobs, schedules/settings, audit/outbox and secrets. |
| Shard 01 | Artist/label/distributor identity and store profile links. |
| Shard 06 | Suspensions, claim disputes and protected evidence. |
| Shard 09 | Release/recording/project assets and contributor workflow. |
| Shard 10 | Rights/consent/territory/identifier registry effects. |
| Shard 20 | Licensed inclusion and clearance instrument. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [22-release-distribution § Contracts](../22-release-distribution.md#contracts) defines commands/queries and [22-release-distribution § Event Schemas](../22-release-distribution.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened readiness, partner, choreography, store, lifecycle, identifier and exit algorithms | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/22-release-distribution|Shard 22]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/10-rights-ownership|Shard 10]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
