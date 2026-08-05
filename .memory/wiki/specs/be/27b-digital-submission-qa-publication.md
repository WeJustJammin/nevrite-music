# Digital artifact submission, QA, review and publication — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]  
**Deep Dive:** [[specs/ia/deep-dives/27-digital-catalog-delivery|Digital catalog delivery deep dive]]

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

- **Shard split:** 2 of 5; 27.05, 27.06, 27.07, 27.08 and 27.09.
- **Boundary:** immutable vendor submissions, deterministic artifact QA, audio/content QC, independent high-risk review and atomic version publication.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 27 IA/deep dive | submission attestations, QA authority, review/appeal and publication gate |
| Shards 04, 06 and 07 | governed media, case/appeal handling and credit obligations |

## Submission and QA Invariants

- Submission atomically commits immutable artifact digests/manifests, structured contents, source declarations, exact attestations, terms, demos and vendor identity/mandate snapshot.
- Organization attestation requires current mandate to bind the entity; listing-write permission alone is insufficient. Signing or schema conflict blocks submission and preserves draft.
- Deterministic QA records scanner/tool versions, manifest facts, archive safety, malware findings and exact contradictions. Scanner failure blocks any executable path and leaves content pending/retry.
- Audio/content QC may extract technical metadata and content-match signals but never asserts provenance. Only defined listing-lie or safety/legal conditions block.
- Third-party recordings, exact matches and policy-risk submissions require independent conflict-screened review. Automation never silently rejects; findings are reasoned, evidence-linked and appealable.
- Publication requires payout readiness, governed demos, terms, QA, attestations and review. Product/version, artifact, schema, terms and vendor snapshot activate atomically; prior versions never mutate.
- Sample/preset packs require a complete-duration protected `contents_only` audition. `made_with` examples are separately labelled and cannot substitute for contents proof.
- Executable publication is unreachable until reproducible build/malware QA, support verification, incident response, staged rollout, liability and continuity gates pass.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-products/{id}/submissions` | draft/version/artifacts/manifests/terms/attestations/demos/schema versions/key; mandated vendor actor | `201 DigitalSubmissionResponse`; immutable pending submission/checklist | `403 MANDATE_REQUIRED`, `409 SIGNATURE_CONFLICT|VERSION_CONFLICT`, `422 SCHEMA_INVALID`, `429` |
| `POST /internal/v1/digital-submissions/{id}/artifact-qa` | artifact digests/scanner versions/event key; QA worker | `DigitalQaResponse`; checks/findings/blockers/version | `403`, `409 EVENT_REUSED|ARTIFACT_CHANGED`, `422`, `429`, `503 SCANNER_UNAVAILABLE` |
| `POST /internal/v1/digital-submissions/{id}/content-qc` | audio/content refs/tool versions/event key; QC worker | `DigitalContentQcResponse`; technical findings/match signals/version | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/digital-submissions/{id}/reviews` | action/findings/evidence/expected submission version/key; independent eligible reviewer | `201 DigitalReviewResponse`; accepted/rejected/evidence-requested/review version | `403 RECUSAL_REQUIRED|REVIEWER_REQUIRED`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/digital-submissions/{id}/appeals` | challenged findings/reason/evidence/key; vendor principal | `201 DigitalReviewAppealResponse`; queued/standing/deadline | `403`, `409 APPEAL_EXISTS`, `422`, `429` |
| `POST /api/v1/digital-submissions/{id}/publication-preflights` | submission/QA/review/payout/terms/demo/capability versions; vendor editor | `DigitalPublicationPreflightResponse`; pass/gaps/hash/expiry | `403`, `409 SOURCE_STALE`, `422 QA_BLOCKED|PAYOUT_UNREADY|DEMO_REQUIRED|EXECUTABLE_DISABLED`, `429` |
| `POST /api/v1/digital-submissions/{id}/publications` | preflight hash/expected submission version/key; vendor publisher | `201 DigitalProductVersionResponse`; active/pinned versions/public URL | `403`, `409 PREFLIGHT_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- `digital_submission`, immutable artifact/manifest/attestation/terms/demo bindings, QA runs/findings, review/appeal and publication snapshot rows pin vendor, actor, tool, policy and capability versions.
- RLS exposes submissions to authorized vendor actors and assigned reviewers, raw artifacts to purpose-scoped QA/delivery services, and only public-safe published projections publicly. Reviewer conflict and internal risk signals remain private.
- QA/QC, review notification and publication-projection workers are idempotent. Artifact digest mismatch invalidates prior checks; no stale check can activate a changed artifact.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Digital submission | `pending → qa_running → review_required|publication_ready|blocked`; review-required `→ accepted|rejected|evidence_requested`; any source change `→ stale|superseded` | Atomic manifest/attestation/terms/demo/mandate snapshot and QA/review trigger. Signature/schema conflict preserves draft; changed digest invalidates checks. |
| Artifact QA | `queued → scanning → passed|blocked|failed|pending_retry`; failed/pending retries same digest/tool identity | Deterministic scanner/archive/malware checks trigger. Scanner failure blocks executable path and automation never silently rejects. |
| Content QC | `queued → completed|review_required|failed`; result `→ stale` on artifact/tool change | Technical metadata/match signal extraction triggers. It never asserts provenance; only defined lie/safety/legal condition blocks. |
| Independent review/appeal | review `pending → accepted|rejected|evidence_requested`; rejected/blocked `→ appeal_pending → upheld|reversed|remanded` | Conflict-screened reviewer and vendor-principal appeal trigger. Evidence/reasons remain immutable and appealable. |
| Publication | `preflight → active|blocked|stale`; active `→ superseded|withdrawn`; executable type remains capability-blocked | Current payout/demo/terms/QA/attestation/review/capability snapshot triggers atomic activation. Prior versions never mutate. |

Every unlisted transition returns the typed state/version/artifact conflict. Raw artifacts and risk signals remain purpose scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover non-mandated org attestation, artifact/attestation split commit, scanner fail-open, QC-as-provenance, silent automated rejection, conflicted reviewer, appeal suppression, missing contents audition, external purchase link and executable capability bypass. Seven passes converge; two implementers receive identical submission, QA and publication behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Submission, QA and publication contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog delivery]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
