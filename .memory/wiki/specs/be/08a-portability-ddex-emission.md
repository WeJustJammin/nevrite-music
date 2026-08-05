# Credit portability and DDEX RIN emission — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]  
**Deep Dive:** None required by the approved IA  
**Credit Boundary:** [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility]]

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

- **Shard split:** 1 of 4; CXR-01 through CXR-05. Complete own-credit portability ships at consumer launch; DDEX RIN generation/emission remains independently capability-gated until identifier, taxonomy, recipient-profile and adapter evidence passes.
- **Boundary:** authorized source selection, portability snapshots, RIN preflight/generation, immutable artifact manifests, delivery evidence, staleness and re-emission.
- **Approval:** Recommended split accepted under standing autonomy.

## Export and Emission Invariants

- Own-credit portability is self-service and includes every credit visible to the requesting party—imported, asserted, contested and embargoed—with actual state/tier/confidentiality. It is never support-gated and never includes another party's hidden record.
- Selection, counts and assembly use authorized Shard 07 projections. Hidden credits leave no omission row, count delta, filename, gap or timing signal; own embargoed records force private, non-share-default delivery.
- Every request pins source IDs/versions/hash, schema/profile/vocabulary versions and authorization scope. Every artifact seals scope, inclusions, safe omissions, degradation/loss declarations, checksums and generated time; mixed-version output is forbidden.
- RIN preflight never mutates source truth. Unresolved identifiers/roles or confidentiality are blocking; representational loss is explicit. Low-tier records are excluded by default and require audited per-credit overrides—never one bulk override.
- `generated` or `emitted` does not mean recipient acceptance. Amendment, retraction or structured-disclosure change marks matching active artifacts stale; score-only confidence changes do not. Re-emission creates a new immutable artifact and claims external supersession only from adapter evidence.
- Artifact lifetime, download TTL and cleanup periods resolve through governed typed settings within code-owned bounds. Receipt/audit metadata survives artifact expiry; blobs use private storage and short-lived actor-bound downloads.

## API Endpoint Matrix

All bodies are strict Zod 4 objects; unknown keys fail. Commands inherit Shard 00 actor, acting-context, request, idempotency, expected-version and exact-source-snapshot envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/credit-exports/preflight` | `PortabilityPreflightRequest`: party, authorized scope, `json|csv|pdf`, locale; credited party/key | `PortabilityPreflightResponse`; visible counts, size estimate, safe gaps and source hash | `403`, `409 SOURCE_STALE`, `422 FORMAT_OR_SCOPE_INVALID`, `429`, `503` |
| `POST /api/v1/credit-exports` | `CreatePortabilityExportRequest`: preflight/source hash, format, delivery preference; credited party/key | `202 OutputRequestResponse`; request/state/version | `403`, `409 SOURCE_STALE|IDEMPOTENCY_MISMATCH`, `422`, `429`, `503` |
| `GET /api/v1/credit-exports/{requestId}` | owner/request authority | `OutputStatusResponse`; state/progress/freshness/safe failure/artifact ID | `403`, `404`, `429`, `503` |
| `GET /api/v1/credit-artifacts/{artifactId}/receipt` | artifact owner/purpose grant | `ArtifactReceiptResponse`; format/profile/scope/omissions/degradation/checksums/manifest/generated time | `403`, `404`, `410 ARTIFACT_EXPIRED`, `429` |
| `POST /api/v1/credit-artifacts/{artifactId}/downloads` | `ArtifactDownloadRequest`: intended use; owner/key | `201 ArtifactDownloadResponse`; actor-bound URL, size, checksum and expiry | `403`, `404`, `409 ARTIFACT_NOT_READY|STALE_CONFIRMATION_REQUIRED`, `410`, `429` |
| `POST /api/v1/ddex/rin/preflights` | `RINPreflightRequest`: credit scope, exact DDEX/profile/recipient versions; authorized exporter/key | `RINPreflightResponse`; blocking/warning/lossy gaps and source hash | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE`, `422 PROFILE_UNAVAILABLE`, `429`, `503` |
| `POST /api/v1/ddex/rin/artifacts` | `GenerateRINRequest`: preflight hash, explicit per-credit low-tier overrides; authorized exporter/key | `202 OutputRequestResponse`; generation request | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE|PREFLIGHT_STALE`, `422 RECIPIENT_REQUIREMENT_UNMET`, `429` |
| `POST /api/v1/ddex/rin/artifacts/{artifactId}/emissions` | `EmitRINRequest`: recipient/profile and exact artifact checksum; delivery capability/key | `202 EmissionResponse`; attempted state, never accepted without evidence | `403 ADAPTER_DISABLED`, `409 ARTIFACT_STALE|DELIVERY_ALREADY_PENDING`, `422`, `429`, `503` |
| `GET /api/v1/credit-emissions/{emissionId}` | exporter/recipient-purpose authority | `EmissionStatusResponse`; generated/attempted/accepted/rejected/unknown evidence state | `403`, `404`, `429`, `503` |
| `POST /api/v1/credit-emissions/{emissionId}/reemit` | `ReemitRequest`: changed-source acknowledgment and target profile; exporter/key | `202 EmissionResponse`; linked successor request | `403`, `409 SOURCE_UNCHANGED|RECIPIENT_STATE_UNKNOWN`, `422`, `429` |

Portability preflight/read is 60/min/person and generation 10/hour/person; receipt/download creation 60/min; RIN preflight 30/min/exporter, generation 10/hour and emission/re-emission 10/hour/recipient. All responses are no-store except actor-bound artifact bytes. Status polling returns `Retry-After`; generation errors never expose hidden row identity.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `reporting.output_requests` / `output_gaps` | kind/requester/context/purpose/source scope/hash/profile/state/key/version and safe blocking/warning/lossy gaps; hidden sources prohibited |
| `reporting.generated_artifacts` / `artifact_credit_snapshots` | private locator/media/schema/profile/checksum/manifest/retention/state and unique artifact/credit-version inclusion/override reason |
| `reporting.emission_records` | artifact/recipient/profile/attempt/evidence/stale reasons/supersession/version; one active attempt per key |
| `reporting.output_audit_events` | immutable actor/context/action/artifact/source/recipient/before-after/request hashes |

RLS permits request/artifact access only to the requester, authorized acting party and expiring purpose grants; recipient adapters receive one sealed artifact and cannot query credit tables. Generation workers use an authorization snapshot plus expected source hash, write a private temporary object, verify checksum/manifest, atomically seal the artifact row and quarantine orphan blobs after failure. Stale workers consume credit/disclosure changes and compare exact snapshot versions. Delivery adapters are idempotent and record `accepted|rejected|unknown`; ambiguous provider outcomes never become success.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Output request | `draft → validating → blocked|generating|failed`; generating `→ generated|failed` | Preflight/authorization/source-hash worker triggers. Hidden source, blocking gap or source drift blocks generation; failed/blocked cannot expose artifact. |
| Generated artifact | `building → sealed`; sealed `→ emitted|stale`; `generated|emitted|stale → superseded` by a new artifact | Checksum/manifest verification, source change and explicit re-generation trigger. Unsealed/orphan blob quarantines; immutable artifact never changes credit snapshot. |
| Emission | `pending → attempting → accepted|rejected|unknown`; unknown `→ accepted|rejected` only by reconciliation evidence | Adapter attempt/evidence triggers. Timeout/ambiguous response stays unknown; terminal provider result is immutable; no evidence means no accepted claim. |
| Artifact staleness | `current → stale → superseded` | Material amendment/retraction/disclosure-version change triggers. Score-only confidence change does not; stale blocks new emission. |

Every unlisted transition returns the typed state/version/source conflict. Events omit hidden credits, artifact content and PII.

## Failure, Deepening and Ambiguity Gate

Tests cover own embargoed inclusion, other-party non-inference, source mutation during generation, duplicate keys, mixed-version rejection, checksum mismatch, orphan blob cleanup, low-tier per-item override, unresolved identifier/role, declared DDEX loss, stale propagation, score-only non-staleness, adapter timeout/unknown, rejected re-emission and false supersession claims. Consumer portability remains available when every DDEX capability is disabled. Logs omit credit titles/parties, artifact contents and signed URLs. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical selection, manifest, staleness and delivery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Portability and DDEX emission contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07c-claims-attestations-confidence-taxonomy|Credit claims, attestations, confidence and taxonomy — Backend Specification]]
