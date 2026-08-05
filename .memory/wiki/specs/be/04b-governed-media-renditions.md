# Governed media, rights, renditions and takedown — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/04-cms-delivery-media|CMS delivery deep dive]]  
**Upload Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]

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

- **Shard split:** 2 of 3; DLV-05 through DLV-08.
- **Boundary:** private media ingest, inspection/quarantine/dedup, use-specific rights/accessibility, deterministic renditions, replacement and urgent revoke/takedown/hold.
- **Approval:** Recommended split accepted under standing autonomy.

## Media Invariants

- Supabase Storage bytes stay private by default; PostgreSQL asset/object/right/reference metadata is canonical. Upload/possession/self-claim proves no rights.
- Admission checks declared/detected MIME, magic, extension, bytes/quota, dimensions/duration/pages, checksum, decompression risk, metadata and scanner. Scanner unavailable/infected stays quarantined.
- Hash dedup may reuse physical bytes but never collapses ownership, rights, consent, retention, accessibility, use or takedown records and reveals no other owner/reference.
- Originals are immutable. Renditions use code-owned transform profile/version plus source checksum for deterministic key and retain lineage. No arbitrary transforms.
- Eligibility intersects active clean asset, purpose/use, territory/term/audience, right/consent/domain state, attribution/accessibility and absence of dispute/takedown/hold.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/media/assets/upload-intents` | purpose/owner/name/MIME/bytes/SHA-256; contributor key | Shard 00 `201` intent + pending asset; 15m private upload | `403`, `404 OWNER_NOT_FOUND`, `409 QUOTA|IDEMPOTENCY`, `413`, `415`, `422`, `429` |
| `POST /api/v1/media/assets/{id}/complete` | bytes/checksum; ETag/key | `202 JobStatus` inspection; never ready immediately | `404`, `409 EXPIRED|STATE|VERSION`, `422 CHECKSUM|SIZE`, `428`, `429`, `502/503/504` |
| `GET /api/v1/media/assets/{id}` | owner/current media capability | asset, inspection, rights/accessibility/reference summary, ETag | concealment-safe `404`, `403`, `429`, `503` |
| `POST /api/v1/media/assets/{id}/rights` | claimant/rightsholder/source/basis/use/territory/term/audience/attribution/consent/evidence; ETag/key | `201` claimed/reviewing right; not verified by assertion | `403`, `409 RIGHT_OVERLAP|VERSION`, `422 RIGHT_SCHEMA_INVALID`, `428`, `429` |
| `PUT /api/v1/media/assets/{id}/accessibility/{use}/{locale}` | decorative or alt/caption/transcript/focal schema; ETag/key | `200` attributable reviewed metadata | `409 ACCESSIBILITY_INCOMPLETE|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/media/assets/{id}/rendition-jobs` | `{ profileKey,profileVersion,useCode,locale,audience }`; ETag/key | existing deterministic rendition or `202 JobStatus` | `409 SOURCE_NOT_READY|RIGHTS_INELIGIBLE|ACCESSIBILITY_INCOMPLETE|PROFILE_RETIRED`, `422`, `428`, `429` |
| `POST /api/v1/media/assets/{id}/replacement-plans` | new asset ID, bounded reference scope, semantic/crop/right decisions; ETag/key | `201` impact plan/job; old refs stay until switch | `409 REPLACEMENT_INELIGIBLE|REFERENCES_CHANGED|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/media/assets/{id}/lifecycle-actions` | strict `replace|revoke|archive|erase|hold|release_hold`, scope/reason/case refs; MFA, ETag/key | `200` state or `202` purge/cleanup job; revoke removes delivery first | `403 STEP_UP_REQUIRED`, `409 HOLD|REFERENCES|RETENTION|STATE|VERSION`, `422`, `428`, `429` |
| `GET /api/v1/media/assets/{id}/references` | cursor/limit/use; owner/curator/operator | exact reverse-reference impact projection | `404`, `403`, `422`, `429`, `503` |
| `POST /api/v1/media/delivery-grants` | asset/rendition/use/audience/disposition/range; current requester context | short-lived signed capability bound to object/checksum/version/user/party | `403 MEDIA_DELIVERY_FORBIDDEN`, `404`, `409 RIGHT_REVOKED`, `422`, `429`, `503` |

Mutations are no-store, strict, idempotent/versioned. Upload intent 20/hour/user and three concurrent; media commands 60/min; rendition 20/hour/asset; urgent lifecycle 10/min and 100% traced/audited.

## Persistence, Workers and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Asset | `pending_upload → uploaded → inspecting → ready|quarantined|rejected`; `ready → archived|revoked|held`; held `→ ready|revoked`; replace creates successor | Upload/inspection/lifecycle command triggers. Scanner unavailable/infected remains quarantined; non-ready never delivers; revoke removes eligibility before purge. |
| Asset-right record | `asserted → active|rejected|disputed`; `active → expired|revoked|disputed|superseded` | Evidence/reviewer/term/dispute triggers. Non-active rights cannot authorize rendition/delivery and never auto-reactivate. |
| Accessibility record | `draft → approved|rejected`; approved `→ stale|superseded` | Curator/reviewer/source change triggers. Required missing data blocks governed use; stale/rejected never satisfies use policy. |
| Rendition | `queued → processing → ready|rejected|quarantined|stale` | Worker/current source-rights-accessibility versions trigger. Stale callback cannot activate; terminal tuple is immutable and deterministic duplicate reuses it. |
| Delivery purge | `pending → running → completed|partial|failed_retryable|blocked` | Revoke/erase/provider worker triggers. Hold/retention/reference blocks byte deletion; urgent partial stays incident-open and cannot report completion. |

Every unlisted transition returns the named state/version conflict; bytes, rights evidence and prior immutable renditions are never silently rewritten.

| Table | Invariants |
|---|---|
| `delivery.asset_records` | owner/purpose/classification/MIME/size/media metadata/checksum/lifecycle/version |
| `delivery.storage_objects` | asset/bucket/server key/upload/scanner/metadata/checksum; key unique |
| `delivery.asset_rights` | claimant/rightsholder/source/basis/use/territory/term/audience/attribution/consent/evidence/state/version |
| `delivery.asset_accessibility` | asset/use/locale/decorative/alt/caption/transcript/focal/author/reviewer/state/version |
| `delivery.transform_profile_versions` | code-owned input/operations/output/a11y/rights/lifecycle/hash |
| `delivery.rendition_records` | asset/source/profile/transform hash/object/metadata/state/version; unique deterministic tuple |
| `delivery.asset_references` | source type/id/version/path, asset/rendition/use/locale/audience/period/version |
| `delivery.delivery_purges` | subject/version/scope/reason/urgent/state/evidence/provider attempts/version |

Inspection streams bytes, detects/strips risky metadata, scans, surfaces duplicate suggestion without tenant data and sets ready only when required checks pass. Rendition worker rechecks rights/accessibility/source, transforms, re-inspects/checksums and stores privately. Urgent revoke marks refs/projections ineligible and creates purge atomically before provider work. Byte deletion waits for no active/retained reference, evidence/dispute/hold/export/backup/retention duty.

RLS gives contributors owner-purpose scope, curators metadata/use review, rights/safety operators assigned case scope and delivery principal one object/use. Signed URLs are server-minted and bind user/party/audience/version/range/disposition/expiry; filenames never become object keys/unsafe headers. Events: asset changed, rendition ready, asset revoked, purge completed.

## Failure, Deepening and Ambiguity Gate

Tests cover polyglot/magic mismatch, malware/scanner outage, archive bomb, metadata attacks, quota, duplicate non-disclosure, rights territory/term/use intersections, accessibility requirements, deterministic rendition dedup, stale callbacks, signed-capability overreach, replacement races, hold/retention and urgent partial purge incidents. Logs contain IDs only when approved/hash classes/state/outcome, never URLs/bytes/evidence. Seven deepening passes converge; micro/macro ambiguity and devil's-advocate checks leave no implicit scanner, rights, retention, delivery or purge behavior. Two implementers receive identical ingest, rights, rendition and takedown behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Governed media and rendition contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/deep-dives/04-cms-delivery-media|Deep Dive 04 — CMS navigation, media and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
