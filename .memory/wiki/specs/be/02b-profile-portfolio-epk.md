# Public profiles, portfolio, reel and EPK delivery — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]  
**Deep Dive:** [[specs/ia/deep-dives/02-profiles-verification|Profiles verification deep dive]]  
**Dependencies:** [[specs/be/00-infrastructure|Foundation]], [[specs/be/02a-shadow-claim-ownership|Claim ownership]]

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

- **Shard split:** 2 of 3; PRF-10 through PRF-13.
- **Boundary:** fixed profile composition, asserted section revisions, viewer-safe fact projection, credit-backed portfolio/reel and revocable live EPK/PDF.
- **Approval:** Recommended split accepted under standing autonomy.

## Endpoint Reconciliation

| Flow | Endpoint(s) |
|---|---|
| compose profile | `GET /api/v1/profiles/{partyId}`, portfolio and reel collection reads |
| edit asserted section | `PUT /api/v1/profiles/{partyId}/sections/{sectionCode}` |
| curate portfolio/reel | emphasis PUT; reel item create/reorder/remove |
| EPK | share create/read/revoke and accessible PDF job |

## Projection Invariants

- Composition is fixed `Header → Now → Record → Detail`; users cannot reorder layers, theme, inject HTML/CSS/scripts/URLs or imitate provenance visuals.
- Every fact carries source ID/version, provenance `asserted|attested|confirmed_assertion|creator_asserted|disputed`, evidence class/count, visibility and lifecycle checks. Attester identity/evidence never publishes.
- Portfolio is a query over canonical credit/fact graphs, not a stored document. Private aliases are excluded before totals, collaborators, ranges and counts. Errors/denials/timeouts never render as empty career data.
- Curation changes emphasis/listing only, never credit truth. No completeness score, aggregate provenance score or provenance-based marketplace eligibility floor.
- Credit proves participation, not media rights. Reel requires governed object or approved embed plus ownership/licence/provider-publication basis, role and credit reference.
- EPK default is live public projection. Private alias and member-held credit inclusion is explicit per send with active consent and forwarding warning. Token is view capability, not authentication.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `GET /api/v1/profiles/{partyId}` | UUID; optional locale; public-view context only | `200 { header, now, recordSummary, detail, projectionVersion }`, ETag/public cache | `404 PROFILE_NOT_FOUND`, `422`, `429`, `503 PROJECTION_UNAVAILABLE`, `500` |
| `GET /api/v1/profiles/{partyId}/portfolio` | cursor/limit, registered role/type/date filters | `200 CursorPage<ProfileFact>` computed from visible source set | same plus `422 FILTER_INVALID`; no zero on dependency failure |
| `GET /api/v1/profiles/{partyId}/reel` | cursor/limit | active rights-valid items only | `404`, `422`, `429`, `503`, `500` |
| `PUT /api/v1/profiles/{partyId}/sections/{code}` | strict registry schema/content <=32KiB; ETag/key | `200` active revision, prior archived atomically | `403 PROFILE_EDIT_FORBIDDEN`, `404`, `409 VERSION|IDEMPOTENCY`, `422 SECTION_CONTENT_INVALID`, `428`, `429` |
| `PUT /api/v1/profiles/{partyId}/emphasis` | `{ surface, defaultFilter?, orderedRefs[] }`; ETag/key | `200`; last-write-wins preference, refs must remain visible | `403`, `404`, `409`, `422 EMPHASIS_REF_INVALID`, `428`, `429` |
| `POST /api/v1/profiles/{partyId}/reel-items` | `{ creditId, mediaKind, mediaRef, roleCode, rightsBasis, rightsRef }`; key | `202 JobStatus` for rights/media verification | `403`, `404 CREDIT_NOT_FOUND`, `409 ITEM_EXISTS`, `422 RIGHTS_BASIS_INVALID`, `429`, `503` |
| `PUT /api/v1/reel-items/{id}` | `{ order, listed }`; ETag/key | `200` item | `404`, `403`, `409 VERSION|STATE`, `422`, `428`, `429` |
| `DELETE /api/v1/reel-items/{id}` | ETag/key | `204`; historical reference retained | `404`, `403`, `409`, `428`, `429` |
| `POST /api/v1/epk-shares` | `{ partyId, recipientLabel, purposeCode, selectedFactRefs, privateAliasRefs, memberCreditRefs, expiresInDays }`; key | `201 { id, shareUrl, expiresAt, version }`; token >=128 random bits, default 90d, max 365d | `403 EPK_FORBIDDEN`, `404`, `409 CONSENT_REQUIRED`, `422`, `429` |
| `GET /epk/{token}` | opaque token only | live viewer-safe EPK; no auth; no-store; revoked/expired `404` | `404 EPK_NOT_FOUND`, `429`, `503`, `500` |
| `DELETE /api/v1/epk-shares/{id}` | sender, ETag/key | `204` immediate revocation | `404`, `403`, `409`, `428`, `429` |
| `POST /api/v1/epk-shares/{id}/pdf-jobs` | sender; ETag/key | `202 JobStatus`; accessible snapshot with timestamp/live URL/sources | `404`, `403`, `409 SOURCE_CHANGED|VERSION`, `428`, `429`, `503` |

Section edits record human author and acting party; mandates must carry exact profile-section capability. Profile commands cannot mutate attested/source facts. All private/admin responses are no-store and use Shard 00 errors/idempotency/version rules.

## State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Section revision | `draft → active`; prior `active → archived`; draft may become `rejected` on schema failure without publication | Valid PUT atomically activates one revision and archives prior. Archived/rejected is immutable and cannot become active in place. |
| Emphasis preference | `active → superseded|cleared` | Valid PUT replaces one party/surface version. Invisible/removed references block commit; prior versions never change credit truth. |
| Reel item | `pending_verification → active|rejected`; `active → hidden|removed`; hidden may return `active` after current rights check | Verification/takedown/user command triggers. Missing/expired rights blocks active; removed is terminal and history remains. |
| EPK consent | `active → revoked|expired` | Grantor revoke or expiry triggers. Non-active consent immediately removes private/member-held facts from live projection and cannot be restored in place. |
| EPK share | `active → revoked|expired|empty` | Sender revoke, timer, or loss of every lawful selected fact triggers. Non-active token returns invariant `404`; source change updates live projection without silently changing share purpose. |
| EPK export | `queued → running → succeeded|failed` under Shard 00 JobStatus | Export worker snapshots one source-version set. Source change before render returns `SOURCE_CHANGED`; terminal artifact is immutable. |

Every unlisted transition returns `*_STATE_CONFLICT` and leaves source facts, credits and prior snapshots unchanged.

## Persistence, RLS and Events

| Table | Invariants |
|---|---|
| `profile.section_revisions` | party/section/content/author/acting party/revision/state; one active partial unique; content Zod-validated |
| `profile.fact_projection` | derived source/version/provenance/visibility/sort; version-addressed, never directly edited |
| `profile.emphasis` | party/surface/filter/ordered refs/version; preference only |
| `profile.reel_items` | party/credit/media/role/rights/state/order/version; active only after rights/media checks |
| `profile.epk_consents` | grantor/beneficiary/use/scope/state/expiry/version; revocable |
| `profile.epk_shares` | party/creator/context/token hash/recipient/purpose/selected refs/consents/expiry/revoke/version |
| `profile.epk_open_counts` | share/day/coarse count only; no IP, fingerprint, beacon or cross-site data |
| `profile.epk_exports` | share/source versions/object ref/generated time/job; timestamped immutable snapshot |

Public views structurally exclude legal identity, trader address, shadows, protected evidence and private aliases. RLS grants editors only source-safe revision/emphasis/reel/share RPCs. EPK token lookup uses hash and exact active projection view; token is forbidden from logs/events.

Events: `profile.projection.invalidated.v1 {partyId,sourceType,sourceId}` and `profile.epk.material-change.v1 {epkShareId,sourceType,sourceId}`. Rebuilders compare source/projection versions; stale jobs cannot overwrite. Consent/takedown/source changes remove live content and notify sender but do not revoke the entire share unless no lawful content remains.

## Rate, Observability and Failure Hygiene

| Surface | Rate / SLO | Telemetry |
|---|---|---|
| public profile/portfolio/reel | 120/min/IP; Tier 1 `<750ms` | route/version/cache/result count/dependency class; public success 1% |
| edits/curation | 60/min/user; Tier 2 | section/ref count/outcome/version; audit for source-affecting decisions |
| share create/revoke/export | 20/day/party; export 10/day | share state/purpose class/source count/job; no recipient/token/content |
| public EPK | 120/min/token+IP with abuse challenge | coarse opens/day, duration/material-change state only |

- Projection dependency failure returns degraded/error, never empty list/zero.
- Rights basis expires/takedown arrives: item leaves public/EPK immediately; source credit remains.
- PDF job source changes before render: refetch and render current version or fail `SOURCE_CHANGED`; never silently emit mixed versions.
- Token forwarding is expected and disclosed; recipient label is informational and no email-beacon identity claim exists.

## Contract Test and Ambiguity Gate

Tests cover fixed composition, viewer-relative facts, private-alias pre-aggregation exclusion, section schema/mass assignment, source immutability, rights/takedown races, consent revocation, token entropy/expiry/revocation, no tracking identifiers, PDF accessibility/metadata, RLS/BOLA and log scrubbing. Mandatory deepening passes converge across consistency, concurrency, dependency cascades, authorization, telemetry, abuse and partial-state hygiene. Two implementers receive identical projections, endpoints, cache/error semantics and live-versus-snapshot behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Profile, portfolio, reel and EPK contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/02a-shadow-claim-ownership|Shadow parties, claims, contests and ownership transfer — Backend Specification]]
