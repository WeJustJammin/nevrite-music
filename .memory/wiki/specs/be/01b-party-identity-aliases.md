# Person, facets, aliases, acting context and legal disclosure — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]  
**Deep Dive:** [[specs/ia/deep-dives/01-identity-authority|Identity authority deep dive]]  
**Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]  
**Auth Boundary:** [[specs/be/01a-auth-account-linking|Authentication and account linking]]

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

- **Shard split:** 2 of 4.
- **Boundary:** IDA-01 through IDA-05: person party, role facets, aliases/handles, acting-context projection and purpose-limited legal identity disclosure.
- **Non-ownership:** Shard 02 owns public profile content/claim presentation. This spec owns party identity, alias ownership/redirect truth and legal/public separation.
- **Approval:** Recommended split accepted under the owner's standing autonomy delegation.

## Referenced Material Inventory

- [[specs/ia/01-identity-authority|IA Shard 01]] interactions IDA-01–05, party/identity contracts, access matrix and events.
- [[specs/ia/deep-dives/01-identity-authority|Identity deep dive]] alias/context policy values, canonical fields, states, concurrency and disclosure gates.
- [[specs/be/00-infrastructure|Backend foundation]] transport, command, job, audit/outbox and error contracts.
- [[specs/be/01a-auth-account-linking|Authentication and account linking]] canonical Auth UUID/person provisioning boundary.

## Endpoint Reconciliation

| IA interaction | Endpoint(s) | Disposition |
|---|---|---|
| IDA-01 Create person | auth callback transaction; `GET /api/v1/me/identity` | Provisioning owned by 01a; projection authored here |
| IDA-02 Add/remove facet | `POST /api/v1/me/facets`, `DELETE /api/v1/me/facets/{facetCode}` | Authored |
| IDA-03 Alias lifecycle | create, update, handle change, retire, transfer offer/accept/decline | Authored |
| IDA-04 Acting context | `GET /api/v1/me/acting-contexts`, `POST /api/v1/me/acting-context-bindings` | Authored |
| IDA-05 Legal identity/disclosure | self legal record GET/PUT; disclosure create/read | Authored |

## Shared Schemas

`PartyKind` is `person|alias|organization`; kind is immutable. `PartyLifecycle` is a closed enum owned by this shard and specialized by aggregate. UUIDs, quoted positive ETags, idempotency keys and four-field errors inherit Shard 00.

```ts
const FacetCode = z.enum(['performer','writer','producer','engineer','teacher','seller','tech']);
const Handle = z.string().min(3).max(40);
const ActingContextProjection = z.strictObject({
  partyId: z.uuid(),
  partyKind: z.enum(['person','alias','organization']),
  label: z.string().min(1).max(120),
  avatarRef: z.string().max(200).nullable(),
  relationshipId: z.uuid().nullable(),
  sourceVersion: z.number().int().positive(),
  expiresAt: z.iso.datetime(),
});
```

Handle length is Unicode code points after NFKC/case-fold/confusable normalization, not UTF-16 units. Public display names are 1–120 normalized code points and non-unique.

## API Endpoints

### `GET /api/v1/me/identity`

Authenticated self only; no body/query. `200` returns `{ person: { id, lifecycle, facets, version }, aliases: [{ id, displayName, handle, lifecycle, publicLinkState, version }], legalIdentityPresent, version }`. Legal fields, hidden alias linkage and Auth provider data are absent. ETag/no-store. Errors: `401 UNAUTHENTICATED`, `404 PERSON_NOT_FOUND`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/me/facets`

Body `{ facetCode }`, example `{ "facetCode":"producer" }`; required `If-Match` person version and `Idempotency-Key`. `200` returns updated identity projection. Add is self-asserted; facet registry is protected and users cannot mint values. Re-adding a removed facet creates a new active assertion period while preserving history.

Errors: `401`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|FACET_ALREADY_ACTIVE`, `422 FACET_UNKNOWN|VALIDATION_FAILED`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`.

### `DELETE /api/v1/me/facets/{facetCode}`

Registered facet path; required version/idempotency; no body. `200` returns updated identity projection. One RPC queries the facet's closed obligation registry and either marks the assertion removed or returns blockers. It never deletes history.

Launch blockers: seller—live listing, unfulfilled order, open return, checkout in flight; teacher—future lesson/running cohort; producer—open owned project/outstanding invite; engineer/tech—accepted-undelivered service; performer—future confirmed booking; writer—issued-unsigned split.

Errors: `401`, `409 FACET_HAS_LIVE_OBLIGATIONS|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `404 FACET_NOT_ACTIVE`, `422 FACET_UNKNOWN`, `428`, `429`, `503 OBLIGATION_PROJECTION_UNAVAILABLE`, `500`. Safe details may contain only blocker codes/counts and recovery route names, never counterpart data.

### `POST /api/v1/aliases`

Body `{ displayName, handle, publicLinkState: "private"|"public" }`; required idempotency. Example `{ "displayName":"Nova Ray","handle":"nova-ray","publicLinkState":"public" }`. `201` returns alias party, ownership period, permanent handle and updated person version. Creation implies and discloses the `performer` facet in the same transaction. Maximum five alias creations per person per rolling 30 days.

Errors: `401`, `409 HANDLE_UNAVAILABLE|IDEMPOTENCY_CONFLICT`, `422 DISPLAY_NAME_INVALID|HANDLE_INVALID|VALIDATION_FAILED`, `429 ALIAS_CREATION_LIMIT|RATE_LIMITED`, `500`.

### `PATCH /api/v1/aliases/{aliasId}`

UUID alias; strict body with at least one of `displayName` or `publicLinkState`; required alias `If-Match` and idempotency. `200` returns updated alias. Current owner self may edit; a mandate cannot transfer/retire but may edit only if its explicit alias-profile capability permits. Errors: `401`, concealment-safe `404 ALIAS_NOT_FOUND`, `403 FORBIDDEN`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### `POST /api/v1/aliases/{aliasId}/handle-changes`

Body `{ handle }`; required owner-self session, version/idempotency and recent step-up. `200` returns alias with new handle and permanent redirect from every old handle. Maximum two changes per alias per rolling 12 months. Reserved handles are never reissued even after retirement.

Errors: `401`, `403 STEP_UP_REQUIRED`, `404 ALIAS_NOT_FOUND`, `409 HANDLE_UNAVAILABLE|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 HANDLE_INVALID`, `428`, `429 HANDLE_CHANGE_LIMIT|RATE_LIMITED`, `500`.

### `POST /api/v1/aliases/{aliasId}/retire`

Body `{ reasonCode: "user_request"|"duplicate_brand"|"safety" }`; owner-self only, step-up, version/idempotency. `200` returns lifecycle `retired` and permanent redirect/tombstone policy. Retirement does not remove credits, provenance or ownership periods. Errors: `401`, `403`, `404`, `409 ALIAS_HAS_BLOCKING_OBLIGATIONS|ALIAS_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### `POST /api/v1/aliases/{aliasId}/transfer-offers`

Body `{ recipientPersonId: UUID }`; owner-self only, step-up, version/idempotency. Recipient must be an active adult person and cannot equal owner. `201` returns `{ id, aliasId, fromPersonId, toPersonId, state:"pending", expiresAt, version }`; expiry is exactly seven days. A mandate can never create an offer.

Errors: `401`, `403 STEP_UP_REQUIRED|FORBIDDEN`, `404 ALIAS_NOT_FOUND|RECIPIENT_NOT_FOUND`, `409 TRANSFER_ALREADY_PENDING|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### `POST /api/v1/alias-transfer-offers/{offerId}/accept`

Recipient self only; body `{ confirmation: "accept" }`; step-up, offer `If-Match`, idempotency. `200` returns transferred alias and dated ownership periods. RPC locks offer, alias and open period; one acceptance/expiry/retirement wins. Transfer activates a 30-day public banner, permanently preserves history and never transfers legal identity or contracts.

Errors: `401`, `403`, `404 TRANSFER_OFFER_NOT_FOUND`, `409 TRANSFER_EXPIRED|TRANSFER_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422`, `428`, `429`, `500`.

### `POST /api/v1/alias-transfer-offers/{offerId}/decline`

Recipient self; body `{ confirmation:"decline" }`; version/idempotency. `200` returns declined offer. Same concealment, precondition and rate errors as acceptance; no alias mutation occurs.

### `GET /api/v1/me/acting-contexts`

Authenticated self; optional `cursor`, `limit` and `includeExpired=false` only. `200 CursorPage<ActingContextProjection>` includes self, current aliases, active memberships and representations. It is derived from current authority and does not itself grant authority. Private/no-store; rate inherits authenticated reads.

Errors: `401`, `422 VALIDATION_FAILED`, `429`, `503 AUTHORITY_PROJECTION_UNAVAILABLE`, `500`.

### `POST /api/v1/me/acting-context-bindings`

Body `{ partyId, clientTabId }`; `clientTabId` is a random UUID held in tab/session memory, never a device fingerprint. Required idempotency. `201` returns `{ bindingId, context: ActingContextProjection }` and a signed opaque binding expiring after 12 hours inactivity. Selection requires an explicit user action and cannot be inferred from return URL, deep link or requested resource.

Every protected command supplies the binding ID and the server re-resolves person, party, relationship, mandate and source version at submit. First attested/monetary action after a session gap returns `409 ACTING_CONTEXT_RECONFIRMATION_REQUIRED` until explicitly rebound.

Errors: `401`, concealment-safe `404 ACTING_CONTEXT_NOT_FOUND`, `409 ACTING_CONTEXT_STALE|IDEMPOTENCY_CONFLICT`, `422`, `429`, `503`, `500`.

### `GET /api/v1/me/legal-identity`

Self with recent step-up only. `200` returns the minimum self-edit projection `{ id, legalName, address, taxReferencePresent, verificationState, effectiveFrom, version }`; external KYC/document refs remain hidden. No-store, no client persistence. Errors: `401`, `403 STEP_UP_REQUIRED`, `404 LEGAL_IDENTITY_NOT_FOUND`, `429`, `503`, `500`.

### `PUT /api/v1/me/legal-identity`

Strict body `{ legalName, address, taxReference? }`; field schemas are country-aware protected registries and reject unsupported/unnecessary data. Required step-up, `If-Match` when replacing, and idempotency. `200` returns the self-edit projection. Replacements close the prior effective period and create a new encrypted/protected record; no in-place historical rewrite.

Errors: `401`, `403 STEP_UP_REQUIRED`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 LEGAL_NAME_INVALID|ADDRESS_INVALID|TAX_REFERENCE_INVALID|VALIDATION_FAILED`, `428` for replacement without ETag, `429`, `503 PROTECTED_STORAGE_UNAVAILABLE`, `500`.

### `POST /api/v1/legal-identity-disclosures`

Body `{ transactionType, transactionId, recipientPartyId, purposeCode, fieldCodes, legalIdentityVersion }`; transaction/purpose/fields must be an active registered eligibility tuple. Required self or currently authorized party, recent step-up, idempotency and expected legal version. `201` returns `{ id, state:"active", recipientPartyId, purposeCode, fieldCodes, expiresAt, version }`; no legal values are echoed.

The RPC verifies current eligible transaction, recipient and minimum field set, writes append-only disclosure evidence and creates an expiring recipient projection. Errors: `401`, `403 STEP_UP_REQUIRED|DISCLOSURE_FORBIDDEN`, `404 ELIGIBLE_TRANSACTION_NOT_FOUND|LEGAL_IDENTITY_NOT_FOUND`, `409 LEGAL_IDENTITY_VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 DISCLOSURE_PURPOSE_INVALID|DISCLOSURE_FIELDS_INVALID`, `429`, `503`, `500`.

### `GET /api/v1/legal-identity-disclosures/{disclosureId}`

Recipient party acting context only; no body/query. `200` returns `{ disclosureId, subjectPartyId, purposeCode, fields: <exact allowlisted projection>, disclosedAt, expiresAt }`, no-store and never cacheable locally by contract. Expired/revoked/wrong-recipient access collapses to `404 DISCLOSURE_NOT_FOUND`. Other errors: `401`, `403 STEP_UP_REQUIRED` where purpose requires, `429`, `503`, `500`. Every successful access is audited.

## Endpoint Policy Matrix

| Class | Idempotency / version | Rate | Service / observability |
|---|---|---|---|
| identity/contexts reads | none; ETag where mutable projection | 300/min/user | Tier 1; projection duration/version/context count |
| facet commands | key + person ETag | 60/min/user | Tier 2; facet/outcome/blocker class; audit/outbox |
| alias create/edit | key; ETag for mutation | 20 creates/hour route cap plus alias policy quotas | Tier 2; normalization/duplicate/ownership outcome |
| alias transfer/retire/handle | key + ETag + step-up | 5 high-risk/hour/user | Tier 2; 100% trace/audit/security notice |
| acting binding | key; current authority source | 30/min/user | Tier 0 acceptance; bind/revoke metrics |
| legal identity/disclosure | key + version + step-up | 10 high-risk/min; disclosure 20/day/person/purpose | Tier 2; 100% trace/audit; no values logged |

## Authorization Matrix

| Surface | Self person | Alias context | Organization/representative | Operator/service |
|---|---|---|---|---|
| facets | manage own | deny | deny | no ordinary override |
| alias edit | current owner; transfer/retire owner-self only | explicit profile edit only | explicit profile edit only | assigned recovery case cannot transfer |
| acting contexts | list/bind own eligible contexts | resolved through human owner | resolved through accepted current relationship | service cannot bind interactively |
| legal self record | self + step-up | deny | deny | protected recovery workflow only |
| disclosure create | subject self or exact current transaction authority | alias cannot sign | explicit legal-disclosure capability only | no general browsing |
| disclosure read | only when recipient is self party | recipient alias prohibited for signature data | exact recipient acting party | assigned legal workflow only |

Wrong user, party, alias owner, relationship, recipient or resource returns concealment-safe `404` where existence is sensitive; an authenticated actor who can know the resource but lacks the action receives `403`.

## Persistence Design

| Table | Invariants / indexes |
|---|---|
| `identity.parties` | UUID, immutable kind, lifecycle/version; kind+lifecycle index |
| `identity.person_parties` | party PK/FK, unique nullable Auth UUID, account state; one active binding |
| `identity.role_facet_assertions` | person/facet/state/source/period/version; partial unique active person+facet; history retained |
| `identity.alias_parties` | party PK/FK, display name, current handle FK, public-link state/version |
| `identity.alias_ownership_periods` | alias/person/start/end/transfer; exclusion constraint prevents overlap; one open period |
| `identity.handle_reservations` | normalized handle unique forever, display, party, active/redirect/retired, successor; no delete/reuse grant |
| `identity.alias_transfer_offers` | alias/from/to/state/expiry/version; one pending per alias; seven-day bound |
| `identity.acting_context_bindings` | human/party/tab/session digest/source relationship+version/last-used/expiry/revoked; unique active tab binding |
| `protected.legal_identities` | person/effective period/protected field refs/verification/version; no overlapping periods |
| `protected.legal_disclosure_events` | append-only identity/version/recipient/purpose/fields/actor/context/time/expiry; recipient+time index |

RLS exposes self-safe projections, current-owner alias rows and exact recipient disclosure views only. Legal base tables have no browser Data API grants. Handle, transfer, acting-context and disclosure changes use migration-owned RPCs that commit version, audit, idempotency and outbox atomically.

## Transactions, Events and Partial State

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Facet assertion period | `active → removed`; re-add creates a new `active` period | Add/remove RPC triggers. Live obligations block removal; removed history cannot reactivate in place. |
| Alias | `active → retired`; transfer keeps alias active and replaces ownership period | Owner retirement triggers terminal state. Blocking obligations or a losing terminal race leaves state unchanged. |
| Handle reservation | `active → redirect|retired`; handle change makes prior active handle a redirect | Change/retirement triggers. Every state permanently reserves the normalized handle; none returns to available. |
| Alias transfer offer | `pending → accepted|declined|expired` | Recipient decision or seven-day timer wins one locked transition. Terminal offer rejects later decisions; only accepted changes ownership. |
| Acting-context binding | `active → revoked|expired` | Rebind/revoke, authority-source revocation or 12-hour inactivity triggers. Non-active binding never authorizes and requires explicit reselection. |
| Legal identity version | `active → superseded` | Valid replacement closes current effective period and inserts successor. Superseded version is immutable. |
| Legal disclosure | `active → expired|revoked` | Timer, source-version invalidation or authorized revocation triggers. Non-active disclosure is concealment-safe `404`. |

Every unlisted transition returns the named state/version conflict and never rewrites canonical history.

- `identity.add_facet` and `remove_facet` lock person/version; removal calls registered blocker queries inside the transaction or fails closed when a required projection is unavailable.
- `identity.create_alias` locks quota window and normalized handle, creates party/alias/ownership/reservation and optional performer facet atomically.
- `identity.accept_alias_transfer` locks offer/alias/open period; closes old and opens new period, changes public linkage/redirect metadata, audits and emits `identity.alias.changed.v1`.
- `identity.bind_acting_context` stores no authority union; it snapshots source for explanation and every command performs the deep-dive's ten-step current resolution.
- `protected.create_legal_disclosure` stores field codes and references, never copied legal values; recipient projection resolves the exact legal record version.
- Database commit plus client disconnect is recovered by idempotency. Outbox/notification failure does not roll back canonical ownership/disclosure; retry remains ID-only.

Events: `identity.facet.changed.v1 {personId,facetCode}`, `identity.alias.changed.v1 {aliasId}`, and `identity.acting-context.revoked.v1 {personId,partyId,relationshipId}`. Payloads are identifiers only and consumers refetch.

## Failure, Privacy and Abuse Rules

- Confusable/equivalent handle requests compete on one normalized unique reservation; one wins, the other gets generic unavailable.
- Public/private alias linkage is viewer-relative; hidden owner linkage never appears in search, errors, Realtime or logs.
- An expired transfer offer racing acceptance yields one committed terminal state; no overlapping ownership period is possible.
- Wrong-context relied-upon facts are retracted/tombstoned and recreated under correct attribution; no row reattribution.
- Legal values never enter audit, outbox, Queue, logs, Sentry, analytics, cache or ordinary exports.
- Disclosure expiration ends future retrieval but preserves append-only evidence according to transaction/legal retention.
- Empty/unrelied alias deletion may be a future privacy workflow; any relied-upon alias uses retirement/tombstone, not destructive deletion.

## Contract Test Plan

1. Boundary-test all facet/handle/name/field schemas and strict unknown-key rejection.
2. Race facet add/remove and assert blocker fail-closed behavior, history and version conflicts.
3. Generate Unicode/confusable handle collisions; prove permanent reservation and no timing/existence oracle.
4. Race transfer accept/expiry/retire and prove one owner period, seven-day expiry and 30-day banner.
5. Assert mandate holders cannot transfer/retire an alias and wrong users/parties receive safe denials.
6. Bind contexts across tabs/devices, expire after 12-hour inactivity, revoke relationship, require reconfirmation after session gaps and prove deep links cannot switch.
7. Exercise legal disclosure across wrong transaction/purpose/recipient/field/version and verify minimum projection plus access audit.
8. Scan logs/events/caches for legal values, hidden linkage, Auth identifiers and protected object references.
9. RLS tests cover anonymous, self, alias owner, wrong valid user, wrong party, recipient and service principals.

## Deepening and Ambiguity Gate

| Pass | Result |
|---|---|
| Consistency | All commands inherit Shard 00 and use one party/version/acting-context vocabulary. |
| Concurrency | Unique handles, exclusion ownership periods, versioned facets/offers and immutable disclosures resolve races. |
| Cascades | Blocker projection, outbox, notification and client disconnect outcomes are explicit. |
| Authorization | Self, alias mandate, organization, representative, recipient and operator rules have no implicit grants. |
| Observability | Per-class metrics/audit/spans specified; protected values structurally excluded. |
| Abuse | Alias quotas, confusable normalization, no deep-link switching and disclosure purpose limits are exact. |
| Partial state | No reattribution, ownership overlap, guessed authority or copied legal payload occurs. |

The endpoint set, validation, states, transactions, RLS, errors and tests are deterministic. Shard 02 may consume public projections but cannot alter canonical identity or disclosure policy.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-03 | Party, alias, context and disclosure contract authored | `/write-be-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01a-auth-account-linking|Authentication, additive login methods and account merge — Backend Specification]]
