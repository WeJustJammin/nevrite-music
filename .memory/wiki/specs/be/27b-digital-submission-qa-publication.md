# BE-27b — Digital Submission, QA, Review, and Publication

## Classification

This companion is the backend contract for the content admission and publication boundary of IA shard 27. It classifies 27.05–27.09 as authenticated vendor submission, deterministic artifact QA, audio/content QC, high-risk human review, and publication commands. It owns VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, and publication handoff records. It consumes DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, and vendor continuity facts from 27a; it does not issue entitlements, deliver bytes, adjudicate ownership, or run an activation server.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 27.05 Submit vendor artifact; 27.06 Run deterministic artifact QA; 27.07 Run audio/content QC; 27.08 Review high-risk submission; 27.09 Publish product/version | Catalog/compatibility 27a; entitlement/library/delivery 27c; updates/assets/trials 27d; enforcement/retirement/portability 27e |
| Submission authority | Immutable artifact master/digest, manifest, source/AI declarations, attestation, demos, terms version, and continuity requirements | Payment, purchaser/holder, delivery grant, machine activation, ownership, or rights adjudication |
| QA authority | Deterministic archive/build/audio contradictions block the specific scope; uncertain extraction is a signal; exact match/named third-party recording enters human review | QA never asserts safe, rights verified, legal clearance, or universal compatibility |
| Publication authority | Atomic product/version, artifact, terms, attestation, QA/review, vendor snapshot, payout-ready, and outbox handoff | Executable plugins remain launch-disabled until separate sandbox/liability/staged-rollout/vendor gates pass |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, immutable object storage, transactional audit/outbox, forced RLS, structured logs, and provider-native diagnostics-compatible telemetry. A correction creates a new immutable submission/version; no prior artifact master, QA decision, review decision, or terms version is edited in place.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 24–40 | Product model, creator-content launch, executable exclusion, vendor identity, QA authority, compatibility, terms, and continuity decisions | Classification, state machine, and publication rules preserve these locks |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 77–90 | Interaction definitions 27.05–27.09 and outcomes/failures | One operation ID maps to each assigned interaction |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 108–120 | SubmitProductVersion, ResolveSubmissionReview, and adjacent command contracts | Request schemas preserve artifacts, attestations, evidence, review, terms, and continuity fields |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 130–146 | VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, VendorContinuityManifest, and all downstream models | Model inventory and persistence mapping distinguish owned versus consumed models |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 148–167 | Typed fields/cardinality and immutable model rules | Persistence rows use explicit SQL types, nullability, constraints, FKs, indexes, RLS, and grants |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 208–225 | Exact Event Schemas and privacy rule | Event inventory uses every literal type and redacts identity, keys, bytes, and URLs |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 14–20 | Submission and QA algorithm: authority, schema, atomic artifact binding, contradiction block, human review, publish | State and test matrices make each gate explicit |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 47–52 | Content-first admission, complete-duration audition, pack/file grain, executable prerequisites | Publication contracts enforce content-specific admission and executable disablement |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 118–131 | Executable launch, rig advisory, activation, freeware/trial, watermark, high-risk review, malicious/rights removal, continuity | Review/publication and dependency references preserve downstream locks |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 105–110 | Payment/retry, withdrawal/update, vendor exit, and metadata race rules | Concurrency/recovery matrix prevents stale or unsafe publication |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 conventions and ApiError { code, message, requestId, details } | Every request, success, and error contract cites the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, CORS, rate, idempotency, audit/outbox, RLS, grants, and provider callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Person/org acting-party authority and organization control | Vendor identity remains canonical and private |
| BE marketplace | .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing/disclosure snapshot and publication handoff | Publication does not rewrite marketplace disclosure authority |
| BE adjacent | .memory/wiki/specs/be/27a-digital-product-catalog-compatibility.md, 27c-digital-entitlements-library-delivery.md, 27d-digital-updates-assets-trials.md, 27e-digital-enforcement-retirement-portability.md | Catalog producer and downstream entitlement/delivery/update/enforcement consumers | Dependency references identify producer/consumer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 27.05 | Submit vendor artifact | BE27B-DCD05 | Current vendor/schema/terms/continuity gate and immutable artifact digest commit atomically |
| 27.06 | Run deterministic artifact QA | BE27B-DCD06 | Manifest/archive/build/malware checks identify exact contradictions and actionable scope |
| 27.07 | Run audio/content QC | BE27B-DCD07 | Technical findings and match signals attach; only listing-lie contradictions block |
| 27.08 | Review high-risk submission | BE27B-DCD08 | Independent reviewer records scoped accept/reject/evidence request with reason, recusal, and appeal |
| 27.09 | Publish product/version | BE27B-DCD09 | Required demos, terms, payout, attestation, QA, review, artifact, and vendor snapshots publish atomically |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| VendorSubmission | Owned immutable vendor submission, declarations, artifact bindings, and state/version | platform_private.vendor_submissions |
| QaCheck | Owned deterministic or content-QC check scoped to artifact/product version | platform_private.digital_qa_checks |
| ReviewDecision | Owned high-risk reviewer decision, reason, evidence, recusal, and appealability | platform_private.digital_review_decisions |
| LicenceTermsVersion | Owned structured product-level terms version; immutable/tombstoned | platform_private.digital_licence_terms_versions |
| DigitalProduct | Consumed catalog aggregate from 27a | BE-27a |
| ProductVersion | Consumed immutable catalog version from 27a | BE-27a |
| CompatibilityMatrix | Consumed version facts; publication includes snapshot | BE-27a |
| DependencyEdge | Consumed version dependency graph; required unknown blocks completable claim | BE-27a |
| Entitlement | Consumed downstream issuance model | BE-27c |
| AcquisitionEpoch | Consumed downstream purchase/grant history | BE-27c |
| SeatAuthorization | Future gated and separate from publication | BE-27c/27d |
| ArtifactVersion | Owned-at-publication artifact revision handoff | platform_private.digital_artifact_versions |
| TransferGrant | Consumed delivery authorization from 27c | BE-27c |
| LibraryProjection | Consumed holder projection from 27c | BE-27c |
| DigitalAsset | Consumed/update-linked file/asset model from 27d | BE-27d |
| VendorContinuityManifest | Owned/validated continuity obligation snapshot | platform_private.vendor_continuity_manifests |

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| digital_product.version_submitted.v1 | Produced by BE27B-DCD05 | Product/version, artifact/attestation/schema IDs, vendor hash, state; no bytes or legal identity |
| digital_product.qa_completed.v1 | Produced by BE27B-DCD06/DCD07 | Check scopes/results, blocker counts, version; no safe/rights assertion |
| digital_product.published.v1 | Produced by BE27B-DCD09 | Product/version, terms/artifact/vendor snapshot hashes, occurredAt; no purchase or keys |
| digital_entitlement.issued.v1 | Consumed from 27c | Entitlement/epoch/version facts only |
| digital_entitlement.state_changed.v1 | Consumed from 27c/27e | Entitlement state/version only |
| digital_transfer.grant_created.v1 | Consumed from 27c | Artifact-bound grant and expiry only |
| digital_transfer.completed.v1 | Consumed from 27c | Range/hash completion only |
| digital_product.update_published.v1 | Consumed from 27d | Prior/new version and compatibility change facts |
| digital_artifact.withdrawn.v1 | Consumed from 27e | Scoped withdrawal reason and version |
| digital_asset.metadata_changed.v1 | Consumed from 27d | Asset metadata/version/confidence |
| digital_vendor.retired.v1 | Consumed from 27e | Vendor continuity/effective state |
| digital_enforcement.requested.v1 | Consumed from 27e | Enforcement case/reason hash only |

## Endpoint Reconciliation

BE-00 owns authentication/session, global errors, idempotency receipts, object evidence, audit/outbox, CORS, and configuration. BE-23/24 own person/org acting-party, provenance, and custody facts. BE-25b owns marketplace listing/disclosure snapshots. BE-27a owns product/type/version/catalog facts. BE-27c owns entitlement, library, transfer grants, and delivery; BE-27d owns updates/assets/trials; BE-27e owns enforcement, withdrawal, retirement, and portability. This companion owns the five routes for submission, QA, review, and publication. No route here issues a grant, charges a buyer, adjudicates rights, activates executable software, or writes an ownership/custody record.

QA says what it checked. Deterministic contradictions in declared facts versus artifact bytes block the scoped submission. Uncertain musical extraction, perceptual match, or source signal warns and preserves vendor assertion. Exact content match or named third-party recording creates a human-review hold. A reviewer decision is reasoned, scoped, appealable, and recusal-checked. Publication is atomic and never treats QA as legal clearance.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE27B-DCD05 | POST | /api/v1/digital/products/{productId}/submissions | 27.05 | SubmitProductVersion | 201 VendorSubmissionSuccess |
| BE27B-DCD06 | POST | /api/v1/digital/submissions/{submissionId}/artifact-qa | 27.06 | RunDeterministicArtifactQa | 200 ArtifactQaSuccess |
| BE27B-DCD07 | POST | /api/v1/digital/submissions/{submissionId}/content-qc | 27.07 | RunAudioContentQc | 200 ContentQcSuccess |
| BE27B-DCD08 | POST | /api/v1/digital/submissions/{submissionId}/reviews | 27.08 | ResolveSubmissionReview | 200 ReviewDecisionSuccess |
| BE27B-DCD09 | POST | /api/v1/digital/products/{productId}/publish | 27.09 | PublishProductVersion | 201 PublicationSuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase strings; dates are RFC 3339 UTC strings; digests are lowercase SHA-256. Unknown keys, unsafe text, mismatched artifact digests, missing declarations, unbounded file metadata, reviewer conflicts, missing evidence, and absent idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details }. Artifact bytes remain in protected object storage and are referenced by ID/hash.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const SafeCode = z.string().trim().regex(/^[A-Z0-9_:-]{2,80}$/);
const SafeText = z.string().trim().min(1).max(4000);
const ArtifactRef = z.object({
  objectId: Id,
  sha256: Hash,
  byteSize: z.number().int().positive().max(50000000000),
  mediaType: z.string().trim().regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/).max(120),
  role: z.enum(["master", "demo", "manifest", "source_declaration", "attestation"]),
}).strict();
const EvidenceRef = z.object({
  objectId: Id,
  sha256: Hash,
  kind: z.enum(["qa_output", "source_record", "match_signal", "review_note", "continuity_record"]),
  capturedAt: IsoDate,
}).strict();

const Gcf05Request = z.object({
  operationId: z.literal("BE27B-DCD05"),
  productId: Id,
  productVersionId: Id,
  schemaVersion: SafeCode,
  artifacts: z.array(ArtifactRef).min(1).max(100),
  manifestObjectId: Id,
  manifestSha256: Hash,
  sourceDeclarations: z.array(z.object({
    sourceCode: SafeCode,
    sourceType: z.enum(["vendor_owned", "licensed", "public_domain", "ai_assisted", "third_party"]),
    declaration: SafeText,
  }).strict()).max(100),
  aiDeclarations: z.array(z.object({
    toolCode: SafeCode,
    use: SafeText,
    outputScope: SafeText,
  }).strict()).max(30),
  attestations: z.array(z.object({
    attestationCode: SafeCode,
    actorPartyId: Id,
    statementHash: Hash,
  }).strict()).min(1).max(20),
  demoObjectIds: z.array(Id).max(20),
  termsVersionId: Id,
  continuityManifestId: Id,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf06Request = z.object({
  operationId: z.literal("BE27B-DCD06"),
  submissionId: Id,
  artifactId: Id,
  artifactSha256: Hash,
  checks: z.array(z.object({
    checkType: z.enum(["manifest", "archive", "malware", "build_reproducibility", "schema", "digest"]),
    scope: SafeCode,
    result: z.enum(["pass", "block", "warn", "unknown"]),
    findingCode: SafeCode.nullable(),
    evidence: z.array(EvidenceRef).max(10),
  }).strict()).min(1).max(50),
  scannerVersion: SafeCode,
  expectedSubmissionVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf07Request = z.object({
  operationId: z.literal("BE27B-DCD07"),
  submissionId: Id,
  productVersionId: Id,
  audioObjectIds: z.array(Id).min(1).max(100),
  technicalFindings: z.array(z.object({
    code: SafeCode,
    result: z.enum(["pass", "block", "warn", "unknown"]),
    scope: SafeCode,
    evidence: z.array(EvidenceRef).max(10),
  }).strict()).max(100),
  metadataExtraction: z.record(SafeCode, z.string().trim().max(500)).default({}),
  contentMatchSignals: z.array(z.object({
    signalType: z.enum(["perceptual_match", "exact_match", "named_third_party"]),
    confidence: z.number().min(0).max(1),
    referenceHash: Hash.nullable(),
  }).strict()).max(50),
  expectedSubmissionVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf08Request = z.object({
  operationId: z.literal("BE27B-DCD08"),
  submissionId: Id,
  action: z.enum(["accept", "reject", "request_evidence"]),
  findings: z.array(z.object({
    code: SafeCode,
    scope: SafeCode,
    severity: z.enum(["low", "medium", "high", "critical"]),
  }).strict()).max(50),
  evidence: z.array(EvidenceRef).min(1).max(30),
  reviewerPartyId: Id,
  recusalCheck: z.object({
    conflictPresent: z.literal(false),
    checkedAt: IsoDate,
  }).strict(),
  appealWindowHours: z.number().int().min(0).max(8760),
  expectedSubmissionVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf09Request = z.object({
  operationId: z.literal("BE27B-DCD09"),
  productId: Id,
  productVersionId: Id,
  submissionId: Id,
  requiredQaCheckIds: z.array(Id).min(1).max(100),
  reviewDecisionId: Id.nullable(),
  termsVersionId: Id,
  continuityManifestId: Id,
  demoObjectIds: z.array(Id).min(1).max(20),
  payoutReady: z.literal(true),
  vendorIdentitySnapshotHash: Hash,
  expectedProductVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const VendorSubmissionSuccess = z.object({
  operationId: z.literal("BE27B-DCD05"),
  submissionId: Id,
  productVersionId: Id,
  state: z.enum(["submitted", "qa_pending", "review_hold", "blocked"]),
  artifactCount: z.number().int().positive(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ArtifactQaSuccess = z.object({
  operationId: z.literal("BE27B-DCD06"),
  submissionId: Id,
  state: z.enum(["qa_passed", "blocked", "warning", "pending_retry"]),
  blockerCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ContentQcSuccess = z.object({
  operationId: z.literal("BE27B-DCD07"),
  submissionId: Id,
  state: z.enum(["qc_passed", "listing_lie_blocked", "warning", "pending_retry"]),
  matchSignalCount: z.number().int().nonnegative(),
  humanReviewRequired: z.boolean(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ReviewDecisionSuccess = z.object({
  operationId: z.literal("BE27B-DCD08"),
  reviewDecisionId: Id,
  submissionId: Id,
  action: z.enum(["accept", "reject", "request_evidence"]),
  appealable: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const PublicationSuccess = z.object({
  operationId: z.literal("BE27B-DCD09"),
  productId: Id,
  productVersionId: Id,
  publicationId: Id,
  state: z.enum(["published", "executable_disabled"]),
  artifactVersionId: Id,
  termsVersionId: Id,
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ApiError = z.object({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
~~~

Gcf06/Gcf07 are worker-authorized commands and may be retried with the same idempotency key. A deterministic block is scoped to its artifact/check; a warning is not converted to a block without the stated policy. Gcf09 cannot publish a plugin as executable at launch; its success state records executable_disabled when the product type is plugin. Response replay returns the stored result through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE27B-DCD05 | Gcf05Request strict; artifacts, manifest, sources, AI declarations, attestations, demos, terms, continuity | VendorSubmissionSuccess; artifact digest and declarations bind atomically to immutable submission | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Submission, artifact refs, attestations, continuity snapshot, audit, outbox, and idempotency receipt |
| BE27B-DCD06 | Gcf06Request strict; deterministic check scopes/results, scanner version, digest, expected revision | ArtifactQaSuccess; contradictions block exact scope and scanner failure remains pending/retry | All failures use ApiError { code, message, requestId, details } via ErrorResponse | QA checks, submission state/version, evidence links, audit, outbox, and idempotency receipt |
| BE27B-DCD07 | Gcf07Request strict; technical findings, metadata, match signals, expected revision | ContentQcSuccess; exact/named match requires human review; uncertain extraction warns | All failures use ApiError { code, message, requestId, details } via ErrorResponse | QC checks/signals, review hold flag, evidence links, audit, outbox, and idempotency receipt |
| BE27B-DCD08 | Gcf08Request strict; scoped findings/evidence, reviewer, false conflict, appeal window | ReviewDecisionSuccess; action is reasoned/appealable and reviewer recusal checked | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Review decision, submission state, appeal clock, evidence, audit, outbox, and idempotency receipt |
| BE27B-DCD09 | Gcf09Request strict; all required gate IDs, terms, continuity, demos, payout, vendor snapshot | PublicationSuccess; product/version/artifact/terms/vendor snapshot commit atomically; plugin remains disabled | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Publication, ArtifactVersion, gate links, listing handoff, audit, outbox, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved after coarse authentication. A hidden product, version, submission, artifact, review, or vendor returns 404; a visible resource for which the actor lacks the action grant returns 403. Error details never reveal source declarations, legal identity, artifact bytes, reviewer notes, or another vendor's status.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE27B-DCD05 | Vendor person/org controller; authorized submission worker; support case-bound | Vendor controls product/version and declaration; artifact refs must be owned or licensed through the vendor gate | Hidden product/version returns 404 PRODUCT_VERSION_NOT_FOUND; visible version without vendor grant returns 403 SUBMISSION_FORBIDDEN |
| BE27B-DCD06 | QA worker with scanner identity; support cannot alter verdict | Submission/artifact and scanner version are scoped; raw artifact bytes are object-purpose protected | Hidden submission returns 404 SUBMISSION_NOT_FOUND; visible submission without QA worker grant returns 403 ARTIFACT_QA_FORBIDDEN |
| BE27B-DCD07 | Content-QC worker; authorized reviewer for signal intake | Audio/content objects belong to submission; signals do not disclose private reference identity | Hidden submission returns 404 SUBMISSION_NOT_FOUND; visible submission without QC grant returns 403 CONTENT_QC_FORBIDDEN |
| BE27B-DCD08 | Independent reviewer; support dual control for mechanical recovery | Reviewer cannot be submitter or conflicted party; decision and evidence are submission-scoped | Hidden submission returns 404 SUBMISSION_NOT_FOUND; visible submission without reviewer grant returns 403 REVIEW_FORBIDDEN |
| BE27B-DCD09 | Publication worker; vendor controller only for request initiation; support cannot bypass gates | Product/version gate IDs, terms, continuity, payout, and vendor snapshot must all match | Hidden product/version returns 404 PRODUCT_VERSION_NOT_FOUND; visible version without publish grant returns 403 PUBLICATION_FORBIDDEN |

The vendor is an acting person/org role over canonical identity. A reviewer must pass a conflict/recusal check and cannot approve their own submission. Support can recover a failed provider handoff only with a purpose-bound grant; support cannot turn a warning into a cleared rights/safety verdict or publish an executable plugin.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE27B-DCD05 | requestId → CORS → auth → vendor-party context → rate limit → idempotency → strict body validation → schema/terms/continuity gate → object digest verifier → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 512 KiB body; bytes by object ID/hash; source/AI declaration bounds; no buyer/payout instrument data |
| BE27B-DCD06 | requestId → CORS → service auth → scanner identity → rate limit → idempotency → strict body validation → submission lock → deterministic evaluator → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; artifact digest match; check scope allowlist; no safe/rights assertion |
| BE27B-DCD07 | requestId → CORS → service auth → QC identity → rate limit → idempotency → strict body validation → submission lock → content evaluator → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; metadata count bounds; signal confidence range; perceptual signal cannot auto-adjudicate |
| BE27B-DCD08 | requestId → CORS → auth → reviewer grant/recusal → rate limit → idempotency → strict body validation → submission lock → evidence purpose gate → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; reviewer conflict must be false; evidence hashes only; action reason required |
| BE27B-DCD09 | requestId → CORS → auth → publication worker/vendor context → rate limit → idempotency → strict body validation → gate snapshot lock → payout/continuity/plugin policy → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; all gate versions match; plugin executable flag forced false at launch; no payment or activation data |

All routes apply CSRF protection where browser credentials are used, content-type/body-size limits, origin allowlisting, safe response headers, request-scoped tracing, and structured redaction. Object storage uses BE-00 short-lived purpose grants. Public events contain IDs/hashes only; source declarations, reviewer notes, evidence originals, legal identity, and signed URLs remain protected.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE27B-DCD05 | Required key/body hash; one active submission per product version; product/version lock; same key replays | 20 per vendor per 10 minutes, burst 3 | p95 2 s, hard 20 s; object digest checks bounded |
| BE27B-DCD06 | Required key/body hash; unique submission/artifact/scanner revision; worker lease and check dedupe | 120 per QA worker per minute, burst 10 | p95 2 s, hard 30 s; scanner failure becomes pending |
| BE27B-DCD07 | Required key/body hash; unique submission/QC revision; match-signal append and state lock | 60 per QC worker per minute, burst 8 | p95 2 s, hard 30 s; audio analysis may be asynchronous |
| BE27B-DCD08 | Required key/body hash; one decision per submission/review version; reviewer lock and recusal check | 30 per reviewer per minute, burst 5 | p95 1.5 s, hard 15 s |
| BE27B-DCD09 | Required key/body hash; unique publication per product version; gate snapshot and product lock | 20 per publisher per 10 minutes, burst 3 | p95 1.5 s, hard 15 s; outbox handoff bounded |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Worker leases expire after eight attempts; retrying a timeout never creates a second artifact master, QA result, review decision, or publication.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE27B-DCD05 | submission_total by product type; digest_mismatch_total; declaration_reject_total; continuity_missing_total; latency | requestId, operationId, product/version hash, type, artifact count, schema version, result; no source text | digital_product.version_submitted.v1; submission audit; artifact hashes |
| BE27B-DCD06 | artifact_qa_total by check/result; deterministic_block_total; scanner_retry_total; latency | requestId, operationId, submission/artifact hash, check scopes, blocker/warning counts, scanner version | digital_product.qa_completed.v1; QA evidence hashes |
| BE27B-DCD07 | content_qc_total; exact_match_review_total; perceptual_signal_total; listing_lie_block_total | requestId, operationId, submission/version hash, signal classes/confidence bucket, result; no reference identity | digital_product.qa_completed.v1; QC evidence hashes |
| BE27B-DCD08 | review_decision_total by action; recusal_denied_total; appeal_open_total; latency | requestId, operationId, submission/reviewer hash, action, finding count, appeal hours, result | review.decision.recorded; review evidence audit; no reviewer note |
| BE27B-DCD09 | publication_total by type/state; gate_block_total; executable_disabled_total; outbox_age; latency | requestId, operationId, product/version hash, gate states, payout flag, executable policy, result | digital_product.published.v1; publication and listing handoff IDs |

Trace spans include submission.bind, artifact.qa, content.qc, review.decision, and publication.commit, preserving failures, contradictions, recusal, gate mismatch, provider retries, and plugin-disable enforcement. the structured diagnostic boundary scrubs artifact URLs, source/AI declarations, reviewer notes, legal identity, and payout data. Alerts fire on publication without all gate IDs, any QA result labelled safe/rights verified, plugin executable enable attempt, and any digest mismatch after binding.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck vendor party, reviewer recusal, product/version state, artifact object purpose, digest, schema, terms, continuity, payout gate, and expected version. Every mutation writes audit and outbox rows in the same transaction. Artifact bytes remain in protected object storage.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.vendor_submissions / VendorSubmission | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); schema_version text NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 80); manifest_object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); manifest_sha256 char(64) NOT NULL CHECK (manifest_sha256 ~ '^[a-f0-9]{64}$'); state text NOT NULL CHECK (state IN ('submitted','qa_pending','review_hold','blocked','accepted','rejected','published')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_version_id,version) | (product_id,created_at DESC); (product_version_id,state); (vendor_party_id,state); (state,updated_at DESC); (manifest_sha256) | Vendor reads/writes own submission through RPC; QA/reviewer receive scoped projection; forced RLS; no direct client grant |
| platform_private.submission_artifacts | id uuid PRIMARY KEY; submission_id uuid NOT NULL REFERENCES platform_private.vendor_submissions(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 50000000000); media_type text NOT NULL CHECK (char_length(media_type) BETWEEN 3 AND 120); role text NOT NULL CHECK (role IN ('master','demo','manifest','source_declaration','attestation')); immutable_master boolean NOT NULL DEFAULT true; created_at timestamptz NOT NULL; UNIQUE(submission_id,role,sha256) | (submission_id,role); (object_id); (sha256); (created_at DESC) | Vendor/QA workers see metadata; BE-00 grants bytes by purpose; forced RLS; no direct client grant |
| platform_private.digital_qa_checks / QaCheck | id uuid PRIMARY KEY; submission_id uuid NOT NULL REFERENCES platform_private.vendor_submissions(id); artifact_id uuid NULL REFERENCES platform_private.submission_artifacts(id); check_type text NOT NULL CHECK (check_type IN ('manifest','archive','malware','build_reproducibility','schema','digest','audio_technical','content_match')); scope text NOT NULL CHECK (char_length(scope) BETWEEN 1 AND 80); result text NOT NULL CHECK (result IN ('pass','block','warn','unknown')); finding_code text NULL CHECK (finding_code ~ '^[A-Z0-9_:-]{2,80}$'); scanner_version text NOT NULL CHECK (char_length(scanner_version) BETWEEN 1 AND 80); evidence_count integer NOT NULL CHECK (evidence_count BETWEEN 0 AND 50); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(submission_id,check_type,scope,version) | (submission_id,check_type,result); (result,created_at DESC); (artifact_id,created_at DESC); (finding_code) | QA workers append; vendor sees scoped findings; reviewer sees evidence metadata; forced RLS; no direct client grant |
| platform_private.digital_review_decisions / ReviewDecision | id uuid PRIMARY KEY; submission_id uuid NOT NULL REFERENCES platform_private.vendor_submissions(id); reviewer_party_id uuid NOT NULL REFERENCES identity.parties(id); action text NOT NULL CHECK (action IN ('accept','reject','request_evidence')); finding_count integer NOT NULL CHECK (finding_count BETWEEN 0 AND 50); evidence_count integer NOT NULL CHECK (evidence_count BETWEEN 1 AND 30); conflict_present boolean NOT NULL CHECK (conflict_present = false); appealable boolean NOT NULL DEFAULT true CHECK (appealable = true); appeal_window_hours integer NOT NULL CHECK (appeal_window_hours BETWEEN 0 AND 8760); state text NOT NULL CHECK (state IN ('recorded','appeal_open','final','superseded')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(submission_id,version) | (submission_id,created_at DESC); (reviewer_party_id,created_at DESC); (action,state); (state,created_at) | Assigned reviewer/support dual control only; vendor sees safe decision and appeal status; forced RLS; no direct client grant |
| platform_private.digital_licence_terms_versions / LicenceTermsVersion | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); clauses jsonb NOT NULL; custom_flags jsonb NOT NULL; status text NOT NULL CHECK (status IN ('draft','active','tombstoned')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_id,version) | (product_id,version DESC); (product_version_id,status); (vendor_party_id,status) | Vendor writes own draft; public sees active structured projection; downstream entitlement reads immutable version; forced RLS; no direct client grant |
| platform_private.digital_artifact_versions / ArtifactVersion | id uuid PRIMARY KEY; product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); source_submission_id uuid NOT NULL REFERENCES platform_private.vendor_submissions(id); master_object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); byte_size bigint NOT NULL CHECK (byte_size > 0); unpacked_size bigint NULL CHECK (unpacked_size >= byte_size); media_type text NOT NULL CHECK (char_length(media_type) BETWEEN 3 AND 120); release_channel text NOT NULL CHECK (release_channel IN ('stable','beta','default')); state text NOT NULL CHECK (state IN ('pending','published','superseded','withdrawn')); executable boolean NOT NULL; executable_enabled boolean NOT NULL DEFAULT false CHECK (executable_enabled = false); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(product_version_id,sha256) | (product_version_id,state); (sha256); (release_channel,state); (source_submission_id) | Publication worker writes; delivery worker reads scoped metadata; BE-00 grants bytes; forced RLS; no direct client grant |
| platform_private.vendor_continuity_manifests / VendorContinuityManifest | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); storage_class text NOT NULL CHECK (storage_class IN ('standard','perpetual_required','legal_hold')); obligations jsonb NOT NULL; dependency_codes text[] NOT NULL CHECK (cardinality(dependency_codes) <= 100); exit_states jsonb NOT NULL; artifact_quota_bytes bigint NOT NULL CHECK (artifact_quota_bytes > 0); state text NOT NULL CHECK (state IN ('draft','validated','expired','superseded')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_id,version) | (product_id,state); (vendor_party_id,state); (storage_class); (updated_at DESC) | Vendor/support case-bound write; publication worker validates; retirement worker reads; forced RLS; no direct client grant |
| platform_private.submission_evidence | id uuid PRIMARY KEY; submission_id uuid NOT NULL REFERENCES platform_private.vendor_submissions(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('qa_output','source_record','match_signal','review_note','continuity_record')); added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(submission_id,sha256) | (submission_id,created_at DESC); (kind,created_at DESC); (sha256) | Worker/reviewer append only; vendor receives approved projection; BE-00 grants originals; forced RLS; no direct client grant |
| platform_private.submission_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload retained in protected event store |

Terms clauses are structured JSON validated against the current schema; custom prose cannot override structured permissions. Artifact and evidence object references are hash-checked. The publication transaction requires all gate IDs to belong to the same product version, a validated continuity manifest, payoutReady true, and a vendor identity snapshot hash. It writes no executable enable flag.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Vendor party controller | Own submission state, actionable QA findings, safe review decision, terms/continuity status | GCF05 and correction submission through scoped RPC | Cannot edit immutable artifact/QA/review, self-approve, publish without gates, or expose buyer identity |
| QA worker | Submission/artifact metadata and check inputs | GCF06/GCF07 worker RPC with scanner/QC identity | Cannot publish, assert rights/safety, or see unrelated vendor data |
| Independent reviewer | High-risk submission, scoped evidence, prior checks | GCF08 with recusal and appeal controls | Cannot review own/conflicted submission or erase evidence |
| Publication worker | Gate snapshots, payout/continuity and vendor hash | GCF09 atomic publication RPC | Cannot enable executable plugin, grant entitlement, charge, or adjudicate rights |
| Support/legal | Case-bound redacted projection | Dual-control recovery/evidence RPC | Cannot change product type, convert warning to clearance, or bypass policy |
| Public client | Published safe product/version/demo projection | No direct table write | No draft, artifact bytes, reviewer notes, source declarations, or legal identity |
| Anon/authenticated table role | No direct access | Public Hono routes only | Direct SQL/object/event grants denied |

## State Machines, Concurrency, and Failure Recovery

### Submission and publication state machine

VendorSubmission: submitted → qa_pending → review_hold → accepted → published, with blocked, rejected, or request_evidence exits. Deterministic contradiction blocks exact scope. Scanner failure is pending/retry. Content-QC exact/named match creates review_hold; perceptual or uncertain extraction remains a signal. ReviewDecision: recorded → appeal_open → final, with superseded only by a new immutable decision. ProductVersion publication binds a new ArtifactVersion and terms/continuity snapshots atomically.

For product type plugin, publication can yield executable_disabled only. Enabling executable delivery requires a separately locked sandboxed QA, liability, staged-rollout, incident-response, and vendor-admission gate. This companion cannot create that enablement.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Submission retry with same digest/key | First committed immutable submission wins | Replay original; hash conflict requires a new correction version |
| Artifact bytes versus manifest digest | Digest mismatch blocks binding | Preserve draft/submission; upload corrected immutable object |
| Deterministic contradiction versus content warning | Deterministic block wins its exact scope; warning remains non-blocking | Vendor corrects with new submission; no verdict rewrite |
| Perceptual signal versus named/exact match | Exact/named match creates human review; perceptual signal alone warns | Reviewer receives scoped evidence; no autonomous rights verdict |
| Reviewer conflicts with vendor | Recusal check blocks conflicted decision | Assign independent reviewer; preserve attempted decision audit |
| Review decision versus publication | Publication requires final accepted review when high-risk | Gate mismatch returns 409; no partial publication |
| Terms/continuity/payout version changes | Current gate snapshot wins; old submission remains historical | Refetch and submit correction; no stale publication |
| Publication versus vendor withdrawal | First atomic publication/withdrawal event is authoritative; downstream withdrawal handles later cause | Outbox consumer reconciles by product/version |
| Worker crash after check write | Transactional audit/outbox preserves or rolls back together | Lease retry with check ID/version dedupe |
| Provider/scanner timeout | State remains pending_retry, never pass | Inquiry/retry same key; quarantine divergent result |
| Deadlock/serialization conflict | No partial submission or publication | Retry twice at 50/150 ms, then return 409 |

Outbox delivery is at-least-once; consumers dedupe event ID plus aggregate/version and refetch the canonical source. Raw artifacts are immutable; corrections add versions. A stale cache never upgrades blocked, unknown, or review-hold state.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| BE-00 object storage/digest | { objectId, sha256, purpose, actor, byteSize } | { verified: true, sizeBytes, mediaType, evidenceReceiptId } | 5,000 ms | 2 retries at 200/600 ms on timeout; no retry on hash mismatch | Open after 3 failures in 60 s; submission remains pending |
| Deterministic artifact scanner | { submissionId, artifactId, sha256, checks, scannerVersion } | { scanId, state: pass/block/warn/unknown, findings, evidenceHashes, scannerVersion } | 30,000 ms | 3 retries at 500/1500/3000 ms for timeout/408/429/5xx; inquiry by scanId | Open after 5 failures in 120 s; executable path remains disabled |
| Audio/content QC service | { submissionId, productVersionId, objectIds, requestedChecks } | { qcId, technicalFindings, metadata, signals, state: pass/block/warn/unknown } | 30,000 ms | 3 retries at 500/1500/3000 ms for timeout/408/429/5xx; same QC ID | Open after 5 failures in 120 s; content remains pending |
| BE-23 vendor party authority | { vendorPartyId, actorId, productId, capability, organizationGrant } | { allowed: true/false, partyType, identitySnapshotHash, grantVersion } | 3,000 ms | 2 retries at 200/600 ms on timeout/408/429/5xx; no retry on deny | Open after 5 failures in 60 s; write fails closed |
| BE-25b listing/disclosure snapshot | { productId, productVersionId, vendorSnapshotHash, expectedVersion } | { listingRevisionId, disclosureRevisionId, state, version } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; publication fails closed |

Provider responses are schema-validated, correlation IDs are hashed in logs, and unknown results remain pending or warning. No scanner, QC, listing, or identity seam can assert rights verified, safe, executable enabled, entitlement, or delivery.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| digital_product.version_submitted.v1 | BE27B-DCD05 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, productVersionId, submissionId, artifactHashes, state } | QA/review workers refetch submission |
| digital_product.qa_completed.v1 | BE27B-DCD06/DCD07 | { eventId, aggregateId, aggregateVersion, occurredAt, submissionId, scopes, blockerCount, warningCount } | Review/publication gates refetch checks |
| digital_product.published.v1 | BE27B-DCD09 | { eventId, aggregateId, aggregateVersion, occurredAt, productId, productVersionId, artifactVersionId, termsVersionId, vendorSnapshotHash } | Catalog/27c/27d consume immutable publication |
| digital_entitlement.issued.v1 | 27c | { eventId, aggregateId, aggregateVersion, entitlementId, epochId, productVersionRange } | Historical only |
| digital_entitlement.state_changed.v1 | 27c/27e | { eventId, aggregateId, aggregateVersion, entitlementId, priorState, newState } | Delivery/enforcement refetch |
| digital_transfer.grant_created.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, artifactVersionId, expiry } | Delivery audit |
| digital_transfer.completed.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, hash, ranges } | Evidence/support metrics |
| digital_product.update_published.v1 | 27d | { eventId, aggregateId, aggregateVersion, productId, priorVersionId, newVersionId } | Holder notification/library |
| digital_artifact.withdrawn.v1 | 27e | { eventId, aggregateId, aggregateVersion, artifactId, reason, scope } | Transfer kill/library reason |
| digital_asset.metadata_changed.v1 | 27d | { eventId, aggregateId, aggregateVersion, assetId, priorVersion, newVersion } | Search/delivery |
| digital_vendor.retired.v1 | 27e | { eventId, aggregateId, aggregateVersion, vendorId, effectiveAt } | Continuity/library |
| digital_enforcement.requested.v1 | 27e | { eventId, aggregateId, aggregateVersion, caseId, targetHash, reasonClass } | Adjudication/appeal |

Events expose IDs, hashes, versions, and safe status only. Source declarations, artifact bytes, licence keys, signed URLs, buyer identity maps, reviewer notes, and legal identity never enter the public event payload.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE27B-DCD05 | Hidden product/version or vendor context | 404 | PRODUCT_VERSION_NOT_FOUND | Do not reveal |
| BE27B-DCD05 | Digest, schema, declaration, terms, or continuity mismatch | 422 | SUBMISSION_SCHEMA_INVALID | Correct and submit a new immutable version |
| BE27B-DCD05 | Duplicate key/body hash conflict | 409 | IDEMPOTENCY_KEY_CONFLICT | Replay original or use new correction key |
| BE27B-DCD06 | Hidden submission/artifact | 404 | SUBMISSION_NOT_FOUND | Do not reveal |
| BE27B-DCD06 | Digest mismatch or malformed check | 422 | ARTIFACT_DIGEST_INVALID | Upload corrected object; no retry unchanged |
| BE27B-DCD06 | Scanner unavailable/unknown | 503 | ARTIFACT_QA_UNAVAILABLE | Retry same key; remain pending_retry |
| BE27B-DCD07 | Hidden submission | 404 | SUBMISSION_NOT_FOUND | Do not reveal |
| BE27B-DCD07 | Audio object or signal invalid | 422 | CONTENT_QC_INVALID | Correct scoped inputs |
| BE27B-DCD07 | QC unavailable | 503 | CONTENT_QC_UNAVAILABLE | Retry same key; preserve submission |
| BE27B-DCD08 | Hidden submission or review context | 404 | SUBMISSION_NOT_FOUND | Do not reveal |
| BE27B-DCD08 | Reviewer conflict/recusal failure | 403 | REVIEW_RECUSAL_REQUIRED | Assign independent reviewer |
| BE27B-DCD08 | Evidence missing or action conflicts with gate | 409 or 422 | REVIEW_EVIDENCE_REQUIRED or REVIEW_ACTION_INVALID | Add scoped evidence or use allowed action |
| BE27B-DCD09 | Hidden product/version | 404 | PRODUCT_VERSION_NOT_FOUND | Do not reveal |
| BE27B-DCD09 | Missing/old QA, review, terms, continuity, demo, payout, or vendor snapshot | 409 | PUBLICATION_GATE_CONFLICT | Refetch current gate versions |
| BE27B-DCD09 | Executable plugin enable attempted | 409 | EXECUTABLE_DISABLED_AT_LAUNCH | Use content-first route; no bypass |
| All | Body/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and idempotency key |
| All | Scanner/object/audit circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; no partial write |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes/paths only and never source text, artifact bytes, reviewer notes, legal identity, or provider secrets.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27B-CON-001 | BE27B-DCD05 | Strict submission contract enforces object digest, manifest, source/AI declarations, attestations, demos, terms, continuity, and immutable result |
| BE27B-CON-002 | BE27B-DCD06 | Deterministic check scopes/results, scanner version, digest, block/warn distinction, and pending state are exact |
| BE27B-CON-003 | BE27B-DCD07 | Technical findings, metadata, match signal confidence, human-review requirement, and no-rights-verdict rule are exact |
| BE27B-CON-004 | BE27B-DCD08 | Reviewer role/recusal, scoped findings/evidence, appealability, and action response are exact |
| BE27B-CON-005 | BE27B-DCD09 | Publication gate IDs, terms/continuity/payout/vendor snapshot, artifact version, and plugin-disabled state are exact |
| BE27B-ROUTE-001 | BE27B-DCD05 through BE27B-DCD09 | Method/path/operation registry is authoritative; aliases cannot bypass gate middleware |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27B-AUTH-001 | BE27B-DCD05 through BE27B-DCD09 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE27B-AUTH-002 | BE27B-DCD05 | Vendor organization grant and artifact purpose/digest ownership are enforced |
| BE27B-AUTH-003 | BE27B-DCD06, BE27B-DCD07 | Worker identity is scoped; scanner/QC cannot publish, assert rights, or access unrelated data |
| BE27B-AUTH-004 | BE27B-DCD08 | Conflicted reviewer is refused; review evidence and notes remain case-bound |
| BE27B-AUTH-005 | BE27B-DCD09 | Publication worker cannot enable executable plugin, issue entitlements, charge, or alter listing disclosure |
| BE27B-AUTH-006 | All | CORS policy digital-api, CSRF, redaction, purpose-bound object access, and no direct grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27B-DB-001 | All | Forced RLS denies direct access; RPC checks party, role, digest, state, version, and append-only rules |
| BE27B-DB-002 | BE27B-DCD05, BE27B-DCD06 | Submission binding and deterministic checks serialize; duplicate object/digest cannot create a second master |
| BE27B-DB-003 | BE27B-DCD07, BE27B-DCD08 | Match/review hold, reviewer recusal, evidence hash uniqueness, and appeal state hold |
| BE27B-DB-004 | BE27B-DCD09 | Publication gate snapshot, artifact version, plugin disabled flag, audit/outbox atomicity hold |
| BE27B-DB-005 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27B-DOM-001 | BE27B-DCD05, BE27B-DCD06 | Deterministic contradiction blocks exact scope; scanner failure remains pending; immutable correction appends |
| BE27B-DOM-002 | BE27B-DCD07, BE27B-DCD08 | Exact/named match requires human review; perceptual/uncertain signal warns; QA never claims safe or rights verified |
| BE27B-DOM-003 | BE27B-DCD09 | Required demos/terms/QA/review/payout/continuity bind atomically; plugin executable remains disabled |
| BE27B-SEAM-001 | BE27B-DCD05 through BE27B-DCD09 | BE-00, object storage, scanner, QC, identity, and listing timeout/retry/circuit behavior is exact |
| BE27B-EVT-001 | BE27B-DCD05 through BE27B-DCD09 | Exact event types, redaction, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE27B-REC-001 | BE27B-DCD05 through BE27B-DCD09 | Lost responses, digest conflict, scanner outage, reviewer recusal, stale gates, worker crash, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 27.05–27.09 map one-to-one to BE27B-DCD05–DCD09 |
| D2 submission | Are artifact, source/AI, attestation, terms, demos, and continuity facts bound atomically? | Yes: Gcf05 and persistence rows require immutable object hashes and snapshots |
| D3 QA | Can uncertain extraction become a definitive rights/safety verdict? | No: deterministic contradiction blocks scope; uncertainty/perceptual match remains signal |
| D4 review | Can a vendor or conflicted reviewer self-approve? | No: independent reviewer, false conflict check, scoped evidence, appealable decision |
| D5 publication | Can publication bypass payout, demos, terms, QA, review, continuity, or plugin gate? | No: all gate IDs/version snapshots are checked atomically; executable flag is forced false |
| D6 identity | Can vendor role create a new persona or reveal legal identity? | No: canonical acting-party authority and hashed public snapshot are used |
| D7 authorization | Are role ownership and 403 versus 404 explicit? | Yes: every operation has a scoped role/concealment row |
| D8 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed |
| D9 resilience | Are scanner/QC/provider races deterministic? | Yes: idempotency, locks, leases, inquiry, pending, quarantine, and circuit behavior are specified |
| D10 boundary | Does this duplicate catalog, delivery, enforcement, or entitlement? | No: endpoint reconciliation assigns every adjacent authority |

## Ambiguity Gate

PASS. Evidence: 27.05–27.09 each map to one authoritative operation and route; VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, and VendorContinuityManifest are owned while DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, Entitlement, AcquisitionEpoch, SeatAuthorization, TransferGrant, LibraryProjection, and DigitalAsset are consumed without route duplication; exact strict Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy digital-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; deterministic contradiction, subjective signal, human review, appeal, content-first admission, continuity, payout, plugin disablement, exact seams, event privacy, and recovery are resolved. Neighboring interactions 27.01–27.04 and 27.10–27.24 are referenced through explicit BE-27a/c/d/e handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, object evidence, and forced RLS.
- BE-23/24 identity and collections: canonical person/org acting-party, organization grants, provenance, and custody boundaries.
- BE-25b listing/disclosure lifecycle: immutable listing/disclosure revisions and publication handoff.
- BE-27a digital product catalog/compatibility: DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, and immutable type/version facts.
- BE-27c entitlements/library/delivery: Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, and delivery authorization.
- BE-27d updates/assets/trials: update versions, release channels, DigitalAsset, auditions, buyer organization, and trial origin.
- BE-27e enforcement/retirement/portability: withdrawals, enforcement, retirement, continuity, and account export/erase.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 27.05–27.09; immutable submissions, deterministic artifact QA, audio/content QC, independent review, terms/continuity, publication gates, executable launch disablement, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
