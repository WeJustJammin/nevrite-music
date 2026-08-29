# Cover, Print & Grand-Right Routing — Backend Specification

**Status:** Complete
**IA source:** [Shard 21](../ia/21-specialized-licensing.md)
**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 21d: cover compulsory-mechanical eligibility, print/lyric negotiated routing, and explicit grand-rights exclusion |
| Included interaction | SPL-15 |
| Included features | 11.09 Cover Songs & Compulsory Mechanical Licensing; 11.10 Print & Lyric Rights; 11.11 Grand Rights & Dramatic Performance |
| Canonical contract | `ClassifySpecialRoute` |
| Canonical models | `cover_mechanical_case`, `print_lyric_request` |
| Boundary | Classification precedes Shard 20 routing. Valid compulsory routes ignore owner veto; print/lyrics require negotiated rights; grand rights are unsupported and never substituted with ordinary media scope. |

## Referenced Material Inventory

| Material | Trace | Use |
|---|---|---|
| Shard 21 special-right decisions | `../ia/21-specialized-licensing.md`, Overview/Specialized Decisions, lines 7–35 | Cover eligibility, owner-veto limit, grand-right WONT, provider boundary |
| Feature/acceptance | same file, Features/Acceptance Criteria, lines 37–62 | Features 11.09–11.11 and AC-SPL-15 |
| Interaction truth | same file, Interactions/Global Interaction Rules, lines 64–90 | SPL-15 completion/error/recovery and no route inference |
| Contract/model truth | same file, Contracts/Data Models, lines 92–161 | `ClassifySpecialRoute`, `cover_mechanical_case`, `print_lyric_request` |
| Access/events | same file, Access Control/Event Schemas, lines 163–208 | Owner/operator limits and `licensing.special-route.changed.v1` |
| Licensing core | `../ia/20-licensing-core.md`, lines 97–183 | Negotiated/statutory scope and instrument boundary |
| BE00 | `00-infrastructure.md`, lines 67–501 | API, error, middleware, idempotency, database, event and test inheritance |
| Architecture/standards | `../2026-08-02-architecture-design.md`, lines 359–999; `../ENGINEERING-STANDARDS.md`, lines 96–166 | Contract/security/privacy/observability/SLO floors |

## IA Source Map

| Interaction | Backend responsibility | Canonical artifacts |
|---|---|---|
| SPL-15 | Validate exact intended use/work/release/territory; classify faithful eligible cover to statutory route, material change to negotiated derivative route, print/lyric to negotiated route, missing facts to blocked gap, and dramatic/grand right to explicit unsupported WONT | `ClassifySpecialRoute`; `cover_mechanical_case`; `print_lyric_request`; `licensing.special-route.changed.v1` |

### Canonical identifier registry

- Contract: `ClassifySpecialRoute`.
- Models: `cover_mechanical_case`, `print_lyric_request`.
- Event: `licensing.special-route.changed.v1`.
- Exact source errors: `STATUTORY_ROUTE_INELIGIBLE`, `GRAND_RIGHTS_UNSUPPORTED`.

## Endpoint Completeness Reconciliation

SPL-15 is one server-side classification and persistence operation. It does not issue a Shard 20 instrument, upload or generate scores/transcriptions, provide legal advice, or automate grand rights. Rate-table administration, work/release registry, artifacts, and generic BE00 endpoints remain external to this companion. No extra CRUD route is justified.

## Shared Contract Inheritance

BE00 supplies `/api/v1`, request IDs, auth, CSRF/CORS, body limit, rate headers, canonical idempotency, transaction/outbox, event envelope, validation, logging and Sentry redaction. Every non-2xx uses `ApiError { code, message, requestId, details }`. Special-route details may contain `caseId`, route class, missing fact keys, settings version and safe next action; they never contain lyric text, score/artifact contents, rights-holder contact, legal evidence, or owner policy. Replay semantics and `IDEMPOTENCY_KEY_REUSED` inherit BE00.

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| SPL-15 | POST /api/v1/licensing/special-route-classifications | Authenticated user with standing on intended release/project, or assigned licensing operator | first-party-write | Strict discriminated intended-use request + registry/settings versions | 20/min/party | Required 30d | 200/201; typed 422 for committed blocked/unsupported case |

Exact-origin credentialed CORS allows POST, Content-Type, X-CSRF-Token, Idempotency-Key and If-Match when reclassifying. Wildcard/null origins fail; BE00 owns OPTIONS.

### Operation Contract Matrix

| Op | Request schema | Success schema | Error schema |
|---|---|---|---|
| SPL-15 | `ClassifySpecialRouteRequest` | `ClassifySpecialRouteResult` | BE00 `ApiError { code, message, requestId, details }` |

## Request and Success Contracts — Zod 4

~~~ts
import { z } from "zod";
const Uuid=z.uuid(), Instant=z.iso.datetime({offset:true}), Version=z.int().positive(), Sha256=z.string().regex(/^[a-f0-9]{64}$/), Currency=z.string().regex(/^[A-Z]{3}$/);
const Territory=z.string().regex(/^[A-Z]{2,3}$/);
const Common=z.object({caseId:Uuid.nullable(),workId:Uuid,releaseId:Uuid,requestingPartyId:Uuid,territories:z.array(Territory).min(1).max(250),intendedReleaseAt:Instant,registryVersion:Version,classificationSettingsVersion:z.string().min(1).max(80),expectedCaseVersion:Version.nullable()}).strict();
const Cover=Common.extend({useKind:z.literal("cover_mechanical"),faithfulness:z.enum(["faithful","material_melody_change","material_lyric_change"]),previouslyDistributedInTerritories:z.boolean(),authorizedRecording:z.literal(true),deliveryConfigurations:z.array(z.enum(["download","interactive_stream","physical"])).min(1).max(3),expectedUnits:z.int().min(0).max(1_000_000_000)}).strict();
const PrintLyric=Common.extend({useKind:z.literal("print_lyric"),textArtifactRef:Uuid,artifactDigest:Sha256,format:z.enum(["printed_lyrics","digital_lyrics","sheet_music","synced_lyrics","merchandise_text"]),quantity:z.int().min(1).max(10_000_000),commercialUse:z.boolean(),suppliedAuthorizedArtifact:z.literal(true)}).strict();
const Grand=Common.extend({useKind:z.literal("grand_rights"),dramaticContext:z.enum(["staged_musical","dramatic_performance","narrative_dramatization","other_dramatic"]),performanceCount:z.int().min(1).max(1_000_000),venueClass:z.string().min(1).max(80)}).strict();
export const ClassifySpecialRouteRequest=z.discriminatedUnion("useKind",[Cover,PrintLyric,Grand]);

const CaseBase=z.object({caseId:Uuid,workId:Uuid,releaseId:Uuid,settingsVersion:z.string().min(1).max(80),territories:z.array(Territory).min(1).max(250),version:Version,classifiedAt:Instant,replayed:z.boolean()}).strict();
export const ClassifySpecialRouteResult=z.discriminatedUnion("route",[
 CaseBase.extend({route:z.literal("cover_compulsory_mechanical"),eligibility:z.literal("eligible"),statutoryRateTableVersion:z.string().min(1).max(80),accountingRoute:z.literal("statutory_mechanical"),ownerVetoApplied:z.literal(false),nextAction:z.literal("request_shard20_statutory_instrument")}).strict(),
 CaseBase.extend({route:z.literal("negotiated_derivative"),eligibility:z.literal("cover_materially_changed"),accountingRoute:z.literal("negotiated"),ownerVetoApplied:z.literal(false),nextAction:z.literal("request_shard20_derivative_clearance")}).strict(),
 CaseBase.extend({route:z.literal("negotiated_print_lyric"),artifactAccepted:z.literal(true),accountingRoute:z.literal("negotiated"),platformGeneratedArtifact:z.literal(false),nextAction:z.literal("request_shard20_negotiated_instrument")}).strict()
]);

export const SpecialRouteErrorDetails=z.discriminatedUnion("classification",[
 z.object({classification:z.literal("blocked_gap"),caseId:Uuid,missingFacts:z.array(z.enum(["work","release","territory","faithfulness","artifact","format","use"])).min(1),nextAction:z.literal("supply_missing_facts")}).strict(),
 z.object({classification:z.literal("grand_rights_unsupported"),caseId:Uuid,wont:z.literal(true),ordinaryMediaScopeSubstituted:z.literal(false),nextAction:z.literal("obtain_external_grand_rights_counsel")}).strict()
]);
~~~

The handler persists an immutable classification case before returning a typed 422 for blocked gap or `GRAND_RIGHTS_UNSUPPORTED`; idempotent replay returns the same case/error. A cover with material melody/lyric change produces negotiated derivative success rather than statutory issuance. A faithful cover is still subject to territory/statutory facts but never an owner-policy veto. Print/lyric requires a supplied authorized artifact; the platform never generates one.

## Authorization, Ownership, and Disclosure

| Principal | Allowed | Denied |
|---|---|---|
| Release/project participant | Classify own intended use and view own case | Classify another private project or inspect rights-holder evidence |
| Work/master owner/admin | Classify under standing and see routed request | Veto a valid compulsory route through owner policy; auto-approve grand rights |
| Licensing operator | Assigned route validation and settings/rate evidence | Issue Shard 20 instrument, give consent, generate score/text |
| Support/counsel | Purpose-granted mechanical/legal evidence | Override statutory facts, privacy, authority, or unsupported boundary |
| Service principal | No interactive classification authority | Wildcard registry/artifact/case access |

Unknown/undiscoverable case/work/release/project returns 404. A visible object with insufficient standing returns 403; invalid mandate/step-up is 403. Missing facts are 422 only after the caller may discover the case. Public responses never reveal rights-holder contact/policy, supplied text/artifact content, legal evidence, or another party's case.

## Database Schema

Server-only `licensing_private`; party FKs target `platform_private.party(id)`.

| Logical fields | Target/meaning | Enforcement |
|---|---|---|
| `work_id`, `release_id` | Shard 10 rights registry and release/project UUID | Registry/version/standing seam before classification |
| `text_artifact_ref` | BE00 encrypted authorized artifact UUID | Digest and purpose capability; content never stored here |
| `instrument_id` | Future Shard 20 routed instrument UUID | Null during classification; later route workflow owns binding |
| settings/rate versions | Governed versioned settings records | Effective territory/date lookup, retained in case evidence |

~~~sql
CREATE TABLE licensing_private.special_route_case (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), requesting_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 work_id uuid NOT NULL, release_id uuid NOT NULL, use_kind text NOT NULL CHECK(use_kind IN ('cover_mechanical','print_lyric','grand_rights')),
 territories text[] NOT NULL CHECK(cardinality(territories) BETWEEN 1 AND 250), intended_release_at timestamptz NOT NULL,
 registry_version bigint NOT NULL CHECK(registry_version>0), classification_settings_version text NOT NULL CHECK(length(classification_settings_version) BETWEEN 1 AND 80),
 classification text NOT NULL CHECK(classification IN ('cover_compulsory_mechanical','negotiated_derivative','negotiated_print_lyric','blocked_gap','grand_rights_unsupported')),
 state text NOT NULL CHECK(state IN ('classified','blocked','unsupported','superseded')), missing_facts text[] NOT NULL DEFAULT '{}',
 ordinary_media_scope_substituted boolean NOT NULL DEFAULT false CHECK(NOT ordinary_media_scope_substituted),
 supersedes_case_id uuid NULL REFERENCES licensing_private.special_route_case(id), version bigint NOT NULL CHECK(version>0), classified_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,version)
);
CREATE TABLE licensing_private.cover_mechanical_case (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), special_route_case_id uuid NOT NULL UNIQUE REFERENCES licensing_private.special_route_case(id),
 faithfulness text NOT NULL CHECK(faithfulness IN ('faithful','material_melody_change','material_lyric_change')),
 previously_distributed boolean NOT NULL, authorized_recording boolean NOT NULL CHECK(authorized_recording), delivery_configurations text[] NOT NULL CHECK(cardinality(delivery_configurations) BETWEEN 1 AND 3),
 expected_units bigint NOT NULL CHECK(expected_units BETWEEN 0 AND 1000000000), eligibility text NOT NULL CHECK(eligibility IN ('eligible','ineligible_material_change','ineligible_territory_facts')),
 statutory_rate_table_version text NULL CHECK(statutory_rate_table_version IS NULL OR length(statutory_rate_table_version)<=80),
 accounting_route text NOT NULL CHECK(accounting_route IN ('statutory_mechanical','negotiated')),
 owner_veto_applied boolean NOT NULL DEFAULT false CHECK(NOT owner_veto_applied), created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((eligibility='eligible')=(statutory_rate_table_version IS NOT NULL AND accounting_route='statutory_mechanical'))
);
CREATE TABLE licensing_private.print_lyric_request (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), special_route_case_id uuid NOT NULL UNIQUE REFERENCES licensing_private.special_route_case(id),
 text_artifact_ref uuid NOT NULL, artifact_digest text NOT NULL CHECK(artifact_digest ~ '^[a-f0-9]{64}$'),
 format text NOT NULL CHECK(format IN ('printed_lyrics','digital_lyrics','sheet_music','synced_lyrics','merchandise_text')),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10000000), commercial_use boolean NOT NULL,
 supplied_authorized_artifact boolean NOT NULL CHECK(supplied_authorized_artifact), platform_generated_artifact boolean NOT NULL DEFAULT false CHECK(NOT platform_generated_artifact),
 state text NOT NULL CHECK(state IN ('negotiated_route_required','instrument_requested','instrument_issued')),
 instrument_id uuid NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='instrument_issued')=(instrument_id IS NOT NULL))
);
~~~

Canonical `cover_mechanical_case` and `print_lyric_request` map literally; `special_route_case` is the common support aggregate required to persist blocked and unsupported classifications. Cases append successors; classification facts are never overwritten.

### Indexes, RLS, and grants

| Table | Query indexes | RLS | Grants |
|---|---|---|---|
| special_route_case | `(requesting_party_id,classified_at DESC)`; work/release; classification/state; supersedes | requester/standing participant; assigned operator/purpose reviewer | classify command; safe route projection; no direct client DML |
| cover_mechanical_case | route case unique; eligibility/rate version; accounting route | inherits visible route case; operator statutory-settings mandate | classification function only |
| print_lyric_request | route case unique; state; instrument partial | inherits visible route case; Shard20 exact request worker | classification/routing functions only |

All tables ENABLE/FORCE RLS using party/work/release/project/mandate/purpose context. `migration_role` owns; no direct client DML and no public DML. Security-definer functions pin `search_path`, keep `row_security=on`, validate logical references and revoke PUBLIC.

### Retention and deletion

Classification/settings/rate evidence, routed instrument linkage and audit/outbox persist for licence/accounting/dispute retention. Supplied artifact content stays in BE00 encrypted storage under its schedule; this schema retains only reference/digest. Unsupported/blocked cases may deidentify optional actor metadata, but the WONT/gap outcome cannot be falsified. Legal holds override deletion.

## State, Middleware, Concurrency, and Data Flow

| Aggregate | State machine | Invariant/recovery |
|---|---|---|
| Route case | absent → classified/blocked/unsupported; reclassification appends successor; prior → superseded | No inference/substitution; same facts/settings replay same result |
| Cover case | eligible statutory or ineligible → negotiated derivative | Owner veto never changes valid statutory facts |
| Print/lyric | negotiated_route_required → instrument_requested → instrument_issued | Platform never generates artifact; Shard20 owns issuance |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| SPL-15 | first-party-write | project/release standing or assigned operator | 20/min/party | 128 KiB strict discriminated request, conditional If-Match, 30d idempotency |

### Operation flows

| Op | Transactional flow and lock order |
|---|---|
| SPL-15 | Authenticate/authorize discoverability → validate exact use facts/artifact → lock work/release/current case/settings version → classify → insert case/subtype/audit/outbox/idempotency → return 2xx route or committed 422 gap/WONT |

Lock order work/release → settings/rate version → current route case → subtype → idempotency. Serializable retry is twice with 25/75 ms backoff. Version/unique case constraints ensure one winner; a settings/registry change returns 409 and preserves prior case.

### External seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit behavior |
|---|---|---|
| Rights/work registry | `{partyId,workId,releaseId,registryVersion,purpose}` → `{standing,workIdentity,releaseFacts,currentVersion,digest}` | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; classification blocks |
| Statutory settings | `{territories,intendedReleaseAt,deliveryConfigurations,settingsVersion}` → `{eligibilityRules,rateTableVersion,effectiveFacts,digest}` | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; missing facts become blocked gap, never guessed |
| BE00 artifact | `{artifactRef,expectedDigest,purpose=print_lyric_classification}` → `{authorized,digest,mimeClass,expiresAt}` | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; print route blocks |
| Shard20 route preflight | `{workId,releaseId,route,territories,caseDigest}` → `{routeSupported,requiredScopeClass,policyVersion}` | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens 60,000 ms after 5 failures; classification persists but instrument not requested |
| PostgreSQL command RPC | `{opId,principal,validatedUse,canonicalHash}` → `{case,subtype,outbox,audit,idempotency}` | Timeout 2,000 ms; 2 retries for serialization failures with 25/75 ms backoff; circuit opens 15,000 ms after 5 failures |

No grand-right provider seam exists by design. Provider/integration additions require a future approved evolution; they cannot be inferred from this contract.

## Event Contract

~~~ts
const EventBase=z.object({eventId:Uuid,aggregateId:Uuid,aggregateVersion:Version,occurredAt:Instant,requestId:Uuid,actorPartyId:Uuid.nullable(),payloadDigest:Sha256}).strict();
export const SpecialRouteChanged=EventBase.extend({type:z.literal("licensing.special-route.changed.v1"),payload:z.object({caseId:Uuid,route:z.enum(["cover_compulsory_mechanical","negotiated_derivative","negotiated_print_lyric","blocked_gap","grand_rights_unsupported"]),state:z.enum(["classified","blocked","unsupported","superseded"]),version:Version}).strict()}).strict();
~~~

BE00 outbox delivery is at-least-once and consumers dedupe `(aggregateId,aggregateVersion)`. The event excludes lyric/score/artifact content, work description, owner policy/contact, legal evidence, quantities, rates/amounts and unsupported-case narrative.

## Errors, Failure Recovery, and Observability

| Op | BE00 `ApiError { code, message, requestId, details }` codes | Recovery |
|---|---|---|
| SPL-15 | VALIDATION_FAILED; ROUTE_FACTS_MISSING; STATUTORY_ROUTE_INELIGIBLE; GRAND_RIGHTS_UNSUPPORTED; REGISTRY_VERSION_CHANGED; SETTINGS_VERSION_CHANGED; FORBIDDEN; NOT_FOUND | Supply facts/refresh; use negotiated derivative/print route or external grand-right counsel; never guess/auto-approve |

Failure recovery matrix:

| Failure | Durable behavior |
|---|---|
| Missing territory/use/artifact fact | Persist blocked case and typed missing keys; no Shard20 request |
| Material cover change | Persist negotiated derivative route; never issue compulsory route |
| Settings/registry race | Roll back new case; refresh/reclassify with explicit versions |
| Shard20 unavailable | Classification remains committed; instrument request remains absent/retriable by case digest |
| Grand-right attempt | Persist unsupported WONT; no provider call or ordinary-scope substitution |

Per-operation observability matrix:

| Op | Safe fields/metrics | SLO/tests |
|---|---|---|
| SPL-15 | opId,useKind,route,state,territoryCount,settingsVersion; `special_route_classification_total` | p95 3 s; statutory/material/print/grand/gap/auth/version/circuit tests; any grand auto-route pages |

Logs/Sentry omit text/artifact content, work descriptions, rights-holder identity/policy, legal evidence, quantities, rate values and instrument contents. Alerts cover settings failures, blocked-gap rate, Shard20 preflight lag, outbox lag, and any ordinary-scope substitution or owner veto on a valid statutory result.

## Release and Testing

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| SPL-15 | Faithful statutory, material-change negotiated, print negotiated, blocked and grand WONT cases | standing/IDOR, exact-origin CSRF, strict union, exact ApiError/details | settings/registry races, replay one case/event, Shard20 outage, no generated artifact |

Property tests cover use-kind discrimination, territory arrays and no owner-veto/substitution invariants. Handler/OpenAPI tests cover 200/201/409/422/403/404 envelopes. PostgreSQL tests cover constraints, subtype atomicity, RLS/grants, append-only history, rollback, outbox and idempotency. Security tests cover IDOR, CSRF/CORS, artifact capability, log/event redaction and absence of grand-right egress.

Release schema/RLS/functions → settings snapshot → contracts/handler → event consumers → flag. Rollback disables classification without deleting prior cases. Recovery scans committed cases lacking expected Shard20 preflight, outbox gaps and supersession discrepancies. Grand rights remains permanently disabled absent a new approved architecture decision.

## Deepening Passes

- Integrity: classification pins registry/settings facts and stores a subtype or explicit blocked/WONT outcome atomically.
- Security/privacy: discoverability precedes fact exposure; artifact content and rights-holder/legal evidence remain outside this schema/events/logs.
- Concurrency: versioned work/settings/case locks make reclassification deterministic.
- Recovery: missing facts, material changes, Shard20 outage and unsupported grand rights retain honest next actions.
- Operations: the sole operation has complete contract, middleware, error, telemetry, tests, migration and reconciliation coverage.

## Ambiguity Gate

**PASS.** Macro boundaries are fixed: this operation classifies only; Shard 20 issues instruments, settings own statutory facts/rates, storage owns supplied artifacts, and grand rights remain an explicit WONT. Micro ambiguity is closed for SPL-15 across route, principal, CORS, validation, rate, idempotency, response/error variants, 403/404, lock order, persistence, event, SLO and recovery. Owner veto cannot defeat a valid compulsory route; ordinary media cannot stand in for print or grand rights; no score/transcription is generated.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for Shard 21d; source split validated and ambiguity gate passed. |

## Dependency References

- [BE00 infrastructure](00-infrastructure.md)
- [Shard 21 IA](../ia/21-specialized-licensing.md)
- [Shard 20 licensing core](../ia/20-licensing-core.md)
- [Shard 10 rights ownership](../ia/10-rights-ownership.md)
