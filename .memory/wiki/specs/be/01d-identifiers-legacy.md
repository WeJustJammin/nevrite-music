# Identifiers & Legacy — Backend Specification

> **IA Source**: [01 Identity & Authority](../ia/01-identity-authority.md)
> **Deep Dives**: [01 Identity & Authority deep dive](../ia/deep-dives/01-identity-authority.md)
> **Foundation**: [00 Infrastructure](00-infrastructure.md)
> **Status**: Complete
> **Last audited**: 2026-08-28

This specification owns only IDA-15 through IDA-18. It records identity
authority facts and protected workflow evidence. It never adjudicates rights,
royalties, payment ownership, probate, or legal title.

## Split Group

> **Split origin**: 01-identity-authority
> **Companion specs**: [01a Authentication & Account Linking](01a-auth-account-linking.md), [01b Party Identity & Aliases](01b-party-identity-aliases.md), [01c Relationships, Authority & Governance](01c-relationships-authority-governance.md)
> **Shared entities**: PersonParty, OrganizationParty, authority snapshot, authenticated request context, audit and outbox records

The locked IA product entities in this split are PartyIdentifierClaim,
LegacyNomination, and MemorialisationCase. IDA-16 requires a durable collision
workflow, so IdentifierCollision and its membership rows are implementation
support records. The estate representation row is likewise a protected review
manifest: 01c remains owner of the canonical active RepresentationEdge created
on approval. Verification attempt, report submission, review decision, and
counsel-policy records are append-only support/workflow records. None is an
alternate party, ownership record, rights record, or source of truth for a
downstream domain.

## Classification

- **Type**: multi-domain-split
- **Owned boundary**: IDA-15 identifier claim/verification; IDA-16 collision hold/resolution; IDA-17 private successor nomination; IDA-18 protected death report, memorialisation review, and scoped estate authority.
- **Excluded boundary**: authentication provider/session mechanics (01a and BE00), aliases and handles (01b), ordinary organization governance and generic relationship semantics (01c), profile rendering, probate/legal adjudication, and downstream rights/payment ownership.
- **Authority rule**: every command derives actor, acting party, current relationship/mandate, activity, domain, territory, term, ceiling, purpose, and source version on the server. Client role claims and client-supplied identity are never authoritative.

## Referenced Material Inventory

- [01 Identity & Authority IA](../ia/01-identity-authority.md): IDA-15–IDA-18 interactions, contracts, canonical models, access control, events, edge cases, and cross-shard handoffs.
- [01 Identity & Authority deep dive](../ia/deep-dives/01-identity-authority.md): identifier and memorialisation state machines, authority resolution, disclosure, concurrency, abuse, recovery, and verification decisions.
- [Architecture Design](../2026-08-02-architecture-design.md): Hono/Cloudflare API boundary, Supabase/RLS, protected workflows, transactions, outbox/jobs, security, and observability.
- [Data Placement Strategy](../data-placement-strategy.md): PII, identifier provenance, restricted legal/death evidence, retention, legal hold, tenancy, and projection rules.
- [Engineering Standards](../ENGINEERING-STANDARDS.md): contract-first testing, performance, security, migration, and CI gates.
- [00 Infrastructure BE](00-infrastructure.md): request context, four-field error, ETag/idempotency, RPC, jobs/uploads, audit/outbox, events, recovery, and telemetry.
- [Shards 22, 30, and 39 IA](../ia/22-release-distribution.md): downstream release, booking/authority, and analytics consumers; exact links and ownership are reconciled in the source map below.
- [Operations runbooks](../../operations/runbooks/README.md): recovery, queue/outbox, security/privacy incident, evidence, and provider-outage procedures.

## IA Source Map

| Source | Normative material used here | BE ownership / handoff |
|---|---|---|
| [01 Identity & Authority IA](../ia/01-identity-authority.md) | IDA-15–IDA-18 interactions; Contracts; Data Models; Access Control; Event Schemas; Edge Cases | This file implements the four interactions and publishes identifier, memorialisation, and relationship changes. |
| [01 Identity & Authority deep dive](../ia/deep-dives/01-identity-authority.md) | Canonical fields; state machines; authority resolution; disclosure; concurrency; abuse; verification questions; implementation envelope | Exact state transitions, no auto-merge, evidence boundaries, and fail-closed decisions are binding. |
| [Architecture Design](../2026-08-02-architecture-design.md) | Hono/Cloudflare API, Supabase/RLS, server-side authority, protected workflows, transaction/outbox/job patterns | Route handlers call named RPCs; no direct table access; durable outbox is the handoff boundary. |
| [Data Placement Strategy](../data-placement-strategy.md) | Identity PII, identifiers, restricted legal/death evidence, retention, legal hold, and derived projections | Evidence stays in governed private Storage; raw/sensitive values and evidence refs never enter logs, queues, or public projections. Opaque canonical IDs appear only in locked event payloads. |
| [Engineering Standards](../ENGINEERING-STANDARDS.md) | Contract-first Zod, protected-resource tests, performance tiers, security, recovery, migrations | This document uses Zod 4 contracts and the BE00 error/performance envelope. |
| [00 Infrastructure BE](00-infrastructure.md) | Request context, strict ApiError, Idempotency-Key, If-Match/ETag, RPC, jobs, upload/object refs, audit/outbox, observability, event envelope | All inherited mechanics are normative; this file adds only domain fields and decisions. |
| [22 Release & Distribution IA](../ia/22-release-distribution.md) | Canonical party and verified destination mandate for artist/store links and distributor eligibility | Consume identity.identifier.changed.v1; never make an asserted ID route or infer a distributor. |
| [30 Booking & Contracts IA](../ia/30-booking-contracts.md) | Principal/delegate IDs, accepted relationships, authority-source versions | Consume current authority snapshots; generic identity or estate representation never implies a booking capability. |
| [39 Analytics, Ingestion & Reporting IA](../ia/39-analytics-ingestion-reporting.md) | External profile binding, confirmation, conflict/merge/split quarantine | Consume canonical identity events; no automatic profile merge or cross-subject winner. |
| [Operations runbooks README](../../operations/runbooks/README.md) | Recovery, queue/outbox, security/privacy incident, and legal evidence procedures | Reversal, legal hold, restore, DLQ, and provider outage procedures are runbook-gated. |

## Boundary and Invariants

1. An identifier claim is a party assertion plus provenance and verification
   state. A self-asserted, mismatched, collided, or revoked claim cannot route
   royalties or prove ownership.
2. A collision is an explicit hold. All live claims in the same namespace and
   normalized value lose verified/routing eligibility until claimant withdrawal
   or registry-backed evidence leaves at most one eligible claim. The service
   never guesses a winner.
3. A legacy nomination is private, revocable only while the nominator is alive,
   and is not a power of attorney, probate finding, ownership transfer, or
   automatic successor activation.
4. A death report opens protected review only. A verified case terminates
   personal session/authority through the identity lifecycle handoff; it does
   not create estate authority. Estate authority requires a separate,
   counsel-policy-verified representation record.
5. An estate representation is scope-constrained by representative party,
   activity/domain, territory, term, communication permission, and a monetary
   ceiling. A null ceiling means no monetary authority, never unlimited
   authority. It cannot grant deceased login, signature, attestation, or
   ownership.
6. Deletion, erasure, unpublish, archive, and legal hold are distinct. Required
   evidence and audit history remain while derived access/projections are
   removed under the approved workflow.

## Inherited BE00 Protocol

Every endpoint below uses the BE00 middleware order: route inventory/request
ID, transport/security/body/URL/header/deadline/CSRF, webhook branch where
applicable, session authentication, acting context, strict Zod parse,
authorization, compare-and-swap/idempotency, one named RPC, response, and
structured observation.

All commands require Idempotency-Key (8–128 printable ASCII bytes, trimmed
value byte-identical, no case folding) and replay the original status, resource
reference, job reference, and safe headers. Reuse with a different canonical
request hash returns 409 CONFLICT with conflict=IDEMPOTENCY_MISMATCH.
Mutable-target commands require one strong If-Match decimal ETag exactly as
BE00 specifies; a missing or malformed header is 400 INVALID_REQUEST. Request
hashes include operation ID, actor, acting party, path, normalized typed
body/query, expected version, target, and contract version.

The inherited response error has exactly four top-level fields: code, message,
requestId, and details. Unknown top-level or details shape is forbidden.
Details use only the BE00 bounded registry. No endpoint returns evidence bytes,
provider payloads, private legal facts, raw identifier input, or internal
SQL/stack information.

## Endpoint Completeness Reconciliation

IDA-15 through IDA-18 are fully mapped: claim create/read/verify/withdraw; collision resolution; nomination create/read/revoke; protected report/read/decision; and estate representation create/read/decision/revoke. Public profile rendering, probate adjudication, rights/payment ownership, and downstream transaction execution remain explicitly outside this surface. No historical route is restored unless the current IA, deep dive, or locked architecture requires it.

## Feature Ledger Coverage

| Feature ID | Feature | Endpoint coverage |
|---|---|---|
| `01.09` | Party Identifier Resolution | IDL-API-01 through IDL-API-05; collision state blocks routing until evidence-backed resolution. |
| `01.10` | Estates, Deceased Users & Legacy Accounts | IDL-API-06 through IDL-API-15; nomination, memorial review, and estate authority remain distinct gates. |

## API Endpoints

### Route Registry

| ID / method / path | Request and success | Auth and ownership | Idempotency / concurrency | Limit; SLO; cache |
|---|---|---|---|---|
| IDL-API-01 POST /api/v1/parties/{partyId}/identifier-claims | CreateIdentifierClaimRequest; 201 IdentifierClaimResource; Location + ETag | Authenticated person acting for path party, or exact delegated identifier-management capability | Idempotency; party If-Match | 30/hour actor, 100/day party; Tier 2 p95 <1200 ms; no-store |
| IDL-API-02 GET /api/v1/parties/{partyId}/identifier-claims | IdentifierClaimListQuery; 200 IdentifierClaimList | Same party predicate; named Shard22/39 read capability only through server projection | No idempotency; cursor binds party/filter/audience | 60/min actor; Tier 1 p95 <750 ms; no-store |
| IDL-API-03 POST /api/v1/identifier-claims/{claimId}/verify | Empty VerifyIdentifierClaimRequest; 202 JobStatus + Location | Claimant/current authority; identity operator only with assigned recovery capability | Idempotency; claim If-Match; claim/collision row lock | 10/hour claim, 30/hour party; async ack p95 <1000 ms; no-store |
| IDL-API-04 POST /api/v1/identifier-claims/{claimId}/withdraw | WithdrawIdentifierClaimRequest; 200 IdentifierClaimResource | Claimant/current authority; recovery operator only with reason/evidence | Idempotency; claim If-Match | 20/hour actor; Tier 2 p95 <1200 ms; no-store |
| IDL-API-05 POST /api/v1/identifier-collisions/{collisionId}/resolve | ResolveIdentifierCollisionRequest; 202 JobStatus + Location | Assigned identity operator with registry-resolution capability, MFA, reason | Idempotency; collision If-Match; collision/claim locks | 5/hour operator and collision; async ack p95 <1000 ms; no-store |
| IDL-API-06 POST /api/v1/persons/{personId}/legacy-nomination | CreateLegacyNominationRequest; 201 LegacyNominationResource; Location + ETag | Person acting for self only while alive | Idempotency; person If-Match | 10/day nominator; Tier 2 p95 <1200 ms; no-store |
| IDL-API-07 GET /api/v1/persons/{personId}/legacy-nomination | No body; 200 LegacyNominationResource | Nominator self only, or exact private-representation capability | No idempotency; nomination ETag | 60/min actor; Tier 1 p95 <750 ms; no-store |
| IDL-API-08 POST /api/v1/legacy-nominations/{nominationId}/revoke | RevokeLegacyNominationRequest; 200 LegacyNominationResource | Nominator self only while alive | Idempotency; nomination If-Match | 10/day nominator; Tier 2 p95 <1200 ms; no-store |
| IDL-API-09 POST /api/v1/persons/{personId}/memorialisation-cases | ReportMemorialisationRequest; 202 MemorialisationReportAccepted | Authenticated reporter; subject may differ; no anonymous case access | Idempotency; person version checked in RPC | 3/day reporter+subject, 10/day actor, 30/day IP; Tier 2 p95 <1200 ms; no-store |
| IDL-API-10 GET /api/v1/memorialisation-cases/{caseId} | No body; redacted or reviewer MemorialisationCaseView; ETag | Reporter receives status only; assigned operator receives protected evidence | No idempotency; case ETag | 60/min actor; Tier 1 p95 <750 ms; no-store |
| IDL-API-11 POST /api/v1/memorialisation-cases/{caseId}/decisions | MemorialisationDecisionRequest; 202 JobStatus + Location | Assigned identity reviewer, MFA, named review capability and reason | Idempotency; case If-Match; person/case lock | 30/hour operator; async ack p95 <1000 ms; no-store |
| IDL-API-12 POST /api/v1/memorialisation-cases/{caseId}/estate-representations | CreateEstateRepresentationRequest; 201 EstateRepresentationResource pending; Location + ETag | Proposed representative or authorized estate workflow actor; case must be verified | Idempotency; case If-Match; no active duplicate | 5/day actor+subject; Tier 2 p95 <1200 ms; no-store |
| IDL-API-13 GET /api/v1/estate-representations/{representationId} | No body; 200 EstateRepresentationResource | Current representative in scope or assigned operator | No idempotency; representation ETag | 60/min actor; Tier 1 p95 <750 ms; no-store |
| IDL-API-14 POST /api/v1/estate-representations/{representationId}/decisions | EstateRepresentationDecisionRequest; 202 JobStatus + Location | Assigned identity/estate reviewer, MFA, counsel-policy capability | Idempotency; representation If-Match; row lock | 30/hour operator; async ack p95 <1000 ms; no-store |
| IDL-API-15 POST /api/v1/estate-representations/{representationId}/revoke | RevokeEstateRepresentationRequest; 200 EstateRepresentationResource | Current representative within scope or assigned operator; deceased cannot act | Idempotency; representation If-Match | 20/hour actor; Tier 2 p95 <1200 ms; no-store |

Public profile, alias, memorial marker, and discovery reads remain owned by
01b. They consume a safe projection and never call the protected case or
evidence reads above. No endpoint in this file accepts an external provider
ID as a profile merge instruction.

## Request/Response Contracts (Zod 4 schemas)

The following is contract-library notation for Zod 4. All objects are strict;
arrays are bounded and unique where stated. UUIDs are lowercase canonical UUID
strings at the API boundary. Timestamps are RFC3339 UTC with offset normalized
by the server. Namespace, capacity, reason-code, activity, domain, and
territory registries are server-owned; unknown values fail closed.

~~~typescript
const Uuid = z.string().uuid();
const Timestamp = z.iso.datetime({ offset: true });
const Version = z.string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine((value) => BigInt(value) <= 9223372036854775807n, "version_out_of_range");
const ReasonCode = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/);
const Namespace = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/);
const RegistryCode = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/);
const EvidenceRefs = z.array(Uuid).max(20).refine(unique);
const MoneyCeiling = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  minorUnits: z.number().int().safe().min(0).max(9000000000000000)
}).strict();

const CreateIdentifierClaimRequest = z.object({
  namespace: Namespace,
  value: z.string().min(1).max(256).refine(isNfcAndNoControls),
  capacity: RegistryCode,
  provenance: z.enum(["self_asserted", "registry", "provider", "platform", "third_party"]),
  evidenceRefs: EvidenceRefs
}).strict();

const IdentifierClaimListQuery = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  namespace: Namespace.optional(),
  state: z.enum(["self_asserted", "verifying", "verified", "mismatch", "collision", "revoked"]).optional(),
  includeRevoked: z.coerce.boolean().default(false)
}).strict();

const VerifyIdentifierClaimRequest = z.object({}).strict();
const WithdrawIdentifierClaimRequest = z.object({
  reasonCode: ReasonCode,
  evidenceRefs: EvidenceRefs
}).strict();
const ResolveIdentifierCollisionRequest = z.object({
  resolution: z.literal("registry_evidence"),
  winningClaimId: Uuid,
  evidenceRefs: EvidenceRefs.min(1),
  reasonCode: ReasonCode
}).strict();

const CreateLegacyNominationRequest = z.object({
  successorPersonId: Uuid
}).strict();
const RevokeLegacyNominationRequest = z.object({
  reasonCode: ReasonCode
}).strict();

const ReportMemorialisationRequest = z.object({
  reasonCode: ReasonCode,
  evidenceRefs: EvidenceRefs.min(1)
}).strict();
const MemorialisationDecisionRequest = z.object({
  decision: z.enum(["verified", "rejected", "contested"]),
  reasonCode: ReasonCode,
  evidenceRefs: EvidenceRefs
}).strict();

const CreateEstateRepresentationRequest = z.object({
  representativePartyId: Uuid,
  activityCodes: z.array(RegistryCode).min(1).max(32).refine(unique),
  domainCodes: z.array(RegistryCode).min(1).max(32).refine(unique),
  territoryCodes: z.array(RegistryCode).min(1).max(256).refine(unique),
  startsAt: Timestamp,
  endsAt: Timestamp,
  communicationAllowed: z.boolean(),
  moneyCeiling: MoneyCeiling.nullable(),
  legalEvidenceRefs: EvidenceRefs.min(1)
}).strict().refine(startBeforeEnd);
const EstateRepresentationDecisionRequest = z.object({
  decision: z.enum(["active", "rejected"]),
  reasonCode: ReasonCode,
  evidenceRefs: EvidenceRefs
}).strict();
const RevokeEstateRepresentationRequest = z.object({
  reasonCode: ReasonCode
}).strict();
~~~

Value is accepted only as an NFC, control-free assertion. The server applies
the configured namespace normalizer and stores only normalized value in the
canonical claim. Confusable/homoglyph and namespace-capacity checks happen
before persistence. A provider/registry adapter is selected by server
configuration; clients cannot select or spoof one.

~~~typescript
const IdentifierClaimResource = z.object({
  id: Uuid,
  partyId: Uuid,
  namespace: Namespace,
  normalizedValue: z.string().min(1).max(256),
  capacity: RegistryCode,
  provenance: z.enum(["self_asserted", "registry", "provider", "platform", "third_party"]),
  verificationState: z.enum(["self_asserted", "verifying", "verified", "mismatch", "collision", "revoked"]),
  evidenceRefCount: z.number().int().safe().min(0).max(20),
  verificationDelayed: z.boolean(),
  verifiedAt: Timestamp.nullable(),
  revokedAt: Timestamp.nullable(),
  version: Version,
  createdAt: Timestamp,
  updatedAt: Timestamp
}).strict();

const IdentifierClaimList = z.object({
  items: z.array(IdentifierClaimResource).max(50),
  nextCursor: z.string().max(512).nullable(),
  hasMore: z.boolean()
}).strict();

const LegacyNominationResource = z.object({
  id: Uuid,
  nominatorPersonId: Uuid,
  successorPersonId: Uuid,
  state: z.enum(["active", "revoked", "superseded"]),
  createdAt: Timestamp,
  revokedAt: Timestamp.nullable(),
  version: Version
}).strict();

const MemorialisationReportAccepted = z.object({
  accepted: z.literal(true)
}).strict();

const MemorialisationCaseReporterView = z.object({
  audience: z.literal("reporter"),
  id: Uuid,
  subjectPersonId: Uuid,
  state: z.enum(["reported", "reviewing", "verified", "rejected", "contested"]),
  createdAt: Timestamp,
  decidedAt: Timestamp.nullable(),
  version: Version
}).strict();
const MemorialisationCaseReviewerView = z.object({
  audience: z.literal("reviewer"),
  id: Uuid,
  subjectPersonId: Uuid,
  reporterPersonId: Uuid.nullable(),
  evidenceRefs: EvidenceRefs,
  state: z.enum(["reported", "reviewing", "verified", "rejected", "contested"]),
  reviewerId: Uuid.nullable(),
  reasonCode: ReasonCode.nullable(),
  createdAt: Timestamp,
  decidedAt: Timestamp.nullable(),
  version: Version
}).strict();
const MemorialisationCaseView = z.discriminatedUnion("audience", [
  MemorialisationCaseReporterView, MemorialisationCaseReviewerView
]);

const EstateRepresentationResource = z.object({
  id: Uuid,
  subjectPersonId: Uuid,
  representativePartyId: Uuid,
  sourceCaseId: Uuid,
  activityCodes: z.array(RegistryCode).min(1).max(32),
  domainCodes: z.array(RegistryCode).min(1).max(32),
  territoryCodes: z.array(RegistryCode).min(1).max(256),
  startsAt: Timestamp,
  endsAt: Timestamp,
  communicationAllowed: z.boolean(),
  moneyCeiling: MoneyCeiling.nullable(),
  legalEvidenceRefCount: z.number().int().safe().min(1).max(20),
  state: z.enum(["pending", "active", "rejected", "expired", "revoked"]),
  reviewedAt: Timestamp.nullable(),
  revokedAt: Timestamp.nullable(),
  version: Version
}).strict();
~~~

The inherited BE00 JobStatus schema is returned for asynchronous operations;
its state is only queued, running, succeeded, failed, or cancelled. A failed
verification job does not make a claim verified. Safe job errors contain a
registered error code and recovery action, never provider evidence.

### Contract examples

The examples are canonical wire shapes. Values are synthetic; evidence refs
are opaque governed-object IDs, not URLs or file contents.

~~~json
{
  "namespace": "isni",
  "value": "0000 0001 2102 3456",
  "capacity": "person",
  "provenance": "self_asserted",
  "evidenceRefs": ["5f35e5e5-5f35-45f3-95c7-111111111111"]
}
~~~

~~~json
{
  "id": "6f7a8e9a-6f7a-48e9-8f7a-222222222222",
  "partyId": "7f8a9e0a-7f8a-49ea-9f8a-333333333333",
  "namespace": "isni",
  "normalizedValue": "0000000121023456",
  "capacity": "person",
  "provenance": "self_asserted",
  "verificationState": "self_asserted",
  "evidenceRefCount": 1,
  "verificationDelayed": false,
  "verifiedAt": null,
  "revokedAt": null,
  "version": 1,
  "createdAt": "2026-08-28T14:00:00Z",
  "updatedAt": "2026-08-28T14:00:00Z"
}
~~~

~~~json
{
  "decision": "verified",
  "reasonCode": "registry_match",
  "evidenceRefs": ["8f35e5e5-8f35-45f3-95c7-444444444444"]
}
~~~

~~~json
{
  "code": "CONFLICT",
  "message": "The requested version is no longer current.",
  "requestId": "9f35e5e5-9f35-45f3-95c7-555555555555",
  "details": {
    "conflict": "VERSION_MISMATCH",
    "expectedVersion": 3,
    "currentVersion": 4,
    "recoveryAction": "refetch_and_retry"
  }
}
~~~

## Endpoint Behavior and Error Matrix

All routes reject unknown fields, invalid UUIDs, invalid query cursor binding,
missing required headers, invalid registry codes, and evidence refs that are
not governed private object records. All protected-resource misses use
concealed 404 NOT_FOUND where revealing existence would disclose identity,
case, collision, or legal evidence.

| Operation | Successful transaction | 400/401/403/404 domain cases | 409 domain cases | 413/415/422/429 | 502/503/500 |
|---|---|---|---|---|---|
| IDL-API-01 create claim | Insert claim as self_asserted, audit, outbox identifier change | malformed header; unauthenticated; wrong party/capability; concealed party miss | same live claim or party version race; idempotency mismatch | inherited size/media; namespace/value/capacity/evidence violations; quota | RPC/outbox dependency unavailable; generic internal |
| IDL-API-02 list claims | Authorized projection, no evidence payload | unauthenticated; concealed party miss | none | query/cursor/limit violations; rate limit | projection/RPC unavailable; generic internal |
| IDL-API-03 verify claim | Insert attempt, enqueue verify job, state verifying under CAS | malformed If-Match; unauthenticated; wrong authority; concealed claim miss | version mismatch; attempt already active; idempotency mismatch | namespace adapter/input validation; rate limit | queue/registry dependency unavailable; generic internal |
| IDL-API-04 withdraw claim | Set claim revoked; update collision atomically; audit/outbox | malformed request; unauthenticated; wrong authority; concealed claim miss | version mismatch; invalid transition; idempotency mismatch | evidence/reason/quota violations; rate limit | RPC/outbox unavailable; generic internal |
| IDL-API-05 resolve collision | Registry decision job accepted; no guessed winner | malformed request; unauthenticated; missing operator capability; concealed collision | version mismatch; no longer open; idempotency mismatch | winning claim/evidence/reason violations; rate limit | registry/queue unavailable; generic internal |
| IDL-API-06 create nomination | Supersede prior active and insert new active atomically | malformed If-Match; unauthenticated; wrong person/dead person; concealed person miss | version race; invalid successor; idempotency mismatch | UUID/registry/quota violations | RPC/outbox unavailable; generic internal |
| IDL-API-07 get nomination | Private self projection | unauthenticated; wrong party; concealed person/nomination miss | none | query/rate limit | RPC unavailable; generic internal |
| IDL-API-08 revoke nomination | Set active nomination revoked atomically | malformed request; unauthenticated; wrong person/dead person; concealed miss | version mismatch; not active; idempotency mismatch | reason/quota violations | RPC/outbox unavailable; generic internal |
| IDL-API-09 report death | Store protected report and create/reuse reviewing case; no public effect | malformed/evidence; unauthenticated; concealed subject miss | idempotency mismatch only; duplicate reports are coalesced | evidence/reason; rate limit | Storage/RPC unavailable; generic internal |
| IDL-API-10 get case | Reporter redaction or reviewer protected view | unauthenticated; wrong reporter/reviewer; concealed case miss | none | rate limit | RPC unavailable; generic internal |
| IDL-API-11 review case | Append decision; verified decision invokes lifecycle handoff and event/job atomically | malformed If-Match; unauthenticated; no assignment/MFA/capability; concealed miss | version race; invalid state; idempotency mismatch | evidence/reason/policy; rate limit | identity/queue/outbox unavailable; generic internal |
| IDL-API-12 request estate representation | Insert pending scoped manifest tied to verified case | malformed If-Match; unauthenticated; wrong representative/case; concealed miss | active/pending duplicate; version race; idempotency mismatch | scope/date/evidence/ceiling; rate limit | RPC/outbox unavailable; generic internal |
| IDL-API-13 get representation | Scope-redacted private projection | unauthenticated; outside representative scope; concealed miss | none | rate limit | RPC unavailable; generic internal |
| IDL-API-14 decide representation | Verify counsel policy and activate/reject; active handoff to 01c | malformed If-Match; unauthenticated; no assignment/MFA/capability; concealed miss | version race; invalid state; idempotency mismatch | evidence/policy/scope; rate limit | 01c/queue/outbox unavailable; generic internal |
| IDL-API-15 revoke representation | Revoke edge and emit relationship change | malformed If-Match; unauthenticated; outside scope; concealed miss | version race; already terminal; idempotency mismatch | reason/quota violations | RPC/outbox unavailable; generic internal |

The stable error codes and status mapping are inherited BE00 values:
INVALID_REQUEST 400, UNAUTHENTICATED or STEP_UP_REQUIRED 401, FORBIDDEN 403,
NOT_FOUND 404, CONFLICT 409, PAYLOAD_TOO_LARGE 413,
UNSUPPORTED_MEDIA_TYPE 415, VALIDATION_FAILED 422, RATE_LIMITED 429,
DEPENDENCY_UNAVAILABLE 503 (or 502/504 only for the inherited gateway
mapping), and INTERNAL_ERROR 500. Domain reason codes are in
details.reasonCode; they never create a fifth top-level error field.

## Route Semantics

### IDA-15: identifier claim and verification

IDL-API-01 validates namespace registry, value normalization, capacity,
provenance, and evidence object ownership. It binds the claim to the path
party, not a body party. The initial state is self_asserted. Duplicate
same-party normalized claims are rejected; two different live parties sharing
the value create/open one IdentifierCollision and set all affected claims to
collision. No global uniqueness is required before verification.

IDL-API-03 locks the claim and any collision row, appends an
IdentifierVerificationAttempt, and enqueues a worker that reads the claim by
ID. The queue contains no identifier value or evidence. A healthy adapter may
produce verified or mismatch; a conflicting live result produces collision.
An unavailable adapter preserves the claim and prior evidence, marks the
attempt delayed, and retries. A stale provider result is retained as attempt
evidence but cannot downgrade verified or transition a newer version.

IDL-API-04 is the only claimant withdrawal path. It revokes the claim and
recomputes the collision in one transaction. If withdrawal leaves no
conflicting live claims, the collision becomes withdrawn; if registry
evidence resolves it, the operator job makes at most one claim verified and
leaves all other history intact. The route never transfers a claim to another
party.

### IDA-16: collision hold and resolution

IDL-API-05 accepts only registry-backed evidence and a winning claim that is a
member of the open collision. It is restricted to an assigned identity
operator with MFA, a reason code, and a policy-approved adapter result.
Claimant withdrawal must use IDL-API-04. Resolution locks collision plus claim
rows, checks expected versions, appends decision evidence, updates states,
emits one identifier change per affected claim, and commits outbox entries
atomically. Missing evidence, provider disagreement, and conflicting digest
keep the collision open and route to protected manual review.

### IDA-17: legacy nomination

IDL-API-06 accepts an existing or already invited successor person ID. It
requires a live nominator acting for self and a current person ETag. If an
active nomination exists, the transaction marks it superseded and inserts
exactly one new active nomination. It never grants authority at creation.
IDL-API-07 is private; it returns no public successor marker. IDL-API-08
revokes only an active nomination while the nominator is alive. A memorialised
person cannot log in, sign, attest, or use this endpoint; the nomination and
its audit history remain preserved.

### IDA-18: report, review, memorialisation

IDL-API-09 requires an authenticated reporter and one or more governed private
evidence refs. It stores an immutable report submission and coalesces reports
for the same subject into one protected case. The transaction records the
case as reported and advances it to reviewing before commit; the externally
visible response remains only accepted: true, so a reporter cannot enumerate
existing cases. No public marker, authority change, notification, or session
revocation occurs.

IDL-API-10 returns a redacted status to a reporter who submitted a report and
the full evidence-ref view only to the assigned reviewer. Subject, unrelated
person, ordinary support/admin, and wrong-party requests receive concealed
404. Evidence object contents require the separate storage policy and are
never in this response.

IDL-API-11 accepts only a reviewer assignment with the exact identity review
capability, recent MFA/step-up, and named reason. verified, rejected, and
contested are the locked decisions. A verified decision transaction locks
case/person versions, invokes the identity lifecycle handoff, writes
identity.party.memorialised.v1, and queues idempotent session/authority
revocation. If the lifecycle handoff cannot commit, the decision does not
commit. Once committed, every authority check fails closed on the person
lifecycle immediately; asynchronous session deletion retries until complete.

False-report reversal is not an ordinary public endpoint. The security/privacy
runbook appends a protected reversal decision, requires elevated capability,
fresh evidence and an audit reason, and restores active lifecycle only after
the same versioned lifecycle RPC succeeds. Original verified evidence is not
deleted. This preserves the locked case states while making reversal
recoverable and reviewable.

### Estate authority and representation

IDL-API-12 creates a pending, scope-complete estate representation manifest
only when the source memorialisation case is verified. The proposed
representative may submit the request but has no authority until activation.
The request references governed legal evidence objects; it cannot contain
probate text, a deceased login, a signature, or an ownership claim.

IDL-API-14 is a separate assigned reviewer decision. It requires counsel-
approved evidence policy, legal evidence verification, MFA, reason, and
current representation ETag. Activation calls the 01c relationship RPC to
materialize the scoped authority edge; the estate manifest remains the
canonical estate-specific record and the generic edge is its authority
projection. A failed handoff leaves state pending. Active, expired, or
revoked edges never become active again; create a new reviewed record.

IDL-API-13 returns only the current representative/operator projection.
IDL-API-15 revokes the scoped edge and manifest atomically. Expiry is an
idempotent scheduled command at endsAt. Estate authority is valid only for
the recorded activity/domain, territory, term, communication flag, and
ceiling. It cannot authorize deceased impersonation or mutate rights/payment
ownership.

## Authorization Role × Operation Matrix

| Role | Claim create/list | Verify/withdraw | Collision resolve | Nomination | Death report/read | Memorial decision | Estate request/read | Estate decision/revoke |
|---|---|---|---|---|---|---|---|---|
| Anonymous | Deny; public projections only elsewhere | Deny | Deny | Deny | Deny | Deny | Deny | Deny |
| Person, self | Own party only | Own claim; withdraw own | Deny | Create/read/revoke own while alive | Report; read only own submitted redacted status | Deny | Submit/read only own proposed representation if in scope | Revoke own active scope only |
| Org member with accepted mandate | Exact party/activity/domain/term/ceiling only | Same scoped claim; no personal nomination | Deny | Deny | Report; no case evidence | Deny | Submit/read only exact scoped representative party | Revoke only exact scoped edge |
| Estate representative | Active edge only, exact scope and term | No deceased claim transfer; scoped read only | Deny | Deny | Report; protected case read only if assigned | Deny | Read/act only within active edge | Revoke within exact edge |
| Assigned identity operator | Recovery capability + reason; no general ownership | Assigned claim recovery only | Assigned collision, MFA, registry evidence | Deny ordinary creation | Assigned case status, no unrelated PII | Assigned reviewer + MFA + policy | Assigned estate case/representation | Assigned review/revoke, runbook for reversal |
| Support/admin | Deny by default | Deny | Deny | Deny | Deny evidence and cases | Deny | Deny | Deny |
| Shard22/30/39 service principal | Named projection/event read only | No command; no direct tables | Deny | No private read | Consume events only | Deny | Consume scoped authority event only | Deny |

Every matrix cell additionally requires current authenticated session,
server-derived actor, one acting party, current relationship/mandate source
and version, purpose capability, lifecycle check, resource predicate, and
fresh ETag. Expired/revoked relationship, wrong party, stale context, and
overbroad consumer purpose fail closed. No role can self-delegate or use a
client-provided role, party, cap, or subject.

## Database Schema, Checks, Indexes, and Grants

Canonical identity tables are in identity_private; infrastructure idempotency,
jobs, audit, outbox, and object records remain BE00 platform_private tables.
All tables are RLS-enabled and forced. Direct client grants are absent,
including service-role access outside named security-definer RPCs with
explicit search_path, actor, purpose, and capability checks.

`identifier_collision`, collision membership/attempt rows, reports, decisions,
`estate_representation`, and estate reviews are implementation support tables.
An active estate manifest must reference the 01c-owned `RepresentationEdge`;
the manifest never becomes a second canonical authority graph.

| Table | Required fields and checks | Indexes / uniqueness |
|---|---|---|
| party_identifier_claim | id, party_id, namespace, normalized_value, capacity, provenance, verification_state, evidence_refs, verified_at, revoked_at, version, created_at, updated_at. Registry-code format, evidence max20, version >0, revoked state/timestamp consistency, and verified timestamp only for verified state. | PK id; party/state; namespace/normalized_value; unique party+namespace+normalized_value+capacity for non-revoked rows. |
| identifier_collision | id, namespace, normalized_value, state open/resolved/withdrawn, resolution_basis, resolved_at, version, created_at, updated_at. Member claims are maintained by support relation and trigger; open requires at least two live members. | PK id; unique namespace+normalized_value for open; state and updated-at. |
| identifier_collision_member support relation | collision_id, claim_id, membership_state, added_at, removed_at, claim_version_at_join. No deletion of history; membership change is RPC-only. | PK collision+claim; claim_id/state; open collision lookup. |
| identifier_verification_attempt support record | id, claim_id, adapter_key/version, requested_at, completed_at, outcome pending/verified/mismatch/collision/delayed/rejected, evidence_refs, provider_event_digest, error_class, attempt_no. No raw provider body. | claim/requested-at; digest; active attempt partial index. |
| legacy_nomination | id, nominator_person_id, successor_person_id, state active/revoked/superseded, created_at, revoked_at, version. Terminal timestamps and positive version; transition trigger forbids reactivation. | PK id; partial unique active nominator; nominator/state. |
| memorialisation_case | id, subject_person_id, reporter_person_id nullable, evidence_refs, state reported/reviewing/verified/rejected/contested, reviewer_id nullable, reason_code nullable, decided_at, version, created_at, updated_at. Evidence max20 and state/decision consistency. | PK id; subject/state; assigned reviewer/state; created-at. Partial unique nonterminal case per subject. |
| memorialisation_report support record | id, case_id, reporter_person_id, evidence_refs, reason_code, request_digest, created_at, intake_state. Immutable; no raw narrative or upload bytes. | case/created-at; reporter/created-at; digest. |
| memorialisation_review_decision support record | id, case_id, reviewer_id, decision, reason_code, evidence_refs, prior_version, next_version, policy_version, runbook_ref nullable, created_at. Append-only and unique case+next_version. | case/version; reviewer/created-at. |
| estate_representation | id, subject_person_id, representative_party_id, source_case_id, activity_codes, domain_codes, territory_codes, starts_at, ends_at, communication_allowed, money_ceiling nullable, legal_evidence_refs, state pending/active/rejected/expired/revoked, reviewed_by, reviewed_at, revoked_at, version, created_at, updated_at. Source case verified, starts < ends, active requires review/evidence, no unlimited ceiling. | PK id; subject/state; representative/state; active scope/term; one active overlapping scope per subject+representative. |
| estate_authority_review support record | id, representation_id, reviewer_id, decision, reason_code, policy_version, evidence_refs, relationship_edge_id nullable, prior_version, next_version, created_at. Append-only; no legal prose or raw files. | representation/version; reviewer/created-at. |

Private Storage object records use BE00 object IDs and retention/legal-hold
metadata. Evidence refs must point to a private, non-expired, non-deleted
object whose target and purpose match the case. Signed reads are separately
authorized, short-lived, non-cacheable, and never included in API resources.

RLS policy predicates are server-derived:

- anonymous and browser roles: no table privileges and no direct SELECT;
- authenticated: named RPC only, with actor/party/resource predicate;
- identity operator: named capability, assignment, MFA freshness, purpose,
  reason, and audit required;
- queue worker: only the named job RPC and only its lease token;
- Shard22/30/39: event/projection consumer grants only; no evidence or
  canonical table reads;
- service owner: break-glass runbook only, time-limited, audited, and no
  arbitrary direct mutation.

### Field-level SQL type and relationship ledger

This ledger is authoritative for the 01d-owned persistence fields. It gives every field an SQL type and nullability, names each FK or deliberate opaque owner-domain reference, ties indexes to lookup patterns, and repeats the forced-RLS and grant boundary. BE00 platform records remain typed at their owning specification.

| Table | Typed fields, nullability, and constraints | Foreign keys and relationship boundary | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| identity_private.party_identifier_claim | id uuid NOT NULL PK; party_id uuid NOT NULL; namespace text NOT NULL CHECK registry code; normalized_value text NOT NULL CHECK length 1..256; capacity text NOT NULL CHECK registry code; provenance text NOT NULL; verification_state text NOT NULL CHECK IN (self_asserted, verifying, verified, mismatch, collision, revoked); evidence_refs jsonb NOT NULL CHECK array and max 20; verified_at timestamptz NULL; revoked_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | party_id REFERENCES platform_private.party(id) ON DELETE RESTRICT; evidence refs are BE00 object IDs validated by purpose and retention RPC | PK; index party_id, verification_state, updated_at DESC; index namespace, normalized_value; partial unique party_id, namespace, normalized_value, capacity WHERE verification_state <> revoked | forced RLS; claimant and assigned operator projections only; no evidence/object table grant |
| identity_private.identifier_collision | id uuid NOT NULL PK; namespace text NOT NULL; normalized_value text NOT NULL; state text NOT NULL CHECK IN (open, resolved, withdrawn); resolution_basis text NULL; resolved_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | normalized value is a keyed collision domain; member rows carry local FKs and no raw value is exposed | PK; partial unique namespace, normalized_value WHERE state = open; index state, updated_at DESC; index namespace, normalized_value | forced RLS; assigned identity operator and bounded claimant projection; anonymous/auth table grants denied |
| identity_private.identifier_collision_member | collision_id uuid NOT NULL; claim_id uuid NOT NULL; membership_state text NOT NULL CHECK IN (live, withdrawn, superseded); added_at timestamptz NOT NULL; removed_at timestamptz NULL; claim_version_at_join bigint NOT NULL CHECK >0; PRIMARY KEY collision_id, claim_id | collision_id REFERENCES identity_private.identifier_collision(id) ON DELETE RESTRICT; claim_id REFERENCES identity_private.party_identifier_claim(id) ON DELETE RESTRICT | PK collision_id, claim_id; index claim_id, membership_state; index collision_id, membership_state | forced RLS; operator and owning claim projection only; append/update through collision RPC |
| identity_private.identifier_verification_attempt | id uuid NOT NULL PK; claim_id uuid NOT NULL; adapter_key text NOT NULL; adapter_version text NOT NULL; requested_at timestamptz NOT NULL; completed_at timestamptz NULL; outcome text NOT NULL CHECK IN (pending, verified, mismatch, collision, delayed, rejected); evidence_refs jsonb NOT NULL CHECK array and max 20; provider_event_digest bytea NULL CHECK octet_length = 32; error_class text NULL; attempt_no integer NOT NULL CHECK BETWEEN 1 AND 6 | claim_id REFERENCES identity_private.party_identifier_claim(id) ON DELETE RESTRICT; provider payload remains in BE00 protected receipt | PK; unique claim_id, attempt_no; index claim_id, requested_at DESC; partial index outcome, requested_at WHERE outcome IN (pending, delayed); index provider_event_digest | forced RLS; adapter worker and assigned operator only; no provider-body or raw evidence grant |
| identity_private.legacy_nomination | id uuid NOT NULL PK; nominator_person_id uuid NOT NULL; successor_person_id uuid NOT NULL; state text NOT NULL CHECK IN (active, revoked, superseded); created_at timestamptz NOT NULL; revoked_at timestamptz NULL; version bigint NOT NULL CHECK >0 | nominator_person_id and successor_person_id REFERENCES platform_private.party(id) ON DELETE RESTRICT; successor authority is not inferred from this row | PK; partial unique nominator_person_id WHERE state = active; index nominator_person_id, state; index successor_person_id | forced RLS; nominator self or named private-representation capability; no public enumeration |
| identity_private.memorialisation_case | id uuid NOT NULL PK; subject_person_id uuid NOT NULL; reporter_person_id uuid NULL; evidence_refs jsonb NOT NULL CHECK array max 20; state text NOT NULL CHECK IN (reported, reviewing, verified, rejected, contested); reviewer_id uuid NULL; reason_code text NULL; decided_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | subject_person_id REFERENCES platform_private.party(id) ON DELETE RESTRICT; reporter_person_id and reviewer_id reference platform_private.party(id) when present; evidence refs are BE00 objects | PK; partial unique subject_person_id WHERE state IN (reported, reviewing, contested); index subject_person_id, state; index reviewer_id, state; index created_at DESC | forced RLS; reporter status projection and assigned reviewer evidence projection; no direct client grant |
| identity_private.memorialisation_report | id uuid NOT NULL PK; case_id uuid NOT NULL; reporter_person_id uuid NOT NULL; evidence_refs jsonb NOT NULL CHECK array max 20; reason_code text NOT NULL; request_digest bytea NOT NULL CHECK octet_length = 32; created_at timestamptz NOT NULL; intake_state text NOT NULL CHECK IN (received, deduped, accepted, rejected) | case_id REFERENCES identity_private.memorialisation_case(id) ON DELETE RESTRICT; reporter_person_id REFERENCES platform_private.party(id) ON DELETE RESTRICT | PK; index case_id, created_at DESC; index reporter_person_id, created_at DESC; unique request_digest | forced RLS; append/read through report RPC; no raw narrative or object bytes |
| identity_private.memorialisation_review_decision | id uuid NOT NULL PK; case_id uuid NOT NULL; reviewer_id uuid NOT NULL; decision text NOT NULL CHECK IN (verify, reject, contest); reason_code text NOT NULL; evidence_refs jsonb NOT NULL CHECK array max 20; prior_version bigint NOT NULL CHECK >0; next_version bigint NOT NULL CHECK >0; policy_version text NOT NULL; runbook_ref text NULL; created_at timestamptz NOT NULL | case_id REFERENCES identity_private.memorialisation_case(id) ON DELETE RESTRICT; reviewer_id REFERENCES platform_private.party(id) ON DELETE RESTRICT | PK; unique case_id, next_version; index case_id, created_at DESC; index reviewer_id, created_at DESC | forced RLS; assigned reviewer and audit capability only; append-only RPC |
| identity_private.estate_representation | id uuid NOT NULL PK; subject_person_id uuid NOT NULL; representative_party_id uuid NOT NULL; source_case_id uuid NOT NULL; activity_codes text[] NOT NULL CHECK cardinality 1..32; domain_codes text[] NOT NULL CHECK cardinality 1..32; territory_codes text[] NOT NULL CHECK cardinality 1..256; starts_at timestamptz NOT NULL; ends_at timestamptz NULL CHECK ends_at > starts_at; communication_allowed boolean NOT NULL; money_ceiling bigint NULL CHECK >=0; currency char(3) NULL; legal_evidence_refs jsonb NOT NULL CHECK array max 20; state text NOT NULL CHECK IN (pending, active, rejected, expired, revoked); reviewed_by uuid NULL; reviewed_at timestamptz NULL; revoked_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | subject_person_id and representative_party_id REFERENCES platform_private.party(id) ON DELETE RESTRICT; source_case_id REFERENCES identity_private.memorialisation_case(id) ON DELETE RESTRICT; reviewed_by REFERENCES platform_private.party(id) ON DELETE RESTRICT; evidence refs are BE00 objects | PK; index subject_person_id, state, starts_at; index representative_party_id, state, starts_at; partial index ends_at WHERE state = active; exclusion on subject, representative, scope and tstzrange | forced RLS; participant-scoped read, assigned reviewer activation RPC, no direct table grant |
| identity_private.estate_authority_review | id uuid NOT NULL PK; representation_id uuid NOT NULL; reviewer_id uuid NOT NULL; decision text NOT NULL CHECK IN (activate, reject, revoke); reason_code text NOT NULL; policy_version text NOT NULL; evidence_refs jsonb NOT NULL CHECK array max 20; relationship_edge_id uuid NULL; prior_version bigint NOT NULL CHECK >0; next_version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL | representation_id REFERENCES identity_private.estate_representation(id) ON DELETE RESTRICT; reviewer_id REFERENCES platform_private.party(id) ON DELETE RESTRICT; relationship_edge_id is the 01c RepresentationEdge opaque FK boundary | PK; unique representation_id, next_version; index representation_id, created_at DESC; index reviewer_id, created_at DESC | forced RLS; assigned estate reviewer and audit capability only; append-only RPC |

## Middleware, Policies, and Disclosure

The route inventory is compile-time checked. URL/path/query/header/body
limits, CSRF, content type, deadline, request ID, and rate limits execute
before database work. Authorization executes after Zod parse but before
resource-specific existence disclosure. A single RPC performs authority
recheck, lifecycle and policy checks, CAS, idempotency result, canonical
mutation, audit append, and outbox append.

Evidence policy is purpose-bound. Reporters see only accepted/status
projections. Reviewers see evidence refs, not bytes, unless governed Storage
policy grants a separate signed read. Logs, events, queue envelopes,
analytics, Sentry, and public projections contain no evidence refs, raw
identifier values, provider payloads, legal narrative, or private successor.
The minimum safe event payload contains only the IDs named by the IA event
contract.

The authority source snapshot stored on every command includes actor ID,
acting party ID, source relationship/mandate ID and version, activity/domain,
territory, term, ceiling, consumer purpose, lifecycle version, and decision
reason. The snapshot is immutable evidence of what was authorized; it never
creates authority by itself.

### Per-operation middleware, error envelope, limits, telemetry, and test matrix

Every row below is keyed to the authoritative operation ID. Route Registry cells remain the single source for exact route-specific auth, rate, idempotency, and success/error status values; this matrix adds the boundary execution policy and makes each operation explicit.

| Operation ID | Auth and ownership | Rate limit | Input validation | CORS policy | Global error envelope | Error and retry guidance | Pagination and limits | Idempotency and concurrency | Observability | Test oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| IDL-API-01 | The authoritative Route Registry IDL-API-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-01; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-02 | The authoritative Route Registry IDL-API-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry IDL-API-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-02; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-03 | The authoritative Route Registry IDL-API-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-03; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-04 | The authoritative Route Registry IDL-API-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-04; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-05 | The authoritative Route Registry IDL-API-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-05; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-06 | The authoritative Route Registry IDL-API-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-06; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-07 | The authoritative Route Registry IDL-API-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-07; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-08 | The authoritative Route Registry IDL-API-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-08; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-09 | The authoritative Route Registry IDL-API-09 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-09 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-09 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-09 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-09; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-10 | The authoritative Route Registry IDL-API-10 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-10 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-10 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-10 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-10; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-11 | The authoritative Route Registry IDL-API-11 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-11 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-11 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-11 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-11; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-12 | The authoritative Route Registry IDL-API-12 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-12 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-12 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-12 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-12; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-13 | The authoritative Route Registry IDL-API-13 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-13 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-13 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-13 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-13; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-14 | The authoritative Route Registry IDL-API-14 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-14 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-14 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-14 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-14; assert exact ApiError envelope and no unauthorized side effect. |
| IDL-API-15 | The authoritative Route Registry IDL-API-15 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry IDL-API-15 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for IDL-API-15 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry IDL-API-15 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for IDL-API-15; assert exact ApiError envelope and no unauthorized side effect. |
## Data Flow

Every protected command executes the inherited order `validate -> authenticate -> resolve acting context -> authorize -> enforce concurrency/idempotency -> commit -> emit`. The named SQL/RPC transaction locks all affected claim, collision, person, case, nomination, or representation rows; commits canonical state, audit, idempotency, and outbox together; then returns the validated response. Verification, review, memorialisation, estate activation, and downstream invalidation run only from identifier-only events/jobs, re-read canonical versions, and preserve `pending`, `delayed`, or manual-review state whenever an external result is ambiguous.

### External seam contracts and circuit state

External identifier and evidence adapters are bounded integrations, not sources of authority. Each request and response is a strict adapter DTO carrying the operation id, `requestId`, source version, and idempotency binding. Provider values and evidence payloads are normalized before persistence; an open circuit leaves the canonical workflow pending or delayed.

| Operations | Seam and owner | Exact request | Exact response | Timeout | Retry policy | Circuit, open state, and recovery |
|---|---|---|---|---:|---|---|
| IDL-API-03, IDL-API-05 | Identifier registry or provider verifier | `claimId`, `claimVersion`, `namespace`, `normalizedValueHash`, `capacityCode`, `attemptId`, `expectedVersion`, `evidenceRefIds`, `requestId` | `verificationState`, `registryReferenceHash`, `observedAt`, `providerAttemptState`, `sourceVersion` | 5,000 ms | Worker performs three attempts at 15, 60, and 300 seconds; an unknown result is reconciled by `attemptId` and never starts a second claim | Five failures in 60 seconds open for 60 seconds; claim remains `verifying` or `delayed`, then max four deliveries route to DLQ and manual review; no verified state is inferred |
| IDL-API-01 through IDL-API-11 | BE00 governed evidence/object metadata | `evidenceRefIds`, `purposeCode`, `subjectPartyId`, `claimOrCaseId`, `expectedDigest`, `requestId` | `readinessState`, `receiptIds`, `digest`, `retentionClass`, `legalHoldState` | 2,000 ms | Two readiness reads at 250 ms and 750 ms; mutation outcomes reconcile by idempotency key | Five failures in 60 seconds open for 60 seconds; claim/case remains private and unverified or reviewing, with no evidence fallback; queue retry resumes after the circuit closes |
| IDL-API-12, IDL-API-14, IDL-API-15 | 01c relationship authority RPC | `representationId`, `representationVersion`, `sourceCaseId`, `scopeHash`, `expectedAuthorityVersion`, `decision`, `requestId` | `relationshipId`, `relationshipVersion`, `authorityState`, `effectiveAt`, `revokedAt` | 2,000 ms | One RPC attempt per command; timeout is reconciled by idempotency key, then one retry at 750 ms only when no commit is found | Five failures in 60 seconds open for 60 seconds; estate manifest remains pending, no partial active edge is asserted, and activation resumes only after status reconciliation |
| `identity.memorialisation.apply`, `identity.estate.activate`, `identity.party.memorialised.v1` | BE00 identity/session invalidation queue | `personId`, `caseId`, `lifecycleVersion`, `eventId`, `eventType`, `requestId` | `accepted`, `deliveryAttemptId`, `inboxState` | 2,000 ms per dispatch | Three deliveries at 15, 60, and 300 seconds, then DLQ; consumers dedupe by event ID and aggregate version | Five dispatch failures in 60 seconds open for 60 seconds; protected access fails closed while the source case remains canonical, and the sweeper reconciles delivery |

## State Machines and Concurrency

| Aggregate | Allowed transitions | Concurrency rule |
|---|---|---|
| Identifier claim | self_asserted → verifying → verified/mismatch/collision/self_asserted; any non-revoked → revoked | Claim and collision locked; stale provider result records attempt only. |
| Identifier collision | open → resolved or withdrawn | Open collision lock; resolution requires member/version and at most one eligible claim. |
| Legacy nomination | active → superseded or revoked; no reactivation | Person ETag; replacement supersedes old row and inserts new row atomically. |
| Memorialisation case | reported → reviewing → verified/rejected/contested | Case/person versions locked; one reviewer decision wins; no lost update. |
| Estate representation | pending → active/rejected; active → expired/revoked | Representation ETag; active handoff and relationship edge are one RPC transaction. |

All mutations reject weak ETags, wildcard, lists, signed/leading-zero/
overflow values, stale versions, duplicate active rows, and retries with a
changed request hash. Concurrent identical idempotency keys wait for the
committing transaction and replay its result. Concurrent different keys
produce one winner and a typed version conflict. Terminal history is never
rewritten.

## Jobs, Events, and Cross-Shard Handoffs

| Job / event | Trigger and payload | Retry / consumer rule |
|---|---|---|
| identity.identifier.verify | Claim ID, claim version, attempt ID, contract version; no value/evidence | BE00 retry schedule, max four deliveries, adapter outage stays delayed; DLQ requires manual review. |
| identity.identifier.resolve | Collision ID, member IDs, expected versions, attempt ID | Registry evidence only; conflicting digest remains open and alerts. |
| identity.memorialisation.apply | Person ID, case ID/version, lifecycle version | Revokes sessions/authority idempotently; authority checks fail closed while retries run. |
| identity.estate.activate | Representation ID/version, source case ID, policy version | Calls 01c relationship RPC; pending on failure, no partial active edge. |
| identity.identifier.changed.v1 | { identifierClaimId } | Shard22 rights/royalty routing re-evaluates; Shard39 refetches binding; asserted/collision state remains blocked. |
| identity.party.memorialised.v1 | { personId, caseId } | BE00 auth/session, profile/search, rights, offers, and notifications refetch/revoke idempotently. |
| identity.relationship.changed.v1 | { relationshipType: estate_representation, relationshipId } | Shard30 consumes current principal/delegate and source versions; no capability inference. |
| identity.legacy-nomination.changed.v1 | { personId, nominationId } | BE implementation event for private nomination/estate-eligibility projections only; no public nomination disclosure and no role-facet mutation. |

Every committed mutation writes audit and outbox in the same transaction.
Outbox dispatch is at-least-once; event handlers deduplicate by event ID and
aggregate version. Unknown schema goes directly to DLQ. Consumers use the
canonical producer lookup and fail closed on stale or missing authority
versions. They never copy mutable ownership or evidence.

## Error Handling

The endpoint behavior/error matrix and the cascade table below are exhaustive. Errors use only the BE00 four-field envelope; missing or malformed `If-Match` is 400 `INVALID_REQUEST`, stale state is 409 `VERSION_MISMATCH`, and concealment-sensitive absence/denial is normalized before any protected details are emitted.

### Failure Cascades and Partial-State Rules

| Failure | Canonical state | Required cascade / recovery |
|---|---|---|
| Namespace/capacity/evidence validation fails | No claim/report/representation row | Return bounded 422; no audit of sensitive value; caller corrects input. |
| Registry unavailable or timeout | Claim and prior evidence preserved; attempt delayed | Retry same job; no downgrade, auto-match, routing, or winner. |
| Two claims collide | All live members collision/unverified | Emit identifier changes; downstream blocks routing and opens protected review. |
| Claim withdrawal races verification | One CAS winner; other receives version conflict | Replay with fresh ETag; history and attempts remain. |
| Audit/outbox/RPC failure | Whole command rolls back | Return dependency/internal error; no orphan case, edge, or state. |
| Memorial verified handoff fails | Case decision does not commit | Retry idempotent decision; no public memorial or authority termination is claimed. |
| Session revocation delivery fails after commit | Person lifecycle is memorialised; authority checks fail closed | Queue retries/DLQ; sessions are denied at revalidation until deletion completes. |
| Estate relationship handoff fails | Representation remains pending | Retry; no active downstream mandate or payment/rights action. |
| Evidence object expires/deletes under legal hold conflict | Case/edge remains protected or is blocked | Legal-hold workflow decides; never silently substitute or erase provenance. |
| Downstream consumer is stale | Producer canonical state unchanged | Consumer refetches by ID/version; stale authority cannot authorize action. |
| Restore or replay | Canonical state restored with BE00 restore epoch | Reopen order is schema, RPC, outbox, queues, projections; duplicate events dedupe. |
| False report | No public or authority change before verified review | Abuse rate limit, protected contest/reversal runbook, immutable evidence/audit. |

No workflow compensates by deleting evidence, reversing a committed authority
fact with an unversioned update, or silently retrying a provider side effect.

## Rate, Abuse, and Security Controls

Rate limits are independent token buckets on actor, acting party, target
subject/collision, and a salted short-retention IP hash where listed. The
strictest exhausted bucket returns BE00 429 RATE_LIMITED with Retry-After,
RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset; dimensions and
existence are not disclosed.

- Identifier create: 30/hour actor and 100/day party; verify: 10/hour claim
  and 30/hour party; withdrawal: 20/hour actor; collision review: 5/hour
  operator/collision.
- Nomination create/revoke: 10/day nominator.
- Death report: 3/day reporter+subject, 10/day actor, 30/day IP; duplicate
  evidence digest is coalesced, never a public case oracle.
- Estate request/revoke: 5/day actor+subject and 20/hour revoke; review:
  30/hour assigned operator.

Normalization rejects control characters and confusable namespace/value
collisions. No provider auto-merge, no guessed collision winner, no
deceased login/signature/attestation, no arbitrary support access, no
subdelegation, no direct SQL, no raw evidence in logs, and no public
enumeration. Operator actions require assignment, capability, MFA, reason,
fresh version, and append-only audit. Suspicious report bursts and conflicting
provider digests alert security/privacy review without exposing reporter
identity to unrelated users.

## Observability, Performance, and SLO

Structured logs inherit BE00 fields: request ID, correlation ID, operation
ID, route, status, latency, actor hash, acting-party hash, target kind/hash,
authority source/version hash, idempotency outcome, ETag outcome, job/event
ID, and error code. They exclude normalized/raw values, evidence refs,
provider payloads, legal text, successor IDs, and signed URLs.

Metrics:

- identity_identifier_claim_total{namespace,state,provenance}
- identity_identifier_verification_latency_ms and
  identity_identifier_verification_delayed_total
- identity_identifier_collision_open_total
- identity_memorial_report_total{outcome} and
  identity_memorial_review_latency_ms
- identity_memorial_authority_revocation_lag_ms
- identity_estate_representation_total{state}
- identity_authorization_denied_total{operation,reason}
- identity_evidence_access_denied_total
- inherited outbox/job lag, retry, and DLQ metrics.

Trace spans include only opaque IDs/hashes and contract versions. Alerts fire
on collision growth, false-report bursts, review-age breach, revocation lag,
DLQ entries, outbox lag, repeated RLS denial, and provider outage. Sentry
events use the same redaction policy.

Tier 1 reads target p95 <750 ms; Tier 2 commands p95 <1200 ms; asynchronous
acknowledgements p95 <1000 ms. Normal verification and authority-revocation
jobs target completion under five minutes; provider outage is represented as
delayed/unknown and excluded from a false-success SLO. Body, object, JSON
depth, array, string, header, cursor, and deadline limits are exactly BE00.

## Tests and Acceptance Matrix

Contract tests assert strict unknown-key rejection, every scalar bound, NFC/
control handling, registry lookup, evidence-ref ownership, null ceiling
meaning no authority, and response redaction. Every protected route tests
anonymous, wrong valid user, wrong party, wrong resource, expired/revoked
relationship, stale version, and overdisclosure.

| Test class | Required assertions |
|---|---|
| IDA-15 | Claim starts self_asserted; namespace/capacity/value/provenance checked; healthy adapter transitions; outage delays; stale provider result cannot downgrade; same-party duplicate and cross-party collision are deterministic. |
| IDA-16 | Open collision blocks every member; withdrawal and registry evidence are the only resolutions; at most one eligible claim; no guessed winner; competing locks return typed conflict. |
| IDA-17 | One active nomination per nominator; replacement supersedes atomically; private read; self-only while alive; death does not activate successor or permit deceased action. |
| IDA-18 | Report has no public effect; evidence protected; one reviewer decision wins; verified lifecycle/outbox/session revocation; rejected/contested behavior; reversal runbook preserves original evidence. |
| Estate | Verified case prerequisite; legal policy and evidence required; scope/term/territory/activity/communication/ceiling enforced; 01c handoff atomic; expiry/revoke terminal; no ownership/payment/deceased impersonation. |
| Protocol | Idempotent replay, mismatched key, concurrent ETag, missing/malformed ETag, bounded errors, no-store, Location, safe headers, and request hash canonicalization. |
| RLS/grants | Direct anonymous/authenticated/service reads and writes denied; named RPC checks actor/party/capability; operator assignment/MFA/reason; worker lease token. |
| Jobs/events | Retry/backoff/DLQ, unknown schema, duplicate event, outbox failure rollback, restore epoch, consumer stale-version fail closed, no PII payload. |
| Abuse/privacy | Rate bucket boundaries, confusable values, report burst, provider digest conflict, no case/collision/evidence enumeration, log/Sentry/trace redaction, legal hold. |
| Performance/recovery | Tier 1/Tier 2/asynchronous budgets under load; provider outage; database failover; queue drain; projection rebuild; migration rollback/forward compatibility. |

Unit tests use no live network. Adapter, Storage, 01c, and downstream
boundaries use contract fakes with deterministic timeout, stale, duplicate,
and malformed responses. Synthetic identifiers and evidence objects only.

## Cross-Reference Traceability

| Requirement | Endpoint/table/event/test |
|---|---|
| IDA-15 record and verify | IDL-API-01/03/04; party_identifier_claim and attempt support record; identity.identifier.changed.v1; IDA-15 tests. |
| IDA-16 hold and resolve | IDL-API-04/05; collision/member tables; identifier event; collision/concurrency tests. |
| IDA-17 nomination | IDL-API-06/07/08; legacy_nomination; private nomination event; nomination/lifecycle tests. |
| IDA-18 report/review | IDL-API-09/10/11; case/report/decision tables; memorialised event; review/reversal tests. |
| Estate authority | IDL-API-12/13/14/15; representation/review tables; relationship event; scope/handoff tests. |
| BE00 mechanics | Every command header/RPC/error/job/audit/outbox/log rule; protocol/RLS/job tests. |
| Shard22 | identity.identifier.changed.v1; verified destination/party lookup; asserted/collision routing block; distribution contract tests. |
| Shard30 | identity.relationship.changed.v1; principal/delegate and source-version lookup; no generic-capability inference; authority contract tests. |
| Shard39 | identifier/memorial events and canonical lookup; one-subject binding and merge/split quarantine; binding contract tests. |

## Deepening Passes and Ambiguity Gate

| Pass | Result and concrete evidence |
|---|---|
| 1 Consistency | PASS — endpoint registry, Zod enums, DB checks, state machines, events, and IA names agree. |
| 2 Concurrency | PASS — every mutable command has ETag/CAS; claim/collision/person/case/representation locks; idempotency replay and one-winner rules are explicit. |
| 3 Failure cascade | PASS — provider, Storage, RPC, audit/outbox, queue, restore, stale consumer, false-report, and evidence-hold cascades preserve canonical state and provenance. |
| 4 Authorization | PASS — role × operation matrix covers anonymous, self, org mandate, estate, operator, support, and service principal; exact source/version/scope checks are required. |
| 5 Observability | PASS — redacted log fields, metric names, traces, alerts, Sentry, request/correlation/job identifiers, and no-PII rules are stated. |
| 6 Rate/abuse | PASS — per-operation actor/party/target/IP buckets, bounded headers, confusable checks, no enumeration, no auto-merge, and operator controls are stated. |
| 7 Partial state | PASS — each cross-system handoff has atomic RPC or pending/retry state; no silent compensation or false success. |
| 8 Schema evolution | PASS — versioned PlatformEvent, contract version in hashes, append-only support records, migration/RLS gate, and unknown-schema DLQ inherit BE00. |
| 9 Recovery/degraded mode | PASS — delayed provider, queue/DLQ, restore epoch, legal hold, session lag, projection replay, and runbook-only reversal are specified. |
| 10 Two-implementer/devil advocate | PASS — route inventory, closed state/error enums, field constraints, authority algorithm, ownership boundary, and event payloads are deterministic. |

## Ambiguity Gate

**PASS.** Implementer simulation and devil's-advocate review covered IDL-API-01 through IDL-API-15, strict request and success schemas, per-operation middleware and CORS, BE00 ApiError envelopes, authorization concealment, idempotency and concurrency, typed persistence, state recovery, integration boundaries, observability, tests, and source reconciliation. No unresolved implementation ambiguity remains; open questions are none.

## Open Questions

No unresolved product decision remains in this split. Explicit readiness gates,
not hidden assumptions: configured namespace/capacity and reason-code
registries must exist before enablement; counsel must publish a versioned
evidence verification/retention policy before memorial verification or estate
activation; 01b/01c must expose the named lifecycle and relationship RPC
contracts before implementation; and provider adapters may leave verification
delayed without changing local truth. Public memorial projection, commercial
ownership, payment routing, and probate outcomes remain downstream product
decisions and are intentionally not made here.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-28 | Replaced the Shard 01d stub with a complete BE contract for IDA-15–IDA-18: source map, 15-route registry, strict Zod contracts, protected evidence and estate scope, RLS/grants, state/concurrency rules, jobs/events, failure cascades, abuse/SLO/observability, tests, traceability, and ten deepening passes. Corrected consumer references to Shards 22, 30, and 39. | /write-be-spec-write | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
