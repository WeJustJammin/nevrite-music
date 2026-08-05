# Production advance checklist, sheets and freeze control — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]  
**Deep Dive:** [[specs/ia/deep-dives/32-show-production-planning|Show production planning deep dive]]

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

- **Shard split:** 4 of 4; 32.10, 32.11, 32.13, 32.14 and 32.15.
- **Boundary:** deterministic advance items, assigned responses/counter-confirmation, exact-version accessible sheets, transparent freeze and severity-driven post-freeze change acknowledgement.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 32 IA/deep dive | checklist derivation, external response, sheet projection, freeze and critical change |
| Shards 04 and 05 | accessible governed artifacts, notification/settings policy |

## Advance and Freeze Invariants

- Checklist derives from diff/source versions. Only shortfall/unknown/judgement needs create rows; match creates none. Every row has owner side, severity, urgency/lead time, resolve-by and provenance.
- Assigned side or scoped expiring external link may answer with evidence. Self-confirmation is labelled; completion requiring counterparty never occurs silently.
- Sort may be urgency or severity and always exposes both in text. External workflow is responsive, screen-reader usable and never requires PDF-only action.
- Advance sheet renders exact authorized version as accessible HTML, tagged PDF and live link. Old link remains resolvable with supersession notice.
- Freeze appends plan hash, checklist/source versions, visible hard open items and exception reason. It never hides unresolved hard items.
- Post-freeze change requires reason/delta and creates successor plus severity-driven recipients. Critical change remains unacknowledged/at-risk until required actors respond.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/production-events/{id}/advance-items` | diff/source/policy versions/event key; checklist worker | `AdvanceChecklistResponse`; deterministic delta/version | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422 LEAD_TIME_INVALID`, `429` |
| `POST /api/v1/advance-items/{id}/responses` | answer/evidence/expected version/key; assigned actor or scoped link | `AdvanceItemResponse`; answered/pending-counter-confirmation/resolved | `403 ASSIGNMENT_FORBIDDEN`, `409 LINK_EXPIRED|VERSION_CONFLICT`, `422 COUNTER_CONFIRM_REQUIRED`, `428`, `429` |
| `POST /api/v1/advance-items/{id}/confirmations` | response hash/expected version/key; required counterparty | `AdvanceItemResponse`; resolved/contested | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/production-events/{id}/advance-sheets` | checklist/version/recipient projection/format/key; authorized producer | `201 AdvanceSheetResponse`; exact HTML/PDF/live refs | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/production-events/{id}/advance-freezes` | checklist/source versions/exceptions/reason/key; producer | `201 AdvanceFreezeResponse`; hash/open hard items/version | `403`, `409 VERSION_CONFLICT`, `422 HARD_ITEM_UNACKNOWLEDGED|REASON_REQUIRED`, `429` |
| `POST /api/v1/advance-freezes/{id}/changes` | delta/reason/expected version/key; authorized editor | `201 AdvanceFreezeResponse`; successor/required acknowledgements | `403 AUTHORITY_REQUIRED`, `409 VERSION_CONFLICT`, `422 CHANGE_INVALID`, `428`, `429` |
| `POST /api/v1/advance-freezes/{id}/acknowledgements` | change/decision/expected version/key; required actor | `AdvanceFreezeResponse`; acknowledged/at-risk state | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- Checklist/item/source refs, responses/evidence/confirmations, sheet artifact/version, freeze hash/exceptions and change/acknowledgement rows pin actor, recipient and source versions.
- RLS exposes items/sheets to assigned production parties, external links only to exact recipient scope and sensitive refs only through live grants; notification payloads minimize private content.
- Checklist, sheet, supersession, deadline and severity-notification workers are idempotent. Critical at-risk state cannot clear without required acknowledgement.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Advance checklist/item | checklist `current → superseded`; item `open → answered → pending_counter_confirmation → resolved|contested`; open may `→ waived|superseded` by governed source | Diff/source worker and assigned-side response trigger. Match creates no row; self-confirmation cannot silently satisfy counterparty requirement. |
| External advance link | `active → used|revoked|expired`; active use remains exact recipient/item scope | Scoped issue/use/timer trigger. Expired/revoked cannot answer and workflow remains accessible without PDF-only action. |
| Advance sheet | `queued → rendered|failed`; rendered `→ superseded|stale`; old link remains resolvable with notice | Exact authorized checklist/recipient/format trigger. HTML parity source and tagged PDF/live link pin same version. |
| Advance freeze | `draft → frozen|blocked`; frozen `→ change_pending → acknowledged|at_risk|superseded` | Exact plan/checklist/source hash/open-hard-item exception and producer command trigger. Freeze never hides unresolved hard items. |
| Post-freeze change | `unacknowledged → acknowledged|rejected|superseded`; critical remains `at_risk` until every required actor responds | Reasoned delta/severity-driven recipient decisions trigger. Missing acknowledgement cannot clear. |

Every unlisted transition returns the typed state/version/acknowledgement conflict. Notifications minimize private content and sensitive refs require live grants.

## Failure, Deepening and Ambiguity Gate

Tests cover match-created task, hidden judgement, self-confirmed completion, PDF-only action, old-link ambiguity, hidden hard freeze item, reasonless freeze, critical silent change, wrong-recipient notification and acknowledgement bypass. Seven passes converge; two implementers receive identical advancing and freeze behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Advance checklist and freeze contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Show production planning]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Event production planning and advancing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
