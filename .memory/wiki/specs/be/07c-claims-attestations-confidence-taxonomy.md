# BE 07c — Claims, attestations, provenance confidence and taxonomy

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 07 — Credit graph, capture and confidence | 07c — Claims, attestations, confidence and taxonomy | CRD-12 through CRD-18; external credit candidates, shell claims, attestation requests/answers/retractions, provenance derivation, credit contests, role aliases and instrument vocabulary. |

The canonical IA source is .memory/wiki/specs/ia/07-credits-core.md. Its approved deep dive is .memory/wiki/specs/ia/deep-dives/07-credits-core.md. 07a owns immutable credit assertions, visibility, graph projections, corrections, merges and page curation. 07b owns session capture and offline merge. This companion never creates rights, splits, payment, ownership, popularity or a person-level trust score.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CRD-12 Import external credit | CRD-07C-01 | Licensed source candidate ingestion command | A service worker preserves source row/hash, exact-resolves identity and taxonomy where possible, queues unresolved candidates and never publishes automatically. |
| CRD-13 Claim unclaimed credit | CRD-07C-02 | Verified shell-to-party claim command | Identity verification links a claimant to a shell but does not confirm contribution; first claimant remains attached during contest and rejection is permanent. |
| CRD-14 Request attestation | CRD-07C-03 | Independent present-human attestation request command | Credited party, session owner or close workflow may ask a present independent human under context, block, dispute and cadence predicates. |
| CRD-15 Answer/retract attestation | CRD-07C-04 | Immutable attestation answer or retraction command | Attester answers confirm, refuse or dont_know against the displayed claim hash; retraction appends and preserves the original edge. |
| CRD-16 Derive provenance | CRD-07C-05 | Evidence-set provenance derivation command | Worker derives categorical rung from eligible evidence and keeps internal score separate; failure is unavailable, never lowest or stale higher tier. |
| CRD-17 Contest credit | CRD-07C-06 | Participant contest and Shard 06 case-link command | Authorized participant opens a case-linked contest; public credit remains under existing visibility while participant outcome and discovery weighting update. |
| CRD-18 Resolve pending taxonomy alias | CRD-07C-07 | Reviewed role-alias and instrument vocabulary resolution command | Taxonomy administrator resolves exact alias or rejects it; deprecation never rewrites assertion-time role or instrument history. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/07-credits-core.md | title, links, overview and scope lines 1-24 | Establishes contribution truth, confidence separation and role/instrument vocabulary ownership. |
| .memory/wiki/specs/ia/07-credits-core.md | features and acceptance criteria lines 25-55 | Supplies import, claim, attestation, derivation, contest and taxonomy requirements. |
| .memory/wiki/specs/ia/07-credits-core.md | interactions and global rules lines 56-87 | Supplies exact CRD-12 through CRD-18 IDs, preconditions, error behavior and no-inference rules. |
| .memory/wiki/specs/ia/07-credits-core.md | core/error and claims, attestation, confidence and taxonomy contracts lines 88-100 and 124-143 | Defines ProvenanceRung, AttestationAnswer, StandardError, ImportCreditCandidate, ClaimCredit, RequestAttestation, RecordAttestation, DeriveProvenance, OpenCreditDispute, ResolveRole, RoleVersion, InstrumentVersion and TaxonomyChange. |
| .memory/wiki/specs/ia/07-credits-core.md | data models and typed registry lines 144-197 | Defines external_credit_candidate, credit_claim, attestation_request, attestation, provenance_derivation, credit_contest, role_version, role_alias, pending_role_alias and instrument_version. |
| .memory/wiki/specs/ia/07-credits-core.md | access control and escalation lines 198-223 | Defines credited party, session participant, Producer, taxonomy admin, dispute reviewer and system-worker permissions. |
| .memory/wiki/specs/ia/07-credits-core.md | accessibility and event schemas lines 224-248 | Defines participant-safe contest state and credit.claim.changed.v1, credit.attestation.changed.v1, credit.provenance.derived.v1, credit.contest.changed.v1 and credit.taxonomy.changed.v1. |
| .memory/wiki/specs/ia/07-credits-core.md | edge cases and coverage matrix lines 249-295 | Supplies claim conflict, attestation refusal/retraction, derivation outage, taxonomy outage, unresolved contest, deletion and concurrency outcomes. |
| .memory/wiki/specs/ia/07-credits-core.md | cross-shard map, changelog and dependencies lines 296-359 | Establishes Shards 00, 01, 06, 09 and 10 contracts and downstream projection limits. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | scope and deepening record lines 1-18 | Confirms no credit-to-right inference, no roll-to-credit promotion, no fuzzy auto-resolution and converged boundaries. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | canonical field contracts lines 20-35 | Supplies exact candidate, claim, attestation, derivation, role, alias and instrument fields. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | attestation and provenance algorithm lines 67-76 | Defines independence, cadence, hash binding, private refusal, retraction, score/rung separation and unavailable derivation. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | correction, merge and dispute verification lines 78-111 | Defines party-change routing, negative assertions, contest visibility and abuse controls. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | cross-shard contracts and implementation envelope lines 113-132 | Binds BE00, Shards 01, 06, 09 and 10 to PostgreSQL RLS, Hono/Zod, queue and outbox boundaries. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | changelog and dependency references lines 134-157 | Records locked decisions and dependency direction. |

## IA Source Map

### Interaction map

| IA interaction | Backend operation | Owned command and invariant | Source trace |
|---|---|---|---|
| CRD-12 Import external credit | CRD-07C-01 | Preserve licensed source row/hash, exact-resolve identities and taxonomy, queue candidate review and cap below captured tiers. | Parent IA line 47 and interaction line 71; deep dive lines 47-54 and 107-108. |
| CRD-13 Claim unclaimed credit | CRD-07C-02 | Verify claimant identity, attach first claimant to shell and route conflict to witness or Shard 06 without silent reassignment. | Parent IA line 48 and interaction line 72; deep dive lines 96-103. |
| CRD-14 Request attestation | CRD-07C-03 | Ask only an independent present human under context, block, dispute, cadence and outstanding limits. | Parent IA line 49 and interaction line 73; deep dive lines 67-72. |
| CRD-15 Answer/retract attestation | CRD-07C-04 | Bind answer to displayed claim hash; preserve private refusal and append retraction. | Parent IA line 50 and interaction line 74; deep dive lines 72-76. |
| CRD-16 Derive provenance | CRD-07C-05 | Derive categorical rung from eligible evidence; keep score internal; emit unavailable on failure. | Parent IA line 51 and interaction line 75; deep dive lines 73-76. |
| CRD-17 Contest credit | CRD-07C-06 | Open participant-only contest linked to Shard 06; public record remains and discovery weight is controlled by outcome. | Parent IA line 52 and interaction line 76; deep dive lines 96-111. |
| CRD-18 Resolve pending taxonomy alias | CRD-07C-07 | Reviewed administrator maps pending literal or rejects it; assertion-time history remains immutable. | Parent IA line 53 and interaction line 77; deep dive lines 33-34 and 107-109. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| external_credit_candidate | CRD-07C-01 | Source/license/hash, raw identifiers, exact matches, review state and negative assertion. | Parent IA line 159; deep dive line 45 or candidate algorithm lines 47-54. |
| credit_claim | CRD-07C-02 | Credit/shell/claimant, identity evidence, first-claim state, witness and case link. | Parent IA line 160; deep dive line 30. |
| attestation_request | CRD-07C-03 and CRD-07C-04 | Credit claim hash, attester, requester, cadence, delivery and answer state. | Parent IA line 161; deep dive line 29 and lines 67-72. |
| attestation | CRD-07C-04 and CRD-07C-05 | Immutable answer edge, claim hash, attester independence, private reason and retraction chain. | Parent IA line 161; deep dive line 31. |
| provenance_derivation | CRD-07C-05 | Evidence-set hash, algorithm version, categorical rung, internal score, explanation and unavailable reason. | Parent IA line 162; deep dive line 32. |
| credit_contest | CRD-07C-06 | Participant opener, reason, participant visibility, Shard 06 case ID and outcome. | Parent IA line 163; deep dive lines 96-111. |
| role_version | CRD-07C-07 and CRD-07A-01 | Canonical base/modifier, party types, family, labels, DDEX fidelity, state and optional vault_role_class. | Parent IA line 164; deep dive line 33. |
| role_alias | CRD-07C-07 | Locale or alternate label mapped to a role version without rewriting assertions. | Parent IA line 164. |
| pending_role_alias | CRD-07C-01, CRD-07C-07 | Requester-scoped retained literal, bounded candidates, state and resolved role reference. | Parent IA line 164; deep dive line 34. |
| instrument_version | CRD-07C-01 and CRD-07C-02 | Separate functional hierarchy, locale labels and deprecation; make/model fields forbidden. | Parent IA line 165; deep dive lines 28 and 33. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.claim.changed.v1 | CRD-07C-02 | Claim, credit, shell, claimant state and version for inbox/profile/dispute projections. | Parent IA line 241. |
| credit.attestation.changed.v1 | CRD-07C-04 | Attestation, credit, answer, state and evidence hash for derivation. | Parent IA line 242. |
| credit.provenance.derived.v1 | CRD-07C-05 | Credit, evidence hash, rung, availability and version for discography/search/downstream consumers. | Parent IA line 243. |
| credit.contest.changed.v1 | CRD-07C-06 | Credit, Shard 06 case, participant state, outcome and version. | Parent IA line 244. |
| credit.taxonomy.changed.v1 | CRD-07C-07 | Vocabulary kind, canonical version, change, pending mapping and vault role class. | Parent IA line 245. |

Events contain opaque IDs, versions, hashes and safe state only. They exclude internal score, ring flags, private refusal identity, evidence narrative, protected session facts, candidate raw identifiers and unrestricted PII. Consumers refetch authorized projections.

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.04.01 | Attestation Request & Confirmation | CRD-07C-03 and CRD-07C-04 | Independent present human, context floor, cadence, claim-hash binding and immutable answer. |
| 02.04.02 | Provenance Tiers & Credit Confidence | CRD-07C-05 | Current eligible evidence derives categorical rung; score is internal and failure is unavailable. |
| 02.06 | Credit Role & Instrument Taxonomy | CRD-07C-07 | Reviewed role versions, aliases, pending literals, DDEX fidelity, vault role class and separate instruments. |
| 02.03.01 | External Catalog Import | CRD-07C-01 | Licensed source hash, exact matching, candidate queue and no auto-publish. |
| 02.03.02 | Claim Inbox & Suggested Claims | CRD-07C-01 and CRD-07C-02 | Candidate review, verified shell claim, first claimant and permanent rejection. |
| 02.04.04 | Attestation-Ring & Collusion Detection | CRD-07C-05 | Ring detection demotes internal score only; categorical rung and public record remain bounded. |
| 02.05 | Credit Dispute Resolution | CRD-07C-06 | Participant-only contest links to Shard 06 case and preserves public credit visibility. |
| 02.03.03 | Claim Adjudication | CRD-07C-02 and CRD-07C-06 | Claim conflict creates witness/case path and never silently reassigns shell. |
| 02.04.03 | Attestation Retraction | CRD-07C-04 | Retraction appends reason, preserves original and re-derives remaining evidence. |

Source trace: feature-ledger.md lines 27-29 contain 02.04.01, 02.04.02 and 02.06; lines 219-222 contain 02.03.01, 02.03.02, 02.04.04 and 02.05; lines 496-497 contain 02.03.03 and 02.04.03.

## Endpoint Completeness Reconciliation

Each owned interaction has one stable operation ID, route registry row, strict request and success schema, error row, authorization row, idempotency/rate rule, observability row and test row. CRD-07C-01 imports a candidate and never writes public credit. CRD-07C-02 proves identity linkage but not contribution. CRD-07C-03 and CRD-07C-04 separate request delivery from answer/retraction because the attester, claim hash and privacy rules differ. CRD-07C-05 derives from current eligible evidence and has no score projection. CRD-07C-06 links the participant contest to Shard 06 without hiding the credit. CRD-07C-07 resolves vocabulary history and does not rewrite assertion-time role or instrument references.

Inherited routes are not repeated:

- BE00 supplies request context, ApiError, idempotency, outbox, queue retry, offline replay and audit.
- BE01 supplies party, shell, membership, mandate, identity evidence, acting context and entity-independence snapshots.
- BE06 supplies scoped credit dispute cases and adjudication; 07c never adjudicates its own contested outcome.
- BE07a supplies immutable credit and visibility references; 07c appends claim/evidence links.
- BE07b supplies session, overlap, roll and contribution references; 07c does not infer presence.
- BE09 supplies project/session/part source truth; BE10 consumes credit IDs as evidence and owns rights/splits.

## Shared Contract Inheritance

- Request envelope includes requestId, session or service principal, acting context, locale, schema version and trace context.
- Success envelope includes data, requestId and schemaVersion.
- Error envelope is exactly ApiError { code, message, requestId, details }. Every route uses it for 4xx and 5xx responses.
- Idempotency-Key binds actor, route, normalized input hash and schema version. Matching replay returns the original result; differing payload returns IDEMPOTENCY_MISMATCH with no second effect.
- Commands carry expectedVersion or evidenceSetHash. Compare-and-set losers return VERSION_CONFLICT. Derivation retries by evidence-set hash and algorithm version.
- Transactional outbox publishes claim, attestation, provenance, contest and taxonomy events only after canonical writes commit.
- Supabase PostgreSQL RLS protects identity evidence, private reasons, candidate raw IDs and attestation edges. Public projections never expose internal score or refusal identity.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CRD-07C-01 | CRD-12 Import external credit | POST /api/v1/credits/import-candidates | Licensed source service principal with import capability; source row scope | ImportCreditCandidateRequest | ImportCreditCandidateResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 600/min per source and 10,000/hour import lane | CORS non-browser licensed-source allowlist; BE00 principal, signature/replay, strict Zod, source scope, rate, queue and ApiError normalization |
| CRD-07C-02 | CRD-13 Claim unclaimed credit | POST /api/v1/credits/{creditId}/claims | Verified person claiming a shell-linked credit; Shard 01 identity authority | ClaimCreditRequest | ClaimCreditResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 3/day per claimant and 20/day per shell claim lane | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, identity evidence, rate, claim CAS, outbox and ApiError normalization |
| CRD-07C-03 | CRD-14 Request attestation | POST /api/v1/credits/{creditId}/attestation-requests | Credited party, session owner or close workflow; independent attester required | RequestAttestationRequest | RequestAttestationResponse 201 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/day per requester, 10/day per credit, one outstanding per credit/attester | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, independence/block/dispute gates, cadence rate, notification queue and ApiError normalization |
| CRD-07C-04 | CRD-15 Answer/retract attestation | POST /api/v1/attestations/{attestationRequestId}/responses | Named attester for answer; same attester for retraction; private response scope | RecordAttestationRequest | RecordAttestationResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 30/day per attester and 5/day per attestation retraction | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, request ownership, claim-hash check, rate, append transaction and ApiError normalization |
| CRD-07C-05 | CRD-16 Derive provenance | POST /api/v1/credits/{creditId}/provenance/derive | Registered derivation worker with algorithm capability; no user actor | DeriveProvenanceRequest | DeriveProvenanceResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 503 | Idempotency-Key required; 120/min per derivation worker and 20/min per credit | CORS non-browser derivation-service allowlist; BE00 principal, strict Zod, evidence-set hash, rate, queue and ApiError normalization |
| CRD-07C-06 | CRD-17 Contest credit | POST /api/v1/credits/{creditId}/contests | Credited party, participant, Producer/session owner or work/release owner | ContestCreditRequest | ContestCreditResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 5/day per participant and 30/day per credit | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, participant scope, rate, Shard 06 adapter, outbox and ApiError normalization |
| CRD-07C-07 | CRD-18 Resolve pending taxonomy alias | POST /api/v1/taxonomy/pending-aliases/{aliasId}/resolve | Taxonomy administrator with reviewed vocabulary capability | ResolvePendingAliasRequest | ResolvePendingAliasResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 60/hour per administrator and 600/hour taxonomy lane | CORS first-party staff allowlist with credentials; BE00 context, CSRF, strict Zod, taxonomy capability, rate, CAS, outbox and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details }; details contain only field paths, opaque IDs, state and retry metadata, never private reasons, identity evidence or internal score.
- 403 means a visible credit, shell, request or alias exists but the actor lacks claimant, participant, attester, worker or taxonomy authority. 404 means RLS hides the aggregate, the shell is not in the actor's projection, or an alias/request is non-enumerable and absent.
- 409 means idempotency mismatch, stale expected version, stale claim hash, duplicate active request or duplicate evidence-set derivation. 422 means ineligible attester, claim conflict, invalid source, fuzzy import, missing evidence, taxonomy mismatch or contest rule failure. 503 means a durable derivation or case command remains pending after an external dependency failure.
- Import, claim, request, answer, derive, contest and taxonomy writes append audit and outbox state atomically. No route writes ownership, rights, splits, royalty, popularity or a public internal score.
- Refusal, don't-know, muted, expired and unavailable states are not public negative assertions. A claim rejection is the explicit exception and remains a protected permanent negative assertion.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CRD-07C-01 | ImportCreditCandidateRequest to ImportCreditCandidateResponse with candidate, source hash, exact-match state, review state and provenance cap. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unlicensed source; SOURCE_NOT_FOUND 404 for hidden source row; IDEMPOTENCY_MISMATCH 409; SOURCE_HASH_INVALID, FUZZY_MATCH_FORBIDDEN or LICENSE_REQUIRED 422. |
| CRD-07C-02 | ClaimCreditRequest to ClaimCreditResponse with claim, shell, verification state, first-claim state, witness/case reference and version. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for resolved-party claim or failed claimant authority; CREDIT_NOT_FOUND 404 for hidden credit; CLAIM_CONFLICT or VERSION_CONFLICT 409; IDENTITY_EVIDENCE_INVALID 422. |
| CRD-07C-03 | RequestAttestationRequest to RequestAttestationResponse with request, delivered state, claim hash, cadence and next nudge. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-requester or visible blocked relationship; CREDIT_NOT_FOUND 404; VERSION_CONFLICT 409; ATTESTATION_INELIGIBLE or RATE_LIMITED 422. |
| CRD-07C-04 | RecordAttestationRequest to RecordAttestationResponse with immutable edge, answer/retraction state, claim hash and derivation queue state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-attester or wrong retracting actor; REQUEST_NOT_FOUND 404; VERSION_CONFLICT or stale hash 409; ANSWER_INVALID or RETRACTION_REASON_REQUIRED 422. |
| CRD-07C-05 | DeriveProvenanceRequest to DeriveProvenanceResponse with availability, rung, explanation and evidence-set version; score is absent. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unregistered worker; CREDIT_NOT_FOUND 404 for hidden credit; VERSION_CONFLICT 409; EVIDENCE_SET_INVALID 422; DERIVATION_UNAVAILABLE 503 with unavailable state. |
| CRD-07C-06 | ContestCreditRequest to ContestCreditResponse with contest, Shard 06 case, participant visibility and discovery-weight state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for nonparticipant; CREDIT_NOT_FOUND 404 for hidden credit; VERSION_CONFLICT or duplicate contest 409; DISPUTE_REQUIRED or CONTEST_INVALID 422. |
| CRD-07C-07 | ResolvePendingAliasRequest to ResolvePendingAliasResponse with alias, mapping/rejection, role version and taxonomy version. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-admin; ALIAS_NOT_FOUND 404; VERSION_CONFLICT 409; ROLE_MAPPING_INVALID, VAULT_CLASS_INVALID or DEPRECATED_TARGET 422. |

## Request/Response Contracts (Zod 4 schemas)

All schemas are Zod 4 strict objects. Unknown keys are rejected. UUIDs are opaque canonical IDs, dates are offset-aware ISO datetimes, hashes are lower-case hexadecimal and private fields are references to protected vault records.

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
const Key = z.string().min(16).max(128);

export const ImportCreditCandidateRequest = z.strictObject({
  idempotencyKey: Key,
  sourceRef: Id,
  sourceLicenseRef: Id,
  sourceRowHash: Hash,
  sourcePermanentHash: Hash,
  externalIdentifier: z.string().min(1).max(200),
  externalPartyIdentifier: z.string().min(1).max(200).optional(),
  externalWorkIdentifier: z.string().min(1).max(200).optional(),
  roleLiteral: z.string().min(1).max(160).optional(),
  taxonomyTerm: z.string().min(1).max(160).optional(),
  locale: z.string().min(2).max(20),
  sourceEvidenceRef: Id.optional(),
});
export const ImportCreditCandidateResponse = z.strictObject({
  candidateId: Id,
  sourceRowHash: Hash,
  sourcePermanentHash: Hash,
  identityMatch: z.enum(["exact", "unresolved"]),
  taxonomyMatch: z.enum(["exact", "alias", "pending"]),
  reviewState: z.enum(["queued", "reviewing", "resolved", "rejected", "negative_assertion"]),
  provenanceCap: z.literal("below_captured_tiers"),
  publicCreditCreated: z.literal(false),
  version: Version,
});

export const ClaimCreditRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  shellId: Id,
  claimantPartyRef: Id,
  identityEvidenceRef: Id,
  claimHash: Hash,
  witnessRequest: z.boolean(),
});
export const ClaimCreditResponse = z.strictObject({
  claimId: Id,
  creditId: Id,
  shellId: Id,
  claimantPartyRef: Id,
  state: z.enum(["suggested", "pending", "attached", "contested", "resolved", "unresolvable"]),
  firstClaimant: z.boolean(),
  identityVerified: z.literal(true),
  contributionConfirmed: z.literal(false),
  witnessRequestId: Id.optional(),
  caseId: Id.optional(),
  version: Version,
});

export const RequestAttestationRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  claimHash: Hash,
  attesterPartyRef: Id,
  sessionId: Id,
  overlapEvidenceRef: Id,
  workId: Id,
  contributionDate: z.string().date(),
  anotherPresentPartyRef: Id,
  boundedNote: z.string().max(500).optional(),
});
export const RequestAttestationResponse = z.strictObject({
  attestationRequestId: Id,
  creditId: Id,
  attesterPartyRef: Id,
  state: z.enum(["queued", "delivered", "answered", "expired", "muted"]),
  claimHash: Hash,
  outstandingCount: z.number().int().nonnegative(),
  nextNudgeAt: DateTime.optional(),
  cadenceState: z.enum(["eligible", "limited", "muted", "dormant"]),
  version: Version,
});

export const RecordAttestationRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  attestationRequestId: Id,
  claimHash: Hash,
  action: z.enum(["confirm", "refuse", "dont_know", "retract"]),
  privateReasonRef: Id.optional(),
  evidenceRefs: z.array(Id).max(20),
  retractionReason: z.string().min(1).max(500).optional(),
});
export const RecordAttestationResponse = z.strictObject({
  attestationId: Id,
  attestationRequestId: Id,
  state: z.enum(["confirmed", "refused", "dont_know", "retracted", "stale"]),
  answerKind: z.enum(["confirm", "refuse", "dont_know"]).optional(),
  claimHash: Hash,
  publicAttribution: z.enum(["attributable", "unattributed"]),
  privateReasonStored: z.boolean(),
  derivationState: z.enum(["queued", "not_required"]),
  version: Version,
});

export const DeriveProvenanceRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  evidenceSetHash: Hash,
  algorithmVersion: z.string().min(1).max(80),
  eligibleEvidenceRefs: z.array(Id).max(500),
  ringSignalRefs: z.array(Id).max(50),
});
export const DeriveProvenanceResponse = z.strictObject({
  derivationId: Id,
  creditId: Id,
  availability: z.enum(["available", "unavailable"]),
  rung: z.enum(["imported", "asserted", "witnessed", "attested", "captured_verified"]).optional(),
  explanationCodes: z.array(z.string().min(1).max(80)),
  unavailableReason: z.string().max(120).optional(),
  internalScoreIncluded: z.literal(false),
  version: Version,
});

export const ContestCreditRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  openerPartyRef: Id,
  participantRole: z.enum(["credited_party", "session_participant", "producer", "session_owner", "work_owner"]),
  reasonCode: z.string().min(1).max(80),
  participantVisible: z.literal(true),
  evidenceRefs: z.array(Id).max(50),
  caseKind: z.enum(["credit_authority", "credit_evidence", "credit_identity"]),
});
export const ContestCreditResponse = z.strictObject({
  contestId: Id,
  creditId: Id,
  caseId: Id,
  state: z.enum(["open", "under_review", "resolved", "closed"]),
  publicCreditState: z.enum(["asserted", "contested", "superseded", "withdrawn"]),
  participantVisible: z.literal(true),
  discoveryWeight: z.enum(["normal", "zero_until_resolved"]),
  version: Version,
});

export const ResolvePendingAliasRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  aliasId: Id,
  decision: z.enum(["map", "reject"]),
  roleVersionId: Id.optional(),
  instrumentVersionId: Id.optional(),
  vaultRoleClass: z.enum(["roster", "review", "stems", "takes", "restricted"]).optional(),
  reviewerPartyRef: Id,
  evidenceRefs: z.array(Id).min(1).max(50),
});
export const ResolvePendingAliasResponse = z.strictObject({
  aliasId: Id,
  state: z.enum(["resolved", "rejected", "pending"]),
  retainedLiteral: z.string().min(1),
  roleVersionId: Id.optional(),
  instrumentVersionId: Id.optional(),
  vaultRoleClass: z.enum(["roster", "review", "stems", "takes", "restricted"]).optional(),
  taxonomyVersion: Version,
  assertionHistoryRewritten: z.literal(false),
  version: Version,
});
~~~

Cross-field validation requires sourcePermanentHash to be reproducible, exact identity/taxonomy matching for import, shell-linked unresolved credit for claim, matching overlap/work/date/present-party context for attestation, retractionReason only for retract, current evidence-set hash for derivation, a participant role for contest and exactly one role or instrument mapping for pending alias resolution. A mapped alias must target an active compatible role or instrument; pending_role_alias never receives vault_role_class. A confirm/refuse/dont_know answer is immutable; changing claim hash makes the answer stale and requires a new request.

## Database Schema

The ten tables below are the complete 07c persistence set. work_credit, credit_visibility_version, session, contribution_claim, party, shell, case and evidence records are owned by 07a, 07b, BE01, BE06 or BE09 and referenced by opaque IDs unless a local foreign key is explicitly stated. Supabase PostgreSQL RLS is enabled for every table; anon/authenticated clients receive purpose projections only.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| external_credit_candidate | id uuid NOT NULL PRIMARY KEY; source_ref uuid NOT NULL; source_license_ref uuid NOT NULL; source_row_hash char(64) NOT NULL; source_permanent_hash char(64) NOT NULL; external_identifier text NOT NULL; external_party_identifier text NULL; external_work_identifier text NULL; role_literal text NULL CHECK char_length(role_literal) <= 160; taxonomy_term text NULL CHECK char_length(taxonomy_term) <= 160; locale text NOT NULL; exact_identity_ref uuid NULL; exact_work_ref uuid NULL; exact_role_version_id uuid NULL; pending_alias_id uuid NULL; review_state text NOT NULL CHECK queued/reviewing/resolved/rejected/negative_assertion; provenance_cap text NOT NULL CHECK below_captured_tiers; negative_assertion_reason text NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | source refs are licensed adapter refs with no local FK; exact_role_version_id FK to role_version.id; pending_alias_id FK to pending_role_alias.id. Unique source_ref plus source_row_hash; indexes source_permanent_hash, external_identifier, review_state, pending_alias_id. | RLS permits licensed import worker and assigned candidate reviewer; raw identifiers are not in public projection; svc_credit_import writes; no direct client grant. |
| credit_claim | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; shell_id uuid NOT NULL; claimant_party_ref uuid NOT NULL; identity_evidence_ref uuid NOT NULL; state text NOT NULL CHECK suggested/pending/attached/contested/resolved/unresolvable; first_claimed_at timestamptz NOT NULL; case_id uuid NULL; witness_request_id uuid NULL; claim_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | credit_id FK to work_credit.id; shell, party and evidence refs resolve through BE01/00; case_id is a BE06 opaque ref. Unique credit_id plus shell_id plus claimant_party_ref; indexes credit_id plus state, shell_id plus state, claimant_party_ref, case_id, claim_hash. | RLS permits claimant, current shell projection, assigned reviewer and case-scoped participant projection; identity evidence is separate protected view; svc_credit_claim writes; no client table grant. |
| attestation_request | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; claim_hash char(64) NOT NULL; requester_ref uuid NOT NULL; attester_party_ref uuid NOT NULL; session_id uuid NOT NULL; overlap_evidence_ref uuid NOT NULL; work_id uuid NOT NULL; contribution_date date NOT NULL; another_present_party_ref uuid NOT NULL; bounded_note text NULL CHECK char_length(bounded_note) <= 500; issued_at timestamptz NULL; nudge_count smallint NOT NULL DEFAULT 0 CHECK between 0 and 2; next_nudge_at timestamptz NULL; cadence_bucket text NOT NULL CHECK eligible/limited/muted/dormant; state text NOT NULL CHECK queued/delivered/answered/expired/muted; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | credit_id FK to work_credit.id; session/work/evidence and party refs are 07b/BE09/BE01 opaque refs. Unique credit_id plus attester_party_ref plus claim_hash for active request; indexes attester_party_ref plus state, requester_ref, next_nudge_at, session_id, claim_hash. | RLS permits requester status, attester response and assigned reviewer minimum; block/dispute predicates are not revealed; svc_attestation writes; notification worker reads a redacted view; no client table grant. |
| attestation | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; request_id uuid NOT NULL; claim_hash char(64) NOT NULL; attester_person_ref uuid NOT NULL; attester_party_ref uuid NOT NULL; answer text NOT NULL CHECK confirm/refuse/dont_know; private_reason_ref uuid NULL; requester_set jsonb NOT NULL CHECK jsonb_typeof(requester_set) = array; conflict_note text NULL; created_at timestamptz NOT NULL; retracted_by_id uuid NULL; state text NOT NULL CHECK confirmed/refused/dont_know/retracted/stale; version bigint NOT NULL DEFAULT 1 CHECK > 0. | credit_id FK to work_credit.id; request_id FK to attestation_request.id; retracted_by_id self FK to attestation.id; person/party refs are BE01 purpose refs. Index credit_id plus created_at, request_id, attester_party_ref, claim_hash, state; unique request_id plus version. | RLS permits attester, credited party derived evidence view and provenance worker hash view; private reason requires purpose capability; svc_attestation writes append-only; no direct client grant. |
| provenance_derivation | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; evidence_set_hash char(64) NOT NULL; algorithm_version text NOT NULL; eligible_evidence_refs jsonb NOT NULL CHECK jsonb_typeof(eligible_evidence_refs) = array; ring_signal_refs jsonb NOT NULL CHECK jsonb_typeof(ring_signal_refs) = array; rung text NULL CHECK imported/asserted/witnessed/attested/captured_verified; score numeric(9,6) NULL CHECK score >= 0 AND score <= 1; explanation_codes jsonb NOT NULL CHECK jsonb_typeof(explanation_codes) = array; unavailable_reason text NULL; derived_at timestamptz NULL; state text NOT NULL CHECK queued/available/unavailable/stale; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | credit_id FK to work_credit.id; evidence and signal refs are protected 07b/BE00 opaque refs. Unique credit_id plus evidence_set_hash plus algorithm_version; indexes credit_id plus derived_at DESC, state, evidence_set_hash, algorithm_version. | RLS exposes rung and explanation to authorized projection only; score is restricted to service/debug purpose and never selected by public grants; svc_provenance writes; no client table grant. |
| credit_contest | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; opener_party_ref uuid NOT NULL; participant_role text NOT NULL CHECK credited_party/session_participant/producer/session_owner/work_owner; reason_code text NOT NULL; participant_visible boolean NOT NULL DEFAULT true CHECK participant_visible = true; case_id uuid NOT NULL; evidence_refs jsonb NOT NULL CHECK jsonb_typeof(evidence_refs) = array; state text NOT NULL CHECK open/under_review/resolved/closed; outcome text NULL; discovery_weight text NOT NULL CHECK normal/zero_until_resolved; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | credit_id FK to work_credit.id; case_id is a BE06 opaque ref; opener party ref resolves through BE01. Unique active credit_id plus opener_party_ref; indexes credit_id plus state, case_id, participant_role, discovery_weight. | RLS exposes contest to participants and assigned case reviewer; public projection receives only allowed state; svc_credit_contest writes; no client table grant. |
| role_version | id uuid NOT NULL PRIMARY KEY; canonical_key text NOT NULL; base text NOT NULL; modifier text NULL; family_id text NOT NULL; admitted_party_types jsonb NOT NULL CHECK jsonb_typeof(admitted_party_types) = array; labels jsonb NOT NULL CHECK jsonb_typeof(labels) = object; ddex_code text NULL; fidelity text NOT NULL CHECK exact/broader/none; vault_role_class text NULL CHECK roster/review/stems/takes/restricted; state text NOT NULL CHECK active/deprecated; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; deprecated_at timestamptz NULL. | No cross-domain FK; taxonomy is canonical here. Unique canonical_key plus version; indexes canonical_key plus state, family_id, ddex_code, vault_role_class; GIN admitted_party_types and labels. | RLS permits public active role labels, authenticated picker projection and taxonomy admin full view; svc_taxonomy writes; no direct client table grant. |
| role_alias | id uuid NOT NULL PRIMARY KEY; role_version_id uuid NOT NULL; alias text NOT NULL; locale text NOT NULL; state text NOT NULL CHECK active/deprecated; source text NOT NULL CHECK reviewed/imported/user_suggested; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; deprecated_at timestamptz NULL. | role_version_id FK to role_version.id. Unique normalized alias plus locale plus active state; indexes role_version_id, alias plus locale, state. | RLS permits public active alias lookup and taxonomy admin writes; user-suggested aliases are requester-scoped until reviewed; svc_taxonomy writes; no client table grant. |
| pending_role_alias | id uuid NOT NULL PRIMARY KEY; requester_scope uuid NOT NULL; literal text NOT NULL CHECK char_length(literal) between 1 and 160; locale text NOT NULL; candidate_role_ids jsonb NOT NULL CHECK jsonb_typeof(candidate_role_ids) = array; candidate_instrument_ids jsonb NOT NULL CHECK jsonb_typeof(candidate_instrument_ids) = array; state text NOT NULL CHECK pending/resolved/rejected; resolved_role_id uuid NULL; resolved_instrument_id uuid NULL; retained_hash char(64) NOT NULL; vault_role_class text NULL CHECK vault_role_class IS NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; resolved_at timestamptz NULL. | resolved_role_id FK to role_version.id; resolved_instrument_id FK to instrument_version.id; requester scope is BE00/BE01 purpose ref. Unique requester_scope plus retained_hash; indexes state plus created_at, requester_scope, retained_hash, resolved_role_id. | RLS exposes pending literal only to requester and taxonomy reviewer; public picker never sees it; svc_taxonomy writes; no direct client table grant. |
| instrument_version | id uuid NOT NULL PRIMARY KEY; functional_key text NOT NULL; parent_functional_key text NULL; labels jsonb NOT NULL CHECK jsonb_typeof(labels) = object; locale text NOT NULL; state text NOT NULL CHECK active/deprecated; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; deprecated_at timestamptz NULL. | Parent functional key is a self-reference by canonical key with no row FK to permit versioned deprecation; no make/model fields by schema. Unique functional_key plus locale plus version; indexes functional_key plus state, parent_functional_key, locale. | RLS permits public active labels and taxonomy admin full view; svc_taxonomy writes; no client table grant. |

### Persistence invariants

- Import candidate sourcePermanentHash and sourceRowHash are immutable. Exact match is required; unresolved identity or taxonomy remains queued with a bounded candidate and never public.
- A claim is identity linkage only. A resolved-party credit cannot be claimed through this route. First claimant remains during contest, and permanent rejection suppresses silent re-proposal.
- Attestation request uniqueness is credit plus attester plus current claim hash. One request plus at most two nudges is enforced in the database. Private refusal and don't-know are indistinguishable from unanswered to public consumers.
- Derivation stores score only in restricted persistence. Public responses/events omit it. An unavailable derivation removes the label rather than returning lowest or stale higher tier.
- Role and instrument versions are assertion-time references. Deprecation adds a new version and never rewrites old claims. A pending_role_alias cannot carry vault_role_class and consumer vault access floors to review.
- Contest is participant-visible and case-linked. Public credit state and visibility remain governed by 07a; discovery weighting may be zero until resolution.

## Middleware & Policies

### Hono middleware order

1. Create requestId and trace context; validate BE00 envelope.
2. Select explicit operation CORS policy and origin; credentialed routes never use wildcard credentials.
3. Verify CSRF on browser commands.
4. Authenticate session or service principal and resolve acting context.
5. Apply purpose-bound capability, target visibility and RLS; hidden aggregates become opaque 404.
6. Enforce body-size, candidate-count, evidence-count and cursor limits.
7. Bind Idempotency-Key to actor, route and normalized payload; for derivation also bind evidenceSetHash and algorithmVersion.
8. Parse strict Zod 4 schema and run exact-match, independence, claim-hash, role and cross-field validation.
9. Apply rate, expected-version and aggregate lock; call external adapter only after local authority checks.
10. Write canonical record, audit and outbox atomically; queue notification, case or derivation effect after commit.
11. Project authorized state, security headers and no-store/ETag policy; normalize all errors to ApiError { code, message, requestId, details }.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CRD-07C-01 | Licensed import service principal | Source license, source row and import lane; no public-write capability | Lock source hash; recheck license and candidate uniqueness | Hidden source is 404; unlicensed or wrong lane is 403. |
| CRD-07C-02 | Verified claimant person | Credit is shell-linked, claimant identity evidence and Shard 01 context | Lock credit/shell claim; recheck current party and first claimant | Hidden credit/shell is 404; resolved-party claim or failed identity authority is 403. |
| CRD-07C-03 | Credited party, session owner or close workflow | Credit, session overlap, work/date context, independence, no block/dispute and cadence | Lock credit/attester request key; recheck claim hash and limits | Hidden credit is 404; non-requester or ineligible visible relationship is 403. |
| CRD-07C-04 | Named attester | Request recipient for answer; original attester for retract; current claim hash | Lock request/attestation; recheck request state and displayed hash | Hidden request is 404; wrong actor or stale relationship is 403. |
| CRD-07C-05 | Registered derivation worker | Credit and exact eligible evidence set; no human authority | Lock credit/evidence-set hash; recheck algorithm version | Hidden credit is 404; unregistered worker is 403. |
| CRD-07C-06 | Credit participant or work/release owner | Participant role and credit scope; Shard 06 case kind | Lock active contest key; recheck credit version and participant role | Hidden credit is 404; nonparticipant is 403. |
| CRD-07C-07 | Taxonomy administrator | Alias requester scope, compatible role/instrument and reviewed evidence | Lock alias and target version; recheck active/deprecated state | Hidden alias is 404; non-admin or incompatible target is 403. |

### Security and abuse controls

- Identity evidence proves claimant identity only. It cannot promote provenance, confirm contribution or mutate ownership.
- Attester eligibility checks overlap, work, date, another named present party, independence through entity membership, active blocks, open disputes, outstanding count, rolling cadence, mute and dormancy.
- Requests and answers never expose a block, dispute or mute reason to an unrelated actor. Refuse and don't_know remain private/unattributed and carry no retaliation signal.
- Ring detection and confidence are evidence-derived. No reciprocal topology, popularity, self-assertion, import agreement, attendance or claim state can promote a rung; ring signals demote score only.
- Import is exact-only. Fuzzy candidates can be reviewed but never selected automatically. Raw source identifiers stay protected.
- Taxonomy admin cannot edit a historical role or instrument reference. vault_role_class is explicit, optional by default and never inferred from family.
- SQL SECURITY DEFINER functions set fixed search_path, verify service role and purpose, append audit before returning and revoke direct client table grants.
- Rate limits are actor, credit, shell, attester, source, lane and alias scoped. No target volume or attestation count creates public confidence.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CRD-07C-01 | Licensed source and import adapter | sourceRef, sourceLicenseRef, sourceRowHash, sourcePermanentHash, externalIdentifier, locale | licenseState, reproducibleRowHash, exactIdentifierMatches, providerReceiptRef | 2,000 ms; 3 retries at 15/60/300 seconds for safe source reads; circuit opens after 5 failures in 60 seconds; unknown license or hash leaves candidate pending and unpublished. |
| CRD-07C-02, CRD-07C-03 | Shard 01 identity, party and mandate adapter | partyRef, shellRef, identityEvidenceRef, requestedSnapshotVersion, relationKind, creditId | identityState, partyState, mandateState, membershipRefs, independenceState, snapshotVersion | 2,000 ms; one read retry at 250 ms; circuit 5/60 seconds; unknown identity or independence blocks claim/ask without mutation. |
| CRD-07C-03, CRD-07C-04 | Notification adapter | requestId, attesterPartyRef, claimHash, channel, nudgeNo, responseDeadline | providerReceiptRef, deliveryState, deliveredAt, notificationId | 2,000 ms; 3 retries at 15/60/300 seconds with same request key; circuit 5/60 seconds; delivery failure leaves request queued/failed and does not mark refusal. |
| CRD-07C-05 | Provenance worker and evidence projection | creditId, evidenceSetHash, eligibleEvidenceRefs, ringSignalRefs, algorithmVersion | derivationId, availability, rung, explanationCodes, unavailableReason | 5,000 ms; 3 retries at 15/60/300 seconds by evidence-set key; circuit 5/60 seconds; worker outage stores unavailable and removes stale label. |
| CRD-07C-06 | Shard 06 credit dispute adapter | creditId, openerPartyRef, reasonCode, evidenceRefs, expectedVersion, caseKind | caseId, acceptedVersion, caseState, participantProjection | 2,000 ms; 3 retries at 15/60/300 seconds with same idempotency key; circuit 5/60 seconds; unknown create reconciles by key and keeps credit visible. |
| CRD-07C-07 | Taxonomy registry and vocabulary projection | aliasId, decision, targetRoleVersionId or targetInstrumentVersionId, evidenceRefs, expectedVersion | taxonomyVersion, aliasState, canonicalTargetRef, vaultRoleClass, providerReceiptRef | 2,000 ms; 3 retries at 15/60/300 seconds for registry reads; circuit 5/60 seconds; unknown mapping leaves pending literal and never rewrites history. |

External seams return typed unknown or pending, never a fabricated identity, attestation, confidence, case, role, instrument or authorization. Unknown mutating results reconcile by provider receipt and idempotency key before retry.

### State machines and concurrency

- Candidate: imported → queued → reviewing → resolved or rejected or negative_assertion. Source and hash remain immutable; unresolved terms remain below captured tiers.
- Claim: suggested → pending → attached → contested → resolved or unresolvable. A second verified claimant does not silently displace the first; a case or witness request resolves the contest.
- Attestation request: queued → delivered → answered, expired or muted, with at most two nudges. Attestation answer is confirm, refuse or dont_know; retraction appends a reason.
- Provenance: queued → available or unavailable or stale. Current evidence-set hash and algorithm version are the derivation key. Ring demotion changes internal score only.
- Contest: open → under_review → resolved → closed. The public credit remains visible per 07a, with discovery weight zero where policy requires.
- Taxonomy: pending → resolved or rejected. Role and instrument versions are immutable; deprecation never remaps old assertions.
- Concurrent claim requests use credit/shell/claimant uniqueness and expected credit version. Concurrent attestation asks use credit/attester/claim hash uniqueness. Concurrent answers compare displayed claim hash; stale answer is historical and unsupported.
- Concurrent derivations use evidenceSetHash and algorithmVersion uniqueness. Concurrent contest opens use credit/opener uniqueness. Alias resolution uses alias version CAS. Losers receive prior response or typed 409.

### Failure recovery

- Crash after candidate, claim, attestation, derivation, contest or alias commit leaves the outbox and durable retry state. Workers resume by idempotency key.
- Source adapter timeout stores pending candidate and never marks exact match. Identity adapter timeout blocks claim/request and preserves prior state.
- Notification failure leaves request delivered state false and retries; no answer is inferred from silence, timeout or provider absence.
- Derivation worker failure stores unavailable reason and removes the derived label. A later successful run must use a new or same evidence-set hash and never resurrect a stale higher rung.
- Shard 06 case creation timeout reconciles by idempotency key. The credit remains attached and participant-visible; no case omission hides the contest.
- Alias or role registry outage leaves pending literal and assertion-time role untouched. A rejected target is a permanent negative mapping and cannot rewrite historical records.
- Erasure or party revocation removes derived access and future authority but retains required claim, attestation, provenance and taxonomy lineage under the applicable retention clock or hold.

## Event Schemas

### Payload contracts

~~~ts
export const CreditClaimChangedV1 = z.strictObject({
  type: z.literal("credit.claim.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  claimId: z.uuid(),
  creditId: z.uuid(),
  shellId: z.uuid(),
  state: z.enum(["suggested", "pending", "attached", "contested", "resolved", "unresolvable"]),
  version: z.number().int().nonnegative(),
});

export const CreditAttestationChangedV1 = z.strictObject({
  type: z.literal("credit.attestation.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  attestationId: z.uuid(),
  creditId: z.uuid(),
  answerKind: z.enum(["confirm", "refuse", "dont_know"]).optional(),
  state: z.enum(["confirmed", "refused", "dont_know", "retracted", "stale"]),
  claimHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const CreditProvenanceDerivedV1 = z.strictObject({
  type: z.literal("credit.provenance.derived.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  creditId: z.uuid(),
  evidenceSetHash: z.string().regex(/^[a-f0-9]{64}$/),
  availability: z.enum(["available", "unavailable"]),
  rung: z.enum(["imported", "asserted", "witnessed", "attested", "captured_verified"]).optional(),
  version: z.number().int().nonnegative(),
});

export const CreditContestChangedV1 = z.strictObject({
  type: z.literal("credit.contest.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  contestId: z.uuid(),
  creditId: z.uuid(),
  caseId: z.uuid(),
  state: z.enum(["open", "under_review", "resolved", "closed"]),
  outcome: z.string().max(80).optional(),
  version: z.number().int().nonnegative(),
});

export const CreditTaxonomyChangedV1 = z.strictObject({
  type: z.literal("credit.taxonomy.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  taxonomyKind: z.enum(["role", "role_alias", "instrument"]),
  canonicalVersion: z.number().int().nonnegative(),
  change: z.enum(["created", "mapped", "deprecated", "rejected"]),
  pendingMapping: z.boolean(),
  vaultRoleClass: z.enum(["roster", "review", "stems", "takes", "restricted"]).optional(),
});
~~~

Event consumers receive safe state and refetch purpose-authorized projections. Internal score, ring flags, private refusal, requester/attester identity, raw imported identifiers and evidence narratives are not published.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | INVALID_REQUEST 400 or UNAUTHENTICATED 401 | Correct envelope or fresh context; no mutation. |
| Target visibility and purpose capability | FORBIDDEN 403 for visible unauthorized actor; opaque 404 for hidden aggregate | Use permitted claimant, participant, attester or admin path; do not enumerate. |
| Strict schema and cross-field eligibility | INVALID_REQUEST 400 or typed 422 | Correct exact match, context, evidence, role or claim fields; no provider call. |
| Idempotency, claim hash or expected version | IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409 | Replay same key or refetch current claim/evidence/alias version. |
| Identity/notification/case/taxonomy adapter | PROVIDER_UNAVAILABLE 503 only with durable pending state | Circuit and queue retry by stable key; never infer answer or authority. |
| Derivation failure | DERIVATION_UNAVAILABLE 503 | Persist unavailable and remove label; retry current evidence set. |
| Claim or contest adjudication | CLAIM_CONFLICT or DISPUTE_REQUIRED 409/422 | Keep first claimant or credit visible and route case/witness request. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CRD-07C-01 | Invalid license/hash, fuzzy match, oversized source or unlicensed principal is rejected before candidate write. | Source hash uniqueness collapses replay; source outage leaves queued candidate; source deletion preserves hash/tombstone. |
| CRD-07C-02 | Resolved-party target, invalid identity evidence, non-shell credit or unauthorized claimant is rejected. | First claimant wins CAS; second becomes contest/witness; party revocation removes access but preserves claim history. |
| CRD-07C-03 | Non-present or dependent attester, block/open dispute, context-floor gap, mute/dormancy or cadence exhaustion creates no request. | Same credit/attester/hash collapses; notification outage leaves queued; claim change invalidates pending ask. |
| CRD-07C-04 | Wrong attester, stale claim hash, invalid answer or missing retraction reason is rejected. | Concurrent answers serialize; old answer remains historical but unsupported; erasure protects private reason and preserves edge. |
| CRD-07C-05 | Invalid evidence set, algorithm or unauthorized worker is rejected. | Same evidence hash/version replays; worker outage returns unavailable and no stale tier; evidence deletion re-derives with tombstone. |
| CRD-07C-06 | Nonparticipant, invalid case kind, duplicate active contest or missing evidence is rejected. | Case adapter unknown reconciles; participant revocation removes derived access but credit and contest evidence remain. |
| CRD-07C-07 | Non-admin, incompatible target, deprecated mapping or vault class on pending alias is rejected. | Alias CAS allows one decision; taxonomy outage leaves pending literal; old assertion role/instrument references never rewrite. |

## Observability

Every operation emits requestId, traceId, operationId, outcome, latencyMs, actorType, purpose, schemaVersion, aggregateRefHash and policyVersion where applicable. Logs and events exclude private reasons, identity evidence, raw source identifiers, internal score, ring flags and unrestricted PII.

| Operation ID | Audit event and metrics | Safe trace fields |
|---|---|---|
| CRD-07C-01 | credit.candidate.changed; licensed source acceptance, exact/unresolved match, queue, rejection and hash-replay metrics | source hash, candidate hash, match states, review state, lane bucket |
| CRD-07C-02 | credit.claim.changed.v1; first claimant, conflict, witness, case route and identity-verification metrics | claim hash, credit hash, shell hash, state, case presence |
| CRD-07C-03 | credit.attestation.requested; eligibility, cadence, delivery, mute and duplicate metrics | credit hash, attester hash, claim hash, cadence state, request state |
| CRD-07C-04 | credit.attestation.changed.v1; answer kind bucket, stale hash, retraction, private-reason and derivation queue metrics | attestation hash, credit hash, answer state, claim hash, public attribution |
| CRD-07C-05 | credit.provenance.derived.v1; available/unavailable, evidence-set, algorithm, retry and ring-signal metrics | credit hash, evidence hash, availability, rung, explanation codes |
| CRD-07C-06 | credit.contest.changed.v1; participant role, case handoff, discovery-weight and convergence metrics | contest hash, credit hash, case hash, state, outcome code |
| CRD-07C-07 | credit.taxonomy.changed.v1; alias mapping, rejection, deprecation, pending and vault-class metrics | alias hash, taxonomy kind, target version, change, pending flag |

provider-native diagnostic sinks receive exception fingerprints and circuit state without request bodies. Alerts fire for candidate queue age over 10 minutes, duplicate claim conflicts, attestation delivery retry exhaustion, stale-hash spikes, derivation unavailable rate, unresolved contest age over policy window and pending aliases older than 14 days.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CRD-07C-01 | Parse strict source/hash schema; reject unlicensed/fuzzy input; assert exact-match queue, no public write, replay dedupe and provider unknown pending. |
| CRD-07C-02 | Parse shell/identity evidence; assert verified identity is not contribution proof, first claimant, resolved-party refusal, case/witness route and permanent rejection. |
| CRD-07C-03 | Assert context floor, overlap, independence through membership, block/dispute gate, one request/two nudges, cadence limits and claim-hash binding. |
| CRD-07C-04 | Assert named attester, confirm/refuse/dont_know, stale claim, private reason, retraction-only same actor and append-only edge. |
| CRD-07C-05 | Assert evidence-set hash, algorithm, eligible evidence, no score in response/event, unavailable failure and retry idempotency. |
| CRD-07C-06 | Assert participant role, participant-only visibility, Shard 06 case link, public credit retention and zero discovery weight where unresolved. |
| CRD-07C-07 | Assert admin capability, exact compatible mapping, deprecated rejection, pending alias vault class absence and assertionHistoryRewritten false. |

### Persistence, concurrency and recovery tests

- Migration tests assert every field type, nullability, check, FK, unique constraint, index, RLS policy and grant listed above.
- Property tests generate duplicate source rows, second shell claimants, changing claim hashes, reciprocal attesters, mute/dispute contexts, ring signals, provider unknowns, alias decisions and version races. Every property asserts no ownership/rights mutation and no public score.
- Worker tests run crash-after-commit, notification timeout, case timeout, taxonomy outage and derivation outage. Stable idempotency/evidence keys converge to one state.
- Security tests attempt raw source-ID disclosure, identity-evidence reads, attestation-request enumeration, private-reason leaks, score projection, fuzzy import, auto-merge and direct table access.
- Performance tests keep local claim/attestation/taxonomy commands under 300 ms p95, derive commands under 300 ms before queued work, and bound 500-item import batches and evidence references.

### Accessibility handoff tests

Claim inbox explains identity verification separately from contribution confidence. Attestation prompts expose canonical claim, work/date context and labeled confirm, refuse and don't-know controls; private reason fields are clearly marked and never echoed publicly. Contest state has participant-safe text and no hidden count. Taxonomy picker exposes canonical label, locale, pending and deprecated status without silently remapping. Keyboard-only, screen-reader, 200 percent zoom, high contrast, reduced motion and focus-on-error tests are required.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | Seven operations each have strict Zod request/success schemas, common ApiError, explicit CORS, auth, rate, idempotency and 403/404 behavior. PASS. |
| Evidence pass | Source/hash permanence, claim identity/contribution separation, attestation independence, hash binding and derivation eligibility are explicit. PASS. |
| Confidence pass | Categorical rung, internal score, ring demotion, unavailable derivation and projection/event redaction are separated. PASS. |
| Taxonomy pass | Exact resolution, bounded pending literal, role/instrument separation, vault class rule and assertion-time immutability are explicit. PASS. |
| Persistence pass | All ten models have typed SQL fields, nullability, constraints, FK target or opaque-reference rationale, indexes, RLS and grants. PASS. |
| State/recovery pass | Candidate, claim, attestation, derivation, contest and taxonomy state machines include CAS, unique keys, outbox recovery and provider unknown behavior. PASS. |
| Adversarial pass | Claim fraud, reciprocal pressure, identity leakage, fuzzy matching, score leakage, alias rewrite, provider outage and case timeout fail safe. PASS. |
| Macro boundary pass | 07a/07b, BE00, BE01, BE06, BE09 and BE10 ownership is referenced without route/table duplication. PASS. |
| Auditability pass | CRD-07C-01 through CRD-07C-07 appear in route, contract, error, auth, observability and test rows; model/event/feature identifiers are literal and line-traced. PASS. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/07-credits-core.md with deep dive .memory/wiki/specs/ia/deep-dives/07-credits-core.md. CRD-12 through CRD-18 have one owner and one operation. Identity proof versus contribution proof, participant contest versus public credit, exact versus fuzzy taxonomy, role versus instrument, score versus categorical rung, refusal privacy, claim-hash invalidation, provider unknown, 403 versus 404, idempotency, rates, CORS, ApiError, external timeout/retry/circuit budgets, RLS, grants, deletion and retention are resolved. No route duplicates 07a, 07b or platform endpoints. All tables have matching Markdown widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 07c backend companion from canonical Shard 07 IA and deep dive; classified seven interactions, ten models and five events. | /write-be-spec | All |
| 2026-08-28 | Added strict Zod 4 contracts, route registry, typed PostgreSQL/RLS schema, external seam budgets, event payloads, error matrices, observability and tests. | /write-be-spec-write | API, database, middleware, data flow, events, errors, observability, tests |

## Dependency References

### Constrained by

- [BE00 — Platform foundation](00-infrastructure.md)
- [BE01 — Authentication and account linking](01a-auth-account-linking.md)
- [BE01 — Party, identity and authority](01c-relationships-authority-governance.md)
- [BE06 — Trust, safety and disputes](06a-case-intake-evidence.md)
- [07a — Credit assertions and visibility](07a-credit-assertions-visibility.md)
- [07b — Session capture and offline merge](07b-session-capture-offline.md)
- [IA Shard 07 — Credit graph, capture and confidence](../ia/07-credits-core.md)
- [IA Deep Dive 07 — Credit graph, capture and confidence](../ia/deep-dives/07-credits-core.md)

### Constrains

- [BE06b — Policy, enforcement and appeals](06b-policy-enforcement-appeals.md)
- [IA Shard 06 — Trust, safety and disputes](../ia/06-trust-safety.md)
- [IA Shard 08 — Credit reporting and disclosure](../ia/08-credit-reporting-disclosure.md)
- [IA Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md)
- [IA Shard 10 — Rights and ownership](../ia/10-rights-ownership.md)
- [IA Shard 18 — Royalty accounting](../ia/18-royalty-accounting.md)
- [IA Shard 19 — Royalty reporting and forecasting](../ia/19-royalty-reporting-forecasting.md)
- [IA Shard 20 — Licensing core](../ia/20-licensing-core.md)
- [IA Shard 22 — Release and distribution](../ia/22-release-distribution.md)
- [IA Shard 23 — Gear provenance registry](../ia/23-gear-provenance-registry.md)
- [IA Shard 27 — Digital catalog and delivery](../ia/27-digital-catalog-delivery.md)
- [IA Shard 39 — Analytics ingestion and reporting](../ia/39-analytics-ingestion-reporting.md)
