# BE 06c — Disputes, DMCA, legal process and specialized safety risk

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 06 — Trust, safety, disputes and evidence | 06c — Disputes, DMCA and legal risk | TSE-02, TSE-10, TSE-11, TSE-12, TSE-13, TSE-15, TSE-18, TSE-19, TSE-23, TSE-24 and TSE-25; legal, transaction, ownership-resolution, launch-risk, authenticity, leak and meetup records only. |

The canonical IA source is .memory/wiki/specs/ia/06-trust-safety.md. Its approved deep dive is .memory/wiki/specs/ia/deep-dives/06-trust-safety.md. No alternate filename is used. 06a owns intake, routing, restrictions, evidence capture and holds. 06b owns policy decisions, controls, sanctions, advisory signals, message safety, rail controls, review integrity and TVEC. This companion owns the eleven interactions above and does not duplicate their routes or tables.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| TSE-02 Submit legal/DMCA notice | TSE-06C-01 | Identified claimant notice validation, strike-unit deduplication and availability-action command | Protected claimant identity, complete pinned-regime attestations and claimant/asset/infringement triple are validated before any action. |
| TSE-10 Open transaction dispute | TSE-06C-02 | Transaction dispute filing and evidence-manifest freeze command | Owning commerce shard and Shard 01 mandate snapshot are read at expected versions; remedy deadline and sealed evidence are frozen atomically. |
| TSE-11 Mediate or adjudicate | TSE-06C-03 | Signed settlement or reasoned adjudication command | Settlement binds every party mandate; adjudication records evidence weights, per-item remedies and an independent adjudicator. |
| TSE-12 Process DMCA counter-notice | TSE-06C-04 | Counter-notice disclosure, delivery and restoration-clock command | Complete signed 512(g) statements and explicit address/jurisdiction disclosure precede delivery and restoration timing. |
| TSE-13 Resolve identity/ownership case | TSE-06C-05 | Scoped identity or ownership access-resolution command | Shard 01 truth is snapshotted; this route can change access and privileges but never ownership, credits or splits. |
| TSE-15 Receive legal process | TSE-06C-06 | Verified legal-process intake and counsel-gated disclosure command | Documented intake verifies requester, instrument, jurisdiction, authority, scope and prohibition; release is manifest-limited and expiring. |
| TSE-18 Assess domain-launch risk | TSE-06C-07 | Domain or release safety-risk assessment and launch-gate record | Owner records harms, controls, gaps, evidence and disposition for one pending domain/release before Shard 05 can enable it. |
| TSE-19 Submit trusted-flagger notice | TSE-06C-08 | Scope-bound public-content priority-lane bulk notice command | Active grant, public target scope and per-item idempotency are required; accuracy write-back is mandatory and ordinary appeals remain intact. |
| TSE-23 Review authenticity or counterfeit claim | TSE-06C-09 | Buyer, brand or listing-time authenticity claim reconciliation command | Registry chain and trademark-exhaustion check are evaluated before a seller-facing action; all paths converge to one reason per listing. |
| TSE-24 Respond to pre-release leak | TSE-06C-10 | Watermark, access-trace and release-state forensic finding command | Platform reference matching produces attribution or explicit no-attribution; the leaked copy is never hosted. |
| TSE-25 Attach meetup safety layer | TSE-06C-11 | Arrangement-time optional safety control record command | Active restrictions deny arrangement; location, check-in and trusted-contact controls are offered, optional and immutably recorded. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/06-trust-safety.md | title, links, overview and scope lines 1-24 | Establishes canonical Shard 06 ownership, launch boundary, counsel gates and the parent/deep-dive relationship. |
| .memory/wiki/specs/ia/06-trust-safety.md | features and delivery phases lines 26-44 | Supplies the feature identifiers and the consumer-launch versus deferred boundary used by this split. |
| .memory/wiki/specs/ia/06-trust-safety.md | acceptance criteria lines 48-78 and 88-104 | Supplies the exact preconditions, outcomes and failure behavior for TSE-02, TSE-10, TSE-11, TSE-12, TSE-13, TSE-15, TSE-18, TSE-19, TSE-23, TSE-24 and TSE-25. |
| .memory/wiki/specs/ia/06-trust-safety.md | interaction rows and global rules lines 79-114 | Reconciles all eleven interaction IDs, idempotency, versioning, no-enumeration, ownership boundaries and source-event behavior. |
| .memory/wiki/specs/ia/06-trust-safety.md | core/error, dispute/legal, priority and specialized contracts lines 115-179 | Defines Notice, Dispute, DMCA, legal process, TrustedFlaggerGrant, AuthenticityClaim, LeakForensics and MeetupSafetyRecord invariants. |
| .memory/wiki/specs/ia/06-trust-safety.md | data models and typed registry lines 181-256 | Defines the thirteen assigned persistence models and their typed field obligations. |
| .memory/wiki/specs/ia/06-trust-safety.md | access, escalation and accessibility lines 258-301 | Defines claimant, party, counsel, owner, trusted-flagger, safety and protected-reviewer access plus accessible consumer/staff surfaces. |
| .memory/wiki/specs/ia/06-trust-safety.md | event schemas, edge cases and coverage matrix lines 303-397 | Defines all eight assigned events and the dispute, DMCA, legal, risk, flagger, authenticity, leak and meetup recovery cases. |
| .memory/wiki/specs/ia/06-trust-safety.md | cross-shard dependencies, changelog and dependency references lines 397-491 | Establishes producer ownership, expected-version handoffs and downstream contract boundaries. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | scope and deepening record lines 1-18 | Confirms converged boundaries, immutable versions, idempotent commands and adversarial outcomes. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | risk, dispute, legal and evidence models lines 45-57 | Supplies exact model fields, append-only evidence references and legal-request constraints. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | dispute, DMCA and legal algorithms lines 121-145 | Supplies transaction freeze, settlement, adjudication, 512(g), verification, minimization and notification algorithms. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | evidence, retention and erasure algorithm lines 147-156 | Constrains evidence manifests, sealed supplements, holds, anonymization and media tombstones used by these flows. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | abuse and recovery verification lines 158-173 | Supplies controls for provenance, legal urgency, provider ambiguity, recovery and no-false-action behavior. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | cross-shard contracts and implementation envelope lines 175-194 | Binds BE00, Shards 01 and 05, source commerce/catalog shards and the Hono/Zod/PostgreSQL/outbox implementation envelope. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | changelog and dependency references lines 196-220 | Records locked decisions and dependency direction. |

## IA Source Map

### Interaction map

| IA interaction | Backend operation | Owned command and invariant | Source trace |
|---|---|---|---|
| TSE-02 Submit legal/DMCA notice | TSE-06C-01 | Validate identified claimant, complete regime attestations and deduplicated strike unit before availability action. | Parent IA lines 80 and 115-130; deep dive lines 131-137. |
| TSE-10 Open transaction dispute | TSE-06C-02 | Freeze transaction version, parties, remedies, deadline and sealed evidence manifest. | Parent IA line 88 and lines 154-163; deep dive lines 123-130. |
| TSE-11 Mediate or adjudicate | TSE-06C-03 | Require exact signed settlement terms or independent evidence-weighted adjudication. | Parent IA line 89 and lines 154-163; deep dive lines 127-130. |
| TSE-12 Process DMCA counter-notice | TSE-06C-04 | Show disclosure consequences, validate signed 512(g) statements, deliver and start restoration clock only when complete. | Parent IA line 90 and lines 154-163; deep dive lines 131-137. |
| TSE-13 Resolve identity/ownership case | TSE-06C-05 | Resolve access and privilege outcome from exact Shard 01 snapshot without mutating ownership truth. | Parent IA line 91 and lines 154-163; deep dive lines 9 and 180. |
| TSE-15 Receive legal process | TSE-06C-06 | Verify instrument and authority; narrow or refuse broad scope; counsel-gated manifest-limited release. | Parent IA line 93 and lines 154-163; deep dive lines 139-145. |
| TSE-18 Assess domain-launch risk | TSE-06C-07 | Record domain/release harms, controls, gaps, evidence and disposition before enablement. | Parent IA line 96 and lines 165-179; deep dive lines 181-193. |
| TSE-19 Submit trusted-flagger notice | TSE-06C-08 | Admit in-scope public items per idempotency key, shortened SLA and accuracy ledger. | Parent IA line 97 and lines 165-179; deep dive lines 162-164. |
| TSE-23 Review authenticity or counterfeit claim | TSE-06C-09 | Reconcile buyer, brand and listing paths; check exhaustion and registry chain; issue one seller reason. | Parent IA line 101 and lines 165-179; deep dive lines 162-173. |
| TSE-24 Respond to pre-release leak | TSE-06C-10 | Match platform reference, extract watermark, trace access and state no-attribution or non-event when required. | Parent IA line 102 and lines 165-179; deep dive lines 147-156. |
| TSE-25 Attach meetup safety layer | TSE-06C-11 | Deny restricted arrangements and persist optional controls/check-out without moralizing or deletion. | Parent IA line 103 and lines 165-179; deep dive lines 158-173. |

### Model map

| IA model name | BE owner | Persistence/contract use | Source trace |
|---|---|---|---|
| transaction_dispute | TSE-06C-02 and TSE-06C-03 | Frozen transaction, party, mandate, remedy, evidence and state/version record. | Parent IA line 194; deep dive line 50. |
| resolution_proposal | TSE-06C-03 | Exact terms, signatures, expiry, accepted parties and settlement hash. | Parent IA line 194; deep dive line 51. |
| dmca_notice | TSE-06C-01 | Identified claimant, regime attestations, completeness, delivery and strike unit. | Parent IA line 195; deep dive line 52. |
| dmca_counter_notice | TSE-06C-04 | Disclosure acknowledgements, signed statements, delivery and restoration clock. | Parent IA line 195; parent line 90; deep dive lines 52 and 136-137. |
| repeat_infringer_entry | TSE-06C-01 | Deduplicated claimant/asset/infringement-event strike ledger. | Parent IA line 195; deep dive lines 133-137. |
| legal_request | TSE-06C-06 | Verified instrument, jurisdiction, scope, prohibition and counsel review state. | Parent IA line 197; deep dive line 53. |
| disclosure_decision | TSE-06C-06 | Minimization, approval, notification, expiring release and prohibition result. | Parent IA line 197; deep dive lines 142-145. |
| safety_risk_assessment | TSE-06C-07 | Domain/release harms, controls, gaps, evidence, approval and disposition. | Parent IA line 201; parent line 96. |
| trusted_flagger_grant | TSE-06C-08 | Verified authority, scope, SLA, accuracy policy, state, expiry and appeal. | Parent IA line 203; parent lines 169 and 179. |
| flagger_accuracy_entry | TSE-06C-08 | Append-only per-item result that drives throttle or suspension decisions. | Parent IA line 203; parent lines 97 and 169. |
| authenticity_claim | TSE-06C-09 | Claim path, exhaustion, registry chain, reconciled seller reason and outcome. | Parent IA line 207; parent lines 174 and 101. |
| leak_forensic_finding | TSE-06C-10 | Release state, watermark recipient, access trace, match and attribution state. | Parent IA line 208; parent lines 175 and 102. |
| meetup_safety_record | TSE-06C-11 | Arrangement-time controls, check-in/out, trusted contact and immutable state. | Parent IA line 209; parent lines 176 and 103. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| safety.dispute.changed.v1 | TSE-06C-02 and TSE-06C-03 | Transaction/case state, remedy, deadline and version projection. | Parent IA line 313. |
| safety.dmca.changed.v1 | TSE-06C-01 and TSE-06C-04 | Notice/asset state, strike and restoration deadlines. | Parent IA line 314. |
| safety.legal-disclosure.decided.v1 | TSE-06C-06 | Request decision, prohibition and release hash. | Parent IA line 316. |
| safety.risk-assessment.decided.v1 | TSE-06C-07 | Domain/release disposition, gap and control hashes. | Parent IA line 317. |
| safety.flagger.status-changed.v1 | TSE-06C-08 | Grant state, scope, SLA and reason version. | Parent IA lines 318-319. |
| safety.authenticity.decided.v1 | TSE-06C-09 | Listing claim path, outcome and seller reason code. | Parent IA line 323. |
| safety.leak.finding.v1 | TSE-06C-10 | Asset attribution state and finding hash. | Parent IA line 324. |
| safety.meetup.record-changed.v1 | TSE-06C-11 | Arrangement controls, check-out state and version. | Parent IA line 325. |

Every event is an allowlisted opaque-ID projection. Events exclude narratives, raw evidence, legal documents, reporter or claimant protected identity, private messages, protected traits and unrestricted PII. Consumers refetch authorized projections at the event version.

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 24.04.01 | Claims & Dispute Filing | TSE-06C-02 | Transaction claimant role, mandate, filing window, sealed manifest and frozen deadline. |
| 24.04.02 | Mediation & Resolution Center | TSE-06C-03 | Exact signed settlement or independent adjudication with per-item remedy and chargeback reconciliation. |
| 24.04.03 | Buyer & Seller Protection Programs | TSE-06C-02 and TSE-06C-03 | Remedy-policy version, protection eligibility and no settlement-created payout promise. |
| 24.04.04 | Chargeback Management & Representment | TSE-06C-02 and TSE-06C-03 | External chargeback reconciles to one canonical dispute and immutable evidence manifest. |
| 24.05.01 | DMCA Notice, Counter-Notice & Repeat Infringer Policy | TSE-06C-01 and TSE-06C-04 | 512 notice/counter validation, strike-unit dedupe, delivery evidence and restoration clock. |
| 24.05.03 | Authenticity, Counterfeit & Brand/IP Protection | TSE-06C-09 | Registry chain, exhaustion check, claim-path reconciliation and one seller reason. |
| 24.05.04 | Pre-Release Leak Detection & Response | TSE-06C-10 | Watermark and access trace finding, release-state interpretation and no-hosting rule. |
| 24.06.02 | Meetup Safety & Safe Exchange | TSE-06C-11 | Arrangement deny-first restriction check and optional safety control record. |
| 24.07.01 | Impersonation & Fake Profile Enforcement | TSE-06C-05 | Scoped identity case references Shard 01 authority and preserves ownership records. |
| 24.07.02 | Entity Ownership & Account Recovery Disputes | TSE-06C-05 | Exact party, alias, membership and mandate snapshot; unresolved authority blocks outcome. |
| 24.07.03 | Deceased & Incapacitated Account Succession | TSE-06C-05 | Succession evidence is read from Shard 01; access result cannot rewrite ownership. |
| 24.08.01 | CSAM Detection, Preservation & Mandatory Reporting | TSE-06C-06 and TSE-06C-07 | Counsel-gated legal intake, preservation and launch-risk controls; no unapproved automation. |
| 24.08.03 | Law Enforcement & Legal Process Portal | TSE-06C-06 | Documented intake only, verification, scope minimization, notification and expiring transfer. |
| 24.08.04 | Safety Governance & Illegal-Harms Risk Assessment | TSE-06C-07 | Pre-launch harms, controls, gaps, evidence and explicit disposition gate. |
| 24.01.04 | Trusted Flagger & Rights-Holder Priority Channel | TSE-06C-08 | Verified controller grant, public scope, shortened SLA, per-item accuracy and appealable suspension. |

Source trace: feature-ledger.md lines 471-490 contain 24.04.01 through 24.08.03 and the 24.05.01 row; lines 684-691 contain 24.01.04, 24.07.03 and 24.08.04; line 203 contains 24.05.01. The exact feature names above are copied from the ledger, not inferred from route names.

## Endpoint Completeness Reconciliation

All eleven owned IA interactions have exactly one operation ID, request schema, success schema, error matrix row, authorization row, idempotency/rate row, observability row and operation-specific test row. TSE-06C-01 and TSE-06C-04 are separate because notice validation and counter-notice restoration have different actors, disclosure consequences and clocks. TSE-06C-02 and TSE-06C-03 are separate because filing freezes evidence while settlement/adjudication consumes the frozen record. TSE-06C-05 never calls an ownership mutation endpoint. TSE-06C-06 never releases on an unknown counsel or provider result. TSE-06C-08 never accepts private-message targets. TSE-06C-09, TSE-06C-10 and TSE-06C-11 do not duplicate 06a intake/evidence or 06b enforcement routes; they produce their own typed case/evidence references and call those owners through expected-version adapters.

No route from BE00, 06a or 06b is redefined. This companion calls:

- BE00 authenticated request envelope, CSRF, idempotency and transactional outbox; every success/error path uses the inherited `ApiError { code, message, requestId, details }` shape for errors.
- 06a case, party, target, evidence and hold commands through opaque IDs and expected versions.
- 06b policy, Statement of Reasons, appeal and enforcement commands where a downstream action is required.
- Shard 01 actor, party, mandate, ownership and succession snapshots.
- Shard 05 capability, launch-gate, counsel-gate, retention and configuration projections.

## Shared Contract Inheritance

The following BE00 contracts are inherited explicitly and are not redefined as routes or tables:

- Request envelope: requestId, authenticated session or service principal, acting context, trace context, locale and schema version.
- Success envelope: data, requestId and schemaVersion.
- Error envelope: ApiError { code, message, requestId, details }. Every route returns this exact shape for 4xx and 5xx responses; details are allowlisted and never carry protected identity, legal documents or raw evidence.
- Idempotency: Idempotency-Key is required on every command; the key is bound to actor, route, normalized request hash and schema version. A matching replay returns the original response; a differing hash returns IDEMPOTENCY_MISMATCH with no mutation.
- Versioning: commands carry expectedVersion where a canonical aggregate exists; compare-and-set loses return VERSION_CONFLICT without a second effect.
- Outbox: canonical transaction writes and typed event enqueue commit together; worker retries are bounded and idempotent.
- Security: Hono middleware validates origin, CSRF and content type before Zod parsing; Supabase PostgreSQL RLS and least-privilege grants protect persistence.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| TSE-06C-01 | TSE-02 Submit legal/DMCA notice | POST /api/v1/safety/legal/notices | Identified claimant with verified claimant capability; asset/case scope | Tse06c01LegalNoticeRequest | Tse06c01LegalNoticeResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 10/min per claimant and 30/min per verified organisation | CORS first-party consumer and rights-holder allowlist with credentials; BE00 session/context, CSRF, strict Zod, claimant scope, rate, outbox and ApiError normalization |
| TSE-06C-02 | TSE-10 Open transaction dispute | POST /api/v1/safety/disputes | Claimant or counterparty mandate for the owning transaction | Tse06c02DisputeRequest | Tse06c02DisputeResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 10/hour per transaction party and 60/hour per account | CORS first-party consumer allowlist with credentials; BE00 session/context, CSRF, strict Zod, mandate, rate, commerce adapter, outbox and ApiError normalization |
| TSE-06C-03 | TSE-11 Mediate or adjudicate | POST /api/v1/safety/disputes/{caseId}/resolution | Binding party mandates for settlement or independent adjudicator capability | Tse06c03ResolutionRequest | Tse06c03ResolutionResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/hour per case party and 30/hour per adjudicator | CORS first-party consumer and staff allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, conflict check, rate, outbox and ApiError normalization |
| TSE-06C-04 | TSE-12 Process DMCA counter-notice | POST /api/v1/safety/legal/notices/{noticeId}/counter-notice | Affected identified subject with the notice disclosure presentation completed | Tse06c04CounterNoticeRequest | Tse06c04CounterNoticeResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 5/day per affected subject and 20/hour per notice delivery worker | CORS first-party consumer allowlist with credentials; BE00 session/context, CSRF, strict Zod, disclosure acknowledgement, rate, delivery adapter, outbox and ApiError normalization |
| TSE-06C-05 | TSE-13 Resolve identity/ownership case | POST /api/v1/safety/ownership-cases/actions | Scoped identity reviewer with case capability; Shard 01 remains owner of truth | Tse06c05OwnershipRequest | Tse06c05OwnershipResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/hour per case and 40/hour per reviewer | CORS first-party staff allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, step-up, rate, Shard 01 adapter, outbox and ApiError normalization |
| TSE-06C-06 | TSE-15 Receive legal process | POST /api/v1/safety/legal/process | Verified legal-intake service; counsel-authorized capability and step-up required for disclosure | Tse06c06LegalProcessRequest | Tse06c06LegalProcessResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 30/hour per verified agency and 120/hour intake service | CORS non-browser legal-service allowlist; BE00 request-id/principal, strict Zod, counsel gate, step-up, rate, minimization, outbox and ApiError normalization |
| TSE-06C-07 | TSE-18 Assess domain-launch risk | POST /api/v1/safety/governance/risk-assessments | Domain owner with Shard 05 launch-gate capability; approver conflict-free | Tse06c07RiskAssessmentRequest | Tse06c07RiskAssessmentResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 10/day per domain owner and 30/day per governance lane | CORS first-party staff allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, conflict check, rate, Shard 05 adapter, outbox and ApiError normalization |
| TSE-06C-08 | TSE-19 Submit trusted-flagger notice | POST /api/v1/safety/trusted-flagger/notices | Active trusted flagger grant for each public target; no private-message scope | Tse06c08TrustedFlaggerRequest | Tse06c08TrustedFlaggerResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 429 | Per-item Idempotency-Key required; 600/min per grant, 10,000/hour per verified organisation, weighted-fair lane | CORS rights-holder server allowlist with credentials; BE00 principal, strict Zod, grant scope, per-item rate, queue, accuracy ledger and ApiError normalization |
| TSE-06C-09 | TSE-23 Review authenticity or counterfeit claim | POST /api/v1/safety/authenticity/actions | Buyer, verified brand representative or platform authenticity reviewer for listing scope | Tse06c09AuthenticityRequest | Tse06c09AuthenticityResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/hour per listing and 100/hour per review lane | CORS first-party consumer, brand and staff allowlist with credentials; BE00 session/context, CSRF, strict Zod, claim-path scope, rate, registry adapter and ApiError normalization |
| TSE-06C-10 | TSE-24 Respond to pre-release leak | POST /api/v1/safety/leak-forensics | Rights-holder or leak-forensics service for referenced asset; no leaked-copy upload | Tse06c10LeakRequest | Tse06c10LeakResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/hour per asset and 200/hour forensic worker | CORS non-browser rights-holder and forensic allowlist; BE00 principal, strict Zod, reference-only validation, rate, forensic adapter, outbox and ApiError normalization |
| TSE-06C-11 | TSE-25 Attach meetup safety layer | POST /api/v1/safety/meetup-safety | Arrangement parties with current acting contexts; both restriction edges checked | Tse06c11MeetupRequest | Tse06c11MeetupResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 10/hour per arrangement and 40/hour per party | CORS first-party consumer allowlist with credentials; BE00 session/context, CSRF, strict Zod, participant scope, deny-first restriction check, rate and ApiError normalization |

### Registry invariants

- Every operation returns the exact BE00 ApiError { code, message, requestId, details } shape on every refusal, including adapter timeout, provider ambiguity and RLS denial.
- 403 means the request target is visible or the actor is authenticated but lacks the stated claimant, party, reviewer, grant, counsel, owner or arrangement authority. 404 means the target is hidden by purpose-bound RLS, the opaque reference does not resolve in the caller's permitted projection, or a deliberately non-enumerable target is absent. The API never converts a visible authority denial into a target-existence oracle.
- 409 is reserved for idempotency-hash mismatch, expected-version loss, duplicate terminal transition or competing canonical case. 422 is invalid legal, mandate, policy, evidence, restriction or mechanism input after authentication. 503 is used only when a required external decision is unavailable and the command remains pending or gated.
- TSE-06C-01, TSE-06C-02, TSE-06C-04, TSE-06C-05, TSE-06C-07, TSE-06C-09 and TSE-06C-11 use a database transaction with outbox enqueue. TSE-06C-06, TSE-06C-08 and TSE-06C-10 return accepted only after durable command state and retry metadata exist.
- No command accepts a raw legal document, leaked copy, private message or unrestricted PII in an event payload. Such content is stored only in the protected evidence or legal vault through its own capability and retention policy.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| TSE-06C-01 | LegalNoticeRequest to LegalNoticeResponse with notice, case, completeness, availability state, strike-unit state and delivery state. | INVALID_REQUEST 400 for schema or missing attestation; UNAUTHENTICATED 401; FORBIDDEN 403 for non-identified or out-of-scope claimant; NOTICE_NOT_FOUND 404 for hidden asset projection; IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409; POLICY_VERSION_INVALID or NOTICE_INCOMPLETE 422. |
| TSE-06C-02 | DisputeRequest to DisputeResponse with case, transaction version, frozen remedy, evidence hash, deadline and state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for missing claimant role or lapsed mandate; TRANSACTION_NOT_FOUND 404 for hidden transaction; VERSION_CONFLICT or duplicate canonical dispute 409; FILING_WINDOW_CLOSED, POLICY_VERSION_INVALID or EVIDENCE_MANIFEST_MISSING 422. |
| TSE-06C-03 | ResolutionRequest to ResolutionResponse with proposal, settlement or adjudication state, evidence weights and per-item remedies. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-binding party, conflicted actor or absent adjudicator capability; CASE_NOT_FOUND 404 for hidden case; VERSION_CONFLICT 409; MANDATE_REQUIRED, SIGNATURE_REQUIRED or EVIDENCE_RULE_INVALID 422. |
| TSE-06C-04 | CounterNoticeRequest to CounterNoticeResponse with disclosure acknowledgement, delivery receipt and restoration due state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-affected subject or missing presentation acknowledgement; NOTICE_NOT_FOUND 404 for hidden notice; VERSION_CONFLICT 409; STATEMENTS_INCOMPLETE or DISCLOSURE_ACK_REQUIRED 422. |
| TSE-06C-05 | OwnershipRequest to OwnershipResponse with Shard 01 snapshot version, scoped access result and preserved-ownership marker. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unauthorized reviewer or requested ownership/credit mutation; CASE_NOT_FOUND 404 for hidden case; VERSION_CONFLICT 409; ACTING_CONTEXT_STALE or OWNERSHIP_MUTATION_FORBIDDEN 422. |
| TSE-06C-06 | LegalProcessRequest to LegalProcessResponse with verification state, narrowed scope, counsel state, release state and expiry. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unverified requester or absent counsel capability; REQUEST_NOT_FOUND 404 for hidden request; VERSION_CONFLICT 409; COUNSEL_GATE_DISABLED, STEP_UP_REQUIRED, DISCLOSURE_PROHIBITED or SCOPE_TOO_BROAD 422; PROVIDER_UNAVAILABLE 503 leaves release pending. |
| TSE-06C-07 | RiskAssessmentRequest to RiskAssessmentResponse with domain/release, evidence/control hashes, disposition and gate state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-owner or conflicted approver; DOMAIN_NOT_FOUND 404 for hidden pending release; VERSION_CONFLICT 409; ASSESSMENT_INCOMPLETE or COUNSEL_GATE_DISABLED 422. |
| TSE-06C-08 | TrustedFlaggerRequest to TrustedFlaggerResponse with per-item case results, grant version, SLA and accuracy-entry states. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for out-of-scope, private-message or inactive-grant item; GRANT_NOT_FOUND 404 when the grant projection is hidden; IDEMPOTENCY_MISMATCH 409; ITEM_KEY_REQUIRED or GRANT_NOT_ACTIVE 422; LANE_THROTTLED 429. |
| TSE-06C-09 | AuthenticityRequest to AuthenticityResponse with claim path, exhaustion result, registry-chain state, reconciled reason and outcome. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unsupported claimant path; LISTING_NOT_FOUND 404 for hidden listing; VERSION_CONFLICT 409; REGISTRY_UNRESOLVED or TRADEMARK_EXHAUSTED 422 with no seller action. |
| TSE-06C-10 | LeakRequest to LeakResponse with reference match, release state, watermark identity, access-trace state and attribution result. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for asset-unscoped actor or leaked-copy upload; ASSET_NOT_FOUND 404 for hidden asset; VERSION_CONFLICT 409; NO_ATTRIBUTION or COPY_UNMATCHABLE 422 as a recorded finding, never a guessed identity. |
| TSE-06C-11 | MeetupRequest to MeetupResponse with arrangement, offered controls, restriction snapshot, check-in/out state and incident reference. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 when either party has an active restriction edge or lacks arrangement authority; ARRANGEMENT_NOT_FOUND 404 for hidden arrangement; VERSION_CONFLICT 409 on concurrent check-out or timer terminalization. |

## Request/Response Contracts (Zod 4 schemas)

All schemas are Zod 4 strict objects. Unknown keys are rejected. UUIDs are canonical UUID strings, dates are ISO 8601 datetime strings, hashes are lower-case hexadecimal strings, and all response identifiers are opaque UUIDs unless explicitly named as a provider reference. The success envelope is inherited from BE00; the data schemas below are its data member.

~~~ts
import { z } from "zod";

export const ApiError = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), z.json()),
});

const Id = z.uuid();
const Version = z.number().int().nonnegative();
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const DateTime = z.iso.datetime({ offset: true });
const IdempotencyKey = z.string().min(16).max(128);

export const Tse06c01LegalNoticeRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  regime: z.enum(["us_512", "eu_dsa", "other"]),
  claimantIdentityRef: Id,
  assetId: Id,
  infringementEventId: Id,
  policyVersion: z.string().min(1).max(80),
  attestations: z.array(z.enum(["ownership_or_authority", "good_faith", "accuracy", "jurisdiction"])).min(4),
  narrative: z.string().min(1).max(4000),
  deliveryChannel: z.enum(["verified_email", "portal", "api"]),
  sourceEvidenceRefs: z.array(Id).min(1).max(50),
});
export const Tse06c01LegalNoticeResponse = z.strictObject({
  noticeId: Id,
  caseId: Id,
  noticeState: z.enum(["draft", "validated", "availability_actioned", "delivery_pending", "delivered", "rejected"]),
  complete: z.boolean(),
  strikeUnitHash: Hash,
  strikeState: z.enum(["not_counted", "counted", "duplicate"]),
  availabilityState: z.enum(["unchanged", "pending", "restricted"]),
  deliveryState: z.enum(["not_required", "pending", "delivered", "failed"]),
  version: Version,
});

export const Tse06c02DisputeRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  transactionType: z.enum(["order", "booking", "ticket", "digital_delivery", "royalty_statement"]),
  transactionId: Id,
  transactionVersion: Version,
  claimantPartyRef: Id,
  claimantMandateVersion: Version,
  remedyPolicyVersion: z.string().min(1).max(80),
  requestedRemedies: z.array(z.enum(["refund", "repair", "replacement", "delivery", "hold_release", "statement_correction"])).min(1).max(8),
  evidenceManifestHash: Hash,
  filingDeadline: DateTime,
});
export const Tse06c02DisputeResponse = z.strictObject({
  caseId: Id,
  disputeId: Id,
  transactionVersion: Version,
  evidenceManifestHash: Hash,
  remedyPolicyVersion: z.string().min(1).max(80),
  deadline: DateTime,
  state: z.enum(["open", "response_pending", "mediation", "adjudicating", "resolved", "closed"]),
  version: Version,
});

export const Tse06c03ResolutionRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  caseId: Id,
  mode: z.enum(["settlement", "adjudication"]),
  terms: z.record(z.string(), z.json()),
  bindingPartyRefs: z.array(Id).min(1).max(20),
  signatures: z.array(z.strictObject({ partyRef: Id, signatureRef: Id, signedAt: DateTime })).min(1).max(20),
  evidenceWeights: z.array(z.strictObject({ evidenceRef: Id, weight: z.number().finite().min(0).max(1), reasonCode: z.string().min(1).max(80) })).min(1).max(100),
  perItemRemedies: z.array(z.strictObject({ itemRef: Id, outcome: z.enum(["grant", "deny", "partial", "hold"]), reasonCode: z.string().min(1).max(80) })).min(1).max(100),
  adjudicatorPartyRef: Id.optional(),
});
export const Tse06c03ResolutionResponse = z.strictObject({
  proposalId: Id,
  caseId: Id,
  state: z.enum(["proposed", "accepted", "adjudicating", "resolved", "rejected"]),
  settlementHash: Hash.optional(),
  evidenceWeightsHash: Hash,
  perItemResults: z.array(z.strictObject({ itemRef: Id, outcome: z.enum(["grant", "deny", "partial", "hold"]), compensationState: z.enum(["none", "pending", "applied", "failed"]) })),
  version: Version,
});

export const Tse06c04CounterNoticeRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  noticeId: Id,
  affectedSubjectRef: Id,
  addressDisclosureAcknowledged: z.literal(true),
  jurisdictionDisclosureAcknowledged: z.literal(true),
  statements: z.strictObject({
    goodFaith: z.literal(true),
    consentToJurisdiction: z.literal(true),
    signatureRef: Id,
  }),
  deliveryAddressRef: Id,
});
export const Tse06c04CounterNoticeResponse = z.strictObject({
  counterNoticeId: Id,
  noticeId: Id,
  state: z.enum(["validated", "delivery_pending", "delivered", "restoration_pending", "restored", "rejected"]),
  restorationDueAt: DateTime.optional(),
  deliveryReceiptRef: Id.optional(),
  version: Version,
});

export const Tse06c05OwnershipRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  caseId: Id,
  caseKind: z.enum(["impersonation", "ownership", "succession"]),
  subjectPartyRef: Id,
  shard01SnapshotVersion: Version,
  requestedAccessOutcome: z.enum(["restore_access", "limit_access", "revoke_access", "route_to_recovery"]),
  privilegeScope: z.array(z.enum(["login", "profile", "messaging", "listing", "admin_delegate"])).min(1).max(5),
  evidenceRefs: z.array(Id).min(1).max(50),
});
export const Tse06c05OwnershipResponse = z.strictObject({
  caseId: Id,
  snapshotVersion: Version,
  accessOutcome: z.enum(["restored", "limited", "revoked", "recovery_required"]),
  privilegeScope: z.array(z.string().min(1)),
  ownershipPreserved: z.literal(true),
  creditsPreserved: z.literal(true),
  version: Version,
});

export const Tse06c06LegalProcessRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  requesterIdentityRef: Id,
  agency: z.string().min(1).max(200),
  instrumentType: z.enum(["subpoena", "court_order", "warrant", "regulatory_request", "preservation_request"]),
  instrumentRef: Id,
  jurisdiction: z.string().min(2).max(100),
  requestedScope: z.array(z.strictObject({ objectRef: Id, fieldAllowlist: z.array(z.string().min(1)).min(1), dateFrom: DateTime.optional(), dateTo: DateTime.optional() })).min(1).max(100),
  emergencyClaim: z.boolean(),
  nondisclosureProhibition: z.boolean(),
  verificationEvidenceRefs: z.array(Id).min(1).max(20),
  counselGateRef: Id.optional(),
  stepUpProofRef: Id.optional(),
});
export const Tse06c06LegalProcessResponse = z.strictObject({
  requestId: Id,
  verificationState: z.enum(["received", "verified", "rejected", "needs_more_proof"]),
  scopeState: z.enum(["requested", "narrowed", "refused", "approved"]),
  counselState: z.enum(["not_required", "pending", "approved", "disabled"]),
  disclosureState: z.enum(["none", "pending", "released", "blocked"]),
  notificationState: z.enum(["pending", "notified", "prohibited"]),
  transferExpiresAt: DateTime.optional(),
  version: Version,
});

export const Tse06c07RiskAssessmentRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  domainKey: z.string().min(1).max(120),
  releaseKey: z.string().min(1).max(120),
  ownerPartyRef: Id,
  harms: z.array(z.string().min(1).max(120)).min(1).max(100),
  controls: z.array(z.string().min(1).max(120)).min(1).max(100),
  gaps: z.array(z.string().min(1).max(120)),
  evidenceManifestHash: Hash,
  disposition: z.enum(["enable", "enable_with_controls", "hold", "reject"]),
  approverPartyRef: Id,
  policyVersion: z.string().min(1).max(80),
});
export const Tse06c07RiskAssessmentResponse = z.strictObject({
  assessmentId: Id,
  domainKey: z.string().min(1),
  releaseKey: z.string().min(1),
  disposition: z.enum(["enable", "enable_with_controls", "hold", "reject"]),
  gateState: z.enum(["gated", "eligible", "enabled"]),
  evidenceManifestHash: Hash,
  supersedesAssessmentId: Id.optional(),
  version: Version,
});

export const Tse06c08TrustedFlaggerRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  grantId: Id,
  grantVersion: Version,
  controllerPartyRef: Id,
  items: z.array(z.strictObject({
    itemId: Id,
    itemKind: z.enum(["public_profile", "public_listing", "public_release", "public_review"]),
    itemIdempotencyKey: IdempotencyKey,
    reasonCode: z.string().min(1).max(80),
    evidenceRefs: z.array(Id).max(20),
  })).min(1).max(500),
});
export const Tse06c08TrustedFlaggerResponse = z.strictObject({
  grantId: Id,
  grantVersion: Version,
  results: z.array(z.strictObject({
    itemId: Id,
    caseId: Id.optional(),
    state: z.enum(["accepted", "duplicate", "rejected", "queued"]),
    reasonCode: z.string().min(1).max(80),
    slaDueAt: DateTime.optional(),
    accuracyEntryId: Id.optional(),
  })),
  version: Version,
});

export const Tse06c09AuthenticityRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  listingId: Id,
  itemId: Id,
  claimPath: z.enum(["buyer_post_purchase", "brand_notice", "listing_time_detection"]),
  claimantRef: Id,
  evidenceManifestHash: Hash,
  registryChainVersion: Version,
  trademarkExhaustionCheck: z.enum(["not_required", "pending", "not_exhausted", "exhausted"]),
  sellerResponseRef: Id.optional(),
});
export const Tse06c09AuthenticityResponse = z.strictObject({
  claimId: Id,
  listingId: Id,
  claimPath: z.enum(["buyer_post_purchase", "brand_notice", "listing_time_detection"]),
  registryState: z.enum(["verified", "unresolved", "contradicted"]),
  exhaustionState: z.enum(["not_required", "not_exhausted", "exhausted"]),
  outcome: z.enum(["proven", "unproven", "dispute_remedy", "no_action"]),
  sellerReasonCode: z.string().min(1).max(80),
  version: Version,
});

export const Tse06c10LeakRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  assetId: Id,
  referenceAssetHash: Hash,
  candidateCopyHash: Hash,
  releaseStateAtMatch: z.enum(["unreleased", "released", "unknown"]),
  watermarkEvidenceRef: Id.optional(),
  accessTraceVersion: Version,
  rightsHolderRef: Id,
});
export const Tse06c10LeakResponse = z.strictObject({
  findingId: Id,
  assetId: Id,
  matchState: z.enum(["matched", "unmatched", "degraded"]),
  releaseStateAtMatch: z.enum(["unreleased", "released", "unknown"]),
  watermarkState: z.enum(["identified", "absent", "unreadable"]),
  accessTraceState: z.enum(["complete", "incomplete", "unavailable"]),
  attribution: z.enum(["attributed", "no_attribution", "pending"]),
  findingHash: Hash,
  version: Version,
});

export const Tse06c11MeetupRequest = z.strictObject({
  idempotencyKey: IdempotencyKey,
  expectedVersion: Version,
  arrangementId: Id,
  organizerPartyRef: Id,
  counterpartyPartyRef: Id,
  restrictionSnapshotVersion: Version,
  offeredControls: z.array(z.enum(["public_location", "check_in_timer", "check_out_timer", "trusted_contact_share"])).min(1).max(4),
  selectedControls: z.array(z.enum(["public_location", "check_in_timer", "check_out_timer", "trusted_contact_share"])),
  locationRef: Id.optional(),
  checkOutDueAt: DateTime.optional(),
  trustedContactRef: Id.optional(),
});
export const Tse06c11MeetupResponse = z.strictObject({
  recordId: Id,
  arrangementId: Id,
  restrictionState: z.enum(["clear", "denied"]),
  offeredControls: z.array(z.string().min(1)),
  selectedControls: z.array(z.string().min(1)),
  state: z.enum(["arranged", "active", "checked_out", "missed_check_out", "incident_referred"]),
  incidentCaseId: Id.optional(),
  version: Version,
});
~~~

Request validation order is: envelope and content type, origin and CSRF, authentication, purpose-bound capability, target visibility, idempotency hash, Zod strict parse, expected-version and policy checks, transaction or durable command, outbox. A provider response never widens a schema or authority decision.

## Database Schema

The thirteen tables below are the complete persistence set for this companion. safety_case, case_party, case_target, evidence_bundle, evidence_entry, legal_hold and policy tables are owned by 06a or 06b and referenced only; they are not redefined here. All tables use Supabase PostgreSQL with RLS enabled, service-role writes through typed functions, and no direct client grant.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| transaction_dispute | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; transaction_type text NOT NULL CHECK; transaction_id uuid NOT NULL; transaction_version bigint NOT NULL CHECK transaction_version >= 0; claimant_party_ref uuid NOT NULL; counterparty_party_ref uuid NOT NULL; claimant_mandate_version bigint NOT NULL CHECK >= 0; remedy_policy_version text NOT NULL; evidence_manifest_hash char(64) NOT NULL; filing_deadline timestamptz NOT NULL; state text NOT NULL CHECK open/response_pending/mediation/adjudicating/resolved/closed; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at and updated_at timestamptz NOT NULL. | FK case_id to safety_case.id; case and transaction refs to producer shards are opaque cross-schema refs because those shards own their tables. Index case_id, transaction_type plus transaction_id plus transaction_version, state plus filing_deadline; unique active transaction dispute by transaction type and transaction id. | RLS permits claimant/counterparty projected rows and assigned adjudicator rows only; staff grant safety_dispute_read is purpose-bound; client has no table grant; svc_safety_dispute owns typed function. |
| resolution_proposal | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; proposer_party_ref uuid NOT NULL; terms jsonb NOT NULL CHECK jsonb_typeof(terms) = object; monetary_amount numeric(20,6) NULL CHECK >= 0; expires_at timestamptz NULL; accepted_by jsonb NOT NULL DEFAULT [] CHECK jsonb_typeof(accepted_by) = array; state text NOT NULL CHECK proposed/accepted/adjudicating/resolved/rejected; content_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | FK case_id to safety_case.id; party refs resolve through Shard 01 adapter with no local ownership FK. Index case_id plus state, expires_at where state = proposed, content_hash; unique case_id plus content_hash. | RLS exposes terms only to binding parties and assigned adjudicator; monetary fields require remedy capability; client has no table grant; svc_safety_dispute writes. |
| dmca_notice | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; regime text NOT NULL CHECK us_512/eu_dsa/other; claimant_identity_ref uuid NOT NULL; asset_id uuid NOT NULL; infringement_event_id uuid NOT NULL; attestations jsonb NOT NULL CHECK jsonb_typeof(attestations) = object; completeness boolean NOT NULL DEFAULT false; policy_version text NOT NULL; delivery_state text NOT NULL CHECK not_required/pending/delivered/failed; removal_at timestamptz NULL; notice_hash char(64) NOT NULL; state text NOT NULL CHECK draft/validated/availability_actioned/delivery_pending/delivered/rejected; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | FK case_id to safety_case.id; asset and event refs are source-domain opaque refs; unique claimant_identity_ref plus asset_id plus infringement_event_id; indexes case_id, asset_id plus state, notice_hash. | RLS reveals a notice to its identified claimant, affected subject and authorized legal reviewer only; protected identity projection is separate; client has no table grant; svc_safety_legal writes. |
| dmca_counter_notice | id uuid NOT NULL PRIMARY KEY; notice_id uuid NOT NULL; affected_subject_ref uuid NOT NULL; address_disclosed boolean NOT NULL; jurisdiction_disclosed boolean NOT NULL; statements jsonb NOT NULL CHECK jsonb_typeof(statements) = object; delivery_address_ref uuid NOT NULL; delivered_at timestamptz NULL; restoration_due_at timestamptz NULL; delivery_state text NOT NULL CHECK pending/delivered/failed; state text NOT NULL CHECK validated/delivery_pending/delivered/restoration_pending/restored/rejected; content_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | FK notice_id to dmca_notice.id; address ref is protected vault ref, not a public field. Index notice_id plus state, affected_subject_ref, restoration_due_at; unique notice_id plus content_hash. | RLS shows statements and address receipt only to affected subject, authorized legal reviewer and purpose-bound delivery worker; client receives disclosure status only; svc_safety_legal writes. |
| repeat_infringer_entry | id uuid NOT NULL PRIMARY KEY; claimant_identity_ref uuid NOT NULL; asset_id uuid NOT NULL; infringement_event_id uuid NOT NULL; notice_id uuid NOT NULL; strike_count smallint NOT NULL CHECK strike_count > 0; state text NOT NULL CHECK counted/voided/under_review; counted_at timestamptz NOT NULL; dedupe_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | FK notice_id to dmca_notice.id; source refs are opaque. Unique claimant_identity_ref plus asset_id plus infringement_event_id; indexes claimant_identity_ref plus state, asset_id, counted_at, dedupe_hash. | RLS hides the ledger from claimant and subject projections; counsel and authorized compliance reviewer see minimum strike metadata; svc_safety_legal owns writes; no client grant. |
| legal_request | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; requester_identity_ref uuid NOT NULL; agency text NOT NULL; instrument_type text NOT NULL CHECK subpoena/court_order/warrant/regulatory_request/preservation_request; instrument_ref uuid NOT NULL; jurisdiction text NOT NULL; requested_scope jsonb NOT NULL CHECK jsonb_typeof(requested_scope) = array; emergency_claim boolean NOT NULL DEFAULT false; nondisclosure_prohibition boolean NOT NULL DEFAULT false; verification_state text NOT NULL CHECK received/verified/rejected/needs_more_proof; counsel_gate_ref uuid NULL; received_at timestamptz NOT NULL; review_due_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | FK case_id to safety_case.id; instrument ref resolves to protected legal vault; counsel_gate_ref references Shard 05 capability projection without a local FK. Index instrument_ref, requester_identity_ref plus received_at, verification_state plus review_due_at, case_id. | RLS permits legal intake worker, counsel-authorized reviewer and notification worker to see purpose-limited fields; requester sees receipt state only; svc_safety_legal writes; no client table grant. |
| disclosure_decision | id uuid NOT NULL PRIMARY KEY; request_id uuid NOT NULL; decision_state text NOT NULL CHECK pending/approved/rejected/blocked/expired; approved_by uuid NULL; step_up_ref uuid NULL; minimization_manifest jsonb NOT NULL CHECK jsonb_typeof(minimization_manifest) = array; release_manifest jsonb NULL CHECK release_manifest IS NULL OR jsonb_typeof(release_manifest) = array; notification_state text NOT NULL CHECK pending/notified/prohibited; prohibition boolean NOT NULL; reason_code text NOT NULL; expires_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; decided_at timestamptz NULL. | FK request_id to legal_request.id; approved_by and step_up refs resolve through Shard 01/00 purpose services. Index request_id plus version, decision_state plus expires_at, notification_state; unique request_id plus version. | RLS permits counsel reviewer and permitted notification worker; release manifest never appears in requester projection; svc_safety_legal owns writes; no client grant. |
| safety_risk_assessment | id uuid NOT NULL PRIMARY KEY; domain_key text NOT NULL; release_key text NOT NULL; owner_party_ref uuid NOT NULL; harms jsonb NOT NULL CHECK jsonb_typeof(harms) = array AND jsonb_array_length(harms) > 0; controls jsonb NOT NULL CHECK jsonb_typeof(controls) = array AND jsonb_array_length(controls) > 0; gaps jsonb NOT NULL CHECK jsonb_typeof(gaps) = array; evidence_manifest_hash char(64) NOT NULL; disposition text NOT NULL CHECK enable/enable_with_controls/hold/reject; approver_party_ref uuid NOT NULL; policy_version text NOT NULL; state text NOT NULL CHECK submitted/approved/rejected/superseded; supersedes_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | FK supersedes_id to safety_risk_assessment.id; domain/release are Shard 05 gate keys and have no local FK. Index domain_key plus release_key plus state, approver_party_ref, disposition; unique active domain_key plus release_key. | RLS exposes an assessment to owner and authorized governance staff; gaps and evidence hashes are not public; svc_safety_governance writes; Shard 05 gate service reads a typed view. |
| trusted_flagger_grant | id uuid NOT NULL PRIMARY KEY; controller_party_ref uuid NOT NULL; controller_type text NOT NULL CHECK individual/organisation; authority_evidence_refs jsonb NOT NULL CHECK jsonb_typeof(authority_evidence_refs) = array; asset_scope jsonb NOT NULL CHECK jsonb_typeof(asset_scope) = object; rights_scope jsonb NOT NULL CHECK jsonb_typeof(rights_scope) = object; territory_scope jsonb NOT NULL CHECK jsonb_typeof(territory_scope) = object; grantor_ref uuid NOT NULL; sla_policy_version text NOT NULL; accuracy_policy_version text NOT NULL; probation_started_at timestamptz NOT NULL; review_due_at timestamptz NOT NULL; expires_at timestamptz NULL; state text NOT NULL CHECK probationary/active/throttled/suspended/revoked/expired; reason_code text NOT NULL; appeal_ref uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | Party and authority refs resolve through Shard 01 purpose-bound snapshots; appeal_ref references 06b appeal projection without a local FK. Index controller_party_ref plus state, expires_at, review_due_at, asset_scope using GIN; unique active grant per controller and scope hash. | RLS exposes grant status and permitted scope to the controller; authority evidence is restricted to governance reviewers; svc_safety_flagger writes; queue worker reads a scope view; no client table grant. |
| flagger_accuracy_entry | id uuid NOT NULL PRIMARY KEY; grant_id uuid NOT NULL; item_case_id uuid NOT NULL; item_key text NOT NULL; outcome text NOT NULL CHECK supported/unproven/contradicted/duplicate; score_delta numeric(10,6) NOT NULL; recorded_at timestamptz NOT NULL; decision_version text NOT NULL; dedupe_key char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | FK grant_id to trusted_flagger_grant.id and item_case_id to safety_case.id; item_key is per-item opaque identity. Unique grant_id plus item_key; indexes grant_id plus recorded_at, outcome, dedupe_key. | RLS permits grant controller aggregate accuracy only; individual case references require reviewer capability; svc_safety_flagger owns writes; no client table grant. |
| authenticity_claim | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; listing_id uuid NOT NULL; item_id uuid NOT NULL; claim_path text NOT NULL CHECK buyer_post_purchase/brand_notice/listing_time_detection; claimant_ref uuid NOT NULL; evidence_manifest_hash char(64) NOT NULL; registry_chain_version bigint NOT NULL CHECK >= 0; trademark_exhaustion_state text NOT NULL CHECK not_required/pending/not_exhausted/exhausted; registry_state text NOT NULL CHECK verified/unresolved/contradicted; seller_reason_code text NOT NULL; outcome text NOT NULL CHECK proven/unproven/dispute_remedy/no_action; window_due_at timestamptz NOT NULL; state text NOT NULL CHECK open/chain_verified/exhaustion_checked/adjudicating/resolved/appealed; version bigint NOT NULL DEFAULT 1 CHECK > 0. | FK case_id to safety_case.id; listing and item refs resolve through Shard 23 or marketplace producer adapters without local ownership FK. Index listing_id plus state, item_id, claim_path, registry_chain_version; unique active case per listing plus item. | RLS exposes claimant and seller reason projection separately; registry evidence is reviewer-only; svc_safety_authenticity writes; client has projection grant only. |
| leak_forensic_finding | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; asset_id uuid NOT NULL; reference_asset_hash char(64) NOT NULL; candidate_copy_hash char(64) NOT NULL; release_state_at_match text NOT NULL CHECK unreleased/released/unknown; watermark_recipient_ref uuid NULL; access_trace_hash char(64) NULL; match_state text NOT NULL CHECK matched/unmatched/degraded; watermark_state text NOT NULL CHECK identified/absent/unreadable; access_trace_state text NOT NULL CHECK complete/incomplete/unavailable; attribution text NOT NULL CHECK attributed/no_attribution/pending; gap_codes jsonb NOT NULL CHECK jsonb_typeof(gap_codes) = array; finding_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | FK case_id to safety_case.id; asset and recipient refs are protected source/Shard 01 refs; no leaked-copy blob FK by design. Index asset_id plus version, match_state, attribution, access_trace_hash; unique asset_id plus reference_asset_hash plus candidate_copy_hash. | RLS exposes finding projection to rights holder and authorized reviewer; candidate copy bytes never enter this schema; svc_safety_forensics writes; client receives attribution status only. |
| meetup_safety_record | id uuid NOT NULL PRIMARY KEY; arrangement_id uuid NOT NULL; organizer_party_ref uuid NOT NULL; counterparty_party_ref uuid NOT NULL; restriction_snapshot_version bigint NOT NULL CHECK >= 0; offered_controls jsonb NOT NULL CHECK jsonb_typeof(offered_controls) = array; selected_controls jsonb NOT NULL CHECK jsonb_typeof(selected_controls) = array; location_ref uuid NULL; check_in_at timestamptz NULL; check_out_due_at timestamptz NULL; check_out_at timestamptz NULL; trusted_contact_ref uuid NULL; share_state text NOT NULL CHECK not_selected/pending/shared/revoked; state text NOT NULL CHECK arranged/active/checked_out/missed_check_out/incident_referred; incident_case_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | FK incident_case_id to safety_case.id; party, arrangement, location and trusted-contact refs resolve by purpose-bound adapters; index arrangement_id, organizer_party_ref, counterparty_party_ref, state, check_out_due_at; unique arrangement_id. | RLS permits both arrangement parties their own control projection; trusted contact sees only shared minimum; safety reviewer sees incident link; svc_safety_meetup writes; no public table grant. |

### Persistence invariants

- Every write compares version and uses SELECT FOR UPDATE on the canonical aggregate. Unique dedupe keys are backed by database constraints, not application memory.
- Legal, notice, forensic and safety evidence references are hashes or protected-vault IDs. RLS never treats a general staff role as a purpose capability.
- Deletes are soft state transitions for canonical records. Subject erasure anonymizes lawful identifiers while preserving required case, strike, evidence, decision and event hashes. A legal hold or retention clock prevents destructive deletion.
- Grant expiry, revocation or suspension removes new priority-lane access but never deletes existing cases or accuracy entries. A meetup clean check-out retains its record.

## Middleware & Policies

### Hono middleware order

1. Request ID and trace context; reject malformed or missing request identifiers.
2. Origin and CORS policy selection; credentialed browser requests accept only the operation's allowlist and never wildcard origins.
3. CSRF double-submit check for credentialed browser commands; reject unsafe cross-origin requests before body parsing.
4. Session or service-principal authentication and acting-context freshness.
5. Purpose-bound capability and target visibility lookup under RLS; return opaque 404 for hidden targets.
6. Content type, body-size, decompression and replay-window limits.
7. Idempotency key extraction and normalized request-hash lookup.
8. Zod 4 strict request parse and cross-field legal/mandate validation.
9. Expected-version compare-and-set, transaction locks and provider adapter call with bounded timeout.
10. Canonical write, audit record and outbox enqueue; normalize every failure to ApiError { code, message, requestId, details }.
11. Response projection, security headers, structured audit/log emission and timing metrics.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| TSE-06C-01 | Identified claimant or verified rights-holder agent | Claimant identity, asset and infringement-event triple; no anonymous path | Lock notice dedupe tuple; recheck claimant identity, policy and asset version | Hidden asset or case is 404; visible claimant lacking standing is 403. |
| TSE-06C-02 | Transaction claimant or counterparty with current Shard 01 mandate | Owning commerce shard transaction, party role, filing window and remedy policy | Lock transaction snapshot and canonical dispute tuple; recheck mandate and evidence hash | Hidden transaction is 404; visible transaction without role or lapsed mandate is 403. |
| TSE-06C-03 | Binding party for settlement or independent adjudicator | Every binding party mandate; adjudicator conflict and case lane | Lock dispute/proposal; recheck signatures, expected version and evidence weights | Hidden case is 404; non-party, conflicted or uncapable actor is 403. |
| TSE-06C-04 | Affected notice subject after disclosure presentation | Notice subject identity, presentation receipt, complete statements | Lock notice/counter tuple; recheck disclosure and notice version before delivery | Hidden notice is 404; different subject or missing presentation is 403. |
| TSE-06C-05 | Scoped identity/ownership case reviewer | Case scope and exact Shard 01 snapshot; no ownership mutation capability exists | Lock case resolution; refetch party/mandate/ownership snapshot before command | Hidden case is 404; reviewer outside case or ownership mutation attempt is 403. |
| TSE-06C-06 | Verified legal intake and counsel-authorized release reviewer | Instrument, agency, jurisdiction, requested manifest, counsel gate and step-up | Lock legal request and disclosure decision; recheck prohibition and expiry | Hidden request is 404; unverified requester or absent counsel capability is 403. |
| TSE-06C-07 | Domain owner and conflict-free governance approver | One pending domain/release and Shard 05 launch capability | Lock active assessment; recheck owner, approver conflict and gate version | Hidden domain/release is 404; non-owner or conflicted approver is 403. |
| TSE-06C-08 | Active trusted-flagger grant service | Each public item must fall inside asset, rights and territory scope | Lock grant version and each item key; recheck state before each item | Hidden grant/item is 404; out-of-scope, private or inactive-grant target is 403. |
| TSE-06C-09 | Buyer, verified brand claimant or platform authenticity reviewer | Listing/item scope, claim path and registry chain | Lock listing claim tuple; recheck exhaustion and registry version | Hidden listing is 404; unsupported claimant path is 403. |
| TSE-06C-10 | Rights-holder or registered forensic service | Asset reference and forensic evidence scope; copy hash only | Lock asset/reference version; recheck release state and trace version | Hidden asset is 404; unscoped actor or uploaded copy is 403. |
| TSE-06C-11 | Both arrangement parties with current acting contexts | Arrangement and two-party restriction edge snapshot | Lock arrangement; recheck both edges and expected version | Hidden arrangement is 404; active edge or absent party authority is 403. |

### Security and abuse controls

- Notice and legal identity fields use protected vault references, envelope encryption and purpose-bound decrypt grants. Logs and events contain hashes, opaque IDs and reason codes only.
- Claimant, flagger and brand scopes are exact asset, rights and territory sets. Volume never establishes truth, priority beyond the granted SLA, or a sanction.
- Requester-supplied emergencyClaim never bypasses verification, counsel approval, minimization or notification prohibition. V1 provides no emergency or 24/7 response promise.
- Authenticity and leak flows separate detection from provenance and attribution. A provider result is evidence, never an automatic ownership or guilt mutation.
- Meetup controls inform and offer. A user can decline controls; only an active restriction edge blocks arrangement, and a missed check-out alone never creates a case.
- Rate limits use account, claimant, transaction, case, asset, grant, lane and arrangement dimensions. A target key is never used to suppress independent safety reports.
- SQL SECURITY DEFINER functions set a fixed search_path, check current_user service role, validate actor purpose and write an audit row before returning. Direct table grants are revoked from anon/authenticated.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| TSE-06C-02, TSE-06C-03 | Commerce transaction and remedy adapter | transactionType, transactionId, expectedVersion, caseId, claimantPartyRef, remedyPolicyVersion, evidenceManifestHash | transactionVersion, partyRefs, sealedEvidenceManifestHash, settlementState, deliveryState, providerRequestId | 2,000 ms; 3 retries at 15/60/300 seconds for timeout or 5xx, no retry after unknown mutating commit; open after 5 failures in 60 seconds; unknown result stays pending and no second dispute. |
| TSE-06C-01, TSE-06C-04 | Claimant delivery adapter | noticeId or counterNoticeId, recipientAddressRef, payloadHash, deliveryDeadline, expectedVersion | providerReceiptRef, deliveredAt, deliveryState, providerMessageId | 2,000 ms; 3 retries at 15/60/300 seconds with same idempotency key; open after 5 failures in 60 seconds; demonstrably undelivered notice cannot finalize termination. |
| TSE-06C-02, TSE-06C-05 | Shard 01 party, mandate and ownership snapshot | partyRef, caseId, requestedSnapshotVersion, relationKind, expectedVersion | snapshotVersion, partyState, mandateState, ownershipRefs, successionState, capabilityRefs | 2,000 ms; one safe read retry after 250 ms, no write retry; open after 5 failures in 60 seconds; unknown snapshot blocks command and returns pending or VERSION_CONFLICT. |
| TSE-06C-06 | Counsel and legal verification adapter | legalRequestId, instrumentRef, requesterIdentityRef, jurisdiction, scopeHash, prohibition, stepUpProofRef | verificationState, counselDecision, minimizedManifest, notificationProhibition, reviewVersion | 2,000 ms; 3 retries at 15/60/300 seconds for safe verification reads; open after 5 failures in 60 seconds; unknown counsel state blocks release and records pending. |
| TSE-06C-07 | Shard 05 launch-gate and configuration adapter | domainKey, releaseKey, assessmentId, disposition, evidenceManifestHash, expectedGateVersion | gateVersion, gateState, acceptedControls, enablementState | 2,000 ms; 2 retries at 250/1,000 ms for reads; open after 5 failures in 60 seconds; unknown gate leaves release gated. |
| TSE-06C-08 | Trusted-flagger grant and notification adapter | grantId, grantVersion, controllerPartyRef, itemId, itemKind, reasonCode, itemIdempotencyKey | grantState, scopeDecision, caseId, slaDueAt, providerReceiptRef | 2,000 ms per item; 3 retries at 15/60/300 seconds with per-item key; open after 5 failures in 60 seconds; unknown item is queued without duplicate admission. |
| TSE-06C-09 | Shard 23 provenance and trademark registry adapter | listingId, itemId, registryChainVersion, claimPath, evidenceManifestHash, exhaustionCheck | registryState, chainHash, exhaustionState, sellerReasonCode, registryVersion | 2,000 ms; 3 retries at 15/60/300 seconds for reads; open after 5 failures in 60 seconds; unknown chain leaves claim unproven and no seller action. |
| TSE-06C-10 | Watermark and access-trace forensic adapter | assetId, referenceAssetHash, candidateCopyHash, releaseStateAtMatch, accessTraceVersion, watermarkEvidenceRef | matchState, watermarkState, recipientRef, accessTraceState, attribution, findingHash | 5,000 ms; 2 retries at 1/5 seconds using same finding key; open after 5 failures in 60 seconds; unavailable trace yields pending or explicit gap, never guessed attribution. |
| TSE-06C-11 | Restriction and trusted-contact notification adapter | arrangementId, organizerPartyRef, counterpartyPartyRef, restrictionSnapshotVersion, selectedControls, contactRef | restrictionDecision, notificationReceiptRef, shareState, adapterVersion | 1,000 ms restriction read with one retry after 100 ms; 2,000 ms notification with 3 retries at 15/60/300 seconds; open after 5 failures in 60 seconds; unknown restriction denies arrangement until a fresh clear result. |

Provider failures never convert to a positive legal verification, ownership result, provenance chain, attribution, restriction-clear result or launch enablement. Safe reads may be retried; unknown mutating commits are reconciled by provider request ID and idempotency key.

### State machines and concurrency

- Transaction dispute: open → response_pending → mediation → adjudicating → resolved → closed. The filing transaction freezes party refs, transaction version, remedies, deadline and evidence manifest. Settlement requires every binding signature and is non-precedential; adjudication stores evidence weights and per-item remedies. A chargeback event reconciles to the same case.
- DMCA notice: draft → validated → availability_actioned → delivery_pending → delivered, with countered → restoration_pending → restored or terminated. An incomplete notice stays draft. The strike unit is claimant, asset and infringement event; a duplicate cannot increment it.
- Legal process: received → verified → counsel_review → approved or rejected → released or notification_blocked → expired. Overbroad scope is narrowed or refused. Release contains only manifest-listed fields and an expiry; it grants no search or database access.
- Domain risk: submitted → approved, rejected or superseded. Only an approved assessment with an explicit disposition can make Shard 05 eligible to enable a release; an assessment merely existing never enables it.
- Trusted flagger: probationary → active → throttled → suspended → revoked or expired. New items after suspension use ordinary reporting; old cases and accuracy evidence remain.
- Authenticity claim: open → chain_verified → exhaustion_checked → adjudicating → resolved or appealed. Buyer, brand and listing-time paths converge on one listing/item outcome and seller reason.
- Leak finding: match_received → matched or unmatched or degraded → attributed or no_attribution or pending. A released asset match is a non-event. Candidate bytes are processed outside this service and never stored.
- Meetup record: arranged → active → checked_out or missed_check_out, or incident_referred. Concurrent check-out and timer expiry compare-and-set one terminal state. A missed check-out is not an incident.
- Every command takes an aggregate lock and expected version. Per-item trusted-flagger keys, strike-unit hashes, listing tuples, arrangement IDs and forensic keys have unique constraints. Losers receive the prior result or typed 409 and never duplicate a case, release, notice or notification.

### Failure recovery

- A crash after canonical commit leaves the outbox and durable command state. Workers resume from the same idempotency key and provider request ID.
- A timeout after an external mutating request produces provider_reconciliation_pending. A reconciler reads the provider receipt before retrying; it never assumes failure and never repeats an unbounded action.
- A failed legal delivery retains delivery evidence and keeps restoration or termination clocks truthful. A failed notification with a nondisclosure prohibition is not retried through an alternate channel without counsel approval.
- A stale Shard 01 or Shard 05 snapshot returns a typed conflict and preserves the prior case state. No ownership, launch or access result is written from a stale snapshot.
- Partial bulk notice admission reports per-item state, retries accepted or failed items independently and writes exactly one flagger_accuracy_entry per item.
- Retention and erasure use the maximum applicable clock. Holds are unbounded while active. Media deletion leaves a tombstone and evidence degradation; no new blob reuses its locator.

## Event Schemas

### Payload contracts

~~~ts
export const SafetyDisputeChangedV1 = z.strictObject({
  type: z.literal("safety.dispute.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  disputeId: z.uuid(),
  caseId: z.uuid(),
  transactionVersion: z.number().int().nonnegative(),
  state: z.enum(["open", "response_pending", "mediation", "adjudicating", "resolved", "closed"]),
  remedyPolicyVersion: z.string().min(1),
  deadline: z.iso.datetime({ offset: true }),
});

export const SafetyDmcaChangedV1 = z.strictObject({
  type: z.literal("safety.dmca.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  noticeId: z.uuid(),
  assetId: z.uuid(),
  state: z.string().min(1),
  strikeState: z.string().min(1),
  restorationDueAt: z.iso.datetime({ offset: true }).optional(),
});

export const SafetyLegalDisclosureDecidedV1 = z.strictObject({
  type: z.literal("safety.legal-disclosure.decided.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  requestId: z.uuid(),
  decision: z.enum(["approved", "rejected", "blocked", "expired"]),
  prohibition: z.boolean(),
  releaseHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const SafetyRiskAssessmentDecidedV1 = z.strictObject({
  type: z.literal("safety.risk-assessment.decided.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  assessmentId: z.uuid(),
  domainKey: z.string().min(1),
  releaseKey: z.string().min(1),
  disposition: z.enum(["enable", "enable_with_controls", "hold", "reject"]),
  gapHash: z.string().regex(/^[a-f0-9]{64}$/),
  controlHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const SafetyFlaggerStatusChangedV1 = z.strictObject({
  type: z.literal("safety.flagger.status-changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  grantId: z.uuid(),
  controllerPartyRef: z.uuid(),
  state: z.enum(["probationary", "active", "throttled", "suspended", "revoked", "expired"]),
  scopeHash: z.string().regex(/^[a-f0-9]{64}$/),
  reasonCode: z.string().min(1),
});

export const SafetyAuthenticityDecidedV1 = z.strictObject({
  type: z.literal("safety.authenticity.decided.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  claimId: z.uuid(),
  listingId: z.uuid(),
  claimPath: z.enum(["buyer_post_purchase", "brand_notice", "listing_time_detection"]),
  outcome: z.enum(["proven", "unproven", "dispute_remedy", "no_action"]),
  sellerReasonCode: z.string().min(1),
});

export const SafetyLeakFindingV1 = z.strictObject({
  type: z.literal("safety.leak.finding.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  findingId: z.uuid(),
  assetId: z.uuid(),
  releaseStateAtMatch: z.enum(["unreleased", "released", "unknown"]),
  attribution: z.enum(["attributed", "no_attribution", "pending"]),
  findingHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const SafetyMeetupRecordChangedV1 = z.strictObject({
  type: z.literal("safety.meetup.record-changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  recordId: z.uuid(),
  arrangementId: z.uuid(),
  state: z.enum(["arranged", "active", "checked_out", "missed_check_out", "incident_referred"]),
  selectedControls: z.array(z.string().min(1)),
  version: z.number().int().nonnegative(),
});
~~~

Event publication occurs only after the canonical transaction commits. Consumers use event type and version to refetch an authorized projection. Events never contain claimant identity, legal instrument bytes, address or jurisdiction details, private messages, leaked copies, evidence narratives, protected traits or unrestricted PII.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | INVALID_REQUEST 400 or UNAUTHENTICATED 401 | Correct request or establish a fresh acting context; no domain mutation. |
| Target visibility and purpose capability | FORBIDDEN 403 for visible unauthorized target; opaque 404 for hidden target | Do not retry as another role; use the permitted case or appeal channel. |
| Strict schema and cross-field policy | INVALID_REQUEST 400 or typed 422 | Return field paths in allowlisted details; no provider call. |
| Idempotency and version | IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409 | Replay the original key or refetch the returned version; no duplicate effect. |
| Shard 01 mandate or ownership | ACTING_CONTEXT_STALE or MANDATE_REQUIRED 422 | Refetch exact snapshot and resubmit; never infer authority from credentials. |
| Shard 05 counsel or launch gate | COUNSEL_GATE_DISABLED, STEP_UP_REQUIRED or ASSESSMENT_INCOMPLETE 422 | Obtain approved gate/evidence; keep release or disclosure gated. |
| Required provider read or write | PROVIDER_UNAVAILABLE 503 only when durable pending state exists | Reconcile by provider request ID; circuit breaker and queue retry. |
| Legal delivery or notification | DELIVERY_FAILED or DISCLOSURE_PROHIBITED 422 | Retain receipt and clock; no alternate disclosure channel without authorization. |

### Operation error coverage

| Operation ID | Invalid-input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| TSE-06C-01 | Incomplete attestation, anonymous claimant, invalid regime, wrong asset scope and duplicate strike unit are rejected without removal. | Unique strike tuple serializes; failed delivery retries; claimant erasure preserves required notice hash and case tombstone. |
| TSE-06C-02 | Unknown transaction, closed filing window, missing mandate, missing sealed manifest and invalid remedy are rejected before freeze. | Competing filing returns one canonical case; chargeback reconciles; transaction deletion leaves frozen evidence and source tombstone. |
| TSE-06C-03 | Missing signature, absent mandate, conflicted adjudicator, malformed terms and invalid weights are rejected with no finding. | Settlement and adjudication compare case version; partial remedy stays per-item pending; party revocation prevents new acceptance but preserves proposal. |
| TSE-06C-04 | Wrong subject, undisclosed address/jurisdiction and incomplete statements start no restoration timer. | Delivery timeout remains pending with evidence; notice deletion preserves counter-notice chain under retention. |
| TSE-06C-05 | Stale Shard 01 snapshot, unresolved mandate or requested ownership mutation produces no access outcome. | Snapshot compare-and-set serializes; authority revocation removes derived access but preserves ownership case and evidence. |
| TSE-06C-06 | Spoofed urgency, unauthenticated instrument, broad scope, absent counsel gate or missing step-up blocks release. | Provider unknown leaves request pending; prohibition prevents notification; legal-request deletion preserves audit and manifest hashes. |
| TSE-06C-07 | Calendar-only review, missing harms/controls/gaps/evidence/disposition or conflicted approver keeps gate closed. | Superseding assessment wins by expected version; domain disablement removes enablement but retains prior assessment and audit. |
| TSE-06C-08 | Private item, out-of-scope item, inactive grant or missing per-item key is rejected independently. | Batch retries per item; grant suspension removes shortened SLA for new items but preserves cases and accuracy entries. |
| TSE-06C-09 | Unresolved registry chain or exhausted trademark returns unproven/no action; detection cannot substitute provenance. | Concurrent claim paths converge by listing tuple; listing deletion preserves claim snapshot and appeal evidence. |
| TSE-06C-10 | Uploaded leak copy, unmatchable/degraded copy and missing trace produce no-attribution or pending, never a guess. | Forensic retries pin reference and trace versions; recipient revocation stops future access but preserves finding hash. |
| TSE-06C-11 | Active restriction, absent party authority or invalid control selection denies arrangement or rejects field. | Check-out and timer compare-and-set; clean check-out and missed timer remain records, and only a reported incident opens 06a case. |

## Observability

Every operation emits a structured event with requestId, traceId, operationId, outcome, latencyMs, schemaVersion, actorType, purpose, aggregateRefHash and policyVersion. Logs exclude raw narratives, legal documents, addresses, private messages, claimant identity, leaked copies and protected traits.

| Operation ID | Audit event and metrics | Safe trace fields |
|---|---|---|
| TSE-06C-01 | safety.dmca.notice.changed; notice validation, strike dedupe, availability, delivery and replay counters | notice hash, case hash, regime, state, delivery state, policy version |
| TSE-06C-02 | safety.dispute.opened; filing acceptance, mandate refusal, manifest gap, deadline and adapter latency counters | case hash, transaction hash, transaction type, remedy count, version |
| TSE-06C-03 | safety.dispute.resolution.changed; settlement signature, adjudication, partial remedy and convergence counters | proposal hash, case hash, mode, item counts, evidence-weight hash |
| TSE-06C-04 | safety.dmca.counter_notice.changed; disclosure acknowledgement, delivery, restoration and expiry counters | notice hash, counter hash, state, delivery receipt hash, due-time bucket |
| TSE-06C-05 | safety.ownership.case.resolution.changed; snapshot conflict, scoped access, recovery route and preservation counters | case hash, snapshot version, privilege scope codes, outcome |
| TSE-06C-06 | safety.legal.request.changed and safety.legal.disclosure.decided; verification, counsel gate, minimization, prohibition and expiry counters | request hash, instrument type, jurisdiction code, scope count, decision state |
| TSE-06C-07 | safety.risk-assessment.decided; missing-control, conflict, disposition and gate-convergence counters | assessment hash, domain/release hashes, disposition, gap/control counts |
| TSE-06C-08 | safety.flagger.notice.batch.changed; item acceptance, duplicate, scope denial, throttle and accuracy counters | grant hash, item count, scope outcome, SLA bucket, accuracy outcome code |
| TSE-06C-09 | safety.authenticity.decided; registry availability, exhaustion, path reconciliation and unproven counters | claim hash, listing hash, path, registry state, outcome, reason code |
| TSE-06C-10 | safety.leak.finding; match, watermark, trace gap, attribution and non-event counters | finding hash, asset hash, release state, match state, attribution, gap code |
| TSE-06C-11 | safety.meetup.record.changed; restriction denial, controls offered/selected, check-out and incident referral counters | record hash, arrangement hash, control codes, timer bucket, state |

provider-native diagnostic sinks receive sampled exception fingerprints and provider circuit state without request bodies. Alert thresholds are: legal release pending over 15 minutes, restoration deadline within 2 hours without delivery, dispute outbox lag over 60 seconds, forensic trace reconciliation over 5 minutes, flagger duplicate ratio over policy threshold, and meetup restriction-adapter unknown over 1 minute.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| TSE-06C-01 | Parse strict notice schema and all four attestations; reject anonymous/out-of-scope claimant; assert strike tuple idempotency, exact ApiError and 403 versus opaque 404; assert no availability action before validation. |
| TSE-06C-02 | Parse transaction and mandate fields; assert closed-window and missing-manifest refusal; assert concurrent filing one canonical case, frozen version and chargeback reconciliation. |
| TSE-06C-03 | Parse exact terms, signatures, weights and per-item remedies; reject missing mandate/conflict; assert settlement needs every signature, adjudication independence and partial compensation state. |
| TSE-06C-04 | Require literal disclosure acknowledgements and signed statements; assert incomplete counter starts no timer, delivery retry and restoration due calculation. |
| TSE-06C-05 | Assert Shard 01 snapshot version and literal ownershipPreserved/creditsPreserved true; reject stale snapshot and ownership mutation; verify scoped access outcome only. |
| TSE-06C-06 | Assert instrument verification, minimization and counsel/step-up gate; emergency claim never bypasses; unknown provider leaves pending and no release; prohibition suppresses notification. |
| TSE-06C-07 | Assert nonempty harms/controls, evidence and disposition; reject calendar-only and conflicted approval; verify Shard 05 gate remains closed until approved assessment. |
| TSE-06C-08 | Assert per-item keys, public-only scope, grant state and weighted-fair admission; retry partial batch; verify one accuracy entry per item and suspension removes only new priority admission. |
| TSE-06C-09 | Exercise all three claim paths, exhaustion and registry unresolved; assert one seller reason per listing and dispute remedy for innocent misrepresentation. |
| TSE-06C-10 | Reject leaked-copy upload; exercise matched/unmatched/degraded, watermark and trace gap; assert released match is non-event and no attribution is guessed. |
| TSE-06C-11 | Assert both restriction edges before arrangement; optional controls can be declined; race check-out versus timer; missed check-out remains record and reported incident routes to 06a. |

### Persistence, concurrency and recovery tests

- Migration tests assert every field type, nullability, check constraint, foreign key, unique key and index listed above. RLS tests cover claimant, subject, binding party, counsel, owner, grant controller, rights holder, trusted contact, staff and service-principal projections.
- Property tests generate duplicate keys, stale versions, provider timeouts, reordered outbox delivery, grant expiry, legal prohibition and deletion/revocation. Each property asserts no duplicate case, no ownership mutation, no release on unknown counsel, no private target admission and no raw protected data in logs/events.
- Worker tests run crash-after-commit and timeout-after-provider-commit scenarios. Reconciliation by provider request ID converges to one state, with 15/60/300 second retry backoff and circuit opening after 5 failures in 60 seconds.
- Security tests attempt case enumeration, wildcard staff reads, cross-tenant IDs, CSRF, replayed keys, path traversal, oversized legal scopes, private-message flagger items and candidate-copy uploads. All fail with the correct envelope.
- Performance tests hold p95 command latency under 300 ms for local validation and persistence, with provider effects returning durable 202; 500-item flagger batches preserve per-item idempotency and bounded queue memory.

### Accessibility handoff tests

The consumer dispute, counter-notice and meetup surfaces expose labeled fields, inline errors tied by id, keyboard-complete disclosure acknowledgement, visible restoration/deadline status, non-color state labels and screen-reader announcements for accepted, pending, blocked and failed states. Staff/legal/rights-holder workspaces expose focus order, reasoned refusal, scope and expiry, never raw protected evidence. Tests cover keyboard-only, 200 percent zoom, reduced motion, high contrast, screen reader status announcements and timeout extension where safe.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | Every operation has one strict request, one strict success data shape, common ApiError, idempotency key, expected version where applicable, numeric rate limit, explicit CORS and operation-specific 403/404 behavior. PASS. |
| Data pass | All thirteen IA models have typed SQL fields, nullability, checks, FK target or cross-shard no-FK rationale, query indexes, RLS and grants. Evidence and legal identity remain protected refs. PASS. |
| State/concurrency pass | Notice, counter, dispute, legal, assessment, grant, authenticity, leak and meetup state transitions include compare-and-set, unique dedupe, outbox recovery and provider unknown behavior. PASS. |
| Adversarial pass | Anonymous legal notice, strike inflation, mandate revocation, spoofed urgency, ownership mutation, private flagger target, exhausted mark, leaked copy, release-state mismatch, restriction race and clean/missed check-out were tested as refusal or safe pending paths. PASS. |
| Macro boundary pass | 06a intake/evidence and 06b enforcement/policy are referenced without route or table duplication; BE00, Shard 01 and Shard 05 contracts are inherited; source commerce, catalog and Shard 23 truth remains producer-owned. PASS. |
| Auditability pass | Route, contract, error, authorization, idempotency/rate, observability and test rows cover exactly TSE-06C-01 through TSE-06C-11. Event and model identifiers are literal and line-traced. PASS. |

## Ambiguity Gate

PASS. Canonical source resolved to .memory/wiki/specs/ia/06-trust-safety.md with deep dive .memory/wiki/specs/ia/deep-dives/06-trust-safety.md; no alternate Shard 06 source was selected. Every assigned interaction, model, event and feature ledger row has one owner and one operation mapping. Cross-shard ownership, actor authority, provider unknown behavior, 403 versus 404, deletion/revocation, state transitions, evidence retention, counsel gates, idempotency, rate limits, CORS and ApiError contracts are explicit. No route duplicates BE00, 06a or 06b. All tables use matching Markdown widths with no unescaped cell pipes. No unresolved choice remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 06c backend companion from canonical Shard 06 IA and deep dive; classified eleven interactions, thirteen models and eight events; locked command, persistence, security and recovery contracts. | /write-be-spec | All |
| 2026-08-28 | Added strict Zod 4 request/success contracts, route registry, typed SQL persistence, external seam budgets, event payloads, error matrices, observability and tests. | /write-be-spec-write | API, database, middleware, data flow, events, errors, observability, tests |

## Dependency References

### Constrained by

- [BE00 — Platform foundation](00-infrastructure.md)
- [BE01 — Authentication and account linking](01a-auth-account-linking.md)
- [BE01 — Party, mandate and authority](01c-relationships-authority-governance.md)
- [BE05 — Settings, flags and runtime](05a-settings-flags-runtime.md)
- [BE05 — Admin, counsel and operations](05b-admin-workspace-operations.md)
- [IA Shard 06 — Trust, safety, disputes and evidence](../ia/06-trust-safety.md)
- [IA Deep Dive 06 — Trust, safety, disputes and evidence](../ia/deep-dives/06-trust-safety.md)

### Constrains

- [BE06a — Case intake and evidence](06a-case-intake-evidence.md)
- [BE06b — Policy, enforcement and appeals](06b-policy-enforcement-appeals.md)
- [IA Shard 11 — Community graph](../ia/11-community-graph.md)
- [IA Shard 12 — Community spaces and events](../ia/12-community-spaces-events.md)
- [IA Shard 18 — Royalty accounting](../ia/18-royalty-accounting.md)
- [IA Shard 20 — Licensing core and instrument lifecycle](../ia/20-licensing-core.md)
- [IA Shard 21 — Specialized clearances and licensing](../ia/21-specialized-licensing.md)
- [IA Shard 22 — Release and distribution](../ia/22-release-distribution.md)
- [IA Shard 23 — Gear provenance registry](../ia/23-gear-provenance-registry.md)
- [IA Shard 25 — Gear market catalog](../ia/25-gear-market-catalog.md)
- [IA Shard 26 — Gear commerce and fulfilment](../ia/26-gear-commerce-fulfilment.md)
- [IA Shard 27 — Digital catalog and delivery](../ia/27-digital-catalog-delivery.md)
- [IA Shard 28 — Digital licensing and commerce](../ia/28-digital-licensing-commerce.md)
- [IA Shard 29 — Venues, studios and spaces](../ia/29-venues-spaces.md)
- [IA Shard 30 — Booking and contracts](../ia/30-booking-contracts.md)
- [IA Shard 31 — Agency, settlement and live-market intelligence](../ia/31-live-settlement-intelligence.md)
- [IA Shard 33 — Show-day execution and recovery](../ia/33-show-day-operations.md)
- [IA Shard 35 — Ticket products, sales, access packages and delivery](../ia/35-ticket-products-sales.md)
- [IA Shard 36 — Box office risk](../ia/36-box-office-risk.md)
- [IA Shard 37 — Fanbase and direct-to-fan](../ia/37-fanbase-direct-to-fan.md)
- [IA Shard 40 — Market intelligence, fraud and scouting signals](../ia/40-market-intelligence-signals.md)
