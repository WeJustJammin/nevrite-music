# Gear custody, operational cases, manifests and theft handoff — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]  
**Deep Dive:** [[specs/ia/deep-dives/24-gear-holdings-operations|Gear holdings deep dive]]

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

- **Shard split:** 4 of 4; 24.10, 24.11, 24.12, 24.13, 24.15 and 24.16. Interaction 24.14 is intentionally absent in the IA source.
- **Boundary:** custody handshake/grants, stale reconciliation, append-only end/dispute, immutable case/manifest snapshots and bulk theft handoff.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 24 IA/deep dive | custody state, snapshot and manifest readiness rules |
| Shards 06, 23 and 32 | disputes/theft identity and downstream carnet/advancing ownership |

## Custody and Manifest Invariants

- Custody is orthogonal to ownership. Owner or proposed holder opens pending reason/expected-return handshake; self-assertion remains pending/contested and grants no authority.
- Counterparty confirms exact custody separately from optional `public_disclosure|sell` grants. Partial acceptance may activate custody only; silence is neutral.
- Confirmed custody authorizes only reason-scoped operations and never implies sale, publication, insurance or title authority.
- Self-asserted, stale or disputed custody creates no external authority; dispute suppresses derived listing/publication immediately.
- Freshness threshold decays confidence and sends one bounded prompt to both ends. No response remains stale; system never invents return.
- Return, transfer, loss or dispute is append-only terminal/contest event ordered by aggregate version. Crossed confirmation/revocation emits compensating event.
- Case/rig membership is versioned; transfer may create unresolved placeholder. One item cannot claim impossible simultaneous physical packing without visible conflict.
- Manifest snapshot pins case/rig/member/source versions and leads with missing serial, weight, origin, value and consent gaps. It never labels incomplete output complete or issues carnet.
- Bulk theft handoff includes eligible identity records only; placeholders/quantity lines are excluded/reported and duplicates join existing Shard 23 flags.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-custodies` | gear/owner/proposed holder/reason/expected return; either party/key | `201 GearCustodyResponse`; pending/contested version | `403`, `409`, `422`, `429` |
| `POST /api/v1/gear-custodies/{id}/confirmations` | custody decision and separate grants; counterparty ETag/key | `GearCustodyResponse`; active custody/grants | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/gear-custodies/{id}/stale-evaluate` | threshold/version/event; timer worker/key | `GearCustodyResponse`; stale/prompt/no-op | `403`, `409 EVENT_REUSED`, `429` |
| `POST /api/v1/gear-custodies/{id}/terminal-events` | return/transfer/loss/dispute/evidence; owner or holder/key | `GearCustodyResponse`; closed/contested version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-cases` | purpose/members/intervals/context; controller/key | `201 GearCaseResponse`; versioned case | `403`, `409 PACKING_CONFLICT`, `422`, `429` |
| `POST /api/v1/gear-cases/{id}/versions` | membership delta/effective time; controller ETag/key | `201 GearCaseResponse`; successor/diff | `403`, `409 VERSION_CONFLICT|PACKING_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-manifests` | case/rig versions/purpose/as-of; controller/key | `202 GearManifestResponse`; snapshot/readiness gaps | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/gear-theft-handoffs` | case/rig/eligible identities/source versions; standing actor/key | `201 GearTheftHandoffResponse`; Shard 23 draft/exclusions | `403`, `409 SOURCE_STALE`, `422 STANDING_REQUIRED`, `429` |

## Persistence, RLS and Workers

- `gear_custody`, `custody_grant`, terminal events, `gear_case`, immutable versions/memberships, `gear_manifest_snapshot` and theft handoff pin source/authority versions.
- RLS exposes custody to endpoints/authorized entity roles, grants to issuer/acceptor, manifests to purpose-scoped controllers and theft handoff to standing parties/reviewers.
- Stale/manifest workers are idempotent. Snapshot transaction pins pre- or post-case edit, never mixed membership.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Gear custody | `pending → active|contested|rejected|expired`; active `→ stale|returned|transferred|lost|contested`; stale `→ active|returned|contested` | Separate counterparty custody confirmation, timer or terminal event triggers. Self-assertion/silence grants no authority; crossed events append compensation. |
| Custody grant | `proposed → active|declined|expired`; active `→ revoked|expired|superseded` independently for `public_disclosure|sell` | Explicit issuer/acceptor decision triggers. Custody acceptance never implies either grant. |
| Gear case membership | `active → unresolved_placeholder|removed|superseded`; case version `active → superseded|closed` | Controller versioned membership/transfer/loss triggers. Impossible simultaneous packing blocks or remains visible conflict; snapshots never mix versions. |
| Gear manifest | `queued → building → ready_with_gaps|blocked|failed`; ready `→ stale|expired|superseded` | Exact case/rig/member/as-of snapshot triggers. Missing serial/weight/origin/value/consent leads gaps, never complete/carnet claim. |
| Theft handoff | `draft → submitted|blocked|partial`; submitted `→ linked|failed` under Shard 23 | Standing actor and eligible identity records trigger. Placeholder/quantity rows are excluded/reported and duplicates join existing flags. |

Every unlisted transition returns the typed state/version/custody conflict. Disputed custody immediately suppresses derived listing/publication.

## Failure, Deepening and Ambiguity Gate

Tests cover custody-as-title, self-grant, partial acceptance granting sale, silence acceptance, stale auto-return, dispute authority, crossed revoke/confirm, impossible packing, mixed snapshot, false-complete carnet and placeholder theft flag. Seven passes converge; two implementers receive identical custody/manifest behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Custody/case/manifest contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear holdings]]
- [[specs/be/23b-theft-screening-recovery|Gear theft flags, transfer screening and recovery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear collections, rigs, custody and manifests]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/23b-theft-screening-recovery|Gear theft flags, transfer screening and recovery — Backend Specification]]
