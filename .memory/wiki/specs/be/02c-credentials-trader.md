# Credentials and trader-status assessment — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]  
**Deep Dive:** [[specs/ia/deep-dives/02-profiles-verification|Profiles verification deep dive]]  
**Dependencies:** [[specs/be/00-infrastructure|Foundation]], [[specs/be/01c-relationships-authority-governance|Authority]]

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

- **Shard split:** 3 of 3; PRF-14 through PRF-16.
- **Boundary:** jurisdiction/profile credential records and verification, counsel-authored trader rule packs, declarations, mismatch review and fail-closed listing eligibility.
- **Approval:** Recommended split accepted under standing autonomy.

## Endpoint Reconciliation

| Flow | Endpoint(s) |
|---|---|
| credential record/verify | party credential list/create, verification job, revoke |
| trader declaration | active questionnaire, assessment submit/read |
| mismatch | internal signal ingest, assigned review and decision |

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `GET /api/v1/parties/{partyId}/credentials` | viewer-relative cursor/limit/type/state | `200 CursorPage` with issuer/method/state/expiry safe projection | `404 PARTY_NOT_FOUND`, `422`, `429`, `503`, `500` |
| `POST /api/v1/parties/{partyId}/credentials` | `{ jurisdiction, profileTypeCode, issuer, externalRef?, issuedOn?, expiresOn?, method, evidenceRef? }`; ETag/key | `201` submitted credential; never verified by assertion | `403`, `404`, `409 VERSION|IDEMPOTENCY`, `422 CREDENTIAL_SCHEMA_INVALID`, `428`, `429` |
| `POST /api/v1/credentials/{id}/verification-jobs` | owner or assigned reviewer; ETag/key | `202 JobStatus` adapter/review flow | `404`, `403`, `409 METHOD_UNAVAILABLE|STATE|VERSION`, `428`, `429`, `502/503/504` |
| `DELETE /api/v1/credentials/{id}` | owner/reviewer reason; step-up if verified; ETag/key | `200` revoked record; history remains | `404`, `403`, `409 STATE|VERSION`, `422`, `428`, `429` |
| `GET /api/v1/trader-rule-pack` | `{ jurisdiction, commerceSurface }` | `200` counsel-approved version/question schema/disclosure preview; no pack returns `503 TRADER_RULE_PACK_UNAVAILABLE` | `422 JURISDICTION_UNSUPPORTED`, `429`, `503`, `500` |
| `POST /api/v1/parties/{partyId}/trader-assessments` | `{ jurisdiction, rulePackVersion, answers, disclosureAcknowledgement }`; ETag/key/step-up | `201` `private|trader|undetermined|review_required` and exact public listing fields/effects | `403 STEP_UP_REQUIRED`, `409 RULE_PACK_STALE|VERSION`, `422 ANSWERS_INVALID|DISCLOSURE_NOT_ACKNOWLEDGED`, `428`, `429` |
| `GET /api/v1/parties/{partyId}/trader-status` | self/current commerce authority | current classification/rule version/effective period/listing eligibility | `404`, `403`, `429`, `503`, `500` |
| `POST /internal/v1/trader-mismatch-signals` | named commerce consumer; bounded `{ partyId, signalType, metrics, sourceVersion }`; key | `202`; creates/reuses open signal and moves assessment to review-required | `403`, `409 STALE_SOURCE`, `422`, `429`, `500` |
| `POST /api/v1/trader-reviews/{reviewId}/decisions` | assigned case operator, MFA/reason, ETag/key; `{ decision, rulePackVersion, basisCode }` | `200` valid classification or continued block | `403`, `404`, `409 RULE_PACK_STALE|STATE|VERSION`, `422`, `428`, `429` |

All errors use Shard 00. Credential evidence and trader answers/address are protected/no-store and never returned in public profile. Trader-required legal disclosures belong to governed commerce listings only unless an approved rule pack names another surface.

## Deterministic Rules and Gates

- Credential registry entry defines jurisdiction, profile type, issuer rules, field schema, expiry semantics, evidence class, verification methods and consuming-domain codes. `verified` requires current evidence/method; adapter outage preserves prior status only until policy expiry.
### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Credential | `submitted → reviewing → verified|rejected|unknown`; `verified → expired|revoked|reviewing`; `unknown → reviewing|revoked` | Reviewer/adapter/current evidence or expiry timer triggers. Assertion alone cannot verify; stale/ambiguous provider result cannot advance; expired/revoked remains visible and cannot be restored in place. |
| Credential attempt | `leased → succeeded|failed_retryable|failed_terminal|stale` | Worker result/current record version triggers. Non-current result becomes stale evidence only and cannot change credential. |
| Trader rule pack | `draft → approved → active → superseded|retired` | Qualified approval/admin publication triggers. Missing approval/effective date blocks active; activated version is immutable. |
| Trader assessment | `undetermined → private|trader`; `private|trader → review_required`; `review_required → private|trader|undetermined` | Valid questionnaire classifies; durable mismatch opens review; assigned decision applies current pack. Unsupported/stale pack leaves undetermined and blocks listing publication. |
| Mismatch signal | `open → confirmed|dismissed|superseded` | Current bounded metrics and assigned review trigger. Open signal pauses public listings; terminal signal cannot be reused for a later source version. |
| Trader review | `open → decided|cancelled` | Assigned MFA operator/current rule pack triggers. Stale pack/evidence leaves open; terminal review rejects replay. |

Every unlisted transition returns the typed state/version conflict. Consuming domains own block/warn/notify consequences and cannot silently reclassify the party.
- Trader rule pack contains jurisdiction/effective version/question schema/deterministic classifier/required public fields/disclosure copy+version/commerce effects. Missing, expired or unsupported pack yields `undetermined` and blocks listing publication.
- Initial sale asks situational questions and shows exact future public fields before explicit confirmation. System never silently labels a party trader.
- Durable mismatch signals may use active-listing count, repeat-category velocity, buy/relist pattern and bounded revenue concentration only; no raw buyer/content/payment data. Signal moves to `review_required`, pauses public listings, preserves drafts/orders and requires re-declaration/review.
- US statutory credential names and trader commerce remain disabled until counsel-approved profiles/rule packs exist. Ordinary admins can publish approved versions only; CMS cannot author legal copy/classifiers.

## Persistence, RLS and Workers

| Table | Invariants |
|---|---|
| `profile.credential_type_registry` | protected versioned jurisdiction/profile/schema/method/expiry/consumer rules |
| `profile.credential_records` | subject/jurisdiction/type/issuer/ref/dates/method/evidence/state/version |
| `profile.credential_attempts` | record/version/adapter/reviewer/result/digest/times; append-only |
| `protected.trader_rule_packs` | jurisdiction/version/questions/classifier/disclosure/effects/approval/state; immutable active version |
| `protected.trader_assessments` | party/jurisdiction/answers/pack/classification/effective/state/version |
| `protected.trader_mismatch_signals` | party/type/bounded metrics/source/state/reviewer/times; no raw customer data |
| `protected.trader_reviews` | assessment/signals/assignment/state/decision/basis/version; append-only decisions |

RLS separates public credential state from owner detail/evidence and gives trader data only to self/current commerce authority/assigned operator. Verification workers re-read record/version; stale provider results remain attempt evidence only. Expiry scheduler deterministically transitions current records and emits `profile.credential.changed.v1`. Mismatch worker emits `profile.trader-status.changed.v1`; commerce refetches and pauses before publication.

## Authorization, Rate and Observability

| Surface | Principal | Limit / telemetry |
|---|---|---|
| credential read/create | viewer-safe public or subject/current mandate | reads 300/min user; creates 30/day; type/state/expiry class only |
| verification/revoke | subject or assigned reviewer capability | 10/day/record; provider duration/result, 100% decision audit |
| rule pack/assessment | subject/current commerce authority + step-up submit | 20 reads/min; 5 submissions/day; pack/classification/outcome, no answers |
| mismatch/review | named consumer or assigned MFA operator | internal bounded; admin 10/min; 100% trace/audit |

## Failure and Contract Test Gate

- Provider unavailable/ambiguous: no verified state; retry/reconcile by current version.
- Rule pack changes during assessment/review: `RULE_PACK_STALE`; user sees new disclosure before resubmission.
- Signal false positive: listings remain paused only through review-required policy; dismissal restores prior valid assessment with audit.
- Orders already accepted continue under owning commerce contract; no retroactive cancellation or silent reclassification.
- Tests cover every credential state/expiry, adapter stale results, issuer/evidence rules, counsel-gate disabled states, deterministic classifier fixtures, exact disclosure acknowledgement, mismatch metrics minimization, listing pause/recovery, RLS/BOLA and telemetry redaction.

Mandatory deepening passes converge across cross-endpoint consistency, state races, provider/rule cascades, role completeness, observability, abuse/mass assignment and partial-state hygiene. Two implementers receive identical schemas, states, rule-pack gates, listing effects and error behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Credential and trader contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
