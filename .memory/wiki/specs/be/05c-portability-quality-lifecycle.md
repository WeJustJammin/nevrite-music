# Portability, quality gates and data lifecycle — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]  
**Deep Dive:** [[specs/ia/deep-dives/05-platform-configuration-admin|Configuration deep dive]]  
**Media Boundary:** [[specs/be/04b-governed-media-renditions|Governed media]]

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

- **Shard split:** 3 of 3; CFG-13 and CFG-14.
- **Boundary:** mapped/quarantined imports, allowlisted expiring exports, isolated restore verification, code-owned quality checks and cross-store archive/delete/anonymize/hold/erasure orchestration.
- **Approval:** Recommended split accepted under standing autonomy.

## Portability and Lifecycle Invariants

- Import declares source/version/mapping/provenance/duplicate policy and cannot import authority, ownership, consent, verification, money, rights or legal status as truth.
- Export compiles exact scope/field/object manifest, excludes secrets/unrelated evidence, encrypts where required, checksums, expires, limits downloads and audits every access. Token possession is not authorization.
- Restore is first performed in isolated non-production target and must verify schema, migrations, counts, hashes, references, objects, RLS/RPC, representative rendering, accessibility and absence of secrets. Backup success without restore proof is failure.
- Quality checker registry is code-owned/versioned. Structural/schema/reference, required accessibility, privacy/legal/rights/route and rendition blockers fail publish; readability/style remains warning unless protected policy explicitly elevates it.
- Lifecycle planner enumerates database rows/revisions/projections, objects/renditions, caches/search/sitemap, exports/backups/processors and shared/third-party references. Legal hold wins destruction but grants no broad access. Numeric retention remains counsel-rule-pack gated.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/admin/imports` | scanned private object, source format/version, target scope, mapping version, duplicate policy; key | `201` draft import | `403`, `404 OBJECT_NOT_FOUND`, `409 IDEMPOTENCY`, `422 SOURCE_UNSUPPORTED|MAPPING_INVALID`, `429` |
| `POST /api/v1/admin/imports/{id}/dry-run-jobs` | ETag/key | `202 JobStatus`; create/update/duplicate/conflict/quarantine/unsupported counts and bounded errors | `409 STATE|SOURCE_HASH_CHANGED|VERSION`, `428`, `429`, `503` |
| `POST /api/v1/admin/imports/{id}/run-jobs` | approved exact dry-run/mapping/source hash, ETag/key | `202` resumable bounded batches | `403`, `409 NOT_APPROVED|DRY_RUN_STALE|VERSION`, `428`, `429`, `503` |
| `GET /api/v1/admin/imports/{id}/items` | cursor/class/state | safe row-level status/provenance/error codes | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/admin/exports` | export type, exact scope/field manifests, purpose, expiry<=protected max, downloads; MFA/key | `202 JobStatus` | `403 STEP_UP_REQUIRED|EXPORT_FORBIDDEN`, `422 FIELD_NOT_ALLOWED|SCOPE_TOO_BROAD`, `429` |
| `POST /api/v1/admin/exports/{id}/delivery-grants` | current actor/purpose; ETag/key | one short-lived download capability within count | `403`, `409 EXPIRED|REVOKED|DOWNLOAD_LIMIT|VERSION`, `428`, `429` |
| `DELETE /api/v1/admin/exports/{id}` | reason, ETag/key | `204`; delivery removed before byte cleanup | `403`, `404`, `409`, `428`, `429` |
| `POST /api/v1/admin/restore-verifications` | source artifact/backup, isolated environment, required suite; MFA/key | `202 JobStatus` | `403`, `409 TARGET_NOT_ISOLATED|RUN_EXISTS`, `422`, `429` |
| `POST /api/v1/admin/restore-verifications/{id}/approve` | exact results/hash, distinct reviewer MFA, ETag/key | verified restore evidence; no automatic production promotion | `403 SELF_APPROVAL`, `409 CHECKS_FAILED|RESULT_STALE|VERSION`, `428`, `429` |
| `POST /api/v1/admin/quality-check-runs` | checker/version/target/version; key | `202 JobStatus` or existing exact result | `403`, `409 CHECKER_STALE`, `422`, `429` |
| `GET /api/v1/admin/quality-check-runs/{id}` | target capability | bounded findings/blocking count/evidence refs/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/admin/data-lifecycle-requests` | archive/delete/anonymize/hold/release_hold/erasure, subject/scope/purpose; MFA/key | `201` verifying request | `403`, `409 REQUEST_EXISTS`, `422`, `429` |
| `POST /api/v1/admin/data-lifecycle-requests/{id}/plan-jobs` | ETag/key | `202` cross-store manifest/conflicts/decisions | `409 STATE|VERSION`, `428`, `429`, `503` |
| `POST /api/v1/admin/data-lifecycle-requests/{id}/decisions` | approve/block with counsel rule/basis; assigned distinct operator MFA, ETag/key | approved/blocked plan | `403`, `409 HOLD_CONFLICT|RULE_PACK_MISSING|MANIFEST_CHANGED|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/admin/data-lifecycle-requests/{id}/run-jobs` | approved exact manifest, ETag/key | `202`; store-by-store evidence; partial remains open | `409 NOT_APPROVED|MANIFEST_CHANGED|VERSION`, `428`, `429`, `503` |

All admin routes are no-store, strict, idempotent/versioned and inherit Shard 00 errors/rates. Imports 10/day/operator; exports 5/day with high-risk audit; quality 60/hour; lifecycle 10/day/subject and 100% trace/audit.

## Persistence, Workers and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Import | `draft → dry_running → review_ready|failed`; `review_ready → approved|rejected|stale`; `approved → running → completed|partial|failed|cancelled` | Scan/map/dry-run/reviewer/worker triggers. Source/mapping hash change invalidates approval; unsupported/conflict rows quarantine and cannot become canonical truth silently. |
| Import item | `pending → created|updated|duplicate|conflict|quarantined|unsupported|failed` | Exact row/hash mapper triggers. Terminal row result is immutable; retry reuses source-row key. |
| Export | `queued → running → ready|failed`; ready `→ expired|revoked|exhausted` | Compiler/current authorization/timer/download count/revoke triggers. Non-ready grant blocked; token possession never reauthorizes; delivery removal precedes cleanup. |
| Restore verification | `queued → running → verified|failed|stale`; verified `→ approved|rejected` | Isolated suite/distinct review triggers. Any schema/count/hash/ref/RLS/render/a11y failure blocks verified; approval never promotes production automatically. |
| Quality check | `queued → running → passed|warning|blocked|failed|stale` | Registered checker/current target triggers. Missing/stale checker result cannot pass publish; terminal result bound to target version. |
| Data lifecycle request | `verifying → planning → review_ready|blocked`; `review_ready → approved|rejected|stale`; `approved → running → completed|partial|blocked|failed` | Identity/scope verification, manifest job, counsel decision and per-store workers trigger. Hold/rule/manifest conflict blocks execution; partial remains open with residual manifest. |
| Lifecycle store result | `pending → running → completed|blocked|failed_retryable|failed_terminal` | Exact store action/current hold triggers. Terminal evidence is unique per action; one store cannot imply whole-request completion. |

Every unlisted transition returns the typed state/version conflict and preserves source, evidence, hold and retention history.

| Table | Invariants |
|---|---|
| `quality.import_jobs` | source/object/scope/mapping/duplicate/state/cursor/counts/dry-run/quarantine/actor/version |
| `quality.import_item_results` | job/source row hash/target/action/provenance/state/error; unique row |
| `quality.export_artifacts` | type/scope/fields/object/checksum/encryption/expiry/max+download count/state/actor/version |
| `quality.restore_verifications` | source/isolated target/schema/count/hash/ref/RLS/render/a11y results/reviewer/state/version |
| `quality.checker_definition_versions` | code-owned input/findings/blocking/freshness/lifecycle/hash |
| `quality.check_runs` | checker/target/version/findings/blocking/evidence/state/time |
| `quality.data_lifecycle_requests` | request/requester/subject/scope/verification/store manifest/conflicts/decisions/state/version |
| `quality.lifecycle_store_results` | request/store/processor/count/action/state/evidence/times/error; unique action |

Import worker scans, maps only supported CMS constructs, validates every value/reference, dry-runs, then executes exact source/mapping hash. Imported claims remain source-marked. Export compiler reads allowlisted projections only. Restore verifier cannot write production. Lifecycle workers receive exact per-store actions and current hold/rule decisions; partial/failure remains truthful and residual manifest persists.

Privacy/legal operators receive assigned case projections only. Held data is sealed/minimized and every access audited. Erasure separates subject-owned optional content from jointly authored evidence/obligations; CMS cannot invent legal exceptions. Events: `quality.lifecycle.changed.v1`, diagnostic/quality task updates.

## Failure, Deepening and Ambiguity Gate

- Tests cover import malware/source drift/mapping/duplicate/quarantine/authority smuggling, export field/scope exfiltration/expiry/download/revoke, restore false confidence when RLS/reference/render/a11y fails, checker staleness, complete cross-store manifests, hold conflicts, shared evidence preservation and partial processor completion.
- Logs/metrics contain job/type/store/count/hash class/state/error/duration only, never imported rows, exported fields, evidence or subject content. Seven deepening passes and micro/macro/devil's-advocate checks converge. Two implementers receive identical portability, restore, quality and lifecycle behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Portability, quality and lifecycle contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
- [[specs/ia/deep-dives/05-platform-configuration-admin|Deep Dive 05 — Platform configuration, admin and quality]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
