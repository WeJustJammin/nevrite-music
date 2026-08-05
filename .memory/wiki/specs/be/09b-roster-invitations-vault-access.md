# Project roster, invitations and vault access — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]  
**Deep Dive:** [[specs/ia/deep-dives/09-projects-collaboration|Project collaboration deep dive]]  
**Credit Boundary:** [[specs/be/07c-claims-attestations-confidence-taxonomy|Credit claims and taxonomy]]

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

- **Shard split:** 2 of 5; PRJ-05 through PRJ-07. Asset/version creation is owned by 09c; this contract owns involvement, invitations, NDA evidence and derived access only.
- **Boundary:** append-only per-song roster events, Shard 07 claim handoff, T0/T1/T2 invitation disclosure, role-profile sensitivity policy, block/NDA intersection and immediate grant revocation.
- **Approval:** Recommended split accepted under standing autonomy.

## Roster and Access Invariants

- Roster involvement, workspace access, contribution credit, rights ownership and payment are independent. Ending involvement revokes derived access immediately but preserves roster/credit history; claim retraction uses Shards 07/06.
- Subjects are canonical parties, shells or entities with canonical role version or bounded literal. Name search never binds identity. Unresolved role commits the event/claim but grants no derived access until a reviewed role profile resolves.
- Roster events and Shard 07 claim commands commit atomically through the outbox. No project API edits credit truth, and no credit outcome silently changes access.
- Invitations disclose only T0 inviter/intended role before identity. T1 may stream one pinned non-confidential rough under explicit policy; T2 requires intended/verified identity, current role, blocks and accepted exact NDA version.
- Vault permission is the union of current song roles intersected with asset sensitivity profile/version, blocks, NDA, asset state and policy. No per-asset hand-grant schema or API exists.
- Grants and signed URLs are short-lived and grant-version bound. Role, block, NDA, sensitivity or policy change invalidates active tokens immediately; bytes already downloaded cannot be reclaimed or represented as leak-proof.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/songs/{songId}/roster-events` | `RosterEventRequest`: add/end, disambiguated party/shell/entity, role version-or-literal, effective time; roster writer ETag/key | `201 RosterEventResponse`; event/projection version/claim command ID | `403`, `404`, `409 ROSTER_OR_AUTHORITY_CONFLICT`, `422 SUBJECT_OR_ROLE_INVALID`, `428`, `429` |
| `GET /api/v1/songs/{songId}/roster` | state/role cursor; authorized song viewer | `RosterPage`; viewer-safe involvement/role/claim state/count | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/songs/{songId}/invitations` | `ContributorInvitationRequest`: roster event IDs, intended recipient/contact, disclosure tier, delegate; inviter capability/key | `201 InvitationResponse`; safe preview/delivery/expiry/version | `403 MAY_INVITE_REQUIRED`, `404`, `409 INVITATION_EXISTS`, `422 TIER_OR_RECIPIENT_INVALID`, `429` |
| `GET /api/v1/invitations/{token}/preview` | opaque token; no identity required | `InvitationT0Response`; inviter, intended role and expiry only | non-enumerable `404`, `410`, `429` |
| `POST /api/v1/invitations/{token}/identity-bindings` | `BindInvitationIdentityRequest`: provider-authenticated intended identity; key | `InvitationBindingResponse`; bound/identity-mismatch state | `403 RECIPIENT_MISMATCH`, `404`, `409 ALREADY_BOUND`, `410`, `422`, `429` |
| `POST /api/v1/invitations/{token}/responses` | `InvitationResponseRequest`: accept/decline and exact terms/role acknowledgment; bound identity/key | `InvitationResponse`; typed state and derived-access refresh | `403`, `404`, `409 ALREADY_RESPONDED|ROLE_CHANGED`, `410`, `422`, `429` |
| `POST /api/v1/songs/{songId}/nda-acceptances` | `NDAAcceptanceRequest`: exact terms/version/method/evidence hash; verified subject/key | `201 NDAAcceptanceResponse`; immutable acceptance and grant refresh | `403`, `404`, `409 TERMS_VERSION_CHANGED`, `422`, `429` |
| `POST /api/v1/assets/{assetId}/access-decisions` | `AssetAccessDecisionRequest`: intended action `stream|download`, client capability; authenticated viewer/key | `AssetAccessDecisionResponse`; allowed grant or explained non-leaking denial | `403 ROLE_UNRESOLVED|NDA_REQUIRED|ACCESS_REVOKED`, concealment-safe `404`, `409 POLICY_VERSION_CHANGED`, `429` |
| `POST /api/v1/assets/{assetId}/stream-grants` | approved decision ID/hash; viewer/key | `201 AssetGrantResponse`; scoped URL/token, grant version and expiry | `403`, `404`, `409 DECISION_STALE|ASSET_STATE_CHANGED`, `429`, `503` |
| `POST /api/v1/assets/{assetId}/download-grants` | approved decision ID/hash and consequence acknowledgment; viewer/key | `201 AssetGrantResponse`; scoped URL/checksum/expiry | `403`, `404`, `409`, `429`, `503` |
| `POST /internal/v1/project-access/invalidate` | song/subject/reason/source versions/event ID; worker capability/key | `AccessInvalidationResponse`; grant version and purge result | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422`, `429` |

Roster reads are 120/min/person; roster/invite writes 30/min/song/actor; previews 30/min/IP with abuse controls; identity/response/NDA 20/min/token/person; access decisions 120/min/person; grant creation 60/min/person/asset. Private responses are no-store. Invite contact, NDA terms and asset names never enter logs/events.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `project.roster_events` / `roster_projections` | song/subject/role-or-literal/event/author/context/effective time/claim/access-profile/version; append-only history and one current involvement projection |
| `project.contributor_invitations` / `invitation_deliveries` | roster refs/inviter/delegate/intended-recipient hash/tier/delivery/response/expiry/version; tokens stored hashed |
| `project.nda_acceptances` | subject/song/exact terms version/time/method/evidence hash; append-only unique acceptance |
| `project.asset_sensitivity_profiles` | code-owned versioned role requirements by sensitivity class; reviewed activation only |
| `project.access_grant_versions` / `asset_access_events` | song/subject/source profile/block/NDA hashes/state/version and minimal decision/access audit |

RLS is song-role, invitation-binding and purpose bound. Link/token possession yields T0 only; T1/T2 resolve current intended identity each request. A security-definer resolver unions live roles then intersects all deny conditions and returns a bounded reason code without hidden asset identity. Workers consume roster, block, NDA, asset and policy events, increment grant versions and push edge/origin revocation before notifications. No manual override path exists.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Roster involvement | `proposed → active → ended`; proposed may become `rejected|withdrawn` | Roster event/claim outcome/end triggers. Unresolved role blocks derived access; ended revokes access immediately but preserves credit/history. |
| Invitation | `draft → sent → delivered → accepted|declined|expired|suppressed`; sent may become suppressed/expired | Delivery/bind/recipient decision/timer/block triggers. Identity mismatch or role change blocks acceptance; terminal invitation rejects replay. |
| NDA acceptance | immutable active acceptance bound to exact terms; terms change makes it `stale` and requires new acceptance | Verified subject acceptance/terms version change triggers. Stale/missing acceptance cannot satisfy T2. |
| Access eligibility/grant | `eligible → granted → revoked|expired`; granted may become `stale` before revoke on source change | Resolver/grant mint/role-block-NDA-policy event/timer triggers. Any deny condition blocks grant; token possession never bypasses current resolution. |
| Sensitivity profile | `draft → reviewed → active → superseded|retired` | Protected review/activation triggers. Unapproved/stale profile cannot authorize delivery. |

Every unlisted transition returns the typed state/version conflict. Events omit contacts, tokens, NDA terms and hidden assets.

## Failure, Deepening and Ambiguity Gate

Tests cover ambiguous name binding, unavailable taxonomy, outbox claim failure/replay, ended involvement with persistent credit, forwarded invite, T0/T1/T2 disclosure, recipient mismatch, stale NDA/role profile, block added mid-stream, revoked signed URL, downloader consequence, downloaded-byte irreversibility, attempted hand grant and hidden asset/count inference. Logs omit contact/terms/assets. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical roster, invitation, derived-access and revocation behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Roster, invitation and vault-access contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/be/07c-claims-attestations-confidence-taxonomy|Credit claims, attestations, confidence and taxonomy — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09a-project-containers-creative-docs|Project containers, release boards and creative documents — Backend Specification]]
