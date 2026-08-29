# External Counts, Attestation & Reconciliation — Backend Specification

**Status:** Complete

**IA source:** [Shard 36](../ia/36-box-office-risk.md)

**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 36d: provider connection/capabilities, operator-confirmed event/schema mapping, external count ingestion, manual attestation, and named-party reconciliation |
| Included interactions | 36.14–36.17 |
| Included feature | 19.07 External Ticketing Integration & Count Reconciliation |
| Canonical contracts | MapExternalEvent; AppendCountAttestation |
| Canonical models | ExternalConnection; CountMapping; CountAttestation |
| Boundary | Provider facts remain provider-owned; unsupported barcode/refund control is never impersonated; manual count is legitimate; platform never chooses a disputed number |

## Referenced Material Inventory

| Material | Source | Use |
|---|---|---|
| External/reconciliation decisions | [IA36 lines 7–44](../ia/36-box-office-risk.md#overview) | Capability profiles, confirmed mapping, gate source, attribution, non-adjudication |
| Feature/criteria | [IA36 lines 46–77](../ia/36-box-office-risk.md#features) | 19.07, AC-36.14–36.17 |
| Interactions | [IA36 lines 79–103](../ia/36-box-office-risk.md#interactions) | Connect, map/ingest, attest, reconcile |
| Contracts/models | [IA36 lines 105–170](../ia/36-box-office-risk.md#contracts) | MapExternalEvent, AppendCountAttestation, three models |
| Roles/events/edges | [IA36 lines 172–272](../ia/36-box-office-risk.md#access-control) | Operator/act/finance, external event, stale connector/manual path |
| Dependencies | [IA36 lines 274–285](../ia/36-box-office-risk.md#cross-shard-dependencies) | BE00, IA06, IA33, IA35 |
| Global HTTP/security | [BE00 lines 112–500](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | ApiError, auth, provider effects, secret refs, events/recovery |

## IA Source Map

| Op | Interaction | Result |
|---|---|---|
| 36.14 | Connect external platform | Verified credential ref, accepted capability profile, mapping proposal, health/freshness |
| 36.15 | Map/ingest external count | Operator-confirmed CountMapping then immutable sourced count versions |
| 36.16 | Attest manual count | Immutable CountAttestation with values/unknown and original/reconstructed state |
| 36.17 | Reconcile count discrepancy | Named decider’s chosen value/reason/counter-acceptance; platform does not choose |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Interactions | 36.14 Connect external platform; 36.15 Map/ingest external count; 36.16 Attest manual count; 36.17 Reconcile count discrepancy |
| Contracts | MapExternalEvent; AppendCountAttestation |
| Models | ExternalConnection; CountMapping; CountAttestation |
| Event | ticketing.external.count_changed |

## Endpoint Completeness Reconciliation

| Op | Responsibility | Durable effect |
|---|---|---|
| 36.14 | Store BE00 secret reference, probe allowlisted provider, pin capabilities/health, propose—not confirm—matches | external_connection |
| 36.15 | Confirm local/foreign event and schema assumptions, then ingest exact provider fields/source currency/freshness | count_mapping, count_attestation |
| 36.16 | Append human values/unknown with source/evidence and preserve concurrent competitors | count_attestation |
| 36.17 | Validate named-party authority, append decision and optional counter-acceptance | count_reconciliation_decision |

36b consumes these sourced count versions. 36a gate-observed scanned remains the platform source and is never overwritten by provider/manual values.

## Shared Contract Inheritance

BE00 owns secret vault refs, provider allowlisting/egress, request IDs, auth, CORS/CSRF, idempotency/ETags, outbox, audit, errors, and recovery.

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 36.14 | POST /api/v1/ticketing/external-connections | Venue operator with step-up | BE00-CORS-WEB-CREDENTIALLED | Provider/secret/capability JSON | 10/hour/venue | Required 30d | 201 |
| 36.15 | POST /api/v1/ticketing/external-count-ingestions | Operator or connection worker | BE00-CORS-WEB-CREDENTIALLED | Confirm/ingest union, If-Match | 60/min/connection | Required 30d | 201 |
| 36.16 | POST /api/v1/ticketing/count-attestations | Operator, act, or finance close role | BE00-CORS-WEB-CREDENTIALLED | Values/unknown union, If-Match | 30/min/event | Required 30d | 201 |
| 36.17 | POST /api/v1/ticketing/count-reconciliations | Named reconciliation party with step-up | BE00-CORS-WEB-CREDENTIALLED | Decision/counter-accept union, If-Match | 12/hour/event | Required 30d | 201 |

36.15 has one pre-authentication policy: BE00-CORS-WEB-CREDENTIALLED answers only allowlisted browser preflights. Service principals send no `Origin`, are therefore outside browser CORS processing, and still require service JWT/mTLS plus the producer allowlist. Wildcard and `null` origins are rejected before authentication.

### Operation Contract Matrix

| Op | Request | Success | Failure |
|---|---|---|---|
| 36.14 | ExternalConnectionRequest plus CommandHeaders | ExternalConnectionResult | BE00 ApiError { code, message, requestId, details } |
| 36.15 | ExternalCountRequest plus VersionedHeaders or ServiceHeaders | ExternalCountResult | BE00 ApiError { code, message, requestId, details } |
| 36.16 | AppendCountAttestationRequest plus VersionedHeaders | AppendCountAttestationResult | BE00 ApiError { code, message, requestId, details } |
| 36.17 | CountReconciliationRequest plus VersionedHeaders | CountReconciliationResult | BE00 ApiError { code, message, requestId, details } |

## Zod 4 Contracts

~~~ts
import {z} from "zod";
const Uuid=z.uuid(),Instant=z.iso.datetime({offset:true}),Version=z.int().positive(),Sha256=z.string().regex(/^[a-f0-9]{64}$/);
const Currency=z.string().regex(/^[A-Z]{3}$/);
const CommandHeaders=z.object({"idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),"x-csrf-token":z.string().min(32).max(512)}).strict();
const VersionedHeaders=CommandHeaders.extend({"if-match":z.string().regex(/^"[1-9][0-9]*"$/)}).strict();
const ServiceHeaders=z.object({"idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),"x-provider-job-assertion":z.string().min(32).max(2048)}).strict();
const CountValues=z.object({
 paidCount:z.int().min(0).max(500_000).nullable(),
 compCount:z.int().min(0).max(500_000).nullable(),
 scannedCount:z.int().min(0).max(1_000_000).nullable(),
 admittedCount:z.int().min(0).max(500_000).nullable(),
 remainingCount:z.int().min(0).max(500_000).nullable(),
 capacityCount:z.int().min(0).max(500_000).nullable(),
}).strict().refine(v=>Object.values(v).some(x=>x!==null),{message:"at_least_one_count_required"});
const CapabilityProfile=z.object({
 profileVersion:z.string().min(1).max(100),
 supportsEventList:z.boolean(),supportsCountPull:z.boolean(),supportsWebhook:z.boolean(),
 supportsBarcodeValidation:z.boolean(),supportsRefundWrite:z.boolean(),
 countFields:z.array(z.enum(["paid","comp","scanned","admitted","remaining","capacity"])).max(6),
 maxFreshnessSeconds:z.int().min(1).max(604800).nullable(),
}).strict();

export const ExternalConnectionRequest=z.object({
 venueId:Uuid,providerKey:z.string().regex(/^[a-z0-9_]{2,64}$/),
 credentialSecretRef:Uuid,acceptedProfile:CapabilityProfile,
 requestedScopes:z.array(z.enum(["events_read","counts_read","counts_webhook"])).min(1).max(3),
 egressHostKey:z.string().regex(/^[a-z0-9_.-]{3,255}$/),
}).strict().refine(v=>!v.requestedScopes.includes("counts_webhook")||v.acceptedProfile.supportsWebhook,{message:"webhook_scope_requires_capability"});
export const ExternalConnectionSchema=z.object({
 connectionId:Uuid,venueId:Uuid,providerKey:z.string().regex(/^[a-z0-9_]{2,64}$/),
 credentialSecretRef:Uuid,capabilityProfile:CapabilityProfile,
 grantedScopes:z.array(z.enum(["events_read","counts_read","counts_webhook"])).min(1).max(3),
 health:z.enum(["verifying","healthy","degraded","broken","revoked"]),
 freshness:z.enum(["unknown","live","fresh","stale"]),
 verifiedAt:Instant.nullable(),lastSuccessAt:Instant.nullable(),version:Version,
}).strict();
export const ExternalConnectionResult=z.object({
 connection:ExternalConnectionSchema,
 mappingProposals:z.array(z.object({foreignEventRef:z.string().min(1).max(200),localEventId:Uuid,confidence:z.enum(["low","medium","high"]),autoConfirmed:z.literal(false)}).strict()).max(1000),
 replayed:z.boolean()
}).strict();

export const MapExternalEvent=z.object({
 connectionId:Uuid,foreignEventRef:z.string().min(1).max(200),localEventId:Uuid,
 operatorConfirmed:z.literal(true),
 schemaMapping:z.array(z.object({
  foreignField:z.string().min(1).max(100),
  canonicalField:z.enum(["paid","comp","scanned","admitted","remaining","capacity"]),
  assumptionClass:z.enum(["declared","proven"]),
  transformation:z.enum(["identity","sum","subtract","constant_zero"]),
 }).strict()).min(1).max(20),
 sourceCurrency:Currency.nullable(),
}).strict().refine(v=>new Set(v.schemaMapping.map(x=>x.canonicalField)).size===v.schemaMapping.length,{message:"canonical_fields_must_be_unique"});
const ProviderCountObservation=z.object({
 providerObservationRef:z.string().min(1).max(200),observedAt:Instant,receivedAt:Instant,
 sourceCurrency:Currency.nullable(),values:CountValues,providerPayloadDigest:Sha256,
 freshness:z.enum(["live","fresh","stale","unknown"]),
 provisional:z.boolean(),
}).strict();
export const ExternalCountRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("confirm_mapping"),mapping:MapExternalEvent}).strict(),
 z.object({action:z.literal("ingest"),mappingId:Uuid,expectedMappingVersion:Version,observation:ProviderCountObservation}).strict()
]);
export const CountMappingSchema=z.object({
 mappingId:Uuid,connectionId:Uuid,foreignEventRef:z.string().min(1).max(200),localEventId:Uuid,
 schemaMapping:z.array(z.object({
  foreignField:z.string().min(1).max(100),
  canonicalField:z.enum(["paid","comp","scanned","admitted","remaining","capacity"]),
  assumptionClass:z.enum(["declared","proven"]),
  transformation:z.enum(["identity","sum","subtract","constant_zero"])
 }).strict()).min(1).max(20),
 sourceCurrency:Currency.nullable(),operatorPartyId:Uuid,state:z.enum(["active","superseded","invalid"]),version:Version,confirmedAt:Instant,
}).strict();

export const AppendCountAttestation=z.object({
 eventId:Uuid,sourceClass:z.enum(["external_provider","venue_manual","performing_act_manual","finance_manual","gate_observed"]),
 sourceRef:Uuid,observedAt:Instant,
 evidenceRef:Uuid.nullable(),
 reconstructionClass:z.enum(["original","reconstructed","unknown"]),
 values:CountValues.nullable(),
 actorPartyId:Uuid,
 statementVersion:z.string().min(1).max(100),
}).strict().refine(v=>(v.reconstructionClass==="unknown")===(v.values===null),{message:"unknown_requires_null_values"});
export const AppendCountAttestationRequest=AppendCountAttestation.extend({
 mappingId:Uuid.nullable(),expectedSourceVersion:Version,
}).strict();
export const CountAttestationSchema=z.object({
 attestationId:Uuid,eventId:Uuid,sourceClass:z.enum(["external_provider","venue_manual","performing_act_manual","finance_manual","gate_observed"]),
 sourceRef:Uuid,mappingId:Uuid.nullable(),values:CountValues.nullable(),
 reconstructionClass:z.enum(["original","reconstructed","unknown"]),
 freshness:z.enum(["live","fresh","stale","unknown"]),
 selfState:z.enum(["submitted","withdrawn"]),counterState:z.enum(["pending","accepted","disputed","not_required"]),
 actorPartyId:Uuid,evidenceRef:Uuid.nullable(),statementVersion:z.string().min(1).max(100),
 providerPayloadDigest:Sha256.nullable(),
 observedAt:Instant,version:Version,digest:Sha256,
}).strict().superRefine((v,ctx)=>{
 if((v.reconstructionClass==="unknown")!==(v.values===null))
  ctx.addIssue({code:"custom",path:["values"],message:"unknown_requires_null_values"});
 if((v.sourceClass==="external_provider")!==(v.providerPayloadDigest!==null))
  ctx.addIssue({code:"custom",path:["providerPayloadDigest"],message:"required_only_for_external_provider"});
});
export const AppendCountAttestationResult=z.object({attestation:CountAttestationSchema,competingAttestationIds:z.array(Uuid).max(100),replayed:z.boolean()}).strict();
export const ExternalCountResult=z.discriminatedUnion("action",[
 z.object({action:z.literal("confirm_mapping"),mapping:CountMappingSchema,replayed:z.boolean()}).strict(),
 z.object({action:z.literal("ingest"),attestation:CountAttestationSchema,replayed:z.boolean()}).strict()
]);

const CountChoice=z.object({
 paidCount:z.int().min(0).max(500_000),compCount:z.int().min(0).max(500_000),
 scannedCount:z.int().min(0).max(1_000_000),admittedCount:z.int().min(0).max(500_000),
 remainingCount:z.int().min(0).max(500_000),capacityCount:z.int().min(0).max(500_000),
}).strict().refine(v=>v.admittedCount<=v.scannedCount,{message:"admitted_cannot_exceed_scanned"});
export const CountReconciliationRequest=z.discriminatedUnion("action",[
 z.object({
  action:z.literal("decide"),eventId:Uuid,attestationIds:z.array(Uuid).min(1).max(20),
  chosen:CountChoice,deciderPartyId:Uuid,
  reasonCode:z.enum(["source_precedence","evidence_quality","known_gap","counterparty_agreement","single_source_explicit"]),
  rationaleEvidenceRef:Uuid.nullable(),counterpartyPartyId:Uuid.nullable(),
 }).strict(),
 z.object({
  action:z.literal("counter_accept"),reconciliationId:Uuid,counterpartyPartyId:Uuid,
  decision:z.enum(["accepted","disputed"]),evidenceRef:Uuid.nullable(),
 }).strict()
]);
export const CountReconciliationResult=z.object({
 reconciliationId:Uuid,eventId:Uuid,attestationIds:z.array(Uuid).min(1).max(20),
 chosen:CountChoice,deciderPartyId:Uuid,reasonCode:z.string().regex(/^[a-z0-9_]{1,64}$/),
 counterState:z.enum(["pending","accepted","disputed","not_required"]),
 platformChose:z.literal(false),version:Version,decidedAt:Instant,replayed:z.boolean(),
}).strict();
~~~

### Invariants

| Op | Rule |
|---|---|
| 36.14 | Provider host/profile/scopes are registry-allowlisted; raw credentials never enter body/log/database; proposal never auto-confirms |
| 36.15 | Mapping confirmation is human/operator action; provider field transformations and source currency are explicit; no silent event binding/conversion |
| 36.16 | Values or unknown are mutually exclusive; concurrent attestations remain separate immutable rows |
| 36.17 | Authenticated named party supplies chosen counts/reason; single-source state is explicit; platformChose is always false |

## Authorization and Disclosure

| Actor | Allowed | Denied |
|---|---|---|
| Venue operator/lead | 36.14–36.17 for venue events | Unsupported provider control, silent mapping, platform-adjudicated result |
| Performing act | Own aggregate attest/counter-accept where deal grants | Credentials, attendee rows, other event connections |
| Finance/deal role | Count attest/reconcile under deal | Connection secrets or door PII |
| Connection worker | 36.15 ingest exact active mapping | Create/confirm mapping or reconcile |
| Support | Purpose grant to repair connector mechanics | View secret, choose count, alter attestations |

Invisible connection/event/mapping/attestation/reconciliation is 404 cause-invariant; visible action denial is 403. Step-up is 401 after visibility. Credential secret refs are never returned to unauthorized roles. Provider payload stored only as digest/quarantine evidence; logs exclude provider bodies, secrets, attendee data, and free text.

## Database Schema

ticketing_private tables; party FKs to platform_private.party(id). Provider secrets reside in BE00 vault.

| Logical reference fields | Target or non-FK meaning | Enforcement |
|---|---|---|
| `external_connection.venue_id` | Shard33 venue aggregate UUID | Venue-authority seam and transaction-local venue RLS context |
| `external_connection.credential_secret_ref` | BE00 vault secret UUID | Vault capability verifies provider, scope, purpose, and expiry; raw secret never enters this schema |
| `count_mapping.foreign_event_ref` | Provider-owned event identifier, deliberately non-UUID/non-FK | Unique per connection/version; allowlisted provider response and operator confirmation bind it to one local event |
| `count_mapping.local_event_id`, `count_attestation.event_id`, `count_reconciliation_decision.event_id` | Shard33 local event/show aggregate UUID | Mapping/attestation commands validate current event version and event-scoped role |
| `count_attestation.source_ref` | Source-class-specific immutable receipt: provider observation, manual statement, or 36a gate snapshot | Discriminated command validates source class, source digest, actor, and same-event ownership; no single physical FK is valid |
| `count_attestation.evidence_ref`, `count_reconciliation_decision.rationale_evidence_ref` | Shard06 evidence-case artifact UUID | Optional purpose-scoped evidence seam verifies authorization and digest before attachment |
| `count_reconciliation_decision.attestation_ids` | `ticketing_private.count_attestation(id)` element references | Command validates every element, same event, distinct source, and locks rows; PostgreSQL arrays cannot carry element FKs |

~~~sql
CREATE TABLE ticketing_private.external_connection (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 venue_id uuid NOT NULL, provider_key text NOT NULL CHECK(provider_key ~ '^[a-z0-9_]{2,64}$'),
 credential_secret_ref uuid NOT NULL, capability_profile jsonb NOT NULL CHECK(jsonb_typeof(capability_profile)='object'),
 granted_scopes text[] NOT NULL CHECK(cardinality(granted_scopes) BETWEEN 1 AND 3),
 egress_host_key text NOT NULL CHECK(length(egress_host_key) BETWEEN 3 AND 255),
 health text NOT NULL CHECK(health IN ('verifying','healthy','degraded','broken','revoked')),
 freshness text NOT NULL CHECK(freshness IN ('unknown','live','fresh','stale')),
 verified_at timestamptz NULL,last_success_at timestamptz NULL,
 version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(venue_id,provider_key)
);
CREATE TABLE ticketing_private.count_mapping (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 connection_id uuid NOT NULL REFERENCES ticketing_private.external_connection(id),
 foreign_event_ref text NOT NULL CHECK(length(foreign_event_ref) BETWEEN 1 AND 200),local_event_id uuid NOT NULL,
 schema_mapping jsonb NOT NULL CHECK(jsonb_typeof(schema_mapping)='array' AND jsonb_array_length(schema_mapping) BETWEEN 1 AND 20),
 source_currency char(3) NULL CHECK(source_currency IS NULL OR source_currency ~ '^[A-Z]{3}$'),
 operator_confirmed boolean NOT NULL DEFAULT true CHECK(operator_confirmed),
 operator_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 state text NOT NULL CHECK(state IN ('active','superseded','invalid')),
 version bigint NOT NULL CHECK(version>0),confirmed_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(connection_id,foreign_event_ref,version)
);
CREATE TABLE ticketing_private.count_attestation (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL,source_class text NOT NULL CHECK(source_class IN ('external_provider','venue_manual','performing_act_manual','finance_manual','gate_observed')),
 source_ref uuid NOT NULL,mapping_id uuid NULL REFERENCES ticketing_private.count_mapping(id),
 values jsonb NULL CHECK(values IS NULL OR jsonb_typeof(values)='object'),
 reconstruction_class text NOT NULL CHECK(reconstruction_class IN ('original','reconstructed','unknown')),
 freshness text NOT NULL CHECK(freshness IN ('live','fresh','stale','unknown')),
 self_state text NOT NULL CHECK(self_state IN ('submitted','withdrawn')),
 counter_state text NOT NULL CHECK(counter_state IN ('pending','accepted','disputed','not_required')),
 actor_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 evidence_ref uuid NULL,statement_version text NOT NULL CHECK(length(statement_version) BETWEEN 1 AND 100),
 provider_payload_digest text NULL CHECK(provider_payload_digest IS NULL OR provider_payload_digest ~ '^[a-f0-9]{64}$'),
 observed_at timestamptz NOT NULL,version bigint NOT NULL CHECK(version>0),
 digest text NOT NULL UNIQUE CHECK(digest ~ '^[a-f0-9]{64}$'),created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((reconstruction_class='unknown')=(values IS NULL)),
 CHECK((source_class='external_provider')=(mapping_id IS NOT NULL)),
 CHECK((source_class='external_provider')=(provider_payload_digest IS NOT NULL)),
 UNIQUE(event_id,source_class,source_ref,version)
);
CREATE TABLE ticketing_private.count_reconciliation_decision (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL,attestation_ids uuid[] NOT NULL CHECK(cardinality(attestation_ids) BETWEEN 1 AND 20),
 chosen_values jsonb NOT NULL CHECK(jsonb_typeof(chosen_values)='object'),
 decider_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 reason_code text NOT NULL CHECK(reason_code IN ('source_precedence','evidence_quality','known_gap','counterparty_agreement','single_source_explicit')),
 rationale_evidence_ref uuid NULL,counterparty_party_id uuid NULL REFERENCES platform_private.party(id),
 counter_state text NOT NULL CHECK(counter_state IN ('pending','accepted','disputed','not_required')),
 platform_chose boolean NOT NULL DEFAULT false CHECK(NOT platform_chose),
 version bigint NOT NULL CHECK(version>0),decided_at timestamptz NOT NULL,
 supersedes_decision_id uuid NULL REFERENCES ticketing_private.count_reconciliation_decision(id),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(event_id,version)
);
~~~

ExternalConnection, CountMapping, CountAttestation map exactly. Mapping, attestation, and decisions are append-only; health/freshness updates are version-checked.

### Indexes/RLS/grants

| Tables | Indexes | RLS | Grants |
|---|---|---|---|
| external_connection | venue/provider unique; health/freshness; last success | venue operator; worker exact connection; support purpose | connection command; provider worker safe health function |
| count_mapping | connection/foreign/version; local event/state | operator/act/finance event scopes; worker active mapping | mapping command INSERT; worker SELECT |
| count_attestation | (event_id,observed_at DESC); source; mapping; counter state | named event/deal roles; worker exact source | attestation command; no UPDATE/DELETE |
| count_reconciliation_decision | (event_id,version DESC); attestation_ids GIN; counterparty pending | named parties/deal roles | decision/counter-accept append functions |

All tables ENABLE/FORCE RLS. Context: party/event/venue/deal/connection/mandate/purpose/service. No direct client DML and no public DML; functions pin search_path/row_security and revoke PUBLIC.

### Retention and Deletion

- Revoking a connection destroys provider credentials in BE00 vault immediately; capability/health/mapping audit remains.
- Raw provider responses stay in bounded quarantine only through schema/replay investigation, at most 30 days absent evidence hold; durable rows retain digest and typed values.
- Mapping, attestation, and reconciliation decisions follow event/settlement/dispute retention and never rewrite competing evidence.
- Manual evidence references deidentify or delete when their hold/retention expires without changing attested values/digests.

## State, Middleware, Flow, and Seams

| Aggregate | State | Rule |
|---|---|---|
| Connection | verifying → healthy/degraded/broken → revoked | Capability truth visible; no unsupported behavior |
| Mapping | active → superseded/invalid | Human confirmed, append successor |
| Attestation | submitted → withdrawn; counter pending → accepted/disputed | Immutable values; concurrent rows compete |
| Reconciliation | decided pending → accepted/disputed or successor | Named party decides; platform never chooses |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| 36.14 | first-party-write | venue operator + step-up | 10/hour/venue | 64 KiB, 30d |
| 36.15 | first-party-write or service-no-origin | operator or exact worker | 60/min/connection | 256 KiB, If-Match/assertion, 30d |
| 36.16 | first-party-write | named event count role | 30/min/event | 128 KiB, If-Match, 30d |
| 36.17 | first-party-write | named decision party + step-up | 12/hour/event | 128 KiB, If-Match, 30d |

Lock order connection → mapping → event/source → attestation/decision version → idempotency. Serializable retry twice 25/75 ms.

### Flows

| Op | Flow |
|---|---|
| 36.14 | Step-up → validate secret ownership/provider registry/egress → capability probe → store profile/health/proposals (unconfirmed) |
| 36.15 | confirm: lock mapping version and append human mapping; ingest: validate active mapping/capability/payload digest then append attestation/outbox |
| 36.16 | authorize source → validate values/unknown/capacity → append immutable attestation, retain competitors |
| 36.17 | authorize named party → lock cited attestations/version → append chosen values/reason; counter action appends successor |

### Provider seams

| Seam | Request → response | Timeout/retry/circuit |
|---|---|---|
| Secret vault | {secretRef,providerKey,purpose} → {credentialCapability,expiresAt,scopeDigest} | Timeout 1,000 ms; 0 retries and no backoff on denial; circuit opens for 30,000 ms after 5 transport failures; raw secret never returns to handler/log |
| Provider capability | GET allowlisted capability endpoint → {profileVersion,features,countFields,freshness} | Timeout 5,000 ms; 2 retries with 250/1,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures |
| Provider events/count | {cursor,foreignEventRef,fields} → {observations,nextCursor,providerDigest} | Timeout 10,000 ms; 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; last state becomes stale/broken |
| 36a/36b source reads | {eventId,version} → {gateDigest,countDigest,sourceVersions,freshness} | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; reconciliation stays unknown |
| Shard06 evidence case | {caseId,evidenceRef,purpose} → {authorized,digest,state} | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; disputed evidence is unavailable |

## Event Contract

~~~ts
export const ExternalCountChangedEvent=z.object({
 connectionId:Uuid,mappingId:Uuid,attestationId:Uuid,eventId:Uuid,
 sourceClass:z.literal("external_provider"),sourceRef:Uuid,
 values:CountValues.nullable(),reconstructionClass:z.enum(["original","reconstructed","unknown"]),
 freshness:z.enum(["live","fresh","stale","unknown"]),providerPayloadDigest:Sha256,
 version:Version,observedAt:Instant
}).strict(); // ticketing.external.count_changed
~~~

No credentials, raw provider payload, attendee rows, foreign event labels, or free text.

## Errors, Recovery, Observability, Tests

| Op | BE00 ApiError { code, message, requestId, details } | Recovery |
|---|---|---|
| 36.14 | CREDENTIAL_INVALID; PROVIDER_NOT_ALLOWED; CAPABILITY_PROFILE_MISMATCH; EGRESS_FORBIDDEN | Replace credential/accept current profile; no partial connection |
| 36.15 | CAPABILITY_MISSING; MATCH_UNCONFIRMED; MAPPING_VERSION_CHANGED; PROVIDER_PAYLOAD_INVALID | Human-confirm mapping/refresh schema; no silent bind/conversion |
| 36.16 | CAPACITY_EXCEEDED; NEGATIVE_COUNT; SOURCE_FORBIDDEN; SOURCE_VERSION_CHANGED | Correct values/source; competitors preserved |
| 36.17 | INDEPENDENT_SOURCE_REQUIRED; DECIDER_NOT_AUTHORIZED; ATTESTATION_CHANGED; COUNTERPARTY_MISMATCH | Add explicit single source or authorized decision/counter action |

### Exact per-operation HTTP error, message, and retry contract

Every failure is the BE00 envelope ApiError { code, message, requestId, details }. The code determines the HTTP status and exact public message; handlers may add only safe structured details and may not rewrite message text.

| Shared HTTP/code | Exact message binding |
|---|---|
| 400 VALIDATION_FAILED | “Request validation failed.” |
| 401 UNAUTHENTICATED | “Authentication is required.” |
| 409 IDEMPOTENCY_CONFLICT | “The idempotency key conflicts with a different request.” |
| 409 REQUEST_IN_PROGRESS | “The request is already in progress.” |
| 429 RATE_LIMITED | “Rate limit exceeded.” |
| 500 INTERNAL_ERROR | “An internal error occurred.” |
| 503 DEPENDENCY_UNAVAILABLE | “A required dependency is unavailable.” |
| 504 DEADLINE_EXCEEDED | “The operation deadline was exceeded.” |

| Op | Complete allowed HTTP status/application-code set | Exact operation-specific message bindings | Exact retry guidance |
|---|---|---|---|
| 36.14 | Shared 400, 401, 409, 429, 500, 503, 504; 403 EGRESS_FORBIDDEN; 404 EVENT_NOT_FOUND; 409 CAPABILITY_PROFILE_MISMATCH; 422 CREDENTIAL_INVALID; 422 PROVIDER_NOT_ALLOWED | EGRESS_FORBIDDEN = “Provider egress is not permitted.”; EVENT_NOT_FOUND = “Event was not found.”; CAPABILITY_PROFILE_MISMATCH = “Provider capability profile changed.”; CREDENTIAL_INVALID = “Provider credential is invalid.”; PROVIDER_NOT_ALLOWED = “Provider is not allowed.” | Transaction: initial attempt plus 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Capability call: 3 attempts total with 250 ms and 1,000 ms full-jitter caps, only for timeout/connection/408/429/5xx. Client: at most 2 same-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits exactly 1 replay after Retry-After up to 60 s. Retry is N/A (0) for every 400/401/403/404/409/422 until input, authority, credential, profile, or key changes. |
| 36.15 | Shared 400, 401, 409, 429, 500, 503, 504; 403 FORBIDDEN; 404 CONNECTION_NOT_FOUND; 409 MATCH_UNCONFIRMED; 409 MAPPING_VERSION_CHANGED; 422 CAPABILITY_MISSING; 422 PROVIDER_PAYLOAD_INVALID | FORBIDDEN = “External count ingestion is not permitted.”; CONNECTION_NOT_FOUND = “External connection was not found.”; MATCH_UNCONFIRMED = “Event mapping is not confirmed.”; MAPPING_VERSION_CHANGED = “Event mapping version changed.”; CAPABILITY_MISSING = “Required provider capability is unavailable.”; PROVIDER_PAYLOAD_INVALID = “Provider count payload is invalid.” | Transaction: initial attempt plus 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Provider count read: 4 attempts total with 1 s, 5 s, and 30 s full-jitter caps, only for timeout/connection/408/429/5xx. Client: at most 2 same-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until corrected or refreshed. |
| 36.16 | Shared 400, 401, 409, 429, 500, 503, 504; 403 SOURCE_FORBIDDEN; 404 EVENT_NOT_FOUND; 409 SOURCE_VERSION_CHANGED; 422 CAPACITY_EXCEEDED; 422 NEGATIVE_COUNT | SOURCE_FORBIDDEN = “Count source is not permitted.”; EVENT_NOT_FOUND = “Event was not found.”; SOURCE_VERSION_CHANGED = “Count source version changed.”; CAPACITY_EXCEEDED = “Attested count exceeds event capacity.”; NEGATIVE_COUNT = “Attested count cannot be negative.” | External retry N/A (0 attempts, no backoff). Transaction: initial attempt plus exactly 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Client transport replay: at most 2 same-idempotency-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits exactly 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until source/input/version changes. |
| 36.17 | Shared 400, 401, 409, 429, 500, 503, 504; 403 DECIDER_NOT_AUTHORIZED; 404 ATTESTATION_NOT_FOUND; 409 ATTESTATION_CHANGED; 422 INDEPENDENT_SOURCE_REQUIRED; 422 COUNTERPARTY_MISMATCH | DECIDER_NOT_AUTHORIZED = “Reconciliation decision is not authorized.”; ATTESTATION_NOT_FOUND = “Count attestation was not found.”; ATTESTATION_CHANGED = “Count attestation version changed.”; INDEPENDENT_SOURCE_REQUIRED = “An independent source or explicit single-source reason is required.”; COUNTERPARTY_MISMATCH = “Counter-acceptance party does not match.” | External retry N/A (0 attempts, no backoff). Transaction: initial attempt plus exactly 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Client transport replay: at most 2 same-idempotency-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits exactly 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until authority, cited versions, source evidence, party, or input changes. |

Failure recovery matrix:

| Failure | Recovery |
|---|---|
| Connector stale/broken | Health/freshness explicit; current claim hidden; manual attestation remains |
| Provider schema drift | Ingest blocks; mapping remains historical; operator confirms successor |
| Competing manual rows | Both immutable; reconciliation names chosen sources/decider |
| Outbox/provider outage | Durable cursor/rows; idempotent replay; no invented provider control |

Per-operation observability matrix:

| Op | Safe fields/metric | SLO/test |
|---|---|---|
| 36.14 | opId,providerKey,profileVersion,health,proposalCount; connection_total | p95 8 s; secret/egress/auth/CORS/circuit tests |
| 36.15 | opId,action,fieldCount,freshness,provisional; external_ingest_total | p95 2 s; mapping race/schema drift/replay tests |
| 36.16 | opId,sourceClass,reconstructionClass,counterState; attestation_total | p95 750 ms; capacity/unknown/concurrent tests |
| 36.17 | opId,sourceCount,reasonCode,counterState; reconciliation_total | p95 1 s; no-platform-choice/authority/race tests |

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| 36.14 | Profile/scopes/health/proposals validate | operator step-up, secret isolation, egress/CORS | probe circuit and replay create one connection |
| 36.15 | Human mapping and provider observation are exact | worker/browser branches and concealed mapping | mapping/schema race blocks; ingest replay stable |
| 36.16 | Values/unknown and reconstruction validate | named source role and exact ApiError | competing attestations remain immutable |
| 36.17 | Named decision/counter action, platformChose=false | decider/counterparty step-up and concealment | changed attestation blocks; successor preserves history |

Additional tests: strict Zod/OpenAPI, every SQL check/index/RLS role, secret/log denylist, provider contract fixtures, property mappings/counts, outbox duplicate/gap, circuit/freshness transitions, manual-path accessibility, and load.

## Release, Migration, and Recovery

- Deploy provider registry, restricted tables, RLS/functions, and event schema before enabling connection/ingest routes.
- Feature flags gate each provider and manual reconciliation independently; disabling stops pulls while preserving manual attestations and historical reads.
- Rollback drains cursors/outbox, disables provider workers, and leaves additive mappings/attestations readable.
- Recovery audits secret revocation, capability/profile versions, cursor/digest continuity, mapping confirmation, competing evidence, decisions, RLS, and outbox age.

## Deepening Passes

| Pass | Evidence |
|---|---|
| Capability truth | Exact provider profile/scopes/freshness and unsupported-control denial |
| Attribution | Human mapping, source/version/digest, immutable competing attestations |
| Neutrality | Named party choice/counter-acceptance and platformChose=false |
| Operations | Four IDs key CORS/auth/rate/contracts/errors/metrics/tests and typed SQL/RLS |

## Ambiguity Gate

**PASS.** Interactions 36.14–36.17, MapExternalEvent, AppendCountAttestation, ExternalConnection, CountMapping, CountAttestation, feature 19.07, and ticketing.external.count_changed are completely reconciled. Unique routes, exact contracts, provider seams, SQL/RLS/grants, per-operation matrices, and non-adjudication are explicit. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 36d backend contract | /write-be-spec | All |
| 2026-08-29 | Bound operations 36.14–36.17 to exact HTTP/code/message and retry contracts | D3/D6 remediation | Errors, Recovery, Observability, Tests |

## Dependency References

- [BE00](00-infrastructure.md)
- [IA06](../ia/06-trust-safety.md)
- [IA33](../ia/33-show-day-operations.md)
- [IA35](../ia/35-ticket-products-sales.md)
- [36a](36a-door-replicas-scans-age.md)
- [36b](36b-boxoffice-counts-drops-walkup-close.md)
- [36c](36c-ticket-refunds-event-changes.md)
- [36e](36e-ticket-limits-transfer-exchange-consent.md)
