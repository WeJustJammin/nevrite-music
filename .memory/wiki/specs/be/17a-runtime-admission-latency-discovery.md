# Runtime admission, preflight, latency and partner discovery — Backend Specification

**Status:** Complete; specialized runtime disabled  
**IA Source:** [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]  
**Deep Dive:** [[specs/ia/deep-dives/17-realtime-sessions|Real-time sessions deep dive]]

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

- **Shard split:** 1 of 4; RTS-01, RTS-02, RTS-03 and RTS-04.
- **Boundary:** private session intent, separately approved runtime admission, rig preflight, pairwise measurement, versioned playability and coarse opt-in discovery.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 17 IA/deep dive | runtime seam, measurement/discovery algorithm and Phase-2 admission |
| Shards 00, 01, 09 and 11 | capability gates, authority, project sessions and discovery privacy |

## Runtime and Measurement Invariants

- Consumer launch has no live audio, remote monitoring or specialized-runtime dependency. Private session intent may be planned, but runtime-dependent routes return `REALTIME_RUNTIME_DISABLED` before provider/device effect.
- Phase-2 admission requires runtime/provider/version, supported OS/devices, relay regions, capabilities, privacy/security review, egress ceiling, tested fallback, infrastructure verification and kill switch.
- Astro/Hono/Supabase own authority and durable facts only. Supabase Realtime is UI invalidation/presence, never audio transport, recorder, transport clock or attendance evidence.
- Runtime receives short-lived session/endpoint/purpose credential after domain authorization and cannot derive party or project authority.
- Preflight returns timestamped `pass|fail|not_run|stale` facts for authorized device, storage, sample rate, local path, network and mode with exact fixes.
- Pairwise probes require mutual session intent/consent. Directional interval, components, jitter, confidence and freshness remain evidence; RTT/2 never becomes directional certainty.
- Playability is pair-specific and reports BPM ceiling, instrument scope, confidence, freshness and evidence basis. `unknown` is first-class; worst pair bounds a room and red suggests overdub without blocking intent.
- Discovery is opt-in coarse market/metro plus instrument/role/availability/mode. Public data never contains exact coordinates, home address, IP, route history or false radius guarantees.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Raw samples, IPs and device names never enter domain events or logs.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/remote-session-intents` | project/participants/mode/schedule/disclosure/policy versions; producer/key | `201 SessionIntentResponse`; private planned intent/version | `403`, `409 SOURCE_STALE`, `422 AGE_GATE_DISABLED`, `429` |
| `POST /api/v1/remote-session-intents/{id}/runtime-grants` | endpoint/purpose/runtime version/capabilities; participant/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /internal/v1/realtime/runtime-admissions` | provider/security/privacy/cost/verification/kill-switch evidence; release principal/key | no launch success without approved evolution | `403 REALTIME_RUNTIME_DISABLED`, `409 EVIDENCE_INCOMPLETE`, `422`, `429` |
| `POST /api/v1/remote-session-intents/{id}/preflights` | endpoint/device-class/storage/sample-rate/network facts; runtime principal/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/remote-session-intents/{id}/path-probes` | endpoint pair/consent/runtime version/bounded samples; runtime principal/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 CONSENT_STALE`, `422`, `429` |
| `GET /api/v1/remote-session-intents/{id}/path-verdicts` | authorized participant | `PathVerdictPage`; measured/unknown/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/realtime-discovery/opt-ins` | coarse market/roles/instruments/availability/modes; user/key | `201 RealtimeDiscoveryOptInResponse`; safe projection/version | `403`, `422 PRECISE_LOCATION_FORBIDDEN`, `429` |
| `POST /api/v1/realtime-discovery/searches` | coarse region/role/instrument/window/mode; opted-in user/key | `RealtimeCandidatePage`; candidates/stale verdict labels | `403`, `422`, `429`, `503` |

## Persistence, RLS and Workers

- `remote_session_intent`, `runtime_admission`, `endpoint_preflight`, `pair_path_measurement`, `pair_path_verdict` and `realtime_discovery_opt_in` use source-policy versions and bigint concurrency.
- Measurement table stores bounded derived intervals/components only; raw network samples and addresses have short runtime-local retention and no PostgreSQL/public projection.
- RLS limits intent/verdict to participants, admission evidence to release/security reviewers and opt-in projection to coarse fields. Pair probing requires both endpoint grants in one intent.
- Gate is enforced at router, database function and runtime credential issuer. Verdict worker version-pins policy and returns `unknown` on stale/insufficient evidence.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Realtime capability | launch terminal `disabled`; future `disabled → admission_pending → enabled|rejected`, enabled `→ killed|disabled` | Explicit evolved provider/security/privacy/cost/fallback/infrastructure evidence and kill switch trigger. Ordinary admin/route cannot enable; disabled rejects before provider/device effect. |
| Remote session intent | `planned → scheduled → cancelled|expired`; future enabled runtime may add `active → completed|failed` | Authorized producer intent/time triggers. Intent grants no runtime capability, party authority or attendance evidence. |
| Endpoint preflight | future `not_run → running → pass|fail`; pass/fail `→ stale` | Admitted runtime device/storage/network facts trigger. Unavailable while disabled; stale/failed result cannot authorize endpoint. |
| Pair path verdict | future `measuring → playable|unplayable|unknown`; any result `→ stale` | Mutual endpoint consent and bounded directional evidence trigger. Missing/stale evidence yields unknown; RTT/2 and room-average certainty are forbidden. |
| Discovery opt-in | `active ↔ paused`; active/paused `→ revoked|expired` | User explicit coarse-region command/timer triggers. Precise location/address/IP/history blocks and outage cannot fabricate radius/candidates. |

Every unlisted transition returns the typed state/version/runtime-gate conflict. Events/logs omit raw samples, IPs, device names and precise location.

## Failure, Deepening and Ambiguity Gate

Tests cover browser fallback, Supabase-as-audio, admin gate bypass, authority derivation, RTT/2 certainty, missing consent, stale green verdict, averaged bad pair, precise-location leakage and discovery-service outage. Seven passes converge; two implementers receive identical disabled-runtime and measurement behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Runtime, latency and discovery contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time sessions]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/11c-collaborator-discovery-calls|Collaborator discovery and calls — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time jamming and remote sessions]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/11c-collaborator-discovery-calls|Collaborator discovery, availability and calls — Backend Specification]]
