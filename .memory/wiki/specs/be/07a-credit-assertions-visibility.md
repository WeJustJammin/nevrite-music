# Credit assertions, visibility and graph — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]  
**Deep Dive:** [[specs/ia/deep-dives/07-credits-core|Credit deep dive]]  
**Identity Boundary:** [[specs/be/01b-party-identity-aliases|Party identity and aliases]]  
**Dispute Boundary:** [[specs/be/06a-case-intake-evidence|Trust and safety case intake]]

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

- **Shard split:** 1 of 3; CRD-01 through CRD-07. CRD-17 contest opening is owned by 07c and may produce a successor or party re-point here only through a typed case outcome.
- **Boundary:** immutable credit assertions, viewer-relative ledger/discography/graph projections, confidentiality and embargo, owner display ordering, party-shell re-pointing and superseding corrections.
- **Approval:** Recommended split accepted under standing autonomy.

## Credit and Visibility Invariants

- A credit names one party or unresolved shell, one role version or retained bounded literal, one work, `recording|composition|both` scope, zero or more instruments, distinct contribution/assertion dates and the actual asserter. It never creates ownership, rights, splits, payment or contractual authority.
- One active canonical row exists per `party_or_shell + role_identity + work + scope`. Concurrent equivalent assertions attach source/evidence references to that row; materially different party, role, work or scope changes require a successor.
- Credits, visibility, ordering, curation, corrections and merge decisions are versioned and append-only. `not_in_final_master` and similar qualifiers preserve contribution truth and cannot widen confidentiality.
- Authorization and confidentiality run before count, cursor, graph traversal, search, cache, notification or export. Embargoed and confidential credits are 404-equivalent and leave no public cardinality, timing or cache trace.
- Public eligibility is the intersection of record confidentiality, effective release/lift, party-page curation and current policy. Public records group by role family, then explicit pins, then reverse chronology; billing order remains a separate owner assertion.
- People never auto-merge. A knowledgeable party approves the exact re-point manifest; rejection is a permanent negative assertion. Re-pointing preserves each credit's visibility, history and evidence.
- Embargo lift requires an authorized manual decision, a release event, or verified public evidence after a 72-hour objection window. Lift is one-way except a seven-day retracted-release recovery; exposure windows remain permanently auditable.

## API Endpoint Matrix

All request and response bodies are strict Zod 4 objects; unknown keys fail. Commands inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/works/{workId}/credits` | `AssertCreditRequest`: party-or-shell, role version-or-literal, scope, recording/composition IDs, instruments, qualifier, dates, confidentiality, source refs; participant/mandate | `201 CreditVersionResponse`; canonical credit/version/hash and evidence attachment result | `409 CREDIT_ACTIVE_CONFLICT|IDEMPOTENCY_MISMATCH`, `422 ROLE_OR_SCOPE_INVALID|PARTY_WORK_MISMATCH`, `429`, `503` |
| `GET /api/v1/works/{workId}/credits` | `CreditLedgerQuery`: state, role family, cursor, limit<=100; viewer context | `CreditLedgerPage`; post-authorization items/count/cursor/freshness | concealment-safe `404`, `422 CURSOR_INVALID`, `429`, `503` |
| `GET /api/v1/parties/{partyId}/discography` | `DiscographyQuery`: role family, chronology cursor, limit<=50; public or authorized viewer | `DiscographyPage`; grouped lines, plain-language provenance, freshness | `404`, `422`, `429`, `503` |
| `GET /api/v1/credits/graph` | `CreditGraphQuery`: start ID, path kind, max depth<=3, cursor, limit<=50; professional capability or fan-safe mode | `CreditGraphPage`; visible paths/explanations or explicit sparse degradation | `403 GRAPH_SCOPE_FORBIDDEN`, `404`, `422 GRAPH_QUERY_INVALID`, `429`, `503` |
| `PUT /api/v1/works/{workId}/credit-order` | `CreditOrderRequest`: ordered visible credit IDs; work/release-owner ETag/key | `CreditOrderVersionResponse`; display-only version | `403`, `409 CREDIT_SET_CHANGED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `PUT /api/v1/parties/{partyId}/discography/{creditId}` | `DiscographyCurationRequest`: listed/unlisted and optional pin rank; party authority ETag/key | `DiscographyCurationResponse`; curation version, no ledger change | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/credits/{creditId}/visibility-versions` | `VisibilityVersionRequest`: target confidentiality, basis, effective time, evidence refs; permitted participant/Producer authority ETag/key | `201 VisibilityVersionResponse`; version, effective state, purge/publication job | `403 VISIBILITY_RATCHET_FORBIDDEN`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/credits/{creditId}/embargo-lifts` | `EmbargoLiftRequest`: basis kind, release event/evidence, requested time; authorized actor/key | `202 EmbargoLiftResponse`; lifted or objection-window state/deadline | `403`, `404`, `409 LIFT_ALREADY_PENDING|VERSION_CONFLICT`, `422 EVIDENCE_INSUFFICIENT`, `429` |
| `POST /api/v1/credits/{creditId}/embargo-objections` | `EmbargoObjectionRequest`: closed-ground reason/evidence refs; credited participant/key | `201 CaseLinkResponse`; status quo retained and Shard 06 case linked | `403`, concealment-safe `404`, `409 WINDOW_CLOSED|DUPLICATE_OBJECTION`, `422`, `429` |
| `POST /api/v1/credits/{creditId}/amendments` | `CreditAmendmentRequest`: successor fields, reason, evidence refs; authorized actor ETag/key | `201 AmendmentResponse`; proposal hash, required parties, reminder/escalation schedule | `403`, `404`, `409 AMENDMENT_OPEN|VERSION_CONFLICT`, `422 ORDINARY_PARTY_CHANGE_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/credit-amendments/{amendmentId}/responses` | `AmendmentResponseRequest`: agree/refuse and optional evidence; required party ETag/key | `AmendmentStateResponse`; awaiting/applied/disputed/correction-blocked | `403 RESPONDER_INELIGIBLE`, `404`, `409 RESPONSE_EXISTS|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/credit-party-merges` | `PartyMergeProposalRequest`: candidate IDs, evidence refs, exact affected-credit manifest; knowledgeable party/key | `201 PartyMergeProposalResponse`; immutable proposal/manifest | `403`, `409 NEGATIVE_ASSERTION_EXISTS|MERGE_OPEN`, `422 PERSON_AUTO_MERGE_FORBIDDEN`, `429` |
| `POST /api/v1/credit-party-merges/{proposalId}/decision` | `PartyMergeDecisionRequest`: approve/reject, reviewed manifest hash, reason; distinct knowledgeable reviewer ETag/key | `PartyMergeDecisionResponse`; re-point job or permanent negative assertion | `403`, `409 MANIFEST_CHANGED|VERSION_CONFLICT`, `422`, `428`, `429` |

Public reads are 120/min/IP and authenticated ledger reads 240/min/person; graph is 30/min fan or 120/min professional; assertions/curation 60/min; visibility/corrections/merge 20/min. Public responses may use 60-second cache plus 300-second stale-while-revalidate only with authorization-safe keys; private responses are no-store. All commands and privileged reads are audited.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `credit.work_credits` / `credit.credit_instruments` | immutable assertion versions; partial unique active canonical key and unique credit/instrument pair; party/shell/work/role/scope and visibility indexes |
| `credit.credit_sources` / `credit.assertion_evidence` | additive source, asserter, evidence and import/session references; unique source/hash; no provenance promotion by existence |
| `credit.credit_visibility_versions` | effective interval, source/inheritance, release evidence, objection case and exposure audit; one current version per credit |
| `credit.credit_order_assertions` / `credit.discography_curations` | owner-scoped display versions and party-page listed/pin state; foreign keys cannot widen ledger access |
| `credit.credit_amendments` / `credit.amendment_responses` | original/successor proposal hash, required-party snapshot, immutable responses and day 3/10/14 schedule |
| `credit.party_merge_assertions` / `credit.party_merge_manifest_items` | candidate pair, reviewer evidence, decision/negative assertion and exact versioned re-point set |
| `credit.public_projection_versions` | authorization-safe work/party lines, counts, graph edges, source version set, freshness and active pointer |

RLS grants public access only through security-definer projection queries that apply effective visibility before aggregation. Credited parties retain scoped embargoed read/export; Producers cannot erase contributions or lift another party's stricter confidentiality; owner ordering never changes ledger truth. Workers consume record/visibility/provenance/case outcomes through the transactional outbox, build exact-version projections, atomically switch active pointers and purge restrictive changes within 60 seconds. Permissive publication may lag with a freshness label; restrictive failure is fail-closed.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Credit | `asserted → acknowledged|contested`; `asserted|acknowledged|contested → superseded|withdrawn` | Assertion/participant action/case outcome/amendment triggers. Source addition never promotes state; superseded/withdrawn immutable and cannot erase contribution history. |
| Visibility | `confidential|embargoed → lift_pending → public`; timely objection returns `lift_pending → embargoed`; public may return to embargoed only for verified seven-day release retraction | Authorized decision/release evidence/objection triggers. Stricter participant policy, stale evidence or open objection blocks public; exposure remains audited. |
| Amendment | `draft → proposed → awaiting_agreement → applied|disputed|correction_blocked`; proposed may be `withdrawn|expired` | Proposal/required responses/deadline/case trigger. Party-change outside amendment path, stale original or missing approver blocks apply. |
| Party merge | `proposed → approved|rejected`; approved `→ repointing → complete|failed` | Distinct knowledgeable review and exact manifest job trigger. Negative assertion/manifest drift blocks approval; failure never partially hides original identity. |
| Public projection | `building → active|failed|blocked`; prior active `→ superseded|purged` | Exact-version worker/current visibility triggers. Restrictive change purges fail-closed; stale builder cannot switch pointer. |

Every unlisted transition returns the typed state/version conflict. Events omit hidden existence/internal confidence.

## Failure, Deepening and Ambiguity Gate

Tests cover concurrent equivalent and conflicting assertions, stale acting context, source accretion, public count/cache non-inference, sparse graph degradation, fan path limits, restrictive purge outage, objection/lift races, seven-day release retraction, amendment reminder/non-response, orphaned approvers, manifest drift, rejected merge persistence and case-outcome replay. Material successor changes invalidate supporting attestations through 07c; instrument, qualifier and taxonomy completion do not. Logs omit hidden record existence, private evidence and PII. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical canonical-key, projection, embargo, correction and merge behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Credit assertion, visibility and graph contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/deep-dives/07-credits-core|Deep Dive 07 — Credit graph, capture and confidence]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
