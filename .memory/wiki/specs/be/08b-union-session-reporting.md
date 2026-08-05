# Union and performer session reporting — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]  
**Deep Dive:** None required by the approved IA  
**Session Boundary:** [[specs/be/07b-session-capture-offline|Session roll and contribution capture]]

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

- **Shard split:** 2 of 4; CXR-06 and CXR-07. The complete domain is later activation; routes remain unreachable until approved US form profiles and institution/counsel capability evidence are enabled.
- **Boundary:** versioned AFM/SAG-AFTRA-oriented form profiles, fact-to-field mapping, human declarations, exact rendered certification and evidence. Automated union submission is absent, not a disabled shortcut.
- **Approval:** Recommended split accepted under standing autonomy.

## Union Reporting Invariants

- Reports derive only approved session, roll and contribution facts. Union membership, performer classification, jurisdiction, rates, waivers and declarations are never inferred from credits, identity, attendance, employer data or prior reports.
- Each report pins one approved organization/form/version and exact source versions. Profile changes never rewrite an existing draft or certificate; a new draft is required.
- Every derived value is visibly source-labelled and individually reviewable. Missing required values remain gaps for human entry or source remediation; the platform never silently fills a consequential field.
- Certification signs the exact rendered artifact checksum, source manifest, signer person/acting authority, declarations and consequence disclosure. The signer—not WeJammin—certifies correctness.
- Certified means human-signed only. No route, worker or status represents `submitted` until a later separately approved provider/legal contract exists and returns evidence; downloadable certification remains valid without an adapter.
- Reporting profiles and capability gates are versioned governed configuration with approval evidence. No administrator or support grant can bypass an absent profile, counsel gate or signer authority.

## API Endpoint Matrix

All bodies are strict Zod 4 objects; commands inherit Shard 00 actor, acting-context, idempotency, expected-version and source-snapshot envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/union-reporting/profiles` | organization/form/effective date query; eligible Producer/session authority | `UnionProfilePage`; approved versions and required declaration summaries | `403 CAPABILITY_DISABLED`, `404 PROFILE_UNAVAILABLE`, `422`, `429` |
| `POST /api/v1/union-reports/preflight` | `UnionReportPreflightRequest`: session/version, profile/version, performers; Producer/session owner | `UnionReportPreflightResponse`; mapped facts, gaps and declaration checklist | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE`, `422 PROFILE_OR_SESSION_INVALID`, `429`, `503` |
| `POST /api/v1/union-reports` | `CreateUnionReportRequest`: preflight hash, selected performers; authorized actor/key | `201 UnionReportResponse`; draft/version/source manifest | `403`, `409 SOURCE_STALE|REPORT_EXISTS`, `422`, `429` |
| `PATCH /api/v1/union-reports/{id}` | `UpdateUnionReportRequest`: explicit field declarations and evidence refs; report editor ETag/key | `UnionReportResponse`; new draft version and remaining gaps | `403`, `404`, `409 PROFILE_CHANGED|VERSION_CONFLICT`, `422 DECLARATION_INVALID`, `428`, `429` |
| `POST /api/v1/union-reports/{id}/renders` | `RenderUnionReportRequest`: exact report/source/profile versions; authorized editor/key | `202 UnionRenderResponse`; immutable render job | `403`, `409 SOURCE_STALE|REPORT_INCOMPLETE`, `422`, `429`, `503` |
| `POST /api/v1/union-reports/{id}/certifications` | `CertifyUnionReportRequest`: artifact checksum, signer authority, explicit consequence acceptance, declaration attestations; signer step-up/ETag/key | `201 UnionCertificationResponse`; signed version/evidence/download ID | `403 SIGNER_INELIGIBLE|STEP_UP_REQUIRED`, `409 ARTIFACT_OR_SOURCE_STALE|VERSION_CONFLICT`, `422 DECLARATION_INCOMPLETE`, `428`, `429` |
| `GET /api/v1/union-reports/{id}` | report party/signer/purpose grant | `UnionReportResponse`; source-labelled fields/gaps/state/version | `403`, `404`, `429`, `503` |
| `POST /api/v1/union-reports/{id}/downloads` | certified/draft permission and intended use | `201 ArtifactDownloadResponse`; private signed URL/checksum/expiry | `403`, `404`, `409 RENDER_NOT_READY`, `410`, `429` |

Reads/preflights are 60/min/person; draft writes 30/min/report; renders 10/hour/report; certifications 5/hour/signer with step-up and 100% audit; downloads 30/min. Every route returns `403 CAPABILITY_DISABLED` before source existence checks while the domain is inactive. No submission endpoint exists.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `reporting.union_form_profiles` | organization/form/version/mappings/declarations/effective interval/approval evidence/gate state; immutable once approved |
| `reporting.union_reports` / `union_report_performers` | session/profile/source manifest/state/version and performer mappings/explicit fields/evidence/gaps |
| `reporting.union_report_renders` / `union_certifications` | exact rendered checksum/private locator and signer/authority/declarations/consequence evidence/signature time/version |

RLS is session/report-party and purpose bound; operators may provide approved room facts but cannot certify performer status, while reporting admins can version profiles but cannot edit reports or source facts. The mapper reads authorized capture projections, records provenance for every populated field and never copies protected facts into broader staff search. The render worker fails on any source/profile mismatch, seals a private immutable artifact and emits no provider intent.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Union form profile | `draft → reviewed → approved|rejected`; approved `→ retired|superseded` | Qualified review/effective-version publication triggers. Missing gate evidence blocks approved; approved/terminal immutable. |
| Union report | `draft → ready_to_render → rendered → certified|superseded`; source/profile change from draft/rendered creates `stale` and requires new draft | Editor/validation/render/signer triggers. Gaps, stale profile/source or missing signer authority blocks advancement; certified is human-signed only. |
| Render | `queued → rendering → sealed|failed|stale` | Worker/current report hash triggers. Mixed/stale source cannot seal; sealed artifact immutable. |
| Certification | `pending → certified|rejected|expired` | Authorized human signature/expiry triggers. Worker/provider cannot certify; non-certified status never says submitted. |

Every unlisted transition returns the typed state/hash/version conflict. Workspace event omits union identifiers, rates, declarations and content.

## Failure, Deepening and Ambiguity Gate

Tests cover disabled-capability non-enumeration, unsupported form/version, profile change during edit, stale source, missing membership/rate/jurisdiction, derived-value review, unauthorized operator certification, signer authority expiry, unchecked consequence disclosure, render crash/checksum mismatch, immutable prior certification and attempted silent submission. No fixture permits inferred membership or platform certification. Logs omit performers, union identifiers, rates, declarations and artifact URLs. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical mapping, gating, certification and no-submission behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Union session reporting contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
- [[specs/be/07b-session-capture-offline|Session roll, contribution capture and offline merge — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/08a-portability-ddex-emission|Credit portability and DDEX RIN emission — Backend Specification]]
