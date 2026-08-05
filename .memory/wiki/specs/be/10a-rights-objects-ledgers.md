# Rights objects, ownership ledgers and consent — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]  
**Deep Dive:** [[specs/ia/deep-dives/10-rights-ownership|Rights ownership deep dive]]  
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

- **Shard split:** 1 of 5; RGT-01 through RGT-04. Control derivation is owned by 10c; splits/agreements, AI/NIL and registration remain separate.
- **Boundary:** separate composition/recording assertions, weighted links, exact-rational writer/publisher/master ledgers, frozen proposal versions and whole-ledger consent.
- **Approval:** Recommended split accepted under standing autonomy.

## Registry and Ledger Invariants

- Work and recording are separate explicitly asserted objects. Credits, project artifacts, performance, possession timestamp, registration and identifiers never auto-create ownership or shares; source links remain evidence only.
- Recording-to-work links are a versioned typed set of positive reduced rationals summing exactly one. They are distinct from recording lineage and reject stale concurrent replacement.
- Canonical shares store reduced integer numerator/positive denominator and use integer arithmetic only. Display decimals never round back. No zero-percent row or invented remainder exists.
- Proposed/consented composition writer rows sum exactly one per territory; publisher rows anchor to writer rows and sum exactly to each anchor share. Master rows sum exactly one; points/encumbrances never enter ownership sums.
- Draft ledgers may be unbalanced and persist the exact deficit/excess as `unallocated`; proposal requires every structural/arithmetic invariant, freezes canonical row order/hash/payout-basis-term version and creates the complete consent set.
- Consent binds the whole frozen ledger and exact values while acting only for authorized rows/party. Being named, credited, invited, represented, opening/reading a link or silence never means consent. Any row change creates a successor and resets every consent.
- Only all required current consents yield `consented`. Refusal remains visible; unreachable blocks indefinitely. UI may say `balances`, never `valid`, `clear`, legally effective or clear title.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Rational values are `{ numerator: bigint-string, denominator: positive-bigint-string }`. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/rights/works` | `AssertWorkRequest`: title/source project-version/party facts/jurisdiction hints; authorized actor/key | `201 RightsObjectResponse`; immutable work assertion/proof state/version | `403`, `409 DUPLICATE_CANDIDATE|IDEMPOTENCY_MISMATCH`, `422`, `429`, `503` |
| `POST /api/v1/rights/recordings` | `AssertRecordingRequest`: source audio/project version/party facts; authorized actor/key | `201 RightsObjectResponse`; immutable recording assertion/proof state/version | `403`, `409 DUPLICATE_CANDIDATE`, `422`, `429`, `503` |
| `PUT /api/v1/rights/recordings/{recordingId}/work-links` | `RecordingWorkLinkSetRequest`: typed weighted rows and evidence; authorized editor ETag/key | `RecordingWorkLinkSetResponse`; exact validated set/version | `403`, `404`, `409 VERSION_CONFLICT`, `422 WEIGHTS_UNBALANCED|RATIONAL_INVALID`, `428`, `429` |
| `GET /api/v1/rights/objects/{objectId}` | authorized rights party/source viewer | `RightsObjectResponse`; object/source/proof/identifier-safe state | `403`, concealment-safe `404`, `429`, `503` |
| `POST /api/v1/rights/objects/{objectId}/ledgers` | `CreateLedgerDraftRequest`: right type/territory/payout-basis term and rows with authorship/provenance; authorized editor/key | `201 RightsLedgerResponse`; draft/unallocated exact totals/version | `403`, `404`, `409 OPEN_DRAFT_EXISTS`, `422 ROW_OR_TERRITORY_INVALID`, `429` |
| `PATCH /api/v1/rights/ledgers/{ledgerId}` | `UpdateLedgerDraftRequest`: full replacement row set and reason; editor ETag/key | `RightsLedgerResponse`; successor draft/version/exact gap | `403`, `404`, `409 LEDGER_FROZEN|VERSION_CONFLICT`, `422 RATIONAL_INVALID`, `428`, `429` |
| `POST /api/v1/rights/ledgers/{ledgerId}/proposals` | `ProposeLedgerRequest`: exact row/source hash, consent delivery policy; proposer ETag/key | `201 LedgerProposalResponse`; frozen ledger/hash/complete consent set | `403`, `409 LEDGER_UNBALANCED|SOURCE_STALE|VERSION_CONFLICT`, `422 STRUCTURE_INVALID`, `428`, `429` |
| `GET /api/v1/rights/ledgers/{ledgerId}` | named party/authorized rights viewer | `RightsLedgerResponse`; complete exact ledger, row authorship, state and consent progress | `403`, `404`, `429`, `503` |
| `POST /api/v1/rights/ledgers/{ledgerId}/consents` | `LedgerConsentRequest`: consent/refuse, whole-ledger hash, authorized row/party, method/evidence; named party/key | `201 LedgerConsentResponse`; row evidence and aggregate state | `403 CONSENT_AUTHORITY_REQUIRED`, `404`, `409 CONSENT_STALE|CONSENT_EXISTS`, `422`, `429` |
| `POST /api/v1/rights/ledger-consent-links` | `CreateLedgerConsentLinkRequest`: ledger/hash/intended recipient/expiry; authorized coordinator/key | `201 LedgerConsentLinkResponse`; one-time secret/policy/version | `403`, `409`, `422`, `429` |
| `GET /api/v1/rights/ledger-consent-links/{token}` | bound intended identity | `LedgerConsentProjection`; complete frozen ledger/consequence/consent action | `403 RECIPIENT_MISMATCH`, non-enumerable `404`, `410`, `429` |

Reads are 120/min/person; object assertions 30/hour/party; draft writes 60/min/object; proposals 10/hour/ledger; consent actions 20/min/person and link opens 60/min/IP. All private responses are no-store; every proposal/consent is 100% audited. Percentages and private party data never enter ordinary logs/events.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `rights.works` / `recordings` | separate asserted objects/lifecycle/source project-version/proof refs/state/version; no automatic ownership rows |
| `rights.recording_work_link_versions` / `recording_work_links` | recording/set version and typed positive reduced rationals; deferred exact-sum constraint |
| `rights.ledger_versions` / `ledger_rows` | object/right/territory/state/payout-basis term/proposer/source hash/supersedes and party/kind/numerator/denominator/author/writer anchor/provenance |
| `rights.ledger_consents` / `consent_deliveries` | exact ledger/row/party/state/method/evidence/time and intended-recipient hash/delivery; unique current version/party/row |

RLS grants whole-ledger read only to named parties and purpose-scoped authorities, while mutation is row/party/mandate bound. A serializable proposal RPC reduces rationals, validates writer/publisher/master pools, freezes row order/hash and creates the exact consent set atomically. Consent RPC rechecks acting authority, intended identity and ledger hash, then derives aggregate state; no worker can create consent. Workers deliver reminders within governed bounded cadence and derive consumer projections only from consented states.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Rights object | `asserted → active → archived`; asserted may become archived before activation | Authorized lifecycle command triggers. Objects with non-empty or consented records cannot be deleted; archival preserves source, proof and rights history. |
| Recording-work link set | immutable version; current pointer `active → superseded` | Authorized full-set replacement with expected version triggers. Non-positive, unreduced or non-unit-total weights and stale versions block replacement. |
| Rights ledger | `draft ↔ unallocated`; `draft|unallocated → proposed`; proposed `→ consented|refused|disputed`; any frozen outcome `→ superseded` through an explicit successor | Row edits derive draft versus unallocated. Proposal requires exact arithmetic/structure and freezes hash/order/terms. Only the complete required consent set yields consented; refusal or dispute never mutates the frozen ledger. |
| Ledger consent | immutable `consented|refused`, bound to exact ledger hash/row/party/authority | Named authorized party command triggers. Duplicate, stale-hash, wrong-recipient or absent-authority attempts are rejected; silence and delivery state create no transition. |
| Public-domain declaration | terminal zero-row declaration governed by Shard 10c | Authorized exact-scope declaration triggers. It cannot be inferred from an empty ledger or converted into ownership rows. |

Every unlisted transition returns the typed state/version/hash conflict. Events include object changed and ledger proposed/consented while consumers receive state/provenance and exact rationals only when explicitly required.

## Failure, Deepening and Ambiguity Gate

Tests cover credit/project auto-ownership attempts, rational reduction/overflow, decimal round-trip prohibition, unbalanced draft persistence, no auto-remainder, publisher anchor mismatch, entity non-flattening, stale link set, concurrent proposals, one-row-only consent attempt, link-read/silence semantics, ledger edit after consent and unreachable party. Logs omit shares/evidence. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical object, arithmetic, proposal and consent behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Rights objects and ledger-consent contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09a-project-containers-creative-docs|Project containers, release boards and creative documents — Backend Specification]]
