# BE 08b — Union and performer session reporting

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 08 — Credit reporting, exchange and disclosure | 08b — Union reporting | CXR-06 and CXR-07; approved US form-profile mapping, draft report assembly, human certification and evidence retention. Automated filing/submission is disabled. |

## Classification

This companion assembles a reviewable union or performer session report from immutable session and credit facts. It stores human-entered membership, jurisdiction, rates and classification declarations without inferring them from attendance, role, party or credit data. CXR-06 is a draft command; CXR-07 signs an exact rendered artifact. Neither command submits a filing or changes union status.

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CXR-06 Prepare union session report | CXR-08B-01 | Gated draft-assembly command | Reporting-authorized session user maps captured facts to an approved profile and receives a draft or blocked report with missing declarations. |
| CXR-07 Certify union report | CXR-08B-02 | Human certification command | Authorized signer acknowledges consequences and signs a pinned artifact; certification evidence is retained without asserting provider submission. |

The following boundaries are explicit:

- Feature 02.07 is a Won't/deferred ledger item. Draft assembly and reusable data capture remain specified, but no production filing, submission, membership assertion or institutional/legal claim ships.
- BE00 owns request context, error envelope, idempotency, queue, audit and storage. BE01 owns party, authority and signer identity. BE07b owns session, roll, contribution and attendance facts. This companion consumes purpose projections only.
- 08a owns generic artifacts, portability and recipient emissions. 08b may reference an artifact but does not duplicate generic export or delivery routes.
- 08c owns gear linkage and 08d owns AI disclosure. Union reports may carry explicitly declared disclosure references but never infer or own those domains.

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | title, overview and scope reconciliation lines 1-24 | Establishes report assembly, no inferred membership, deferred union boundary and no canonical mutation. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | features and delivery phases lines 25-38 | Defines 02.07, draft-only later activation and explicitly disabled automated submission. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | acceptance criteria lines 40-48 | Supplies CXR-06 and CXR-07 preconditions, human declarations, consequence acknowledgement, profile gates and source-stale behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | interactions and global rules lines 57-82 | Supplies exact CXR-06 and CXR-07 IDs, immutable source/version and no-inference rules. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | core types and errors lines 84-95 | Defines ArtifactState and StandardError values used for draft and certification failures. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | union contracts lines 107-118 | Defines BuildUnionReport and CertifyUnionReport, human confirmation and no-submission invariants. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | data models and typed registry lines 119-165 | Defines union_form_profile and union_report fields, cardinalities and deterministic types. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | access control and escalation lines 166-187 | Defines reporting-admin, operator/room, signer and system-worker permissions and prohibitions. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | accessibility lines 188-195 | Requires consequence disclosure, semantic report status, readable artifacts and accessible retry behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | event schemas lines 197-208 | Defines credit.union-report.changed.v1 and privacy exclusions. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | edge cases and coverage matrix lines 210-249 | Supplies profile/rate change, adapter outage, source revocation, signature conflict and deletion outcomes. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | cross-shard dependencies and contract map lines 251-267 | Establishes BE00, BE01 and BE07 inputs and confirms no filing dependency is active. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | changelog and dependencies lines 269-295 | Records deferred submission and locked report boundaries. No deep-dive file is required; scope line 23 and Deep Dives Needed lines 258-260 say none. |
| .memory/wiki/specs/feature-ledger.md | row 692 | 02.07 Union and Performer Session Reporting is a Won't/deferred surface row mapped to this IA shard. |
| .memory/wiki/specs/be/00-infrastructure.md | API Endpoints line 67; Database Schema line 202; Middleware and Policies line 253; Data Flow line 298 | Inherits platform envelopes, idempotency, audit, queue and RLS/grant rules. |
| .memory/wiki/specs/be/07b-session-capture-offline.md | API Endpoints line 105; Database Schema line 277; Data Flow line 336; Event Schemas line 370 | Consumes immutable session, contribution and attendance projections with source versions. |

## IA Source Map

The parent IA field registry is retained for companion reconciliation: scope_detail?, tool_name?, tool_version?, model_name? and subject_is_own_model? are exact optional AI Disclosure Entry V1 JSON keys owned by 08d, not fields of 08b.

### Interaction map

| IA interaction | Backend operation | Owned command and invariant | Source trace |
|---|---|---|---|
| CXR-06 Prepare union session report | CXR-08B-01 | Map captured facts to an approved profile, expose missing human declarations and remain draft or blocked while the gate is disabled. | Parent IA acceptance line 47 and interaction line 66; union contract line 111. |
| CXR-07 Certify union report | CXR-08B-02 | Render exact pinned artifact, collect human signer confirmation and retain signature evidence without submitting. | Parent IA acceptance line 48 and interaction line 67; union contract line 112. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| union_form_profile | CXR-08B-01 and CXR-08B-02 | Approved US form/version, field mappings, declarations, effective interval and gate state. | Parent IA line 128; typed registry line 158. |
| union_report | CXR-08B-01 and CXR-08B-02 | Session/profile mappings, human declarations, artifact, signer, certification and disabled submission state. | Parent IA line 129; typed registry line 159. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.union-report.changed.v1 | CXR-08B-01 and CXR-08B-02 | Report, session, profile, state, artifact and version for the authorized reporting workspace. | Parent IA line 204 and event schema line 197. |

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.07 | Union and Performer Session Reporting | CXR-08B-01 and CXR-08B-02 | Draft-only form mapping, human declarations, exact signer evidence and explicit no-submission gate. |

Source trace: feature-ledger.md row 692 marks 02.07 as Won't and maps it to 08-credit-reporting-disclosure. This backend preserves reusable draft capture while keeping filing and submission disabled.

## Endpoint Completeness Reconciliation

Each owned interaction has one stable operation ID, one route registry row, one strict request and success schema, one error row, one authorization row, one idempotency/rate rule, one observability row and one test row. CXR-08B-01 never certifies or submits. CXR-08B-02 signs only the exact pinned artifact and cannot create a submitted state.

| Interaction | Request and success | Persistence effect | External effect |
|---|---|---|---|
| CXR-06 | BuildUnionReportRequest to BuildUnionReportResponse | Insert or CAS update union_report draft, missing declarations and audit/outbox. | Read approved profile and immutable session projections only. |
| CXR-07 | CertifyUnionReportRequest to CertifyUnionReportResponse | Lock report, retain signer/consequence evidence and seal certification artifact reference. | No filing call; disabled gate records no-submission outcome. |

## Shared Contract Inheritance

- BE00 request envelope carries requestId, authenticated session or service principal, acting context, locale, schema version and trace context.
- Success envelope is data, requestId and schemaVersion. Errors use exactly ApiError { code, message, requestId, details } for every 4xx and 5xx.
- Idempotency-Key binds actor, route, normalized input hash and schema version. Same key and hash returns the first result; a changed payload returns IDEMPOTENCY_MISMATCH with no second signature.
- expectedVersion and sourceSnapshotHash are required on state-changing commands. CAS losers return VERSION_CONFLICT.
- RLS exposes only the reporting purpose projection. Membership, rates, union identifiers, signer evidence and private declarations never enter a public event or generic artifact route.
- Submission status is always not_submitted or disabled until a separately approved institutional/legal gate and delivery adapter exist.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CXR-08B-01 | CXR-06 Prepare union session report | POST /api/v1/union/reports | Reporting-authorized session operator or approved reporting administrator; target session scope required | BuildUnionReportRequest | BuildUnionReportResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 10/day per operator and 60/day per session | CORS first-party staff allowlist with credentials; BE00 context, CSRF, strict Zod, session/profile scope, gate, rate, queue and ApiError normalization |
| CXR-08B-02 | CXR-07 Certify union report | POST /api/v1/union/reports/{reportId}/certify | Named human signer with report signing capability and session/report scope; no worker or support override | CertifyUnionReportRequest | CertifyUnionReportResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 3/day per signer and 10/day per report | CORS first-party staff allowlist with credentials; BE00 context, CSRF, strict Zod, report CAS, signer step-up, consequence acknowledgement, rate and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details }; details contain field paths, opaque IDs, state and retry metadata only.
- 403 means a visible session/report exists but the actor lacks reporting or signer authority. 404 means RLS hides the session/report/profile or the opaque ID is absent. A disabled feature gate is a typed 422 or 503, never a successful submission.
- 409 means idempotency mismatch, stale source/profile/report version or duplicate certification. 422 means missing human declarations, unsupported profile, unacknowledged consequence disclosure or invalid signer assertion. 503 means profile or source reads remain unavailable after bounded retry.
- Certification is a local evidence state. It never implies correctness, union membership, provider acceptance or filing submission.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CXR-08B-01 | BuildUnionReportRequest to BuildUnionReportResponse with report, profile version, field mappings, human-declaration gaps, artifact state and not-submitted gate. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-reporting scope; SESSION_OR_PROFILE_NOT_FOUND 404; VERSION_CONFLICT 409; PROFILE_UNAVAILABLE or HUMAN_DECLARATION_REQUIRED 422; SOURCE_UNAVAILABLE 503. |
| CXR-08B-02 | CertifyUnionReportRequest to CertifyUnionReportResponse with signed artifact, signer evidence, source versions and certification state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-signer; REPORT_NOT_FOUND 404; VERSION_CONFLICT or ALREADY_CERTIFIED 409; CONSEQUENCE_ACK_REQUIRED, DECLARATION_INVALID or SUBMISSION_DISABLED 422; ARTIFACT_UNAVAILABLE 503. |

### Route field validation matrix

| Operation ID | Required validation | Success assertion |
|---|---|---|
| CXR-08B-01 | Approved effective profile, eligible session scope, source versions and bounded human-declaration fields; no inferred membership/rate/classification. | Report remains draft or blocked, every missing declaration is addressable and no submission route is reachable. |
| CXR-08B-02 | Exact report artifact, pinned source versions, signer authority, membership/jurisdiction/rate confirmation and explicit consequence acknowledgement. | Signature binds exactly one artifact/version and submissionState remains not_submitted or disabled. |

## Request/Response Contracts (Zod 4 schemas)

~~~ts
import { z } from "zod";

export const ApiError = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), z.json()),
});

const Id = z.uuid();
const Version = z.number().int().nonnegative();
const DateTime = z.iso.datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const GateState = z.enum(["draft_enabled", "draft_only", "disabled"]);
const ReportState = z.enum(["draft", "validating", "blocked", "certified", "stale"]);

const Declaration = z.strictObject({
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(500),
  source: z.enum(["human_entered", "human_confirmed"]),
});

export const BuildUnionReportRequest = z.strictObject({
  sessionId: Id,
  formProfileId: Id,
  formProfileVersion: z.string().min(1).max(80),
  sourceSnapshotVersion: Version,
  declarations: z.array(Declaration).max(500),
  actingContextVersion: Version,
  expectedVersion: Version,
});

export const BuildUnionReportResponse = z.strictObject({
  reportId: Id,
  sessionId: Id,
  profileVersion: z.string().min(1),
  state: ReportState,
  gateState: GateState,
  sourceVersions: z.array(z.strictObject({ objectRef: Id, version: Version })).max(5000),
  missingDeclarations: z.array(z.string().min(1).max(120)).max(500),
  derivedFields: z.array(z.strictObject({ key: z.string().min(1), value: z.string().min(1) })).max(500),
  submissionState: z.literal("not_submitted"),
  artifactId: Id.optional(),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const CertifyUnionReportRequest = z.strictObject({
  reportId: Id,
  artifactId: Id,
  reportVersion: Version,
  sourceSnapshotHash: Hash,
  membershipConfirmed: z.literal(true),
  jurisdictionConfirmed: z.literal(true),
  ratesConfirmed: z.literal(true),
  fieldsConfirmed: z.literal(true),
  consequenceDisclosureAcknowledged: z.literal(true),
  signerPartyId: Id,
  signerContextVersion: Version,
  signatureEvidenceRef: Id,
  expectedVersion: Version,
});

export const CertifyUnionReportResponse = z.strictObject({
  reportId: Id,
  artifactId: Id,
  state: z.literal("certified"),
  signerPartyId: Id,
  sourceSnapshotHash: Hash,
  certifiedAt: DateTime,
  signatureEvidenceRef: Id,
  submissionState: z.literal("not_submitted"),
  providerAcceptance: z.literal("not_attempted"),
  requestId: Id,
  schemaVersion: z.string().min(1),
});
~~~

Headers are inherited from BE00: X-Request-Id, Idempotency-Key, Content-Type application/json, schema version and trace context. Unknown JSON keys, malformed UUIDs, uncontrolled declaration lengths and false confirmation literals are rejected before persistence. Responses redact union identifiers and private signer evidence from unauthorized projections.

## Database Schema

The two tables below are the complete 08b persistence set. Session, performer, party and artifact records are purpose-scoped opaque references; no union membership, rate or classification is copied from a source domain. Supabase PostgreSQL RLS is enabled for both tables.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| union_form_profile | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; organization text NOT NULL CHECK char_length <= 160; form_key text NOT NULL; form_version text NOT NULL; field_mappings jsonb NOT NULL CHECK jsonb_typeof(field_mappings) = object; required_declarations jsonb NOT NULL CHECK jsonb_typeof(required_declarations) = array; effective_from timestamptz NOT NULL; effective_until timestamptz NULL CHECK effective_until > effective_from; approval_state text NOT NULL CHECK approved, draft or revoked; gate_state text NOT NULL CHECK draft_enabled, draft_only or disabled; source_evidence_ref uuid NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | No cross-domain FK; source evidence is a BE00 opaque ref. UNIQUE organization, form_key, form_version; indexes approval_state, gate_state, effective_from, effective_until, owner_id. | RLS permits approved profile read to reporting service and assigned admin; only svc_union_profile writes; no client table grant; revoked profiles disappear from new drafts. |
| union_report | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; session_ref uuid NOT NULL; form_profile_id uuid NOT NULL; form_profile_version text NOT NULL; performer_mappings jsonb NOT NULL CHECK jsonb_typeof(performer_mappings) = array; declarations jsonb NOT NULL CHECK jsonb_typeof(declarations) = array; missing_declarations jsonb NOT NULL DEFAULT []; source_versions jsonb NOT NULL CHECK jsonb_typeof(source_versions) = array; artifact_ref uuid NULL; signer_party_ref uuid NULL; signer_context_version bigint NULL CHECK signer_context_version > 0; signature_evidence_ref uuid NULL; state text NOT NULL CHECK draft, validating, blocked, certified or stale; submission_state text NOT NULL CHECK not_submitted or disabled; provider_acceptance text NOT NULL CHECK not_attempted; consequence_acknowledged boolean NOT NULL DEFAULT false; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | form_profile_id FK to union_form_profile.id ON DELETE RESTRICT; session, performer, party, artifact and evidence refs are BE07b/BE01/08a opaque refs. UNIQUE session_ref, form_profile_id, form_profile_version, owner_id; indexes owner_id, session_ref, state, form_profile_id, artifact_ref, signer_party_ref, updated_at DESC. | RLS permits reporting owner, assigned reporting admin and named signer minimum fields; declarations and signature evidence use purpose views; svc_union_report writes; no direct client table grant. |

### Persistence invariants

- union_form_profile changes create a new version. A revoked or expired profile cannot be used for a new draft.
- union_report stores source versions and human declarations separately. Derived mappings are labeled derived and never become membership, rate or classification assertions.
- A report can be certified only when the rendered artifact hash and all source versions match the request. A profile or rate change makes the old report immutable and requires a new draft.
- submission_state remains not_submitted or disabled. There is no local submitted transition, provider receipt or automatic filing worker.
- Signature evidence is append-only and purpose-scoped. Erasure redacts private evidence while retaining a non-PII certification tombstone.

## Middleware & Policies

### Hono middleware order

1. HTTPS, body-size and declaration-count limits: JSON body 256 KiB and 500 declaration maximum.
2. CORS first-party staff allowlist with credentials; no wildcard credential policy.
3. Request ID and trace context validation.
4. BE00 authentication, acting-context and CSRF verification; step-up is required for certification.
5. Strict Zod 4 parsing and cross-field checks for profile state, confirmations and source versions.
6. BE01 authority resolution and BE07b session/reporting projection with existence-safe 403 versus 404 behavior.
7. Idempotency and numeric rate reservation.
8. Transactional CAS, source recheck, artifact hash verification and audit/outbox write.
9. Response redaction and structured observability.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CXR-08B-01 | Reporting-authorized session operator or reporting administrator | Session scope, approved profile, effective gate and source projection | Lock report key; recheck profile and session versions | Hidden session/profile is 404; visible session without reporting scope is 403. |
| CXR-08B-02 | Named human signer | Report owner or assigned signing scope, exact artifact and declaration set | Lock report and artifact; recheck source hash, signer authority and gate | Hidden report/artifact is 404; non-signer or disabled certification scope is 403. |

### Security and abuse controls

- Membership, jurisdiction, rates and classifications are explicit human declarations. No attendance, role, party, location or credit field can auto-fill a declaration as confirmed.
- Consequence disclosure appears before signature, is included in the signer evidence hash and cannot be acknowledged by a service worker.
- Reporting admins may manage profiles but cannot edit source credits or certify a report without signer capability. Support has no override.
- Form profile files are treated as untrusted input: bounded fields, approved version, no executable templates, no remote includes and checksum validation.
- Logs contain report/profile/session opaque IDs, state, gate and timing class only. Union identifiers, rates, membership and private declarations are excluded.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CXR-08B-01 | Approved form-profile registry | profileId, profileVersion, locale, requestedAt | exact form version, fieldMappings, requiredDeclarations, effective interval, approvalState, gateState | 1,000 ms; 3 read retries at 100/500/1,500 ms; circuit opens after 5 failures in 60 seconds; no draft uses a default profile. |
| CXR-08B-01, CXR-08B-02 | BE07b session and performer projection | sessionId, requestedSourceVersion, purpose, performerRefs | sessionVersion, performerMappings, contributionRefs, declared facts, sourceState | 2,000 ms; 2 safe read retries at 100/500 ms; circuit 5/60 seconds; unknown source blocks report and never fabricates facts. |
| CXR-08B-02 | Signer evidence service | reportId, artifactId, sourceSnapshotHash, signerPartyRef, consequenceHash, signatureEvidenceRef | signerReceipt, acceptedReportVersion, evidenceRef, occurredAt | 2,000 ms; 2 retries at 250/1,000 ms with the same key; circuit 5/60 seconds; unknown receipt leaves report pending and unsigned. |
| CXR-08B-02 | Institutional submission gate | reportId, profileVersion, certificationEvidenceRef, submissionIntent | gateState disabled, submissionState not_submitted, providerCall not_attempted | 1,000 ms; no external submission retry; circuit remains closed because the route is disabled; any attempted call is rejected before network effect. |

All seams carry requestId and idempotency key. A source/profile timeout after local draft commit leaves the report draft or blocked and is reconciled by source version; no timeout creates a certified or submitted state.

### State machines and concurrency

- union_form_profile: draft -> approved -> revoked. Effective interval and gate state are versioned; a new profile never rewrites historical reports.
- union_report: draft -> validating -> blocked or certified; source/profile changes move a draft or certified report to stale and require a new draft. There is no submitted state.
- Two identical command keys serialize. Same key and hash returns the original report; changed payload returns IDEMPOTENCY_MISMATCH. Competing expected versions return VERSION_CONFLICT.
- Certification locks report and artifact, rechecks source versions and signer authority, then writes signature evidence and outbox atomically. A second signer cannot overwrite the first.

### Failure recovery

- Profile unavailable returns PROFILE_UNAVAILABLE and leaves the request draft or blocked. No unapproved profile is substituted.
- Source session changes between draft and certification return SOURCE_STALE or VERSION_CONFLICT; the signature is refused and the old artifact remains immutable.
- Signature evidence provider timeout leaves certification pending, retries by key and never writes certified without evidence.
- Feature or institutional gate disabled returns SUBMISSION_DISABLED; no provider submission attempt is made.
- Owner deletion or signer revocation removes derived access, redacts private declarations/evidence under retention policy and retains a non-PII audit tombstone.

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery rule |
|---|---|---|
| credit.union-report.changed.v1 | eventId, reportId, sessionRef, profileVersion, state, artifactRef, sourceVersions, submissionState, version, occurredAt | Authorized reporting workspace only; no union identifiers, rates, membership, private declarations or artifact contents. |

~~~ts
export const UnionReportChangedEvent = z.strictObject({
  eventId: z.uuid(),
  reportId: z.uuid(),
  sessionRef: z.uuid(),
  profileVersion: z.string().min(1),
  state: z.enum(["draft", "validating", "blocked", "certified", "stale"]),
  artifactRef: z.uuid().optional(),
  sourceVersions: z.array(z.strictObject({ objectRef: z.uuid(), version: z.number().int().positive() })).max(5000),
  submissionState: z.enum(["not_submitted", "disabled"]),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime({ offset: true }),
});
~~~

The transactional outbox publishes only after the report/signature commit. Consumers refetch purpose-authorized projections and treat submissionState as a hard no-filing signal.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | UNAUTHENTICATED or INVALID_REQUEST | Reject before database/provider effect; retain requestId. |
| Session/report/profile scope | FORBIDDEN or 404 | Do not disclose hidden sessions, profile existence or report contents. |
| Gate or human declaration | SUBMISSION_DISABLED, PROFILE_UNAVAILABLE or HUMAN_DECLARATION_REQUIRED | Preserve draft, show direct remediation and never infer a value. |
| CAS, idempotency or source version | IDEMPOTENCY_MISMATCH, VERSION_CONFLICT or SOURCE_STALE | Return safe current version and require explicit re-review. |
| Signer evidence or artifact | ARTIFACT_UNAVAILABLE or SIGNATURE_PENDING | Keep report unsigned and retry by idempotency key. |
| Retention or revocation | ACCESS_REVOKED | Remove derived access and preserve a minimal certification tombstone. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CXR-08B-01 | Unknown profile, hidden session, unsupported field mapping, non-reporting actor or missing declaration is rejected. | Same key collapses; profile/source outage leaves draft or blocked; deletion revokes derived report access. |
| CXR-08B-02 | Non-signer, stale artifact, missing consequence acknowledgement or unconfirmed declaration is rejected. | Signer CAS allows one evidence chain; timeout leaves pending; signer revocation prevents later access without rewriting the report. |

## Observability

| Operation ID | Audit event and metrics | Safe trace fields and alert |
|---|---|---|
| CXR-08B-01 | union.report.draft, union_draft_total, profile_gate_block_total, source_projection_latency_ms | requestId, reportId, sessionRef hash, profileVersion, gateState, missingCount; alert on profile outage and inferred-declaration invariant breach. |
| CXR-08B-02 | union.report.certified, union_certification_total, signature_pending_total, source_stale_total | requestId, reportId, artifactId, signerRef hash, state and evidence presence; alert on any submission attempt or signature without pinned hash. |

Structured logs exclude union identifiers, rates, membership, declarations, signature bytes and provider secrets. provider-native diagnostic sinks receive only opaque refs and redacted error codes.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CXR-08B-01 | Parse strict request/response; reject unknown profile, hidden session, non-reporting actor and inferred confirmation; verify 403 versus 404; replay idempotency; assert no submitted state. |
| CXR-08B-02 | Require all confirmations and consequence acknowledgement; reject non-signer and stale artifact; verify signature evidence and 403 versus 404; assert no network submission call. |

### Persistence, concurrency and recovery tests

- Migration tests assert both tables, SQL types, nullability, checks, FK, indexes, RLS policies and grants.
- Property tests generate unknown keys, oversized declarations, stale profile intervals, false literals and malformed hashes.
- Concurrency tests race two drafts, two signers, source-version changes, profile revocation and same-key different-body commands.
- Security tests prove rates, membership, union identifiers, private declarations and signature evidence never enter public projections or events.
- Gate tests prove no code path can write submitted or provider-accepted status while the institutional/legal gate is disabled.
- Accessibility tests verify consequence disclosure before commit, semantic draft/blocked/certified states, keyboard review and persistent retry routes.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | CXR-06 and CXR-07 have strict schemas, status/error mapping, idempotency and numeric rates. |
| Human declaration pass | Membership, jurisdiction, rates and classifications are explicit human inputs and never inferred. |
| Persistence pass | Both IA models have typed SQL fields, constraints, FKs or opaque-ref rationale, indexes, RLS and grants. |
| State/recovery pass | Draft, blocked, stale and certified states, signer CAS, profile outage and disabled submission are explicit. |
| Adversarial pass | Hidden sessions, non-signer access, stale artifacts, replay, declaration leakage and provider timeout are covered. |
| Macro boundary pass | BE00, BE01 and BE07b are consumed by projection; 08a generic artifact routes are not duplicated; filing remains disabled. |
| Auditability pass | Source inventory, exact source-map IDs, route registry, per-operation matrices, event payload, tests and links reconcile. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/08-credit-reporting-disclosure.md and it requires no deep-dive file. CXR-06 and CXR-07 have one owner and one operation. Deferred Won't feature status, draft-only behavior, human membership/rate/classification declarations, profile effective versions, signer evidence, consequence acknowledgement, no-submission state, 403 versus 404, idempotency, numeric rates, CORS, ApiError, external timeout/retry/circuit budgets, RLS, grants, deletion and stale recovery are resolved. No route duplicates BE00, 08a, 08c or 08d. All Markdown tables have matching widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Classified and authored draft union report and human certification backend contracts from canonical Shard 08 IA. | /write-be-spec | All |
| 2026-08-28 | Locked deferred submission, typed persistence, signer evidence, route matrices and ambiguity evidence. | /write-be-spec-write | API, Contracts, Database, Middleware, Data Flow, Tests |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01b — Party identity and aliases](01b-party-identity-aliases.md)
- [BE07b — Session capture and offline](07b-session-capture-offline.md)
- [BE08a — Portability and DDEX/RIN emission](08a-portability-ddex-emission.md)
- [IA Shard 08 — Credit reporting, exchange and disclosure](../ia/08-credit-reporting-disclosure.md)
