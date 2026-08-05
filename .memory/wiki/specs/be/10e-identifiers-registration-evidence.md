# Rights identifiers, registration and evidence export — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]  
**Deep Dive:** [[specs/ia/deep-dives/10-rights-ownership|Rights ownership deep dive]]  
**Identifier Boundary:** [[specs/be/01d-identifiers-legacy|Identifiers and legacy reconciliation]]

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

- **Shard split:** 5 of 5; RGT-17 through RGT-20. Private possession proof ships at consumer launch; registrant allocation, filing adapters and public lookup remain separately capability-gated.
- **Boundary:** identifier assertion/allocation/reconciliation, universal possession timestamping, user-reviewed registration drafts, publication-safe rights lookup and immutable title-chain exports.
- **Approval:** Recommended split accepted under standing autonomy.

## Identifier and Evidence Invariants

- Every asserted rights object/version receives a source hash/time proof attempt. Anchor success proves possession at time, never authorship, ownership, registration or priority; failure is visible/retryable and never rolls back the object.
- Identifier adapters preflight internal/external existing IDs before allocation, reserve idempotently and reconcile ambiguous provider outcomes. Two valid IDs produce ranked evidence only; authorized owners confirm canonical or open dispute.
- Registration drafts pin jurisdiction/form/group/source versions, surface gaps/deadlines and require user review. No automatic filing and no claim that registration creates copyright. Submission status requires adapter evidence.
- Public lookup uses a dedicated allowlisted projection and is disabled until privacy/policy gates pass. It omits percentages by default, disputes, private economics/evidence/contact and hidden counts.
- Evidence/title-chain exports pin right/territory/period and exact source versions, naming scope, gaps, trust and checksum. Artifact generation never upgrades asserted/imported evidence to consented/registered/clear.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/rights/objects/{objectId}/identifier-preflights` | scheme/registrant/profile/source versions; owner/operator key | `IdentifierPreflightResponse`; existing/conflict/gap/reservation eligibility | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE`, `422 PROFILE_UNAVAILABLE`, `429`, `503` |
| `POST /api/v1/rights/objects/{objectId}/identifier-allocations` | preflight hash/stable request key; approved operator/key | `202 IdentifierAllocationResponse`; reserved/pending/reconciled state | `403 CAPABILITY_DISABLED`, `409 PREFLIGHT_STALE|REQUEST_KEY_MISMATCH`, `422`, `429`, `503` |
| `POST /api/v1/rights/identifier-conflicts/{id}/decisions` | canonical assertion or dispute; authorized owner ETag/key | `IdentifierDecisionResponse`; versioned reconciliation/case link | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/rights/objects/{objectId}/creation-proof` | authorized party | `CreationProofResponse`; source hash/observed time/anchor state/evidence class | `403`, `404`, `429`, `503` |
| `POST /internal/v1/rights/creation-proofs/{id}/retry` | exact source hash/event ID; worker key | `202 CreationProofResponse`; retry state | `403`, `409 SOURCE_HASH_CHANGED|EVENT_REUSED`, `429`, `503` |
| `POST /api/v1/rights/registration-drafts` | jurisdiction/form/group/source versions; authorized registrant/key | `201 RegistrationDraftResponse`; draft/gaps/deadline/manifest | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE`, `422 PROFILE_UNAVAILABLE`, `429` |
| `POST /api/v1/rights/registration-drafts/{id}/renders` | exact reviewed draft/source hash; registrant/key | `202 RegistrationArtifactResponse`; private draft artifact/checksum | `403`, `409 DRAFT_INCOMPLETE|SOURCE_STALE`, `422`, `429`, `503` |
| `GET /api/v1/rights/objects/{objectId}/evidence` | named party/case-purpose viewer | `PrivateRightsEvidenceResponse`; full authorized ledger/title/proof/identifier provenance | `403`, `404`, `429`, `503` |
| `GET /api/v1/public/rights/{publicId}` | public lookup capability | `PublicRightsProjectionResponse`; allowlisted holder/contact/one-stop/provenance only | `404` for disabled/hidden, `429`, `503` |
| `POST /api/v1/rights/evidence-exports` | object/right/territory/period/source snapshot/format; authorized party/key | `202 RightsEvidenceExportResponse`; immutable artifact request | `403`, `409 SOURCE_STALE`, `422 SCOPE_INVALID`, `429` |
| `POST /api/v1/rights/evidence-artifacts/{id}/downloads` | owner/purpose/key | `201 ArtifactDownloadResponse`; private URL/checksum/receipt/expiry | `403`, `404`, `409 ARTIFACT_NOT_READY|ARTIFACT_STALE`, `410`, `429` |

Reads are 120/min/person; identifier preflight 30/min and allocation 10/hour; proof retries use queue budgets; registration 10/hour; public lookup 60/min/IP; exports 10/hour/person. All private responses are no-store.

## Persistence, RLS and Workers

Tables: `rights.identifier_assertions`, `identifier_allocations`, `creation_timestamps`, `registration_drafts`, `public_rights_projections`, `evidence_export_requests`, `evidence_artifacts` and audit events. Provider request keys and source hashes are unique; artifacts use private storage and exact manifests.

RLS is object-party/operator/case-purpose bound. Public access exists only through the allowlisted projection function. Anchor workers retry the same source hash; allocation adapters reconcile unknown outcomes before reserving another code; artifact workers seal checksum/manifests and quarantine partial blobs. No worker auto-files registration or declares copyright.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Identifier preflight | `requested → eligible|existing|conflict|gap|failed`; any result `→ stale` on source/profile change | Adapter preflight and exact source/profile versions trigger. Stale, conflicted or incomplete results cannot allocate. |
| Identifier allocation | `requested → pending → reserved|reconciled|failed|unknown`; unknown `→ reconciled|failed` | Approved operator call and provider evidence trigger. Ambiguous outcome must reconcile under the same request key before another code may be reserved. |
| Identifier conflict | `open → canonical_confirmed|disputed|superseded` | Authorized owner decision with expected version triggers. Ranked evidence never chooses canonical automatically; dispute creates/links governed handling rather than rewriting assertions. |
| Creation proof | `pending → anchored|failed`; failed `→ retrying → anchored|failed`; any state `→ superseded` only by a new source hash/version | Anchor evidence or bounded retry triggers. Retry must retain exact source hash/event identity; success proves possession time only and failure never rolls back the object. |
| Registration draft/artifact | `draft → review_ready|blocked`; review-ready `→ rendering → rendered|failed`; rendered `→ stale|superseded` | Complete pinned jurisdiction/form/group/source versions and explicit registrant review trigger. No state auto-files registration or claims copyright; submission status requires separate adapter evidence. |
| Public rights projection | `disabled → active → hidden|disabled`; active/hidden may become `stale` before governed rebuild | Privacy/policy gate and allowlisted rebuild trigger. Disabled/hidden returns concealment-safe not-found and never leaks percentages, disputes, private evidence/contact or hidden counts. |
| Evidence export/artifact | `requested → generating → ready|failed`; ready `→ stale|expired|superseded`; partial output `→ quarantined` | Exact source snapshot worker/checksum seal/timer triggers. Mixed/stale sources block readiness; quarantined or non-ready artifact cannot download. |

Every unlisted transition returns the typed state/version/hash conflict. Artifact/evidence states never upgrade asserted or imported material to consented, registered or clear.

## Failure, Deepening and Ambiguity Gate

Tests cover provider timeout/retry without second code, two valid identifiers, anchor outage with object survival, changed source hash, auto-registration attempt, false copyright wording, public hidden-percentage/dispute inference, mixed-version export and partial artifact cleanup. Seven passes converge; two implementers receive identical identifier, proof, registration, lookup and export behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Identifier, registration and evidence contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/be/01d-identifiers-legacy|External identifiers, legacy succession and memorialisation — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
