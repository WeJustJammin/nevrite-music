# External identifiers, legacy succession and memorialisation — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]  
**Deep Dive:** [[specs/ia/deep-dives/01-identity-authority|Identity authority deep dive]]  
**Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]  
**Authority Boundary:** [[specs/be/01c-relationships-authority-governance|Relationships and governance]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** 4 of 4.
- **Boundary:** IDA-15 through IDA-18: namespace/capacity-aware identifier claims/collisions, private successor nomination, death reports, counsel-gated memorialisation and estate representation.
- **Non-ownership:** This spec records, verifies and gates party identifiers; rights/royalty domains decide whether an eligible verified identifier participates in a specific filing/routing flow. It records legacy authority evidence but does not adjudicate probate or distribute an estate.
- **Approval:** Recommended split accepted under the owner's standing autonomy delegation.

## Referenced Material Inventory

- [[specs/ia/01-identity-authority|IA Shard 01]] interactions IDA-15–18, identifier/legacy contracts, access and events.
- [[specs/ia/deep-dives/01-identity-authority|Identity deep dive]] claim/collision and memorialisation fields/states, retention and counsel gates.
- [[specs/be/00-infrastructure|Backend foundation]] protected commands/jobs, evidence references, errors, audit/outbox and observability.
- [[specs/be/01a-auth-account-linking|Authentication/account linking]] session/account lifecycle revocation boundary.
- [[specs/be/01c-relationships-authority-governance|Relationships/authority]] estate representation contract.

## Endpoint Reconciliation

| IA interaction | Endpoint / worker | Disposition |
|---|---|---|
| IDA-15 Record identifier | party claim list/create/revoke and verification job | Authored |
| IDA-16 Collision | participant read, withdraw/evidence, operator resolution | Authored |
| IDA-17 Nomination | self read/create-replace/revoke | Authored |
| IDA-18 Death/memorialisation | report, case read/review/decision, protected verification job, estate edge | Authored behind counsel policy gate |
| Identifier procurement | none | Explicitly excluded; record/verify/resolve only |
| Estate distributions | none | B3/provider/counsel-gated; authority only |

## Identifier Namespace Registry

| Namespace family | Initial code / capacity rule | Verification and routing posture |
|---|---|---|
| public-name identity | `isni`; capacity `public_identity` | party/alias eligible; self-asserted until registry evidence; no ownership proof |
| writer/publisher | `ipi_cae`; capacity `writer|publisher` | many per party; verification needed for routing eligibility |
| performer | `ipn`; capacity `performer` | verification needed for routing eligibility |
| society/union membership | `pro_member:<society>`, `union_member:<union>`; registry-defined capacity | public number is corroboration only; account control is separate integration proof |
| DDEX party | `ddex_party`; capacity `sender|recipient|party` | type eligibility and registry verification required |
| DSP artist | `dsp_artist:<provider>`; capacity `artist_profile` | login identity is unrelated; provider integration verifies exact artist subject |

Each protected registry entry defines normalized syntax, party kinds/types, allowed capacities, uniqueness class, display sensitivity, verifier adapter, evidence class, retry policy and downstream eligibility policy. New namespaces are admin-governed configuration; ordinary users/CMS cannot mint codes or weaken routing safeguards. Public facts never grant account/party control.

## API Endpoints

### `GET /api/v1/parties/{partyId}/identifiers`

Viewer-relative read with `cursor`, `limit`, optional namespace filter. Public response contains only claims whose registry/display policy and party projection permit `{ namespaceLabel, maskedOrPublicValue, capacity, provenance, verificationState }`. Owner/current authorized party additionally receives claim UUID, safe mismatch/collision state, attempts and recovery actions. Provider evidence refs remain hidden. `200 CursorPage`, ETag; public cache only for public projection.

Errors: `404 PARTY_NOT_FOUND`, `422 NAMESPACE_UNKNOWN|VALIDATION_FAILED`, `429`, `503`, `500`.

### `POST /api/v1/parties/{partyId}/identifier-claims`

Body `{ namespace, value, capacity, provenance, evidenceRef? }`; required current self/party identifier-management capability, party ETag and idempotency. Value is normalized by namespace but original display may be retained protected. Example `{ "namespace":"ipi_cae","value":"00123456789","capacity":"writer","provenance":"self_asserted" }`.

`201` returns claim `{ id, partyId, namespace, maskedOrPublicValue, capacity, provenance, verificationState, routingEligible:false, version }`. Creation attempts configured verification asynchronously. Existing same normalized namespace/value on another party creates/joins one collision; all involved claims become `collision`, lose verified/routing status and both parties are notified.

Errors: `401`, `403 IDENTIFIER_FORBIDDEN`, concealment-safe `404 PARTY_NOT_FOUND`, `409 IDENTIFIER_CLAIM_EXISTS|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 IDENTIFIER_FORMAT_INVALID|IDENTIFIER_CAPACITY_INVALID|NAMESPACE_UNKNOWN|EVIDENCE_CLASS_INVALID`, `428`, `429`, `500`.

### `POST /api/v1/identifier-claims/{claimId}/verification-jobs`

Owner/current party capability; claim ETag/idempotency. No body. `202 JobStatus` when a configured verifier exists; `409 IDENTIFIER_VERIFICATION_UNAVAILABLE` when none exists. Worker sends minimum claim fields, records attempt evidence, compares current version and returns `verified|mismatch|collision|self_asserted`. A stale result remains attempt evidence but cannot transition the claim.

Errors: `401`, `403`, `404 IDENTIFIER_CLAIM_NOT_FOUND`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|IDENTIFIER_STATE_CONFLICT|IDENTIFIER_VERIFICATION_UNAVAILABLE`, `428`, `429`, `502 IDENTIFIER_PROVIDER_RESPONSE_INVALID`, `503 IDENTIFIER_PROVIDER_UNAVAILABLE`, `500`.

### `DELETE /api/v1/identifier-claims/{claimId}`

Owner/current party capability, step-up when claim is verified/routing-eligible, ETag/idempotency; body `{ reasonCode }`. `200` returns state `revoked`, routing false. Record and prior uses remain; no destructive deletion. If revocation clears a collision, remaining claims return to `self_asserted` or re-verification—never automatically verified.

Errors: `401`, `403 STEP_UP_REQUIRED|IDENTIFIER_FORBIDDEN`, `404`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|IDENTIFIER_STATE_CONFLICT`, `422`, `428`, `429`, `500`.

### `GET /api/v1/identifier-collisions/{collisionId}`

Only a current affected party or assigned identity operator with MFA/reason. `200` returns namespace, masked value, own claim, other claimant-safe labels, state, allowed actions and version. It never discloses legal identity, contact data or provider evidence. Wrong/unassigned access returns `404 COLLISION_NOT_FOUND`.

### `POST /api/v1/identifier-collisions/{collisionId}/actions`

Body is one strict union: `{ action:"withdraw", claimId }`, `{ action:"submit_evidence", claimId, evidenceRef }`, or operator-only `{ action:"resolve", winningClaimId, basisCode, evidenceRefs }`. Required ETag/idempotency; operator resolution requires TOTP MFA, assigned case and reason.

`200` returns collision/claim projections. Resolution verifies current registry evidence, allows exactly one routing-eligible winner, leaves losing claims mismatch/revoked as appropriate and preserves all history. If neither can verify, collision stays open and routing remains disabled.

Errors: `401`, `403 STEP_UP_REQUIRED|COLLISION_ACTION_FORBIDDEN`, `404`, `409 COLLISION_STATE_CONFLICT|EVIDENCE_INSUFFICIENT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### `GET /api/v1/me/legacy-nomination`

Self with recent step-up only. `200` returns active nomination `{ id, successorPersonId, successorLabel, state, createdAt, version }`; absent returns `404 NOMINATION_NOT_FOUND`. Private/no-store; no other role or estate can read it while nominator is alive.

### `PUT /api/v1/me/legacy-nomination`

Body `{ successorPersonId }`; successor must be a distinct existing/invited adult person. Required step-up, idempotency and `If-Match` when replacing. `200` creates or supersedes one active nomination and emits a private security notice. Nomination is evidence of intent, not probate authority and grants no current access.

Errors: `401`, `403 STEP_UP_REQUIRED`, `404 SUCCESSOR_NOT_FOUND`, `409 NOMINATION_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428` on replacement, `429`, `500`.

### `DELETE /api/v1/me/legacy-nomination`

Self, step-up, ETag/idempotency. `204` revokes active nomination and preserves history. Same auth/precondition errors; absent is `404 NOMINATION_NOT_FOUND`.

### `POST /api/v1/memorialisation-reports`

Deployment-enabled only when a counsel-approved `legacy_evidence_policy_version` defines admitted evidence classes, lawful purpose, reviewers, notices, retention/hold, contest and false-report reversal. Body `{ subjectPersonId, relationshipToSubject, statement, evidenceRefs }`; statement 1–2,000 characters is restricted evidence, never logs/search/analytics. Reporter may be authenticated self or an allowlisted external reporting route with stricter abuse controls. Required idempotency.

`201` returns `{ caseId, state:"reported", receiptCode, policyVersion }`; no public/auth change and no confirmation of hidden account details. Errors: `403 MEMORIALISATION_POLICY_DISABLED`, concealment-safe `404 SUBJECT_NOT_FOUND`, `409 REPORT_ALREADY_OPEN|IDEMPOTENCY_CONFLICT`, `413`, `422 EVIDENCE_CLASS_INVALID|VALIDATION_FAILED`, `429`, `503 EVIDENCE_STORAGE_UNAVAILABLE`, `500`.

### `GET /api/v1/memorialisation-cases/{caseId}`

Reporter receives receipt/status-safe projection; subject, verified nominee/estate candidate and assigned operator receive distinct minimum projections under policy. Evidence is accessed through separate expiring purpose grants, never returned here. Wrong scope returns `404 CASE_NOT_FOUND`. Assigned operator requires MFA and reason; every access is audited.

### `POST /api/v1/memorialisation-cases/{caseId}/decisions`

Assigned identity operator only; TOTP MFA, reason, case ETag/idempotency. Body `{ decision:"begin_review"|"verify"|"reject"|"contest"|"reverse_false_report", basisCode, evidenceRefs }`; exact transitions follow policy. `verify` returns `202 JobStatus` for protected memorialisation. Operator cannot adjudicate probate, invent evidence or bypass counsel policy.

Verification job atomically/transactionally coordinates: case/person expected versions; account state to memorialised; all sessions, personal mandates and acting bindings revoked; public projection marker; optional biography suppression; audit/outbox. Minimum third-party provenance remains. False-report reversal is a separately authorized protected transition and cannot erase evidence.

Errors: `401`, `403 STEP_UP_REQUIRED|CASE_ACTION_FORBIDDEN|MEMORIALISATION_POLICY_DISABLED`, `404`, `409 CASE_STATE_CONFLICT|EVIDENCE_INSUFFICIENT|POLICY_VERSION_STALE|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `503`, `500`.

### `POST /api/v1/memorialisation-cases/{caseId}/estate-representations`

Available only after verified memorialisation and verified legal authority under counsel policy. Body uses 01c representation scope `{ representativePartyId, activities, domains, territories, startsAt, endsAt, communicate, ceilingMinor?, currency?, legalAuthorityEvidenceRefs }`; case/party ETags, idempotency, operator approval and representative acceptance required.

`201` creates pending estate representation; authority starts only on acceptance and never includes login, signature or attestation as the deceased. No nomination alone, longest-tenure heuristic or family claim satisfies legal authority. No verified authority means administration disabled.

Errors: `401`, `403 ESTATE_AUTHORITY_FORBIDDEN|MEMORIALISATION_POLICY_DISABLED`, `404`, `409 CASE_STATE_CONFLICT|ESTATE_EVIDENCE_UNVERIFIED|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

## Validation, Rate and Authorization Matrix

| Surface | Validation / limits | Principal | Rate / SLO |
|---|---|---|---|
| identifier read | strict namespace/cursor; viewer projection | public/owner/current party | public 120/min/IP, auth 300/min; Tier 1 |
| claim/revoke/verify | namespace syntax+capacity+party type; ETag/key | self/current identifier capability | 30 mutations/min; verification 10/day/claim; Tier 2 |
| collision | assigned participant/operator only | affected party or MFA identity operator | 20/day/collision; 100% trace/audit |
| nomination | distinct adult successor UUID; no evidence claim | living self + step-up | 5/day; high-risk Tier 2 |
| report | policy evidence classes, 256 KiB metadata body; file bytes via governed upload | reporter route | 3/day/reporter+subject, burst 1/min; acceptance `<1,200ms` |
| case/decision/estate | current policy, assignment, evidence grants, versions | minimum participant or MFA operator | admin 10/min; 100% trace/audit |

All endpoint errors use Shard 00's exact envelope. Public/participant errors suppress existence and verification-oracle detail. Known under-18 registration and professional authority remain blocked; future guardian/minor legacy flows require evolution.

## Persistence Design

| Table | Core constraints / indexes |
|---|---|
| `identity.identifier_namespace_registry` | code/version/schema/party kinds/types/capacities/visibility/verifier/routing policy/state; protected changes |
| `identity.party_identifier_claims` | party/namespace/normalized value/capacity/provenance/state/evidence/version; many per party+namespace+capacity |
| `identity.identifier_verification_attempts` | claim/version/provider/result/digest/times/error; append-only |
| `identity.identifier_collisions` | namespace/value digest/state/resolution basis/time/version; one open collision per normalized key |
| `identity.identifier_collision_claims` | collision/claim/joined/left/outcome; history retained |
| `protected.legacy_nominations` | nominator/successor/state/times/version; partial unique active nominator |
| `protected.memorialisation_cases` | subject/reporter/policy/state/assigned reviewer/reason/decision/version |
| `protected.memorialisation_evidence` | case/governed object ref/evidence class/submitter/hold/retention; no raw bytes in DB |
| `identity.estate_representation_links` | representation/case/legal evidence refs; current verified case required |

Identifier claims have no global unique constraint because collisions must persist; a transaction advisory lock on namespace+normalized digest creates/updates the collision deterministically. Routing eligibility is a derived fail-closed projection requiring active verified claim, no open collision and namespace/downstream policy.

Protected nomination/case/evidence tables have no ordinary browser grants. Participant/operator projections are separate RLS views. Evidence access uses expiring purpose grants; service principals receive one case/job scope. Audit, verification attempts, case decisions and revoked claims are append-only.

## Workers, Events and Failure Hygiene

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Identifier claim | `self_asserted → verifying → verified|mismatch|collision|self_asserted`; any non-revoked state `→ revoked` | Current verification result or owner revocation triggers. Stale/unknown result cannot advance; collision/revoked is never routing eligible; collision clearance returns to self-asserted/reverification, never directly verified. |
| Identifier collision | `open → resolved`; evidence submission/withdrawal may remain `open` | Duplicate normalized key opens; assigned operator with sufficient evidence resolves one winner. Insufficient evidence, multiple winners or stale version leaves open; resolved rejects actions. |
| Legacy nomination | `active → superseded|revoked` | Owner replacement/revocation triggers. Non-active nomination grants no current/estate authority and cannot restore in place. |
| Memorialisation case | `reported → in_review → verifying → memorialised|rejected`; `reported|in_review → contested`; `memorialised → reversed_false_report` | Assigned decision/job triggers. Missing evidence or stale counsel policy blocks transition; contest changes no account state; reversal preserves evidence. |
| Estate representation | `pending → active|rejected|expired`; `active → revoked|expired` | Shard 01c acceptance/revocation after verified memorialisation/legal authority. Nomination alone or expired evidence blocks activation. |

Every unlisted transition returns the named state-conflict code and preserves evidence, authority and audit history.

| Worker | Contract |
|---|---|
| `identifier-verifier:<namespace>` | lease claim/version, send minimum fields, record attempt, apply only current result; provider timeout remains verifying/self-asserted and never routing-eligible |
| `identifier-collision-notifier` | notify affected parties with masked safe context; no claimant contact/legal data |
| `memorialisation-verifier` | execute protected verified decision, revoke sessions/authority, publish marker and retain evidence under policy |
| `legacy-security-notifier` | notify nomination changes, case transitions and authority changes where policy permits |

Events: `identity.identifier.changed.v1 {identifierClaimId}` and `identity.party.memorialised.v1 {personId,caseId}`. Rights/royalty/auth/profile consumers refetch and fail closed. A Queue/provider result is never authority.

- Provider unavailable or no verifier: claim stays self-asserted and non-routing; platform shows source correction path where known.
- Same identifier on two parties: both persist, collision opens, both lose routing/verified presentation until evidence resolves one.
- Registry name mismatch: retain registry and platform values as separate evidence; do not overwrite either; mark mismatch.
- Memorialisation evidence unreviewed/rejected: account/public/authority unchanged.
- Verification commits but session revocation partially fails: account state blocks new requests; revocation job retries and readiness/security alert remains active.
- Estate evidence expires/revokes: representation authority ends immediately; historic actions retain authority snapshot.
- Public suppression removes optional discovery/biography but preserves minimal citations and third-party provenance.

## Contract Test Plan

1. Namespace fixtures cover ISNI per alias, multiple writer/publisher IPI/CAE values, IPN and type-restricted DDEX/DSP IDs.
2. Validate format/capacity/type combinations and prove public registry facts never grant account/party control.
3. Race same normalized identifier claims and verification results; assert one collision, no uniqueness loss, no routing and stale-result evidence only.
4. Test participant/operator collision projections, masked disclosures, withdrawal, evidence resolution and unresolved tie.
5. Verify nomination privacy, one-active supersession, self-only revocation and zero current authority.
6. Prove memorialisation route remains disabled without counsel policy and accepts only configured evidence classes when enabled.
7. Exercise report/review/verify/reject/contest/false-report reversal, session/mandate revocation and idempotent job recovery.
8. Assert nomination/family/member status alone cannot create estate authority and no endpoint impersonates deceased identity.
9. RLS/BOLA tests cover anonymous, wrong participant, nominee, estate candidate, unassigned operator, assigned MFA operator and service job.
10. Scan logs/events/search/analytics for raw identifiers where masked, evidence, statements, legal refs, deceased sessions and provider payloads.

## Deepening and Ambiguity Gate

| Pass | Result |
|---|---|
| Consistency | Namespace registry, claim/collision and protected case contracts use Shard 00/01 versions and errors. |
| Concurrency | Advisory claim lock, claim versions, collision rows, case versions and idempotent jobs resolve races. |
| Cascades | Provider, routing, auth/session, authority, public projection and evidence failures are explicit. |
| Authorization | Viewer, claimant, nominee, reporter, estate, operator and service roles have exact minimum projections. |
| Observability | Routing eligibility, provider attempts, collision age and case/job outcomes are measured with restricted audit. |
| Abuse | Identifier interception, registry-oracle leakage, false death reports, probate overclaim and evidence browsing fail closed. |
| Partial state | No routing on uncertainty, no memorial change before verification and no estate authority without legal evidence. |

Two implementers receive the same endpoint groups, namespace families, claim/collision semantics, counsel gate, state transitions, RLS and tests. Provider-specific registry adapters and numeric evidence retention are protected policy/setup inputs, not permission to weaken defaults.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-03 | Identifier, legacy and memorialisation contract authored | `/write-be-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/01a-auth-account-linking|Authentication, additive login methods and account merge — Backend Specification]]
