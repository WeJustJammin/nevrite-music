# Sample, Interpolation & Remix Clearance — Backend Specification

**Status:** Complete
**IA source:** [Shard 21](../ia/21-specialized-licensing.md)
**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 21a: sample declaration, machine suggestion, instant/negotiated clearance, interpolation, and authorized remix/stem use |
| Included interactions | SPL-01 through SPL-06 |
| Included feature | 11.05 Sample & Derivative Clearance |
| Canonical contracts | `DeclareSample`, `SuggestSampleIdentity`, `ClearSample`, `GrantDerivativeUse` |
| Canonical models | `sample_declaration`, `sample_source_side`, `sample_identity_suggestion`, `sample_clearance_request`, `sample_terms`, `derivative_asset_grant` |
| Boundary | Humans declare; machines only suggest or measure. Unknown truth persists. Shard 20 owns scope/instrument issuance and Shard 10 owns registry authority. |

## Referenced Material Inventory

| Material | Trace | Use |
|---|---|---|
| Shard 21 overview and locked decisions | `../ia/21-specialized-licensing.md`, Overview/Specialized Decisions, lines 7–35 | Human authorship, interpolation composition-only, possession-not-authority, provider-disabled boundary |
| Feature and acceptance source | same file, Features/Acceptance Criteria, lines 37–62 | Feature 11.05 and source outcomes |
| Interaction truth | same file, Interactions/Global Interaction Rules, lines 64–90 | SPL-01–SPL-06 and non-destructive recovery |
| Canonical contracts and models | same file, Contracts/Data Models, lines 92–161 | Exact identifiers, states, obligation semantics, persistence inventory |
| Access and safe events | same file, Access Control/Event Schemas, lines 163–208 | Role limits, escalation, payload minimization, exact event types |
| Licensing-core boundary | `../ia/20-licensing-core.md`, Contracts/Data Models, lines 97–183 | Scope gate, policy, consent, quote, and issued-instrument ownership |
| Platform backend contract | `00-infrastructure.md`, API/Zod/Database/Middleware/Error/Event/Testing, lines 67–501 | Envelope, middleware order, idempotency, RLS context, outbox, observability |
| Architecture and standards | `../2026-08-02-architecture-design.md`, API/Error/Data/Security/Observability, lines 359–999; `../ENGINEERING-STANDARDS.md`, lines 96–166 | Hono/Workers, Zod 4, PostgreSQL, security and SLO floors |

## IA Source Map

| Interaction | Backend responsibility | Canonical artifacts |
|---|---|---|
| SPL-01 | Append a contributor-authored, prompt-versioned declaration and supersede rather than overwrite | `DeclareSample`; `sample_declaration`; `sample_source_side` |
| SPL-02 | Append adapter candidates or honest no-machine state; record human accept/reject without changing declaration automatically | `SuggestSampleIdentity`; `sample_identity_suggestion` |
| SPL-03 | Evaluate current identified sides against Shard 20 instant policy/gate and issue or route to negotiation | `ClearSample`; `sample_clearance_request`; `sample_terms` |
| SPL-04 | Route every source owner simultaneously, collect unanimous decisions, validate ordered obligations, then request one instrument | `ClearSample`; `sample_clearance_request`; `sample_terms` |
| SPL-05 | Record human-affirmed interpolation with composition-only routing and permanent master-not-cleared warning | `DeclareSample`; `sample_declaration`; `sample_source_side` |
| SPL-06 | Verify Shard 10 registry authority and exact assets/scope before a derivative grant | `GrantDerivativeUse`; `derivative_asset_grant` |

### Canonical identifier registry

- Contracts: `DeclareSample`, `SuggestSampleIdentity`, `ClearSample`, `GrantDerivativeUse`.
- Models: `sample_declaration`, `sample_source_side`, `sample_identity_suggestion`, `sample_clearance_request`, `sample_terms`, `derivative_asset_grant`.
- Events: `licensing.sample-declaration.changed.v1`, `licensing.sample-clearance.changed.v1`, `licensing.derivative-grant.changed.v1`.
- Source states retained literally: `declared`, `unidentified`, `suggested_match`, `identified`, `superseded`, `retracted`.

## Endpoint Completeness Reconciliation

All six interactions require server authorization, versioned persistence, audit, and/or provider orchestration, so each maps to one operation. BE00 already owns health, authentication/session, idempotency storage, error envelopes, event envelopes, and OPTIONS; this companion does not duplicate them. Reads are returned as safe projections from command results or Shard 20/09 views; no extra generic CRUD routes are introduced.

## Shared Contract Inheritance

- API base `/api/v1`, JSON UTF-8, request IDs, authentication, CSRF, CORS, body limits, rate response headers, `If-Match`, idempotency canonicalization, transaction/outbox, and provider-native diagnostics/log redaction inherit BE00.
- Every non-2xx response is BE00 `ApiError { code, message, requestId, details }`; details are code-specific, Zod-validated, and contain no source description, fingerprint, media, owner refusal reason, or provider credential.
- Mutation replay uses the original status/body/request ID semantics. Same key with a different canonical hash returns `409 IDEMPOTENCY_KEY_REUSED`.
- Events inherit the BE00 lossless envelope and are inserted in the same transaction as aggregate/audit/idempotency rows.

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| SPL-01 | POST /api/v1/licensing/sample-declarations | Owning Shard 09 contributor | first-party-write | Strict declaration union + conditional `If-Match` | 30/min/contributor | Required 30d | 201 |
| SPL-02 | POST /api/v1/licensing/sample-identity-suggestions | Exact fingerprint worker or owning contributor | first-party-write or service-no-origin | Strict run/review union + job assertion | 60/min/declaration | Required 30d | 201/200 |
| SPL-03 | POST /api/v1/licensing/sample-clearances/instant-evaluations | Work/master owner or licensing admin with standing | first-party-write | Strict scope/policy/gate request + `If-Match` | 20/min/work | Required 30d | 200/201 |
| SPL-04 | POST /api/v1/licensing/sample-clearance-negotiations | Source owner or request administrator | first-party-write | Strict open/decision/finalize union + `If-Match` | 30/min/request | Required 30d | 201/200 |
| SPL-05 | POST /api/v1/licensing/interpolation-declarations | Owning Shard 09 contributor | first-party-write | Strict composition-only declaration + `If-Match` | 30/min/contributor | Required 30d | 201 |
| SPL-06 | POST /api/v1/licensing/derivative-grants | Shard 10 registry-authorized owner/admin | first-party-write | Exact asset/scope grant + `If-Match` | 12/min/source asset | Required 30d | 201 |

SPL-02 selects CORS after authentication: a browser contributor uses credentialed exact-origin `first-party-write`; a service principal requires no `Origin` and `service-no-origin`. Wildcard/null browser origins fail. BE00 owns preflight.

### Operation Contract Matrix

| Op | Request schema | Success schema | Error schema |
|---|---|---|---|
| SPL-01 | `DeclareSampleRequest` | `DeclareSampleResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-02 | `SuggestSampleIdentityRequest` | `SuggestSampleIdentityResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-03 | `InstantClearSampleRequest` | `ClearSampleResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-04 | `NegotiateSampleRequest` | `ClearSampleResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-05 | `DeclareInterpolationRequest` | `DeclareSampleResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-06 | `GrantDerivativeUseRequest` | `GrantDerivativeUseResult` | BE00 `ApiError { code, message, requestId, details }` |

## Request and Success Contracts — Zod 4

~~~ts
import { z } from "zod";

const Uuid=z.uuid();
const Instant=z.iso.datetime({offset:true});
const Version=z.int().positive();
const Sha256=z.string().regex(/^[a-f0-9]{64}$/);
const Currency=z.string().regex(/^[A-Z]{3}$/);
const Money=z.int().nonnegative();
const Scope=z.object({territories:z.array(z.string().min(2).max(3)).min(1).max(250),startsAt:Instant,endsAt:Instant.nullable(),media:z.array(z.string().min(1).max(60)).min(1).max(30),uses:z.array(z.string().min(1).max(60)).min(1).max(30)}).strict().refine(v=>v.endsAt===null||v.endsAt>v.startsAt,{message:"scope_end_after_start"});
const Provenance=z.enum(["human","machine_suggested","machine_measured"]);
const SourceSide=z.enum(["recording","composition"]);
const SideInput=z.object({side:SourceSide,sourceState:z.enum(["known","unknown"]),sourceWorkId:Uuid.nullable(),sourceAssetId:Uuid.nullable(),prominenceBasisPoints:z.int().min(0).max(10_000),identityProvenance:Provenance,prominenceProvenance:Provenance}).strict().superRefine((v,ctx)=>{if((v.sourceState==="known")!==(v.sourceWorkId!==null))ctx.addIssue({code:"custom",path:["sourceWorkId"],message:"known_requires_work"});if(v.side==="recording"&&v.sourceState==="known"&&v.sourceAssetId===null)ctx.addIssue({code:"custom",path:["sourceAssetId"],message:"known_recording_requires_asset"});if(v.side==="composition"&&v.sourceAssetId!==null)ctx.addIssue({code:"custom",path:["sourceAssetId"],message:"composition_has_no_master_asset"});});

export const DeclareSampleRequest=z.object({contributionId:Uuid,promptVersion:z.string().min(1).max(80),expectedVersion:Version.nullable(),declarationKind:z.literal("sample"),sourceAudioPresent:z.literal(true),humanAuthored:z.literal(true),sides:z.array(SideInput).length(2)}).strict().superRefine((v,ctx)=>{const names=new Set(v.sides.map(x=>x.side));if(names.size!==2||!names.has("recording")||!names.has("composition"))ctx.addIssue({code:"custom",path:["sides"],message:"sample_requires_both_unique_sides"});});
export const DeclareInterpolationRequest=z.object({contributionId:Uuid,promptVersion:z.string().min(1).max(80),expectedVersion:Version.nullable(),declarationKind:z.literal("interpolation"),sourceAudioPresent:z.literal(false),humanAffirmedReplay:z.literal(true),masterNotClearedAcknowledged:z.literal(true),sides:z.array(SideInput).length(1)}).strict().refine(v=>v.sides[0]?.side==="composition",{message:"interpolation_composition_only"});
export const SampleSourceSideSchema=SideInput.safeExtend({sourceSideId:Uuid,declarationId:Uuid}).strict();
export const SampleDeclarationSchema=z.object({declarationId:Uuid,contributionId:Uuid,state:z.enum(["declared","unidentified","suggested_match","identified","superseded","retracted"]),declarationKind:z.enum(["sample","interpolation"]),promptVersion:z.string().min(1).max(80),humanAuthored:z.literal(true),masterNotCleared:z.boolean(),sides:z.array(SampleSourceSideSchema).min(1).max(2),supersedesDeclarationId:Uuid.nullable(),version:Version,createdAt:Instant}).strict();
export const DeclareSampleResult=z.object({declaration:SampleDeclarationSchema,replayed:z.boolean()}).strict();

const Candidate=z.object({candidateWorkId:Uuid,candidateAssetId:Uuid.nullable(),providerKey:z.string().regex(/^[a-z0-9_]{2,64}$/),modelVersion:z.string().min(1).max(80),measurementBasisPoints:z.int().min(0).max(10_000),evidenceDigest:Sha256}).strict();
export const SuggestSampleIdentityRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("run_adapter"),declarationId:Uuid,jobId:Uuid,adapterKey:z.string().regex(/^[a-z0-9_]{2,64}$/),fingerprintArtifactRef:Uuid,expectedDeclarationVersion:Version}).strict(),
 z.object({action:z.literal("review_candidate"),suggestionId:Uuid,decision:z.enum(["confirmed","rejected"]),expectedSuggestionVersion:Version}).strict()
]);
export const SuggestSampleIdentityResult=z.discriminatedUnion("outcome",[
 z.object({outcome:z.literal("candidate"),suggestionId:Uuid,declarationId:Uuid,candidate:Candidate,state:z.literal("pending_human"),version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("no_machine"),declarationId:Uuid,reason:z.enum(["provider_disabled","provider_unavailable","no_candidate"]),version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("reviewed"),suggestionId:Uuid,decision:z.enum(["confirmed","rejected"]),declarationChanged:z.literal(false),version:Version,replayed:z.boolean()}).strict()
]);

const FixedTerm=z.object({kind:z.literal("fixed_fee"),amountMinor:Money,currency:Currency,order:z.int().positive()}).strict();
const ShareTerm=z.object({kind:z.literal("revenue_share"),basisPoints:z.int().min(1).max(10_000),base:z.enum(["gross_receipts","net_receipts_defined"]),order:z.int().positive()}).strict();
const Terms=z.array(z.discriminatedUnion("kind",[FixedTerm,ShareTerm])).min(1).max(20).superRefine((a,ctx)=>{const o=a.map(x=>x.order);if(new Set(o).size!==o.length||[...o].sort((x,y)=>x-y).some((x,i)=>x!==i+1))ctx.addIssue({code:"custom",message:"obligation_order_must_be_contiguous"});});
export const InstantClearSampleRequest=z.object({declarationId:Uuid,requestedScope:Scope,instantPolicyVersion:z.string().min(1).max(80),scopeGateDigest:Sha256,expectedDeclarationVersion:Version}).strict();
export const NegotiateSampleRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("open"),declarationId:Uuid,requestedScope:Scope,sourceOwnerPartyIds:z.array(Uuid).min(1).max(100),terms:Terms,expectedDeclarationVersion:Version}).strict().refine(v=>new Set(v.sourceOwnerPartyIds).size===v.sourceOwnerPartyIds.length,{message:"owners_unique"}),
 z.object({action:z.literal("record_decision"),clearanceRequestId:Uuid,sourceOwnerPartyId:Uuid,decision:z.enum(["consented","declined"]),decisionEvidenceDigest:Sha256,expectedRequestVersion:Version}).strict(),
 z.object({action:z.literal("finalize"),clearanceRequestId:Uuid,expectedRequestVersion:Version,scopeGateDigest:Sha256}).strict()
]);
export const ClearSampleResult=z.discriminatedUnion("outcome",[
 z.object({outcome:z.literal("issued"),clearanceRequestId:Uuid,instrumentId:Uuid,sourceSideCount:z.int().min(1).max(2),termsDigest:Sha256,version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("negotiation_required"),clearanceRequestId:Uuid,reason:z.enum(["instant_ineligible","policy_miss","owner_route_required"]),version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("pending"),clearanceRequestId:Uuid,pendingOwnerCount:z.int().positive(),version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("declined"),clearanceRequestId:Uuid,instrumentId:z.null(),version:Version,replayed:z.boolean()}).strict()
]);

export const GrantDerivativeUseRequest=z.object({sourceAssetIds:z.array(Uuid).min(1).max(100),grantingPartyId:Uuid,registryAuthorityVersion:Version,route:z.enum(["remix","stem","bootleg_retroactive"]),exploitationScope:Scope,derivativeScope:z.enum(["named_derivative_only","project_family","independent_exploitation"]),expectedSourceVersion:Version}).strict().refine(v=>new Set(v.sourceAssetIds).size===v.sourceAssetIds.length,{message:"source_assets_unique"});
export const GrantDerivativeUseResult=z.object({grantId:Uuid,instrumentId:Uuid,sourceAssetIds:z.array(Uuid).min(1).max(100),route:z.enum(["remix","stem","bootleg_retroactive"]),state:z.literal("authorized"),createsDeclaration:z.literal(false),createsEncumbrance:z.literal(false),version:Version,replayed:z.boolean()}).strict();
~~~

Response validation is mandatory before serialization. `ClearSampleResult.outcome=issued` is reachable only after every required source side is identified, all source owners consent, ordered obligations validate, and Shard 20 returns a committed instrument. A suggestion never mutates a declaration; confirmation creates a later contributor-authored declaration only through SPL-01/SPL-05.

## Authorization, Ownership, and Disclosure

| Principal | Allowed | Denied |
|---|---|---|
| Contributor | Declare/revise own Shard 09 contribution; review its suggestions | Declare another contribution; turn candidate into authority automatically |
| Work/master owner/admin | Evaluate/request clearance under proven standing | Override source/co-owner decision or see unrelated refusal evidence |
| Source owner | Decide own routed negotiation participant row | Decide another owner row or mutate proposed terms silently |
| Registry-authorized owner/admin | Grant exact source assets within Shard 10 authority | Grant by possession alone or exceed authority version/scope |
| Fingerprint worker | One asserted adapter job and declaration | Wildcard declaration/media access or interactive authority |
| Rights operator/support | Purpose-granted reconciliation/safe projection | Grant consent, edit a declaration, or bypass a hard authority gate |

Object lookup and authorization occur inside one command transaction. Unknown IDs and IDs outside the caller's discoverable owner/event/work scope return `404 NOT_FOUND`. A visible object with insufficient action authority returns `403 FORBIDDEN`; missing/recent-step-up or job scope also returns 403. Conflict responses expose only expected/current version and retry guidance. Refusal reasons and source descriptions are visible only to their submitting owner and assigned purpose-granted reviewers.

## Database Schema

Schema `licensing_private` is server-only. Party FKs target `platform_private.party(id)`. Cross-shard identifiers are logical references:

| Fields | Target/meaning | Enforcement |
|---|---|---|
| `contribution_id` | Shard 09 contribution UUID | Owner/version seam under contribution lock |
| `source_work_id`, `source_asset_id`, `candidate_work_id`, `candidate_asset_id` | Shard 10 work/master registry UUIDs | Required by known-side/candidate discriminator; registry seam and human review |
| `instrument_id` | Shard 20 issued licensing instrument UUID | Stored only from committed scope-gate result |
| `fingerprint_artifact_ref`, `evidence_ref` | BE00 encrypted artifact/evidence UUID | Purpose capability and digest-bound response |
| `source_asset_ids` | Shard 10 source-asset UUID elements | Command validates every unique element; arrays cannot carry element FKs |
| `source_owner_party_ids` | `platform_private.party(id)` element references | Command validates every unique routed owner and current source-side standing; arrays cannot carry element FKs |

~~~sql
CREATE TABLE licensing_private.sample_declaration (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 contribution_id uuid NOT NULL, declaration_kind text NOT NULL CHECK(declaration_kind IN ('sample','interpolation')),
 prompt_version text NOT NULL CHECK(length(prompt_version) BETWEEN 1 AND 80),
 source_audio_present boolean NOT NULL, human_authored boolean NOT NULL DEFAULT true CHECK(human_authored),
 master_not_cleared boolean NOT NULL, state text NOT NULL CHECK(state IN ('declared','unidentified','suggested_match','identified','superseded','retracted')),
 supersedes_declaration_id uuid NULL REFERENCES licensing_private.sample_declaration(id),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((declaration_kind='interpolation')=(NOT source_audio_present AND master_not_cleared)),
 UNIQUE(contribution_id,version)
);
CREATE TABLE licensing_private.sample_source_side (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 declaration_id uuid NOT NULL REFERENCES licensing_private.sample_declaration(id),
 side text NOT NULL CHECK(side IN ('recording','composition')), source_state text NOT NULL CHECK(source_state IN ('known','unknown')),
 source_work_id uuid NULL, source_asset_id uuid NULL, prominence_basis_points integer NOT NULL CHECK(prominence_basis_points BETWEEN 0 AND 10000),
 identity_provenance text NOT NULL CHECK(identity_provenance IN ('human','machine_suggested','machine_measured')),
 prominence_provenance text NOT NULL CHECK(prominence_provenance IN ('human','machine_suggested','machine_measured')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((source_state='known')=(source_work_id IS NOT NULL)),
 CHECK(side='recording' OR source_asset_id IS NULL),
 CHECK(side<>'recording' OR ((source_state='known')=(source_asset_id IS NOT NULL))), UNIQUE(declaration_id,side)
);
CREATE TABLE licensing_private.sample_identity_suggestion (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 declaration_id uuid NOT NULL REFERENCES licensing_private.sample_declaration(id), provider_key text NOT NULL CHECK(provider_key ~ '^[a-z0-9_]{2,64}$'),
 model_version text NOT NULL CHECK(length(model_version) BETWEEN 1 AND 80), candidate_work_id uuid NULL, candidate_asset_id uuid NULL,
 measurement_basis_points integer NULL CHECK(measurement_basis_points BETWEEN 0 AND 10000), evidence_ref uuid NULL, evidence_digest text NULL CHECK(evidence_digest ~ '^[a-f0-9]{64}$'),
 state text NOT NULL CHECK(state IN ('pending_human','confirmed','rejected','no_machine')),
 no_machine_reason text NULL CHECK(no_machine_reason IN ('provider_disabled','provider_unavailable','no_candidate')),
 reviewed_by_party_id uuid NULL REFERENCES platform_private.party(id), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz NULL,
 CHECK((state='no_machine')=(no_machine_reason IS NOT NULL)), CHECK((state IN ('confirmed','rejected'))=(reviewed_by_party_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE TABLE licensing_private.sample_clearance_request (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 declaration_id uuid NOT NULL REFERENCES licensing_private.sample_declaration(id), route text NOT NULL CHECK(route IN ('instant','negotiated')),
 requested_scope jsonb NOT NULL CHECK(jsonb_typeof(requested_scope)='object'), scope_gate_digest text NOT NULL CHECK(scope_gate_digest ~ '^[a-f0-9]{64}$'),
 source_owner_party_ids uuid[] NOT NULL CHECK(cardinality(source_owner_party_ids) BETWEEN 1 AND 100),
 owner_decisions jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(owner_decisions)='object'),
 state text NOT NULL CHECK(state IN ('evaluating','negotiation_required','pending','declined','issued')),
 instrument_id uuid NULL, terms_digest text NULL CHECK(terms_digest ~ '^[a-f0-9]{64}$'),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='issued')=(instrument_id IS NOT NULL AND terms_digest IS NOT NULL)), UNIQUE(declaration_id,requested_scope,version)
);
CREATE TABLE licensing_private.sample_terms (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 clearance_request_id uuid NOT NULL REFERENCES licensing_private.sample_clearance_request(id), obligation_kind text NOT NULL CHECK(obligation_kind IN ('fixed_fee','revenue_share')),
 obligation_order integer NOT NULL CHECK(obligation_order>0), amount_minor bigint NULL CHECK(amount_minor>=0), currency char(3) NULL CHECK(currency ~ '^[A-Z]{3}$'),
 basis_points integer NULL CHECK(basis_points BETWEEN 1 AND 10000), share_base text NULL CHECK(share_base IN ('gross_receipts','net_receipts_defined')),
 consented_by_party_id uuid NULL REFERENCES platform_private.party(id), consented_at timestamptz NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((obligation_kind='fixed_fee')=(amount_minor IS NOT NULL AND currency IS NOT NULL)),
 CHECK((obligation_kind='revenue_share')=(basis_points IS NOT NULL AND share_base IS NOT NULL)), UNIQUE(clearance_request_id,obligation_order)
);
CREATE TABLE licensing_private.derivative_asset_grant (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), granting_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 source_asset_ids uuid[] NOT NULL CHECK(cardinality(source_asset_ids) BETWEEN 1 AND 100), registry_authority_version bigint NOT NULL CHECK(registry_authority_version>0),
 route text NOT NULL CHECK(route IN ('remix','stem','bootleg_retroactive')), exploitation_scope jsonb NOT NULL CHECK(jsonb_typeof(exploitation_scope)='object'),
 derivative_scope text NOT NULL CHECK(derivative_scope IN ('named_derivative_only','project_family','independent_exploitation')),
 instrument_id uuid NOT NULL, state text NOT NULL CHECK(state='authorized'), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(instrument_id), UNIQUE(id,version)
);
~~~

`sample_declaration`, `sample_source_side`, `sample_identity_suggestion`, `sample_clearance_request`, `sample_terms`, and `derivative_asset_grant` map literally to the IA models. Histories are append-only except version-checked state transitions through security-definer command functions; declarations and source sides are never destructively rewritten.

### Indexes, RLS, and grants

| Table | Query indexes | RLS | Grants |
|---|---|---|---|
| sample_declaration | `(contribution_id,version DESC)`; `(owner_party_id,state)`; current partial | owning contributor; standing owner safe projection; purpose reviewer | declaration command; no direct client DML |
| sample_source_side | `(declaration_id,side)` unique; `(source_work_id,side)`; source state | inherits visible declaration; source owner only after routed request | declaration/clearance functions only |
| sample_identity_suggestion | `(declaration_id,created_at DESC)`; provider/state; pending partial | owning contributor; exact job worker; reviewer purpose grant | suggestion command; worker append, no UPDATE/DELETE |
| sample_clearance_request | `(declaration_id,version DESC)`; owner/state; instrument unique partial | declaring work standing and named source owners | clearance command; Shard20 worker safe callback |
| sample_terms | `(clearance_request_id,obligation_order)` unique; consenting party | request parties see scoped terms; no unrelated source-owner decisions | clearance function only |
| derivative_asset_grant | source assets GIN; `(granting_party_id,created_at DESC)`; instrument unique | registry-authorized parties; named grantee projection | grant command; no direct client DML |

All tables ENABLE/FORCE RLS. Context requires party, contribution/work/source asset, mandate, purpose, job, and service principal as applicable. `migration_role` owns tables; no direct client DML and no public DML. Security-definer functions pin `search_path`, keep `row_security=on`, validate every logical reference, and revoke PUBLIC.

### Retention and deletion

- Declarations, decisions, clearance terms, grants, instrument links, and audit/outbox evidence persist for licence/accounting/dispute retention; legal holds override schedules.
- Fingerprint artifacts and raw provider candidates expire within 30 days after review/no-machine outcome unless purpose-held; only safe candidate/evidence digests remain.
- A privacy erasure deidentifies optional actor/display metadata where lawful but never falsifies authority, consent, issued scope, or obligation history.

## State, Middleware, Concurrency, and Data Flow

| Aggregate | State machine | Invariant/recovery |
|---|---|---|
| Declaration | declared/unidentified/suggested_match/identified → superseded/retracted | Truthful unknown is durable; a revision appends successor |
| Suggestion | pending_human → confirmed/rejected; or no_machine terminal | Never auto-merges or changes declaration |
| Clearance | evaluating → negotiation_required/pending → issued or declined | Any decline prevents instrument; instant failure routes, never clears |
| Derivative grant | authorized terminal; revocation requires a new governed successor outside this operation | Possession alone creates no row |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| SPL-01 | first-party-write | own contributor + Shard09 version | 30/min/contributor | 128 KiB strict union, conditional If-Match, 30d idempotency |
| SPL-02 | first-party-write/service-no-origin | own contributor or exact job assertion | 60/min/declaration | 256 KiB strict union, 30d idempotency |
| SPL-03 | first-party-write | standing owner/admin | 20/min/work | 128 KiB scope/gate parse, If-Match, 30d idempotency |
| SPL-04 | first-party-write | named source owner/request admin | 30/min/request | 256 KiB action union, If-Match, 30d idempotency |
| SPL-05 | first-party-write | own contributor + Shard09 version | 30/min/contributor | 128 KiB composition-only parse, If-Match, 30d idempotency |
| SPL-06 | first-party-write | Shard10 registry authority | 12/min/source asset | 128 KiB assets/scope parse, If-Match, 30d idempotency |

Middleware order is BE00 request ID → proxy/security → CORS → body limit → auth/job assertion → CSRF for browser → rate → strict Zod validation → object/standing authorization → idempotency/If-Match → transaction/outbox → response validation → audit/metrics.

### Operation flows

| Op | Transactional flow and lock order |
|---|---|
| SPL-01 | Authorize contribution → lock current declaration → validate prompt/sides → supersede current → insert declaration/sides/audit/outbox/idempotency |
| SPL-02 | Authenticate branch → lock declaration/suggestion → call adapter only if enabled → append candidate/no-machine or human decision; declaration unchanged |
| SPL-03 | Lock declaration/sides → read Shard20 policy/gate → if eligible request instrument and append issued request/terms; otherwise append negotiation-required |
| SPL-04 | Lock request then participant decisions → append decision → on finalize require all current owners consent and ordered terms → Shard20 instrument → commit |
| SPL-05 | Authorize contribution → lock declaration → prove no source audio/human replay answer → insert composition-only declaration with warning |
| SPL-06 | Lock Shard10 authority/source versions → validate exact assets/scopes → request Shard20 instrument → insert terminal grant/outbox |

Serializable commands lock in the order contribution/declaration → source work/assets → clearance request/participant → Shard20 instrument → idempotency. SQLSTATE `40001` retries twice with 25/75 ms backoff. Unique versions and idempotency make one winner; losers receive `409 VERSION_CONFLICT` without duplicate side effects.

### External seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit behavior |
|---|---|---|
| Shard 09 contribution | `{contributionId,partyId,expectedVersion,purpose}` → `{ownerPartyId,workId,state,version,digest}` | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; mutation blocks |
| Fingerprint adapter | `{jobId,artifactCapability,adapterKey,purpose}` → `{candidates[],modelVersion,evidenceDigest}` | Timeout 8,000 ms; 2 retries with 500/2,000 ms backoff; circuit opens 120,000 ms after 5 failures; disabled/unavailable returns honest no-machine state |
| Shard 20 gate/instrument | `{subjectRefs,scope,termsDigest,policyVersion,gateDigest,idempotencyKey}` → `{eligible,instrumentId,state,version,digest}` | Timeout 3,000 ms; 2 retries with 250/1,000 ms backoff; circuit opens 60,000 ms after 5 failures; no issued state on uncertainty |
| Shard 10 registry | `{partyId,sourceAssetIds,authorityVersion,purpose}` → `{authorized,workIds,assetVersions,digest}` | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; grant blocks |
| BE00 artifact/evidence | `{artifactRef,purpose,expectedDigest}` → `{authorized,digest,expiresAt}` | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; raw media never enters logs/events |
| PostgreSQL command RPC | `{opId,principal,validatedBody,canonicalHash}` → `{row,outbox,audit,idempotency}` | Timeout 2,000 ms; 2 retries for serialization failures with 25/75 ms backoff; circuit opens 15,000 ms after 5 failures |

Provider adapters remain disabled until reviewed Phase-2 evolution. Disabled means no outbound request and a typed, visible state; it never implies no sample or clearance.

## Event Contracts

~~~ts
const EventBase=z.object({eventId:Uuid,aggregateId:Uuid,aggregateVersion:Version,occurredAt:Instant,requestId:Uuid,actorPartyId:Uuid.nullable(),payloadDigest:Sha256}).strict();
export const SampleDeclarationChanged=EventBase.extend({type:z.literal("licensing.sample-declaration.changed.v1"),payload:z.object({declarationId:Uuid,contributionId:Uuid,state:z.enum(["declared","unidentified","suggested_match","identified","superseded","retracted"]),version:Version}).strict()}).strict();
export const SampleClearanceChanged=EventBase.extend({type:z.literal("licensing.sample-clearance.changed.v1"),payload:z.object({clearanceRequestId:Uuid,requiredSides:z.array(SourceSide).min(1).max(2),state:z.enum(["evaluating","negotiation_required","pending","declined","issued"]),version:Version}).strict()}).strict();
export const DerivativeGrantChanged=EventBase.extend({type:z.literal("licensing.derivative-grant.changed.v1"),payload:z.object({grantId:Uuid,sourceAssetCount:z.int().min(1).max(100),state:z.literal("authorized"),version:Version}).strict()}).strict();
~~~

Consumers dedupe by `(aggregateId,aggregateVersion)` and reject gaps to replay/DLQ. Events exclude source descriptions, media, fingerprints, candidate identities, owner decisions/refusal reasons, terms amounts, provider tokens, and evidence. Outbox delivery is at-least-once; domain/outbox commit is atomic.

## Errors, Failure Recovery, and Observability

| Op | BE00 `ApiError { code, message, requestId, details }` codes | Recovery |
|---|---|---|
| SPL-01 | DECLARATION_REQUIRED; VALIDATION_FAILED; VERSION_CONFLICT; FORBIDDEN; NOT_FOUND | Correct prompt/side, refresh version; current history unchanged |
| SPL-02 | PROVIDER_DISABLED; PROVIDER_UNAVAILABLE; CANDIDATE_INVALID; JOB_SCOPE_INVALID; VERSION_CONFLICT | Persist no-machine or retry same job; declaration unchanged |
| SPL-03 | DECLARATION_REQUIRED; SOURCE_UNIDENTIFIED; CLEARANCE_REQUIRED; POLICY_VERSION_CHANGED; FORBIDDEN | Identify required side or route negotiation; never false clear |
| SPL-04 | UNANIMOUS_CONSENT_REQUIRED; OBLIGATION_STACK_INVALID; VERSION_CONFLICT; FORBIDDEN | Collect every consent/correct ordering; no partial instrument |
| SPL-05 | SOURCE_UNIDENTIFIED; ORIGINAL_AUDIO_REQUIRES_SAMPLE_ROUTE; VALIDATION_FAILED; FORBIDDEN | Resolve composition or use sample route; warning persists |
| SPL-06 | STEM_AUTHORITY_REQUIRED; SOURCE_ASSET_CHANGED; SCOPE_INVALID; FORBIDDEN | Obtain registry authority/current asset version; no grant row |

Failure recovery matrix:

| Failure | Durable behavior |
|---|---|
| Provider unavailable/disabled | Append honest no-machine state; never auto-declare or notify |
| Shard20 timeout after request | Query by idempotency key before retry; local state stays evaluating/pending |
| Concurrent owner decision | One version wins; loser refreshes; previous decisions remain immutable |
| Outbox lag | Domain truth remains committed; alert/replay by aggregate version |
| Shard10 authority changes | Grant blocks before insert; already issued history is not silently rewritten |

Per-operation observability matrix:

| Op | Safe fields/metrics | SLO and alert/test |
|---|---|---|
| SPL-01 | opId,declarationKind,sideCount,state,version; `sample_declaration_total` | p95 500 ms; version conflicts >3% alert |
| SPL-02 | opId,branch,adapterKey,outcome,candidateCount; `sample_suggestion_total` | p95 10 s adapter; provider/no-machine and job-scope tests |
| SPL-03 | opId,sideCount,outcome,policyVersion; `sample_instant_clear_total` | p95 4 s; any issued-with-unidentified invariant page |
| SPL-04 | opId,action,ownerCount,pendingCount,state; `sample_negotiation_total` | p95 4 s finalize; partial-instrument invariant page |
| SPL-05 | opId,compositionState,masterWarning,state; `interpolation_declaration_total` | p95 500 ms; original-audio routing tests |
| SPL-06 | opId,route,assetCount,derivativeScope,state; `derivative_grant_total` | p95 4 s; authority failures and scope races |

Logs omit all prohibited fields and use IDs only where access-controlled. provider-native diagnostic sinks receive error code/operation/request ID and safe dimensions, never declaration text, media, fingerprints, terms, decisions, tokens, or evidence.

## Release and Testing

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Concurrency/failure |
|---|---|---|---|
| SPL-01 | Both sample sides; interpolation rejected; unknown persists | Own contributor, other-owner 404, strict CORS, exact ApiError | Two revisions one winner; replay one declaration/outbox |
| SPL-02 | Candidate/no-machine/review schemas; no declaration mutation | Browser/service branches, exact job, provider fields redacted | late provider/rejected match/replay stable |
| SPL-03 | Identified-side issue or negotiation result exact | standing owner only; policy/gate concealment | declaration/policy race blocks issued state |
| SPL-04 | Ordered fixed/share stack and unanimous finalization | named participant row isolation | decline/finalize race produces no instrument |
| SPL-05 | Composition-only, human replay, permanent warning | own contribution and strict request | sample reclassification and version race |
| SPL-06 | Exact assets/exploitation/derivative scope | registry standing, possession-only denial | authority/source version race; Shard20 uncertainty queried |

Unit/property tests cover all Zod branches and refinements. Handler contract tests assert status/body/OpenAPI parity and exact error details. PostgreSQL integration tests exercise constraints, RLS deny-by-default, grants, array-element validation, transaction rollback, outbox atomicity, and idempotency. Security tests cover IDOR, CSRF, origin rejection, job assertion, log/event redaction, and provider egress allowlisting.

Release order: schema/RLS/functions → Zod/OpenAPI → handlers/workers → consumers → feature flag. Provider calls remain disabled by default. Rollback disables routes/workers but preserves append-only truth/outbox; forward migration resumes by version. Reconciliation scans evaluating/pending requests, orphaned jobs, and outbox gaps.

## Deepening Passes

- Data integrity: source sides are explicit, ordered obligations are normalized, and suggestions cannot become declarations.
- Security/privacy: ownership is checked at lookup; machine/provider artifacts are capability-scoped and absent from events/logs.
- Concurrency: stable lock order, versions, unique constraints, and idempotency resolve revision/finalization races.
- Failure recovery: provider absence, Shard20 uncertainty, owner decline, and outbox lag retain honest durable states.
- Operations/testing: every operation has contract, policy, error, telemetry, test, migration, and recovery coverage.

## Ambiguity Gate

**PASS.** Macro ambiguity is closed: this companion owns declaration/suggestion/orchestration/grant evidence, while Shards 09, 10, and 20 retain contribution, authority, scope, and instrument truth. Micro ambiguity is closed: every operation fixes route, principal, CORS, validation, response/error schema, idempotency, rate, locks, persistence, event, telemetry, tests, and recovery. Unknown identity is a durable state; provider availability, possession, silence, and partial consent never imply authority. No unspecified implementation choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for Shard 21a; source split validated and ambiguity gate passed. |

## Dependency References

- [BE00 infrastructure](00-infrastructure.md)
- [Shard 21 IA](../ia/21-specialized-licensing.md)
- [Shard 20 licensing core](../ia/20-licensing-core.md)
- [Shard 09 contributions](../ia/09-projects-collaboration.md)
- [Shard 10 registry](../ia/10-rights-ownership.md)
