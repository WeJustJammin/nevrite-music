# Organizations, relationships, mandates and governance — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]  
**Deep Dive:** [[specs/ia/deep-dives/01-identity-authority|Identity authority deep dive]]  
**Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]  
**Party Boundary:** [[specs/be/01b-party-identity-aliases|Person, aliases and acting context]]

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

- **Shard split:** 3 of 4.
- **Boundary:** IDA-06 through IDA-14: organization creation/lifecycle/types, membership, representation, mandates, band governance/name statements, treasury authority and successor/fork lineage.
- **Non-ownership:** This shard records and resolves authority. It does not hold pooled funds, calculate commissions/tax, sign legal agreements, adjudicate name ownership or rewrite downstream business facts.
- **Approval:** Recommended split accepted under the owner's standing autonomy delegation.

## Referenced Material Inventory

- [[specs/ia/01-identity-authority|IA Shard 01]] interactions IDA-06–14, organization/relationship/governance contracts, access and events.
- [[specs/ia/deep-dives/01-identity-authority|Identity deep dive]] deterministic policies, relationship fields/states, ten-step authority resolution, band defaults and concurrency.
- [[specs/be/00-infrastructure|Backend foundation]] protected/high-risk commands, errors, audit/outbox, jobs and observability.
- [[specs/be/01b-party-identity-aliases|Party and alias backend]] canonical parties and acting-context bindings.

## Endpoint Reconciliation

| IA interaction | Endpoint group | Disposition |
|---|---|---|
| IDA-06 Organization creation | create/read/update organization | Authored |
| IDA-07 Types | add/remove type commands | Authored |
| IDA-08 Membership | invitation, assertion, accept/reject, end and retroactive confirmation | Authored |
| IDA-09 Representation | propose, accept/reject, revoke | Authored |
| IDA-10 Mandate | grant/revoke and authority projection | Authored |
| IDA-11 Governance | propose, confirm/reject, withdraw and activation | Authored |
| IDA-12 Name ownership | append/supersede statement | Authored; record-only |
| IDA-13 Treasury authority | shared resolver + explain endpoint | Authored; no money movement |
| IDA-14 Lifecycle | close/reopen, dissolve and successor creation | Authored |

## Common Domain Contracts

- Organization type and relationship activity/domain/capacity values come from protected versioned registries. Unknown values never become live by user input.
- One authenticated human acts as one explicit party per command. Subject, principal, beneficiary and recipient IDs remain separate.
- Every mutable command requires Shard 00 idempotency and `If-Match`; create/propose commands require idempotency. Every authority-changing commit writes authority-source snapshot, audit and outbox atomically.
- Organization lifecycle and ownership state are orthogonal. Different legal/payable identities require separate affiliated parties; multi-type is permitted only when legal/payable identity is shared.

## API Endpoints

### Organization Resources

`POST /api/v1/organizations` accepts strict body `{ mode, displayName, typeCode, externalReference? }`; mode is `self_member|shadow_custodial|external_reference`, name 1–120 normalized code points, type registered, and external reference allowed only in external-reference mode. Required idempotency. Example `{ "mode":"self_member","displayName":"The Night Owls","typeCode":"band" }`.

`201` returns `{ organization, ownership, initialMembership, duplicateSignals, version }`. Duplicate detection is type-aware, p95 `<500ms`, hard-bounded at two seconds and never auto-merges or permanently denies by count. On timeout, creation commits and a dedupe job continues. Friction review begins above three organizations/24h or ten lifetime/person.

Errors: `401`, `403 ORGANIZATION_CREATION_FORBIDDEN`, `409 IDEMPOTENCY_CONFLICT`, `422 ORGANIZATION_MODE_INVALID|ORGANIZATION_TYPE_INVALID|DISPLAY_NAME_INVALID`, `429 ORGANIZATION_CREATION_REVIEW|RATE_LIMITED`, `503`, `500`.

`GET /api/v1/organizations/{organizationId}` returns viewer-safe canonical identity, active types, lifecycle/ownership state and version. Membership/governance/authority details require their scoped projections. Anonymous sees only publication-approved fields; authenticated private access follows relationship policy. Errors: `404 ORGANIZATION_NOT_FOUND`, `422`, `429`, `503`, `500`.

`PATCH /api/v1/organizations/{organizationId}` accepts only `displayName` and allowed ordinary identity fields; required current owner/admin capability, ETag/idempotency. It cannot change kind, legal/payable identity, lifecycle, ownership state or authority. Errors: `401`, `403`, `404`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### Organization Type Commands

`POST /api/v1/organizations/{organizationId}/types` body `{ typeCode }`; owner/admin, ETag/idempotency. `200` returns organization/type projection. `DELETE /api/v1/organizations/{organizationId}/types/{typeCode}` uses the same preconditions and returns `200` after closing the active assignment. Removal hides type-owned surfaces but preserves records/history; live type obligations block removal with safe blocker codes.

Errors: `401`, `403`, concealment-safe `404 ORGANIZATION_NOT_FOUND|TYPE_NOT_ACTIVE`, `409 TYPE_ALREADY_ACTIVE|TYPE_HAS_LIVE_OBLIGATIONS|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 ORGANIZATION_TYPE_INVALID`, `428`, `429`, `503 OBLIGATION_PROJECTION_UNAVAILABLE`, `500`.

### Membership Commands

`POST /api/v1/organizations/{organizationId}/membership-invitations` body `{ personId, capacity, startsOn, currentTermsVersionId? }`; current membership-admin capability, organization ETag/idempotency. Capacity is `permanent|touring|staff|honorary`; prospective current authority always requires invitation and acceptance. `201` returns invited tenure with seven-day default invitation expiry from protected policy.

`POST /api/v1/organizations/{organizationId}/membership-assertions` body `{ personId, capacity, startsOn, endsOn?, provenance, visibilityEmbargoUntil? }`; creates historical/non-authoritative `asserted` tenure. It cannot grant current authority. Embargo is at most 180 days and auto-publishes on expiry; either party may publish earlier.

`POST /api/v1/membership-tenures/{tenureId}/accept` recipient self only; body `{ decision:"accept", currentTermsVersionId }`; tenure ETag/idempotency. Acceptance locks invitation, current governance terms and member set. Stale/missing current terms returns `409 TERMS_ACCEPTANCE_STALE`. Permanent band membership seeds defaults only after commit.

`POST /api/v1/membership-tenures/{tenureId}/reject` recipient self; version/idempotency; terminal rejection, no authority.

`POST /api/v1/membership-tenures/{tenureId}/end` body `{ effective: "now"|"retroactive", endsOn?, reasonCode }`; either party may end now and authority revokes immediately. Retroactive end creates a counterpart confirmation proposal; history remains unchanged until confirmation.

`POST /api/v1/membership-end-proposals/{proposalId}/confirm` counterpart self; body `{ decision:"confirm"|"reject" }`; version/idempotency. Confirmation changes historical end only; immediate authority revocation remains effective regardless of contest.

Membership errors: `401`, `403 MEMBERSHIP_FORBIDDEN`, concealment-safe `404 MEMBERSHIP_NOT_FOUND|PERSON_NOT_FOUND`, `409 MEMBERSHIP_STATE_CONFLICT|MEMBERSHIP_OVERLAP|TERMS_ACCEPTANCE_STALE|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 CAPACITY_INVALID|DATE_RANGE_INVALID|PROVENANCE_INVALID`, `428`, `429`, `503`, `500`.

### Representation Commands

`POST /api/v1/representations` body `{ principalPartyId, representativePartyId, activities, domains, territories, startsAt, endsAt, communicate, ceilingMinor?, currency?, agreementRef? }`; proposer must be one party with authority to propose. Arrays are non-empty registered unique values; territories are ISO-3166-1 alpha-2 values or sole `WORLDWIDE`; end follows start. Null ceiling means no monetary authority; monetary acts require explicit non-negative integer minor amount and ISO currency. `201` creates `pending` edge.

Exact overlapping active scope requires `{ overlapAcknowledgement:true }` from both parties; partial domain/territory/term overlap returns warning but does not block. Consumer launch records optional external agreement reference only—no signing or commission calculation.

`POST /api/v1/representations/{representationId}/accept` counterparty self/authorized party; ETag/idempotency and body `{ decision:"accept", overlapAcknowledgement? }`; starts authority only if current time is within term. `reject` endpoint is identical with decision reject. `DELETE /api/v1/representations/{representationId}` permits either authorized party to revoke immediately; history remains.

Errors: `401`, `403 REPRESENTATION_FORBIDDEN`, `404 REPRESENTATION_NOT_FOUND|PARTY_NOT_FOUND`, `409 REPRESENTATION_SCOPE_OVERLAP|REPRESENTATION_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 ACTIVITY_INVALID|DOMAIN_INVALID|TERRITORY_INVALID|TERM_INVALID|CEILING_INVALID`, `428`, `429`, `500`.

### Mandate and Authority Endpoints

`POST /api/v1/relationships/{relationshipType}/{relationshipId}/mandates` body `{ activities, domainsMode, domains, communicate, ceilingMinor?, currency?, startsAt, endsAt }`; relationship type is `membership|representation|estate`. Grantor must currently hold every granted activity/domain/ceiling and cannot delegate beyond term/scope. `domainsMode:"all"` requires empty domains; explicit requires non-empty registered domains. `201` returns mandate and refreshed projection.

`DELETE /api/v1/mandates/{mandateId}` requires current grantor or principal revocation capability, ETag/idempotency. Revocation is immediate and atomically invalidates authority projections/bindings, audits and emits `identity.acting-context.revoked.v1` plus relationship changed event.

`GET /api/v1/organizations/{organizationId}/authority/me` returns `{ actingPartyId, relationshipId, mandateId, activities, domains, communicate, ceiling, term, sourceVersion }` for the current human, or `404 AUTHORITY_NOT_FOUND`. It is an explanation/read model, not an authorization token; every command recalculates.

Mandate errors: `401`, `403 MANDATE_FORBIDDEN|DELEGATION_EXCEEDS_AUTHORITY`, `404 RELATIONSHIP_NOT_FOUND|MANDATE_NOT_FOUND|AUTHORITY_NOT_FOUND`, `409 MANDATE_OVERLAP|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `503 AUTHORITY_PROJECTION_UNAVAILABLE`, `500`.

### Governance and Name Statements

`POST /api/v1/organizations/{organizationId}/governance-terms` body `{ terms, documentHash, supersedesId? }`; proposer needs governance capability, ETag/idempotency. Terms use a strict versioned schema for decision thresholds, name disposition, treasury ceilings and dissolution rules; no arbitrary executable rules/legal prose. `201` creates immutable `proposed` version and snapshots all current confirmed permanent members. Defaults remain active until unanimous confirmation.

`POST /api/v1/governance-terms/{termsId}/decisions` member self only; body `{ decision:"confirm"|"reject", documentHash }`; ETag/idempotency and recent step-up. Hash/version/member-set mismatch conflicts. Final required confirmation atomically activates terms, supersedes prior version, rebuilds mandate projection and emits `identity.governance.activated.v1`. Any rejection makes the proposal rejected; content cannot be edited.

`POST /api/v1/governance-terms/{termsId}/withdraw` proposer with current capability; only proposed terms, version/idempotency. `200` returns withdrawn version; current/default authority remains.

`POST /api/v1/organizations/{organizationId}/name-ownership-records` body `{ owners, disposition, trademarkReference? }`; governance-authorized, step-up, ETag/idempotency. `201` appends/supersedes a statement attributable to actors/current terms. The API labels trademark reference `self_supplied_unverified` and makes no search, clearance, registry or legal conclusion.

Errors: `401`, `403 STEP_UP_REQUIRED|GOVERNANCE_FORBIDDEN`, `404 ORGANIZATION_NOT_FOUND|TERMS_NOT_FOUND`, `409 TERMS_MEMBER_SET_CHANGED|TERMS_HASH_MISMATCH|TERMS_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 GOVERNANCE_TERMS_INVALID|NAME_DISPOSITION_INVALID`, `428`, `429`, `500`.

### Organization Lifecycle Commands

`POST /api/v1/organizations/{organizationId}/close` body `{ reasonCode }`; lifecycle capability, step-up, ETag/idempotency. Finite resolvable obligation codes block closing; indefinite/unresolvable assertions cannot create a permanent veto. `200` returns `closed` and recorded dispositions after the protected close job completes, otherwise `202 JobStatus`.

`POST /api/v1/organizations/{organizationId}/reopen` applies only to `closed`, never `dissolved`; same high-risk preconditions. `200` returns active lifecycle and a new version without rewriting history.

`POST /api/v1/organizations/{organizationId}/dissolve` band only; body `{ termsVersionId, dispositions, acknowledgementCodes }`; follows active governance decision rule, step-up and protected job. It notifies affected non-members but grants no vote unless active recorded terms do. `dissolved` is terminal.

`POST /api/v1/organizations/{organizationId}/successors` body `{ displayName, typeCodes, lineageReason, copiedPublicFields }`; allowed only after dissolved or approved fork, high-risk version/idempotency. `201` creates a new party with explicit predecessor/successor or fork lineage; work, rights, memberships, contracts and authority do not copy implicitly.

Lifecycle errors: `401`, `403 STEP_UP_REQUIRED|LIFECYCLE_FORBIDDEN`, `404`, `409 LIFECYCLE_STATE_CONFLICT|LIVE_OBLIGATIONS|GOVERNANCE_DECISION_INCOMPLETE|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `503`, `500`.

## Authority Resolution Algorithm

Every protected downstream command executes this exact order inside its use case and rechecks steps 7–10 in the committing RPC:

1. verify Supabase session/account and derive human/person UUID;
2. load requested acting party; ignore client role/capability claims;
3. resolve self, current alias owner, or active accepted organization/representation relationship;
4. choose active governance projection, explicit grant, or exact band default—never union expired/revoked sources;
5. require activity and, for representation, domain;
6. require explicit `communicate` for send/reply;
7. require territory, term, resource relationship and field/action capability;
8. compare monetary integer minor units and exact ISO currency to explicit/default ceiling; no implicit FX;
9. recheck lifecycle, NDA, visibility, domain invariant, expected version and RLS/RPC predicate;
10. commit fact, human actor, acting party, authority source/version, audit, idempotency and outbox atomically.

Confirmed permanent band membership seeds `book, sign, spend, list, release, settle, administer` across commercial domains and USD 1,000 per monetary act. Owning mandate is uncapped unless terms configure otherwise. Touring/staff/honorary and non-band membership seed no authority. `communicate` is always explicit. Active governance overrides defaults prospectively only.

## Persistence Design

| Table | Core constraints / indexes |
|---|---|
| `identity.organization_parties` | party PK, ownership state, quiet/closing times, version; lifecycle on party |
| `identity.organization_type_assignments` | org/type/period/version; partial unique active org+type |
| `identity.membership_tenures` | org/person/state/provenance/dates/accept/revoke/version; rejoin creates new tenure |
| `identity.membership_capacity_periods` | tenure/capacity/period; non-overlap and contained by tenure |
| `identity.membership_end_proposals` | tenure/proposer/proposed date/state/expiry/version; one pending |
| `identity.representation_edges` | principal/representative/scope/term/communication/ceiling/agreement/state/version |
| `identity.mandate_grants` | relationship/scope/ceiling/term/grantor/source/state/version |
| `identity.authority_projection` | derived human/acting party/source/scope/term/version; never client writable |
| `identity.governance_terms_versions` | org/version/strict terms/hash/state/times/supersedes; immutable after proposed |
| `identity.governance_member_snapshots` | terms/member/source tenure/version; immutable proposal electorate |
| `identity.governance_confirmations` | terms/member/decision/context/time; unique member+terms |
| `identity.name_ownership_records` | org/terms/owners/disposition/unverified trademark/effective/superseded |
| `identity.organization_lineage` | predecessor/successor/relation/reason/effective; no implicit asset transfer |

All protected tables enable RLS. Members read shared tenure/governance projections according to current relationship; authority/mandate mutation is RPC-only. Historical assertions, confirmations, activated terms, name records, authority snapshots and lineage are append-only or superseded, never silently rewritten.

## State and Concurrency Rules

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Membership tenure | `invited → confirmed|rejected|expired`; `asserted → confirmed|rejected|disputed`; `confirmed → ended|disputed` | Recipient decision/timer/evidence/end triggers. Authority revokes immediately on end request; disputed historical date cannot restore it. Terminal invitation rejects replay. |
| Representation | `draft → pending → active|rejected|expired`; `active → revoked|expired` | Proposal/dual acceptance/term timer/either-party revoke triggers. Missing overlap acknowledgement or invalid scope/term blocks activation; terminal edge cannot reactivate. |
| Mandate | `active → revoked|expired|superseded` | Grant, principal/grantor revoke, term expiry or governance replacement triggers. Scope/term/ceiling beyond source authority blocks creation. |
| Governance terms | `draft → proposed → active|rejected|withdrawn`; `active → superseded` | Proposal freezes content/electorate; unanimous confirmation activates; reject/withdraw terminates. Changed member set/hash/version blocks activation. |
| Organization lifecycle | `active ↔ dormant`; `active|dormant → closing → closed`; `closed → active`; band `active|dormant → dissolving → dissolved` | Authorized command/job triggers. Finite obligations block close; only closed reopens; dissolved is terminal and only permits successor creation. |
- Membership acceptance locks invitation, current terms and membership snapshot. Governance activation locks proposal, electorate, confirmations and active version. Revocation locks relationship/mandate and projection version.
- Client disconnect after commit replays stored result. Duplicate events refetch current versions; stale events cannot restore authority.

Every unlisted source/target pair returns the typed state-conflict code and performs no partial authority change.

## Rate, Authorization and Observability

| Endpoint class | Rate | Principal / ownership | Required telemetry |
|---|---|---|---|
| org read | public 120/min/IP; auth 300/min/user | publication or current scoped relationship | duration/cache/view class/version |
| org/type mutation | 60/min/user | owner/admin exact capability | decision/blocker/version; audit/outbox |
| membership/representation | 30/min/user; invites 100/day/org | exact party or recipient/counterparty | state/overlap/provenance; notification/audit |
| mandate/authority | 10 high-risk/min; read 300/min | grantor subset/current human | resolver step failure class/source version |
| governance/name | 10 high-risk/min | current governance member/capability + step-up | 100% trace, hash/member count/decision, audit |
| lifecycle/successor | 5/hour/org | active terms/capability + step-up | job/obligation/disposition/lineage; 100% trace |

Wrong party/resource/relationship returns `404` when existence is not safely known; a known member lacking action receives `403`. Membership presence alone grants no authority except exact permanent-band seed. Service principals can rebuild one projection from canonical IDs but cannot create interactive authority.

## Failure Cascades and Gated Boundaries

- Duplicate detection unavailable: organization creation proceeds after two-second bound; job records signals without merging.
- Notification failure: invitation/relationship/governance canonical state remains; outbox retries. Acceptance never depends on email delivery.
- Relationship expires/revokes during command: committing RPC rejects stale source; no mutation.
- Governance member changes during proposal: proposal conflicts and requires a new immutable version/electorate.
- Authority projection lags: commands resolve canonical relationships and fail closed rather than trust projection.
- Treasury authorization records explain permission only; no pooled balance, split routing, escrow, tax or multi-party distribution (B3/counsel/provider gate).
- Name/trademark and governance records are user statements, not platform legal advice or adjudication.
- Quietness inference prompts at 12 months and suppresses supply discovery at 18 months; it never publishes dormancy or revokes authority itself.

## Contract Test Plan

1. Validate every registry value, date/territory/term/ceiling combination and strict unknown-key rejection.
2. Exercise all organization creation modes, duplicate timeout, friction thresholds and no-auto-merge behavior.
3. Race membership accept/reject/expiry/end and assert immediate revocation plus preserved disputed history.
4. Test representation overlap intersections, dual acknowledgement, null ceiling, currency mismatch and expiry.
5. Exhaust ten-step authority resolution across self, alias, band defaults, explicit/governance mandates, revoked terms, territory/domain, communication and money ceilings.
6. Race unanimous governance activation against member/electorate/version changes and prove prior/default terms remain until activation.
7. Verify name records are labelled unverified and no trademark search/advice path exists.
8. Test close/reopen/dissolve/successor states, finite blocker rules, terminal dissolution and no implicit record copying.
9. RLS/BOLA tests cover anonymous, member, owner/admin, representative, estate, wrong user/party/resource and service consumer.
10. Telemetry tests reject member content, agreement refs, legal text and monetary details while retaining safe source/version/outcome.

## Deepening and Ambiguity Gate

| Pass | Result |
|---|---|
| Consistency | Relationship, mandate, governance and lifecycle commands use one party/version/error vocabulary. |
| Concurrency | Membership, transfer, governance electorate, revocation and lifecycle races have locking rules. |
| Cascades | Dedupe, notifications, projections, jobs and downstream authority failure states are explicit. |
| Authorization | Every endpoint names holder, subset/ownership predicate, step-up and disclosure behavior. |
| Observability | Route metrics, authority-step diagnostics, audit/outbox and high-risk traces are specified. |
| Abuse | Org spam, invite abuse, delegated overreach, stale mandates, overlap and name/legal overclaim are bounded. |
| Partial state | Canonical relationships precede projections; no guessed authority, silent merge or destructive lifecycle rewrite. |

Two implementers receive identical endpoints, validation, state machines, authority order/defaults, transactions, errors and tests. Domain shards consume authority snapshots but cannot mint or broaden them.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-03 | Organization, relationship, mandate and governance contract authored | `/write-be-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
