# Private rolodex, notes and reminders — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]  
**Deep Dive:** [[specs/ia/deep-dives/11-community-graph|Community graph deep dive]]

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

- **Shard split:** 5 of 5; COM-16 through COM-18. Consumer scope is private personal CRM only; shared/team CRM, enrichment, sales automation and enterprise directory remain deferred.
- **Boundary:** owner-isolated shadow contacts, owner-confirmed reconciliation, encrypted bounded notes/tags/lists, B5 prohibited-content enforcement and author-only reminders.
- **Approval:** Recommended split accepted under standing autonomy.

## CRM Isolation Invariants

- Every record is scoped to owner person/acting party. Two owners' contacts never deduplicate, co-reference or reveal a common subject; subject receives no signal and no CRM record creates a platform profile.
- Contact identifiers and note/tag values encrypt with owner-scoped keys. Search and all SQL predicates include owner; operators/moderators lack general access and Shard 06 cannot treat notes as allegations.
- Reconciliation requires owner confirmation of a canonical target—never email/name auto-merge. One owner transaction re-points reminders/tags/notes while content stays private and is never copied to canonical profile or subject.
- Notes are non-shareable by schema/API and structurally absent from feed, search, ranking, endorsement, referral, safety, analytics and model-training consumers.
- B5 validation rejects special-category data and unverified allegations until a narrower counsel-approved policy version exists. Raw rejected content is never indexed/logged; safe policy outcome only is retained.
- Reminders notify author only. Reconciliation moves their contact reference; delivery never contacts or signals the subject. Deletion respects governed retention/holds and leaves no shared tombstone.

## API Endpoint Matrix

All bodies are strict Zod 4 objects, no-store, and inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/me/crm/contacts` | `CreateShadowContactRequest`: private display/contact refs and source; owner/key | `201 ShadowContactResponse`; encrypted owner-only version | `403`, `409 CONTACT_DUPLICATE_WITHIN_OWNER`, `422`, `429` |
| `GET /api/v1/me/crm/contacts` | owner query/tag/list/cursor | `ShadowContactPage`; owner-only items/count | `403`, `422`, `429`, `503` |
| `PATCH /api/v1/me/crm/contacts/{id}` | owner-private replacement fields; owner ETag/key | `ShadowContactResponse`; successor version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/me/crm/contacts/{id}/reconciliations` | canonical party ID and explicit confirmation/evidence; owner ETag/key | `CRMReconciliationResponse`; one-owner re-point manifest/version | `403`, `404`, `409 TARGET_OR_VERSION_CHANGED`, `422 AUTO_RECONCILIATION_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/me/crm/contacts/{id}/notes` | bounded encrypted plain text/policy version; owner/key | `201 PrivateNoteResponse`; version/policy outcome | `403`, `404`, `422 CRM_CONTENT_PROHIBITED`, `429` |
| `POST /api/v1/me/crm/contacts/{id}/tags` | bounded encrypted tag/list value; owner/key | `201 PrivateTagResponse`; version | `403`, `404`, `422`, `429` |
| `DELETE /api/v1/me/crm/notes/{id}` | owner ETag/key | `204`; owner-only lifecycle version | `403`, `404`, `409 RETENTION_HOLD|VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/me/crm/reminders` | contact/due/optional bounded recurrence/source; author/key | `201 CRMReminderResponse`; scheduled/version | `403`, `404`, `409`, `422`, `429` |
| `PATCH /api/v1/me/crm/reminders/{id}` | complete/snooze/cancel/new due; author ETag/key | `CRMReminderResponse`; state/version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

Contact reads are 120/min/owner; contact/note/tag writes 60/min; reminders 60/min. Content validation runs before ciphertext persistence for accepted notes and retains no raw rejected body. Every access is owner-audited with opaque IDs only.

## Persistence, RLS and Workers

Tables: `community.shadow_contacts`, `private_contact_notes`, `private_contact_tags`, `crm_reconciliations`, `follow_up_reminders` and private audit events. Owner ID is part of every primary/foreign/unique key; ciphertext, key version and blind owner-local search tokens are separated from metadata.

RLS requires exact owner person/acting party on every row and forbids service-role broad scans outside purpose-specific lifecycle operations. No database view joins CRM to shared community/search tables. Reconciliation is one serializable owner transaction. Reminder workers fetch opaque due IDs, decrypt only for author projection if needed and notify author; events carry reminder/author/opaque contact ref only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Shadow contact version | immutable version; current pointer `active → superseded|reconciled`; reconciled is terminal for the shadow reference | Owner-authorized replacement or confirmed canonical target triggers. Cross-owner match, email/name inference, stale target/version or absent confirmation blocks; no subject signal is emitted. |
| Private note/tag | immutable active record `→ deleted`; deletion may be blocked without transition by `retention_hold` | Owner create/delete triggers after B5 validation. Prohibited raw content is never persisted; held record remains owner-private and absent from every shared consumer. |
| CRM reconciliation | `requested → applying → completed|failed` | Serializable owner confirmation triggers. Completion atomically re-points only that owner's reminders/tags/notes; failure rolls back every pointer and never copies content to profile/subject. |
| Follow-up reminder | `scheduled → due → completed|snoozed|cancelled`; scheduled may be `cancelled`; snoozed `→ scheduled`; recurring completion `→ scheduled` for the next governed occurrence | Database time and author command trigger. Reconciliation changes opaque contact reference only; worker may notify author, never subject. |
| Owner encryption key version | `active → rotating → superseded|rotation_failed` | Purpose-scoped lifecycle worker triggers. Reads/writes remain owner-bound; failed rotation cannot expose plaintext or permit broad service-role scanning. |

Every unlisted transition returns the typed state/version/owner conflict. Events carry only reminder/author/opaque contact references and no contact identifiers, notes, tags or common-subject signal.

## Failure, Deepening and Ambiguity Gate

Tests cover two owners same subject, cross-owner enumeration, auto email/name merge, reconciliation race, subject notification, note sharing/shared-consumer query, special-category/unverified allegation rejection, raw reject logging, moderator/safety browsing, owner-key rotation, reminder re-point and subject-directed delivery attempt. Seven passes converge; two implementers receive identical isolation, B5 and reminder behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Private CRM contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths, reachability and warm introductions — Backend Specification]]
