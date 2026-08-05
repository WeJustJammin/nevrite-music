# Deep Dive 21 — Specialized clearances and licensing

**Status:** Complete
**Parent:** [[specs/ia/21-specialized-licensing|Shard 21]]

## Scope

This deep dive owns declaration provenance, provider-confirmed creator licensing, AI corpus immutability and special-route classification.

## Deepening Record

| Pass | Result |
|---|---|
| Consistency | Declaration, clearance, instrument, whitelist, corpus and allocation remain independently versioned. |
| What-if | Unknown samples, provider races, claim relanding, subscription cancellation, consent withdrawal and share transfer terminate honestly. |
| Adversarial | Machine-authored truth, stem-possession authority, silent whitelist, retroactive AI erasure and statutory overreach fail closed. |

## Sample and Derivative Algorithm

1. Enumerative prompt records each contribution's sample/replay/none answer and prompt version; negative answer is a declaration.
2. Human declares sample/replay and sides; machine records candidate/measurement provenance only.
3. Unknown source is valid and durable. Late candidate is a suggestion beside current declaration.
4. Sample clearance resolves recording and composition independently; instant policy failure falls to simultaneous negotiation.
5. Negotiated source-owner consent is unanimous. Fee and revenue share remain distinct ordered obligations and stacking must be valid.
6. Replay/interpolation asks plain language, resolves composition only and recommends replay when master cannot clear.
7. Authorized stem/remix grant derives from registry authority and explicit exploitation scope; unauthorized bootleg path is retroactive legitimisation, not marketplace approval.

## Creator Licence and Claim Algorithm

1. Owner opts share/work into fixed template/flat price; no negotiation or unsupported scope.
2. Buyer proves channel control through approved OAuth grant distinct from login.
3. Shard 20 issues instrument only under eligible single-payee/£0 path, then provider whitelist is requested.
4. Purchase completion waits for confirmed provider write; ambiguous state reconciles, failure blocks and triggers void/refund/recovery.
5. Claim-release case binds instrument/channel/content/claim. One user action submits provider request and retains receipt.
6. Correct claim is acknowledged; re-landed claim escalates with prior evidence instead of looping.
7. Subscription cancellation removes future purchase benefit only. Instrument/whitelist persists; failed cascade favors persistence.

## AI Consent, Corpus and Compensation Algorithm

1. AI data-use starts refused. Verified current share owner opts in for exact work/share/purpose/scope.
2. Share transfer supersedes consent and resets acquirer's share to refused.
3. Corpus draft pins proposed manifest and Shard 20 instruments; every item must be fully cleared/current at ship.
4. Notify affected owners before ship. Withdrawal/race before ship excludes item.
5. Ship atomically freezes immutable manifest/delivery evidence. Append model-use records as shipped uses become known.
6. Withdrawal after ship excludes future corpora and leads with inability to undo shipped dataset/model.
7. Compensation uses disclosed manifest rule, not influence estimation. Exact small entitlement remains attributable.
8. Multi-party payout remains disabled under B3; no allocation becomes platform-held wallet/escrow or forfeits below threshold.

## Special Route Algorithm

1. Classify cover, derivative, print/lyric, dramatic/grand-rights or ordinary Shard 20 scope before clearance.
2. Eligible faithful cover uses compulsory mechanical process; owner veto/policy is not substituted for statute. Shard 18 owns rate accounting.
3. Material melody/lyric change exits compulsory route and requires negotiated derivative permission.
4. Print and lyric rights share one negotiated feature; platform stores supplied authorized artifact but does not generate scores/transcriptions.
5. Grand rights remains unsupported/WONT, composition-side only if reconsidered, and never an auto-approved scope-grammar media value.

## Abuse and Recovery Verification

| Risk | Proof |
|---|---|
| Machine creates declaration | Schema separates suggestion/measurement from human decision. |
| Possessor grants stem rights | Shard 10 standing required independent of object access. |
| Payment without whitelist | Purchase terminal invariant requires confirmed provider write. |
| Cancellation removes licence | Lifecycle test excludes subscription from claim-release and instrument validity. |
| Silent AI inclusion | Corpus gate requires explicit current opt-in for every item. |
| Withdrawal rewrites shipped history | Manifest/model-use append-only tests. |
| Tiny compensation disappears | Exact allocation and no-forfeit state tests. |
| Grand rights slips through generic scope | Route classifier and unsupported gate tests. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | OAuth/provider adapters, job reconciliation, storage, settings, audit and B3 gate. |
| Shard 06 | Claims, disputes and protected evidence. |
| Shard 09 | Contribution/source assets and project lineage. |
| Shard 10 | Rights/share/standing and statutory accounting inputs. |
| Shard 20 | Scope, policy, clearance, consideration and instrument lifecycle. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [21-specialized-licensing § Contracts](../21-specialized-licensing.md#contracts) defines commands/queries and [21-specialized-licensing § Event Schemas](../21-specialized-licensing.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened sample, creator, AI and special-route algorithms | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/21-specialized-licensing|Shard 21]]
- [[specs/ia/20-licensing-core|Shard 20]]
- [[specs/2026-08-02-architecture-design|Architecture design]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized clearances and licensing]]
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
