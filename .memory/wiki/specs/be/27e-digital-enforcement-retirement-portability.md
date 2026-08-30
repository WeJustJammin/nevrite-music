# BE-27e — Digital Enforcement, Retirement, and Portability

## Classification

This companion is the backend contract for 27.20–27.24: request serial blacklist/enforcement, retire a vendor/product, remove a malicious artifact, remove an artifact for rights cause, and export/erase account context. It owns enforcement cases, scoped artifact-withdrawal records, vendor/product retirement records, portability exports, and erasure requests. It consumes immutable ProductVersion, ArtifactVersion, Entitlement, AcquisitionEpoch, LibraryProjection, DigitalAsset, VendorContinuityManifest, review, terms, and delivery facts from 27a–27d. It does not adjudicate rights as a universal legal authority, erase indelible acquisition evidence, refund money, create a transfer grant, or delete an artifact master.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 27.20 Request blacklist/enforcement; 27.21 Retire vendor/product; 27.22 Remove malicious artifact; 27.23 Remove rights cause; 27.24 Export/erase account context | Catalog/compatibility 27a; submission/QA/publication 27b; entitlements/library/delivery 27c; updates/assets/trials 27d |
| Enforcement authority | Platform case, vendor request, scoped target/reason/evidence, notice, appeal, and approved state effect | Vendor direct mutation, automatic guilt, universal rights verdict, or refund/revocation decision |
| Withdrawal authority | Smallest valid asset/container scope, malicious immediate kill, rights lawful stop, reason/date/evidence retention, and in-flight behavior | Artifact byte deletion, payment/refund, entitlement history deletion, or ownership/custody rewrite |
| Retirement authority | New sales stop, continuity manifest and artifact obligations, passive owner library state, and committed-order handoff | Deleting perpetual artifacts, cancelling settled title, or erasing acquisition epochs |
| Portability authority | Portable entitlement/library/history export and eligible erasure/anonymization workflow | Deleting lawful contractual records, raw provider secrets, or unscoped account data |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, protected Supabase Storage, transactional audit/outbox, forced RLS, structured logs, and provider-native diagnostics-compatible telemetry. Enforcement is platform-adjudicated, reasoned, appealable, and smallest-scope. Malicious withdrawal can stop an in-flight transfer immediately; rights withdrawal preserves unaffected assets and acquisition evidence.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 24–40 | Entitlement, delivery, version, vendor exit, malicious/rights withdrawal, continuity, and watermark decisions | Classification, state, withdrawal, and privacy rules preserve these locks |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 77–104 | Interaction definitions 27.20–27.24 and outcomes/failures | One operation ID maps to each assigned interaction |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 108–120 | RequestSerialBlacklist, WithdrawArtifact, RetireVendor, and adjacent command contracts | Request schemas preserve reason/evidence/scope/version and continuity |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 130–146 | ArtifactVersion, Entitlement, AcquisitionEpoch, LibraryProjection, DigitalAsset, VendorContinuityManifest, and all canonical models | Model inventory and persistence mapping distinguish owned versus consumed models |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 148–167 | Typed field/cardinality registry and immutable history rules | Persistence rows use explicit SQL types, nullability, constraints, FKs, indexes, RLS, and grants |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 208–225 | Exact Event Schemas and privacy rule | Event inventory uses every literal type and no buyer identity/key/URL |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 32–39 | Withdrawal algorithm: current checks, ordinary updates, superseded/defective, malicious kill, rights smallest scope | Withdrawal state and race matrices implement each rule |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 54–60 | Indelible entitlement/acquisition, frozen terms, key/seat/grant distinction | Persistence and entitlement handoff preserve evidence |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 64–68 | Entitlement state/repurchase rules and non-deletion | Enforcement does not erase acquisition history |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 70–76 | Withdrawal matrix for superseded, defective, malicious, and rights | Error, state, and test matrices distinguish scope and in-flight behavior |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 105–110 | Withdrawal/update/vendor-exit races and committed-order continuity | Recovery matrix resolves races and handoffs |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 127–131 | Buyer watermark, high-risk review, malware/rights removal, perpetual storage continuity | Security and portability rules preserve privacy and continuity |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 conventions and ApiError { code, message, requestId, details } | Every request, success, and error contract cites the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, CORS, rate, idempotency, audit/outbox, RLS, grants, object storage, retention, and callbacks | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Person/org acting party, holder, custody, and ownership boundaries | Enforcement/portability never rewrites identity/title/custody |
| BE commerce | Shard 28 commerce/refund/revenue contracts referenced by IA lines 32, 90, 115 | Committed order, owned/refunded outcome, refund/revocation, and revenue handoff | Retirement sends order outcomes to Shard 28; this companion does not refund |
| BE adjacent | .memory/wiki/specs/be/27a-digital-product-catalog-compatibility.md, 27b-digital-submission-qa-publication.md, 27c-digital-entitlements-library-delivery.md, 27d-digital-updates-assets-trials.md | Catalog/publication/entitlement/update producers | Dependency references identify producer/consumer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 27.20 | Request blacklist/enforcement | BE27E-DCD20 | Vendor request enters a platform case with reason/evidence, adjudication, notification, and appeal; vendor cannot execute directly |
| 27.21 | Retire vendor/product | BE27E-DCD21 | New sales stop, continuity obligations persist, passive owner library remains, and committed orders become owned/refunded through Shard 28 |
| 27.22 | Remove for malicious artifact | BE27E-DCD22 | Evidence-approved emergency removal stops new/in-flight unsafe delivery, marks partial unsafe, and preserves entitlement evidence |
| 27.23 | Remove for rights cause | BE27E-DCD23 | Legal record stops onward/archive delivery at smallest valid asset/container scope and retains unaffected content |
| 27.24 | Export/erase account context | BE27E-DCD24 | Portable entitlement/library export precedes eligible erasure/anonymization; lawful contractual records remain pseudonymous |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| VendorContinuityManifest | Owned/validated retirement continuity and artifact obligation snapshot | platform_private.vendor_continuity_manifests |
| ArtifactVersion | Consumed immutable artifact/withdrawal target and master identity | BE-27b/27d |
| Entitlement | Consumed primary issuance/state fact; enforcement can request state effect | BE-27c |
| AcquisitionEpoch | Consumed indelible purchase/grant history exported and retained | BE-27c |
| LibraryProjection | Consumed holder projection updated by withdrawal/retirement | BE-27c |
| DigitalAsset | Consumed smallest-scope asset/container target | BE-27d |
| DigitalProduct | Consumed vendor/product retirement target | BE-27a |
| ProductVersion | Consumed immutable version target | BE-27a |
| CompatibilityMatrix | Consumed version support facts for impact calculation | BE-27a |
| DependencyEdge | Consumed dependency facts for continuity/impact | BE-27a |
| VendorSubmission | Consumed evidence provenance | BE-27b |
| QaCheck | Consumed QA/malware/check scope | BE-27b |
| ReviewDecision | Consumed high-risk review/appeal context | BE-27b |
| LicenceTermsVersion | Consumed terms required for retention/export | BE-27b |
| SeatAuthorization | Consumed future activation state; no key deletion here | BE-27c/provider |
| TransferGrant | Consumed delivery grant to revoke/mark unsafe | BE-27c |

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| digital_enforcement.requested.v1 | Produced by BE27E-DCD20 | Case/target hash, reason class, evidence hash, actor role, appeal state; no buyer identity |
| digital_artifact.withdrawn.v1 | Produced by BE27E-DCD22/DCD23 | Artifact/container scope, reason, effective time, evidence/version; no source bytes |
| digital_vendor.retired.v1 | Produced by BE27E-DCD21 | Vendor/product continuity states and effective version; no legal identity |
| digital_entitlement.state_changed.v1 | Produced by approved enforcement state effect and consumed from 27c | Prior/new state, trigger, version; no key or buyer map |
| digital_product.version_submitted.v1 | Consumed from 27b | Submission provenance only |
| digital_product.qa_completed.v1 | Consumed from 27b | QA scope/results only |
| digital_product.published.v1 | Consumed from 27b | Published snapshot only |
| digital_entitlement.issued.v1 | Consumed from 27c | Issuance/epoch context only |
| digital_transfer.grant_created.v1 | Consumed from 27c | Grant scope/expiry; withdrawal may revoke |
| digital_transfer.completed.v1 | Consumed from 27c | Completion/hash evidence |
| digital_product.update_published.v1 | Consumed from 27d | New version/old preservation |
| digital_asset.metadata_changed.v1 | Consumed from 27d | Asset version/facet changes |

Portability export and erasure actions write audit records and protected delivery jobs; they do not invent a public event type. Entitlement state effects and withdrawals publish only the exact event types listed above.

## Endpoint Reconciliation

BE-00 owns authentication/session, global errors, idempotency receipts, audit/outbox, object storage, retention, CORS, signed export delivery, and callback verification. BE-23/24 own person/org identity, holder, ownership, and custody. BE-25b owns listing/disclosure snapshots. BE-27a owns catalog/type/version; BE-27b owns submission, QA, review, terms, artifacts, and continuity; BE-27c owns entitlement, acquisition, library, grants, and live delivery; BE-27d owns updates/assets/trials. Shard 28 owns committed order/refund/revenue outcomes. The five routes below are the only public routes for 27.20–27.24. No route here directly mutates a vendor, deletes an artifact, refunds a buyer, revokes an entitlement without approved state authority, or exports provider secrets.

Blacklist is a case request distinct from refund revocation. Malicious removal is emergency scoped delivery control and can stop in-flight transfer; rights removal requires an identified scope and legal record. Retirement stops new sales but preserves perpetual owner access subject to withdrawal and continuity. Export is a portable snapshot job; eligible erasure anonymizes removable data only after export and legal-hold checks.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE27E-DCD20 | POST | /api/v1/digital/enforcement/blacklist-requests | 27.20 | RequestSerialBlacklist | 202 DigitalEnforcementSuccess |
| BE27E-DCD21 | POST | /api/v1/digital/vendors/{vendorId}/retire | 27.21 | RetireVendor | 202 VendorRetirementSuccess |
| BE27E-DCD22 | POST | /api/v1/digital/artifacts/{artifactId}/malicious-removals | 27.22 | WithdrawArtifact | 202 MaliciousWithdrawalSuccess |
| BE27E-DCD23 | POST | /api/v1/digital/artifacts/{artifactId}/rights-removals | 27.23 | WithdrawArtifact | 202 RightsWithdrawalSuccess |
| BE27E-DCD24 | POST | /api/v1/digital/account-context/portability | 27.24 | ExportEraseAccountContext | 202 PortabilitySuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase strings; dates are RFC 3339 UTC; evidence and target hashes are lowercase SHA-256; scopes and reasons are allowlisted. Unknown keys, unsafe text, unbounded target scope, missing evidence, absent legal record, direct vendor execution, erasure before export, and missing idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse.

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
const EvidenceRef = z.object({
  objectId: Id,
  sha256: Hash,
  kind: z.enum(["case_record", "malware_scan", "legal_record", "continuity_manifest", "export_manifest"]),
  capturedAt: IsoDate,
}).strict();
const Target = z.object({
  productId: Id.nullable(),
  productVersionId: Id.nullable(),
  artifactVersionId: Id.nullable(),
  assetId: Id.nullable(),
  entitlementId: Id.nullable(),
}).strict();
const Gcf20Request = z.object({
  operationId: z.literal("BE27E-DCD20"),
  target: Target,
  entitlementOrKeyHash: Hash.nullable(),
  vendorPartyId: Id,
  reasonCode: z.enum(["malware_suspected", "rights_complaint", "policy_risk", "fraud_signal", "buyer_report"]),
  description: SafeText,
  evidence: z.array(EvidenceRef).min(1).max(30),
  requestedAction: z.enum(["review", "suspend_delivery", "blacklist_review"]),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf21Request = z.object({
  operationId: z.literal("BE27E-DCD21"),
  vendorId: Id,
  productIds: z.array(Id).min(1).max(100),
  continuityManifestId: Id,
  effectiveAt: IsoDate,
  committedOrderPolicy: z.enum(["owned_or_refunded"]),
  reason: SafeCode,
  expectedVendorVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf22Request = z.object({
  operationId: z.literal("BE27E-DCD22"),
  artifactId: Id,
  scope: z.enum(["artifact_version", "asset", "container"]),
  reasonCode: z.literal("malicious"),
  evidence: z.array(EvidenceRef).min(1).max(30),
  emergency: z.literal(true),
  expectedArtifactVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf23Request = z.object({
  operationId: z.literal("BE27E-DCD23"),
  artifactId: Id,
  scope: z.enum(["asset", "container", "artifact_version"]),
  reasonCode: z.literal("rights"),
  legalRecordId: Id,
  affectedAssetIds: z.array(Id).min(1).max(100),
  unaffectedScopeHash: Hash,
  evidence: z.array(EvidenceRef).min(1).max(30),
  effectiveAt: IsoDate,
  expectedArtifactVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf24Request = z.object({
  operationId: z.literal("BE27E-DCD24"),
  accountId: Id,
  holderPartyId: Id,
  action: z.enum(["export", "erase", "export_then_erase"]),
  exportFormat: z.enum(["json", "jsonl", "zip_manifest"]),
  destination: z.enum(["signed_download", "provider_transfer"]),
  legalHoldCheck: z.literal(true),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const DigitalEnforcementSuccess = z.object({
  operationId: z.literal("BE27E-DCD20"),
  caseId: Id,
  state: z.enum(["received", "under_review", "delivery_suspended", "appeal_open", "resolved"]),
  appealable: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const VendorRetirementSuccess = z.object({
  operationId: z.literal("BE27E-DCD21"),
  retirementId: Id,
  vendorId: Id,
  state: z.enum(["scheduled", "retired", "continuity_pending"]),
  newSales: z.literal("stopped"),
  perpetualArtifactsRetained: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const MaliciousWithdrawalSuccess = z.object({
  operationId: z.literal("BE27E-DCD22"),
  withdrawalId: Id,
  artifactId: Id,
  scope: z.enum(["artifact_version", "asset", "container"]),
  state: z.enum(["emergency_pending", "withdrawn", "quarantined"]),
  inFlightDelivery: z.literal("stopped"),
  entitlementEvidenceRetained: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const RightsWithdrawalSuccess = z.object({
  operationId: z.literal("BE27E-DCD23"),
  withdrawalId: Id,
  artifactId: Id,
  scope: z.enum(["artifact_version", "asset", "container"]),
  state: z.enum(["pending_legal", "withdrawn", "appeal_open"]),
  unaffectedScopeRetained: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const PortabilitySuccess = z.object({
  operationId: z.literal("BE27E-DCD24"),
  portabilityJobId: Id,
  action: z.enum(["export", "erase", "export_then_erase"]),
  state: z.enum(["queued", "export_ready", "erase_pending", "anonymized", "blocked_legal_hold"]),
  exportRequired: z.literal(true),
  lawfulRetention: z.literal(true),
  expiresAt: IsoDate,
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

Gcf20 is a request for platform review; vendorPartyId and requestedAction cannot directly suspend or blacklist an entitlement. Gcf22 emergency true is required for the malicious path and immediately applies delivery kill after evidence admission; Gcf23 requires a legal record and affected scope, preserving unaffected content. Gcf24 action erase or export_then_erase queues export first and blocks anonymization on a legal hold. Response replay returns the original stored response through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE27E-DCD20 | Gcf20Request strict; target, vendor role, reason, evidence, and review action | DigitalEnforcementSuccess; case is appealable and vendor cannot execute state effect | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Enforcement case, evidence links, notice job, audit, outbox, and idempotency receipt |
| BE27E-DCD21 | Gcf21Request strict; vendor/products, continuity manifest, effective time, and committed-order policy | VendorRetirementSuccess; new sales stopped and perpetual artifacts retained | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Retirement, continuity validation, sales-stop signal, order handoff, audit, outbox, and idempotency receipt |
| BE27E-DCD22 | Gcf22Request strict; malicious scope, emergency evidence, artifact version | MaliciousWithdrawalSuccess; in-flight delivery stopped and entitlement evidence retained | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Withdrawal, delivery kill, unsafe markers, evidence, audit, outbox, and idempotency receipt |
| BE27E-DCD23 | Gcf23Request strict; rights scope, legal record, affected/unaffected set, evidence | RightsWithdrawalSuccess; smallest valid scope withdrawn and unaffected content retained | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Withdrawal, legal record link, scope snapshot, notice/appeal job, audit, outbox, and idempotency receipt |
| BE27E-DCD24 | Gcf24Request strict; holder/account, action, format/destination, legal-hold check | PortabilitySuccess; export precedes eligible erasure and lawful retention remains | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Portability job, export manifest, erasure/anonymization plan, audit, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved after coarse authentication. A hidden target, vendor, artifact, case, or account returns 404; a visible resource for which the actor lacks the scoped enforcement/retirement/portability grant returns 403. Error details never reveal legal records, provider credentials, buyer identity, source bytes, keys, or another account's export.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE27E-DCD20 | Buyer/vendor reporter; Trust and Safety reviewer; support case-bound; legal reviewer | Reporter submits evidence; platform reviewer adjudicates; vendor has response/appeal but no direct state mutation | Hidden target/case returns 404 ENFORCEMENT_TARGET_NOT_FOUND; visible case without action grant returns 403 ENFORCEMENT_FORBIDDEN |
| BE27E-DCD21 | Vendor controller; continuity worker; governance/support dual control | Vendor and product set must belong to acting party; continuity manifest and committed-order policy required | Hidden vendor/product returns 404 VENDOR_NOT_FOUND; visible vendor without retirement grant returns 403 RETIREMENT_FORBIDDEN |
| BE27E-DCD22 | Trust and Safety emergency worker; malware reviewer; support dual control | Artifact scope and evidence are case-bound; emergency kill may be executed by authorized platform worker | Hidden artifact returns 404 ARTIFACT_NOT_FOUND; visible artifact without emergency grant returns 403 MALICIOUS_WITHDRAWAL_FORBIDDEN |
| BE27E-DCD23 | Legal/copyright reviewer; Trust and Safety; support dual control | Legal record and affected asset/container scope control withdrawal; vendor may appeal | Hidden artifact/legal record returns 404 RIGHTS_TARGET_NOT_FOUND; visible target without legal grant returns 403 RIGHTS_WITHDRAWAL_FORBIDDEN |
| BE27E-DCD24 | Account/holder controller; privacy worker; support case-bound | Account must control holder; export is delivered to verified destination; erasure respects legal hold and lawful retention | Hidden account/holder returns 404 ACCOUNT_CONTEXT_NOT_FOUND; visible account without control returns 403 PORTABILITY_FORBIDDEN |

The service never treats a vendor request as a final rights verdict. Buyer and holder identity are pseudonymized in events and exports where law permits. Organization accounts require canonical controlled-party grants. Support cannot erase acquisition epochs, override a legal hold, delete perpetual artifacts, or convert an enforcement request into refund/entitlement revocation without the owning workflow.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE27E-DCD20 | requestId → CORS → auth → reporter/reviewer context → rate limit → idempotency → strict body validation → target/evidence scope → case workflow → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; evidence hashes; reporter/vendor separation; platform adjudication required |
| BE27E-DCD21 | requestId → CORS → auth → vendor/governance context → rate limit → idempotency → strict body validation → continuity/order gate → retirement lock → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; product list bound; continuity manifest; new-sales stop forced; no artifact deletion |
| BE27E-DCD22 | requestId → CORS → emergency worker auth → malware scope → rate limit → idempotency → strict body validation → evidence verifier → delivery kill → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; emergency/evidence required; immediate in-flight kill; entitlement evidence retained |
| BE27E-DCD23 | requestId → CORS → legal/reviewer auth → rights scope → rate limit → idempotency → strict body validation → legal record verifier → smallest-scope planner → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; legal record required; affected/unaffected set; no whole-catalog removal |
| BE27E-DCD24 | requestId → CORS → auth → holder/privacy context → rate limit → idempotency → strict body validation → legal-hold/export gate → signed export worker → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; verified account/destination; export before erase; pseudonymous lawful retention |

All routes apply CSRF protection for browser credentials, origin allowlisting, content-type/body-size limits, safe response headers, request-scoped tracing, and structured redaction. Object evidence and exports use BE-00 short-lived purpose grants. Public events contain hashes/status only; export manifests omit provider secrets and unrelated parties.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE27E-DCD20 | Required key/body hash; one active case per target/reason window; target case lock; replay original | 10 per reporter per 10 minutes, burst 2 | p95 1.5 s, hard 15 s; review async |
| BE27E-DCD21 | Required key/body hash; one retirement per vendor/effective policy revision; vendor lock; order handoff dedupe | 5 per vendor per day, burst 1 | p95 2 s, hard 20 s; continuity/order workers async |
| BE27E-DCD22 | Required key/body hash; unique artifact/scope/evidence; emergency artifact lock; delivery kill idempotent | 30 per emergency worker per minute, burst 5 | p95 1.2 s, hard 15 s; kill must be bounded |
| BE27E-DCD23 | Required key/body hash; unique artifact/legal record/scope; legal scope lock; appeal versioned | 20 per legal reviewer per 10 minutes, burst 3 | p95 1.5 s, hard 15 s; notice async |
| BE27E-DCD24 | Required key/body hash; one active portability job per account/action; export manifest and erasure lock | 5 per account per day, burst 1 | p95 2 s, hard 20 s; export job async |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Worker leases expire after eight attempts. A timeout never deletes data, duplicates a withdrawal, or starts a second export/erasure job. Legal-hold and export order checks run inside the erasure transaction.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE27E-DCD20 | enforcement_request_total by reason/state; appeal_open_total; vendor_direct_action_total; latency | requestId, operationId, target hash, reporter/reviewer role, reason class, state, result; no description/legal text | digital_enforcement.requested.v1; case/evidence/notice audit |
| BE27E-DCD21 | retirement_total; sales_stop_total; continuity_block_total; committed_order_handoff_total; latency | requestId, operationId, vendor/product hash, manifest version, effective class, order policy, result; no legal identity | digital_vendor.retired.v1; retirement/order handoff audit |
| BE27E-DCD22 | malicious_withdrawal_total; in_flight_kill_total; unsafe_partial_total; delivery_revoke_latency | requestId, operationId, artifact/scope hash, evidence count, emergency flag, result | digital_artifact.withdrawn.v1; delivery kill/unsafe evidence |
| BE27E-DCD23 | rights_withdrawal_total by scope; legal_record_reject_total; appeal_open_total; unaffected_retained_total | requestId, operationId, artifact/scope hash, legal record hash, affected count, result | digital_artifact.withdrawn.v1; scope/legal/notice audit |
| BE27E-DCD24 | portability_job_total by action/state; export_ready_total; legal_hold_block_total; anonymization_total; latency | requestId, operationId, account/holder hash, action, format, destination class, result; no exported content | export/erase audit; protected manifest and retention decision |

Trace spans include enforcement.case, retirement.continuity, malicious.kill, rights.scope, portability.export, and erasure.anonymize, preserving denials, legal holds, in-flight kills, appeal, provider retries, and data deletion safeguards. the structured diagnostic boundary scrubs legal records, account IDs, evidence URLs, provider secrets, and exported content. Alerts fire on vendor direct execution, whole-catalog rights removal, artifact deletion attempt, erasure before export, or acquisition evidence deletion.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck reporter/reviewer role, target scope, evidence purpose, continuity/order handoff, delivery kill authority, legal record, account/holder control, export completion, retention policy, and expected versions. Every mutation writes audit and outbox rows in the same transaction. Artifact bytes and export bytes remain in protected object storage.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.digital_enforcement_requests | id uuid PRIMARY KEY; target_product_id uuid NULL REFERENCES platform_private.digital_products(id); target_product_version_id uuid NULL REFERENCES platform_private.digital_product_versions(id); target_artifact_version_id uuid NULL REFERENCES platform_private.digital_artifact_versions(id); target_asset_id uuid NULL REFERENCES platform_private.digital_assets(id); target_entitlement_id uuid NULL REFERENCES platform_private.digital_entitlements(id); reporter_party_id uuid NOT NULL REFERENCES identity.parties(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); reason_code text NOT NULL CHECK (reason_code IN ('malware_suspected','rights_complaint','policy_risk','fraud_signal','buyer_report')); description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 4000); requested_action text NOT NULL CHECK (requested_action IN ('review','suspend_delivery','blacklist_review')); state text NOT NULL CHECK (state IN ('received','under_review','delivery_suspended','appeal_open','resolved')); appealable boolean NOT NULL DEFAULT true CHECK (appealable = true); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(reporter_party_id,target_artifact_version_id,reason_code) | (state,created_at DESC); (vendor_party_id,state); (target_artifact_version_id,created_at DESC); (target_asset_id,state); (reason_code,created_at DESC) | Reporter sees own case; vendor sees permitted response; reviewer/support case-bound; forced RLS; no direct client grant |
| platform_private.digital_artifact_withdrawals | id uuid PRIMARY KEY; artifact_version_id uuid NOT NULL REFERENCES platform_private.digital_artifact_versions(id); product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); scope text NOT NULL CHECK (scope IN ('artifact_version','asset','container')); reason_code text NOT NULL CHECK (reason_code IN ('malicious','rights','superseded','defective')); affected_asset_ids uuid[] NOT NULL CHECK (cardinality(affected_asset_ids) BETWEEN 1 AND 100); unaffected_scope_hash char(64) NULL CHECK (unaffected_scope_hash ~ '^[a-f0-9]{64}$'); legal_record_id uuid NULL; evidence_count integer NOT NULL CHECK (evidence_count BETWEEN 1 AND 30); emergency boolean NOT NULL DEFAULT false; in_flight_policy text NOT NULL CHECK (in_flight_policy IN ('stop_immediately','finish_with_warning','scope_stop')); entitlement_evidence_retained boolean NOT NULL DEFAULT true CHECK (entitlement_evidence_retained = true); state text NOT NULL CHECK (state IN ('emergency_pending','pending_legal','withdrawn','quarantined','appeal_open')); effective_at timestamptz NOT NULL; version bigint NOT NULL CHECK (version > 0); created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(artifact_version_id,scope,reason_code,version) | (artifact_version_id,state); (product_id,reason_code,state); (effective_at,state); (legal_record_id); (affected_asset_ids) GIN | Safety/legal worker writes; delivery worker reads; vendor/holder safe projection; forced RLS; no direct client grant |
| platform_private.digital_vendor_retirements / VendorContinuityManifest | id uuid PRIMARY KEY; vendor_id uuid NOT NULL REFERENCES identity.parties(id); continuity_manifest_id uuid NOT NULL REFERENCES platform_private.vendor_continuity_manifests(id); product_ids uuid[] NOT NULL CHECK (cardinality(product_ids) BETWEEN 1 AND 100); effective_at timestamptz NOT NULL; committed_order_policy text NOT NULL CHECK (committed_order_policy = 'owned_or_refunded'); reason_code text NOT NULL CHECK (reason_code ~ '^[A-Z0-9_:-]{2,80}$'); state text NOT NULL CHECK (state IN ('scheduled','retired','continuity_pending','blocked')); new_sales text NOT NULL DEFAULT 'stopped' CHECK (new_sales = 'stopped'); perpetual_artifacts_retained boolean NOT NULL DEFAULT true CHECK (perpetual_artifacts_retained = true); version bigint NOT NULL CHECK (version > 0); created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(vendor_id,effective_at,version) | (vendor_id,state); (effective_at,state); (continuity_manifest_id); (product_ids) GIN | Vendor/governance worker scoped; holders see passive state; order/continuity workers read; forced RLS; no direct client grant |
| platform_private.digital_portability_jobs | id uuid PRIMARY KEY; account_id uuid NOT NULL REFERENCES auth.users(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); action text NOT NULL CHECK (action IN ('export','erase','export_then_erase')); export_format text NOT NULL CHECK (export_format IN ('json','jsonl','zip_manifest')); destination text NOT NULL CHECK (destination IN ('signed_download','provider_transfer')); legal_hold_checked boolean NOT NULL CHECK (legal_hold_checked = true); state text NOT NULL CHECK (state IN ('queued','export_ready','erase_pending','anonymized','blocked_legal_hold','failed')); export_required boolean NOT NULL DEFAULT true CHECK (export_required = true); lawful_retention boolean NOT NULL DEFAULT true CHECK (lawful_retention = true); export_manifest_object_id uuid NULL REFERENCES platform_private.object_refs(id); export_manifest_sha256 char(64) NULL CHECK (export_manifest_sha256 ~ '^[a-f0-9]{64}$'); expires_at timestamptz NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(account_id,action) WHERE state IN ('queued','export_ready','erase_pending') | (account_id,state); (holder_party_id,state); (expires_at,state); (export_manifest_sha256) | Account/controller sees own job; privacy worker updates; BE-00 grants export; forced RLS; no direct client grant |
| platform_private.digital_erasure_plans | id uuid PRIMARY KEY; portability_job_id uuid NOT NULL UNIQUE REFERENCES platform_private.digital_portability_jobs(id); account_id uuid NOT NULL REFERENCES auth.users(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); export_completed_at timestamptz NULL; legal_hold_state text NOT NULL CHECK (legal_hold_state IN ('clear','blocked','partial_retention')); removable_scope jsonb NOT NULL; retained_scope jsonb NOT NULL; anonymization_policy_version text NOT NULL; state text NOT NULL CHECK (state IN ('pending_export','ready','blocked_legal_hold','anonymized','failed')); completed_at timestamptz NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (account_id,state); (holder_party_id,state); (legal_hold_state); (portability_job_id) unique | Privacy worker only; support case-bound read; lawful retention projection; forced RLS; no direct client grant |
| platform_private.digital_enforcement_appeals | id uuid PRIMARY KEY; case_id uuid NOT NULL REFERENCES platform_private.digital_enforcement_requests(id); appellant_party_id uuid NOT NULL REFERENCES identity.parties(id); reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 4000); evidence_count integer NOT NULL CHECK (evidence_count BETWEEN 1 AND 30); state text NOT NULL CHECK (state IN ('received','under_review','accepted','rejected','withdrawn')); reviewer_party_id uuid NULL REFERENCES identity.parties(id); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; decided_at timestamptz NULL; UNIQUE(case_id,version) | (case_id,created_at DESC); (appellant_party_id,state); (state,created_at DESC); (reviewer_party_id) | Appellant sees own; reviewer/support case-bound; forced RLS; no direct client grant |
| platform_private.digital_enforcement_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload protected |

The target columns require at least one non-null target through database CHECK and RPC validation. Malicious rows force entitlement_evidence_retained true and in_flight_policy stop_immediately; rights rows require legal_record_id and preserve unaffected_scope_hash. The portability partial unique index is implemented as a PostgreSQL partial unique index matching active states. Erasure plans retain a machine-readable removable/retained scope and cannot delete acquisition epochs or lawful contractual records.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Reporter/buyer/vendor | Own enforcement submission and safe case/appeal status | GCF20 request; appeal through scoped case workflow | Cannot execute blacklist, alter delivery, erase evidence, or see unrelated identity |
| Vendor/governance controller | Own retirement/continuity status and committed-order handoff | GCF21 with manifest and policy | Cannot delete perpetual artifacts, cancel settled title, or force enforcement |
| Trust and Safety/malware worker | Scoped artifact/evidence and delivery state | GCF22 emergency withdrawal RPC | Cannot change money/title or withdraw unrelated scope |
| Legal/copyright worker | Scoped legal record, affected/unaffected assets, appeals | GCF23 rights withdrawal RPC | Cannot remove whole catalog without scope; cannot erase acquisition records |
| Holder/account controller | Own portability job, export status, safe retained-state result | GCF24 verified account/holder RPC | Cannot export another account, bypass legal hold, or delete lawful records |
| Privacy worker | Account export manifest and retention plan | Export/erasure worker RPC | Cannot omit mandatory history or disclose provider secrets |
| Entitlement/delivery worker | Scoped grant/entitlement/artifact withdrawal state | State/revoke handoff from approved event | Cannot invent enforcement verdict or alter original artifact |
| Anon/authenticated table role | No direct table access | Public Hono routes only | Direct SQL/object/event grants denied |

## State Machines, Concurrency, and Failure Recovery

### Enforcement, withdrawal, retirement, and portability state machines

EnforcementCase: received → under_review → delivery_suspended or appeal_open → resolved. A vendor request never directly changes entitlement. Malicious withdrawal: emergency_pending → quarantined/withdrawn with in-flight stop immediately. Rights withdrawal: pending_legal → withdrawn or appeal_open with smallest valid scope. VendorRetirement: scheduled → continuity_pending → retired, with blocked exit if manifest/order handoff fails; new sales remain stopped once scheduled.

Entitlement state remains owned by 27c: pending_payment → active → suspended, commercially_revoked, refunded, chargeback, or expired. Enforcement may request an approved state effect but never erases issuance/acquisition. TransferGrant is revoked or marked unsafe by withdrawal according to reason. Perpetual artifacts remain retained after retirement unless a scoped malicious/rights withdrawal changes delivery.

PortabilityJob: queued → export_ready → erase_pending → anonymized, or blocked_legal_hold/failed. action export completes at export_ready; erase and export_then_erase require verified export manifest before anonymization. Lawful pseudonymous retention preserves perpetual contractual records, acquisition epochs, legal holds, and audit/outbox history.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Vendor blacklist request versus platform reviewer | Platform case/reviewer state wins; vendor cannot execute | Notify vendor/appeal; no automatic refund or entitlement revocation |
| Malicious withdrawal versus transfer range | Emergency kill wins immediately | Revoke grant, mark partial unsafe, preserve entitlement evidence |
| Rights withdrawal versus unrelated pack asset | Legal smallest-scope snapshot wins | Stop affected asset/container only; unaffected assets remain fetchable |
| Retirement versus committed order | New sales stop; Shard 28 resolves owned or refunded | Continuity/order worker reconciles; no paid-without-access |
| Retirement versus perpetual library | Entitlement/history wins | Passive retired row remains; required artifacts retained |
| Appeal versus withdrawal effect | Appeal does not restore unsafe bytes automatically | Reviewer may create new scoped decision; original event remains |
| Export versus erasure | Export manifest commit wins before anonymization | Legal hold or failed export blocks erasure; retry same job |
| Legal hold versus erase | Legal hold wins | State blocked_legal_hold; retain lawful pseudonymous scope |
| Duplicate provider/webhook | Event ID and payload hash inbox dedupe | Replay result; divergent hash quarantines |
| Worker crash after withdrawal/export write | Transactional outbox preserves durable state | Lease retry; event ID/aggregate/version dedupe |
| Stale policy/manifest/version | Expected revision rejects write | Refetch current continuity/legal policy; old record remains |
| Deadlock/serialization conflict | No partial deletion/withdrawal | Retry twice at 50/150 ms; return 409 |

Outbox delivery is at-least-once; consumers refetch canonical state and dedupe event ID plus aggregate/version. Queue leases expire after eight attempts; poison legal/provider payloads quarantine. No recovery path deletes original acquisition evidence or changes a withdrawal from scoped to global without a new authorized record.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| Trust and Safety/case service | { caseId, targetHash, reasonCode, evidenceHashes, requestedAction, actorRole } | { caseId, state: received/under_review/delivery_suspended/appeal_open/resolved, appealable, version } | 5,000 ms | 3 retries at 300/900/1800 ms for timeout/408/429/5xx; inquiry by caseId | Open after 5 failures in 120 s; case remains pending |
| BE-00 storage withdrawal/kill | { artifactId, scope, reasonCode, effectiveAt, inFlightPolicy, evidenceHashes } | { withdrawalId, state, killedGrantCount, unsafeRangeCount, scopeHash } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by withdrawalId | Open after 5 failures in 120 s; delivery fails closed |
| BE-27c entitlement/delivery | { entitlementId, artifactVersionId, action, withdrawalId, expectedVersion } | { accepted: true, grantState, entitlementState, evidenceRetained: true, version } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict; no retry on policy deny | Open after 3 failures in 30 s; no stale grant action |
| Shard 28 order/refund/revenue | { vendorId, productIds, retirementId, committedOrderPolicy, continuityManifestId } | { handoffId, ordersOwned, ordersRefunded, state, version } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by retirementId | Open after 5 failures in 120 s; retirement continuity_pending |
| Legal/copyright registry | { legalRecordId, artifactId, affectedAssetIds, unaffectedScopeHash, evidenceHashes } | { recordReceipt, state: valid/invalid/pending, scopeHash, appealWindow } | 5,000 ms | 2 retries at 300/900 ms for timeout/408/429/5xx; inquiry by legalRecordId | Open after 5 failures in 120 s; rights withdrawal pending |
| BE-00 export/retention service | { portabilityJobId, accountId, holderPartyId, format, destination, removableScope, retainedScope } | { manifestObjectId, manifestSha256, state: ready/blocked, expiresAt, retentionDecision } | 8,000 ms | 3 retries at 300/900/1800 ms for timeout/408/429/5xx; inquiry by job ID | Open after 5 failures in 120 s; erasure remains pending |
| BE-27b/27d artifact continuity | { vendorId, productIds, manifestId, withdrawalImpact, currentVersions } | { continuityValid: true/false, requiredArtifacts, version } | 3,000 ms | 2 retries at 200/600 ms on timeout/408/429/5xx; no retry on invalid manifest | Open after 5 failures in 60 s; retirement blocked |

Provider responses are schema-validated; unknown legal/continuity/export/withdrawal state is pending or blocked. Correlation IDs and provider records are hashed in logs. No seam can delete artifacts, erase acquisition, refund money, or broaden smallest-scope withdrawal.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| digital_enforcement.requested.v1 | BE27E-DCD20 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, caseId, targetHash, reasonClass, evidenceHash, appealable } | Case/reviewer/notification consumers refetch state |
| digital_artifact.withdrawn.v1 | BE27E-DCD22/DCD23 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, withdrawalId, artifactHash, scope, reason, effectiveAt } | 27c kills/restricts delivery; library preserves reason/history |
| digital_vendor.retired.v1 | BE27E-DCD21 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, retirementId, vendorHash, continuityState, effectiveAt } | Catalog stops sales; 27c/Shard 28 reconcile owner/refund |
| digital_entitlement.state_changed.v1 | Approved state handoff from 27c | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, priorState, newState, triggerCode } | Library/delivery refetch live authority |
| digital_product.version_submitted.v1 | 27b | { eventId, aggregateId, aggregateVersion, productVersionId, submissionId, state } | Enforcement impact context |
| digital_product.qa_completed.v1 | 27b | { eventId, aggregateId, aggregateVersion, submissionId, scopes, results } | Malware/review context |
| digital_product.published.v1 | 27b | { eventId, aggregateId, aggregateVersion, productId, productVersionId, termsVersionId, artifactVersionId } | Retirement/withdrawal target context |
| digital_entitlement.issued.v1 | 27c | { eventId, aggregateId, aggregateVersion, entitlementId, epochId, productId, holderHash, origin } | Portability/export source |
| digital_transfer.grant_created.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, artifactVersionId, expiry } | Malicious/rights kill target |
| digital_transfer.completed.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, artifactVersionId, hash, ranges } | Unsafe/rights impact evidence |
| digital_product.update_published.v1 | 27d | { eventId, aggregateId, aggregateVersion, productId, priorVersionId, newVersionId } | Withdrawal/retirement impact |
| digital_asset.metadata_changed.v1 | 27d | { eventId, aggregateId, aggregateVersion, assetId, priorVersion, newVersion } | Smallest-scope asset mapping |

Outbox rows include event ID, aggregate ID/version, request ID, payload hash, and redacted payload. Events never contain legal records, source bytes, provider credentials, licence keys, signed URLs, or buyer identity maps. Consumers acknowledge only after durable processing and refetch canonical state.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE27E-DCD20 | Hidden target/case or reporter context | 404 | ENFORCEMENT_TARGET_NOT_FOUND | Do not reveal |
| BE27E-DCD20 | Evidence/reason invalid or vendor direct action | 403 or 422 | ENFORCEMENT_FORBIDDEN or ENFORCEMENT_EVIDENCE_INVALID | Use platform case/reviewer |
| BE27E-DCD20 | Duplicate active case | 409 | ENFORCEMENT_ALREADY_OPEN | Refetch case/appeal |
| BE27E-DCD21 | Hidden vendor/product | 404 | VENDOR_NOT_FOUND | Do not reveal |
| BE27E-DCD21 | Continuity manifest/order policy invalid | 409 | RETIREMENT_CONTINUITY_CONFLICT | Repair continuity or await Shard 28 |
| BE27E-DCD21 | Retirement duplicate/stale vendor | 409 | RETIREMENT_VERSION_CONFLICT | Refetch vendor state |
| BE27E-DCD22 | Hidden artifact | 404 | ARTIFACT_NOT_FOUND | Do not reveal |
| BE27E-DCD22 | Emergency evidence/scope invalid | 422 | MALICIOUS_WITHDRAWAL_INVALID | Supply scoped evidence |
| BE27E-DCD22 | Delivery kill provider unavailable | 503 | DELIVERY_KILL_UNAVAILABLE | Retry same key; fail closed |
| BE27E-DCD23 | Hidden artifact/legal target | 404 | RIGHTS_TARGET_NOT_FOUND | Do not reveal |
| BE27E-DCD23 | Legal record missing/invalid | 409 | RIGHTS_RECORD_REQUIRED | Obtain valid scoped record |
| BE27E-DCD23 | Affected/unaffected scope conflicts | 422 | RIGHTS_SCOPE_INVALID | Recompute smallest scope |
| BE27E-DCD24 | Hidden account/holder | 404 | ACCOUNT_CONTEXT_NOT_FOUND | Do not reveal |
| BE27E-DCD24 | Export not ready or legal hold | 409 | EXPORT_REQUIRED or LEGAL_HOLD_BLOCKED | Await export or retain data |
| BE27E-DCD24 | Destination/account control invalid | 403 | PORTABILITY_FORBIDDEN | Verify account/holder |
| All | Body/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and same idempotency key |
| All | Case/storage/legal/export circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; fail closed |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes/paths only and never legal records, account identity, provider secrets, evidence originals, or artifact bytes.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27E-CON-001 | BE27E-DCD20 | Strict enforcement request/response enforces target, reason/evidence, platform review, appealability, and no direct vendor action |
| BE27E-CON-002 | BE27E-DCD21 | Strict retirement enforces vendor/products, continuity manifest, effective time, owned/refunded policy, and perpetual retention |
| BE27E-CON-003 | BE27E-DCD22 | Strict malicious removal enforces scope, emergency evidence, in-flight stop, unsafe markers, and retained entitlement evidence |
| BE27E-CON-004 | BE27E-DCD23 | Strict rights removal enforces legal record, affected/unaffected scope, smallest withdrawal, and appeal state |
| BE27E-CON-005 | BE27E-DCD24 | Strict export/erase enforces account/holder, destination, legal hold, export-before-erase, and lawful retention |
| BE27E-ROUTE-001 | BE27E-DCD20 through BE27E-DCD24 | Method/path/operation registry is authoritative; aliases cannot bypass scope or deletion gates |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27E-AUTH-001 | BE27E-DCD20 through BE27E-DCD24 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE27E-AUTH-002 | BE27E-DCD20 | Vendor request cannot execute enforcement; reviewer/platform case and appeal are required |
| BE27E-AUTH-003 | BE27E-DCD21 through BE27E-DCD23 | Governance, Trust and Safety, and legal scopes are distinct; no artifact deletion or whole-catalog rights removal |
| BE27E-AUTH-004 | BE27E-DCD24 | Account/holder control, destination purpose, legal hold, export manifest, and pseudonymous retention are enforced |
| BE27E-AUTH-005 | All | CORS policy digital-api, CSRF, signed callbacks/exports, redaction, and no direct table/object grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27E-DB-001 | All | Forced RLS denies direct access; RPC checks role, target, evidence, policy, version, legal scope, and append-only history |
| BE27E-DB-002 | BE27E-DCD20 | Case/reason/evidence uniqueness, appeal state, vendor/report separation, and notification outbox hold |
| BE27E-DB-003 | BE27E-DCD21 | Retirement/vendor uniqueness, continuity manifest, sales stop, order handoff, and artifact retention hold |
| BE27E-DB-004 | BE27E-DCD22, BE27E-DCD23 | Withdrawal scope, in-flight policy, legal record, unaffected hash, delivery kill, and event dedupe hold |
| BE27E-DB-005 | BE27E-DCD24 | Export job uniqueness, manifest hash, erasure plan, legal hold, removable/retained scope, and no acquisition deletion hold |
| BE27E-DB-006 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27E-DOM-001 | BE27E-DCD20 | Blacklist is a platform-adjudicated, appealable case distinct from refund or entitlement revocation |
| BE27E-DOM-002 | BE27E-DCD21 | Retirement stops sales, preserves perpetual artifacts/library evidence, and routes committed orders owned/refunded |
| BE27E-DOM-003 | BE27E-DCD22, BE27E-DCD23 | Malicious kill and rights smallest-scope withdrawal differ; unaffected content and acquisition evidence remain |
| BE27E-DOM-004 | BE27E-DCD24 | Export precedes eligible erase; lawful pseudonymous records survive; provider secrets and unrelated parties never export |
| BE27E-SEAM-001 | BE27E-DCD20 through BE27E-DCD24 | BE-00, Trust and Safety, storage kill, BE-27c, Shard 28, legal registry, continuity, and export timeout/retry/circuit behavior is exact |
| BE27E-EVT-001 | BE27E-DCD20 through BE27E-DCD24 | Exact event types, redaction, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE27E-REC-001 | BE27E-DCD20 through BE27E-DCD24 | Lost responses, provider outage, in-flight kill, appeal, retirement/order handoff, scope conflict, legal hold, export failure, deadlock, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 27.20–27.24 map one-to-one to BE27E-DCD20–DCD24 |
| D2 enforcement | Can vendor request directly blacklist or revoke an entitlement? | No: platform case/reviewer/appeal controls state effect; refund remains Shard 28 |
| D3 withdrawal | Are malicious and rights withdrawal scopes/in-flight effects distinct? | Yes: malicious kills immediately; rights requires legal record and smallest valid scope |
| D4 retirement | Can retirement delete perpetual artifacts or leave committed payment without access? | No: continuity manifest and owned/refunded Shard 28 handoff are required |
| D5 portability | Can erasure precede export or delete lawful acquisition evidence? | No: export manifest/legal-hold checks precede anonymization; retained scope is explicit |
| D6 privacy | Can legal records, buyer identity, keys, provider secrets, or bytes leak? | No: hashes, scoped projections, purpose-bound exports, redaction, and lawful pseudonymous retention |
| D7 authorization | Are role ownership and 403 versus 404 explicit? | Yes: every operation has scoped role and concealment row |
| D8 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed |
| D9 resilience | Are provider/worker races deterministic? | Yes: locks, idempotency, retries, leases, inquiry, quarantine, and fail-closed behavior are specified |
| D10 boundary | Does this duplicate catalog/publication/entitlement/update/commerce authorities? | No: endpoint reconciliation and dependency references assign each adjacent authority |

## Ambiguity Gate

PASS. Evidence: 27.20–27.24 each map to one authoritative operation and route; VendorContinuityManifest and enforcement/withdrawal/retirement/portability records are owned while ArtifactVersion, Entitlement, AcquisitionEpoch, LibraryProjection, DigitalAsset, DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, SeatAuthorization, and TransferGrant are consumed without route duplication; exact strict Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy digital-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; platform adjudication, appeal, retirement continuity, malicious immediate kill, rights smallest-scope withdrawal, perpetual evidence retention, export-before-erase, legal holds, exact seams, event privacy, and recovery are resolved. Neighboring interactions 27.01–27.19 are referenced through explicit BE-27a/b/c/d and Shard 28 handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, object storage, retention, exports, and forced RLS.
- BE-23/24 identity and collections: canonical person/org acting-party, holder, provenance, ownership, and custody boundaries.
- BE-25b listing/disclosure lifecycle: immutable listing/disclosure revisions and product impact context.
- BE-27a digital product catalog/compatibility: DigitalProduct, ProductVersion, CompatibilityMatrix, and DependencyEdge.
- BE-27b digital submission/QA/publication: VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, and VendorContinuityManifest.
- BE-27c entitlements/library/delivery: Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, live authorization, and state effects.
- BE-27d updates/assets/trials: DigitalAsset, updates, channel, audition, organization, and trial projections.
- Shard 28 commerce/refund/revenue: committed-order owned/refunded handoff, payment/refund/revocation, and revenue outcomes.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 27.20–27.24; platform enforcement/appeal, retirement continuity, malicious and rights smallest-scope withdrawal, portability/export/erasure, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
