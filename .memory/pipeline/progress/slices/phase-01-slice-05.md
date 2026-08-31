# Phase 1 / Slice 05: Upload completion, verification job, and quarantine lifecycle

**Status**: complete
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slice 04  
**Spec depth floor**: 78  
**Acceptance criteria**: 78  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [x] Contract: lock Zod/config/registry contracts
- [x] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [x] `BE` implementation
- [x] `FE` implementation
- [x] `QA` GREEN and adversarial verification
- [x] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [x] **P1-S05-AC-001** — `POST /api/v1/upload-intents/{uploadIntentId}/complete` returns `202 JobStatus`, `Location`, and object ETag while verification remains asynchronous. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-03, Response Reconciliation
- [x] **P1-S05-AC-002** — `uploadIntentId` is a UUID. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-003** — `Idempotency-Key` satisfies the shared length rule. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-004** — `Idempotency-Key` satisfies printable ASCII and byte-identity rules. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-005** — `If-Match` equals the exact current object version. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-006** — `byteSize` is a safe positive integer. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-007** — `byteSize` does not exceed intent maximum. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-008** — `byteSize` equals provider-observed bytes before ready. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-009** — `mediaType` is normalized. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-010** — `mediaType` remains in the intent allowlist. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-011** — `mediaType` equals verified provider metadata. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-012** — `checksum` is lowercase SHA-256 hexadecimal. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-013** — `checksum` equals verified bytes. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-014** — Unknown request keys are rejected by the strict completion schema. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-015** — Malformed completion input uses the safe `INVALID_REQUEST` message. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Global Error Envelope
- [x] **P1-S05-AC-016** — Semantic completion failures use the safe `VALIDATION_FAILED` message; terminal verification failure uses the sanitized job error. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Field Validation Matrix, Job-State Reconciliation
- [x] **P1-S05-AC-017** — Return the declared INVALID_REQUEST status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-018** — Return the declared UNAUTHENTICATED status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-019** — Return the declared FORBIDDEN status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-020** — Return the declared NOT_FOUND status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-021** — Return the declared CONFLICT status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-022** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-023** — Return the declared VALIDATION_FAILED status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-024** — Return the declared RATE_LIMITED status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-025** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-026** — Return the declared INTERNAL_ERROR status/envelope for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-027** — Anonymous browser receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-028** — Authenticated user receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-029** — Acting-party principal receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-030** — Internal capability operator receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-031** — Queue/schedule principal receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-032** — Provider webhook principal receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-033** — Deployment principal receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-034** — Service/maintenance role receives the declared allow/deny behavior for upload completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-035** — Require the same actor/party that owns the live intent. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-036** — Re-evaluate current target authority at completion time. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-037** — Require the exact current ObjectRecord version. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-038** — Never grant automatic operator override; only an owning-domain registered capability can admit one. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-039** — Require the idempotency key for completion. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-040** — Require exact object `If-Match` and compare inside the transition transaction. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-041** — Same binding replays the same verification job. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-042** — Mismatched body or version returns 409 without starting another verifier. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-043** — Database commit with lost response is recovered through the same idempotency result. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade — PostgreSQL transaction
- [x] **P1-S05-AC-044** — Verifier/queue replay uses CAS and cannot regress ready/rejected/quarantined terminal state. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade — Queue consumer
- [x] **P1-S05-AC-045** — Unverified or mismatched Storage bytes remain unusable and are reconciled, quarantined, or removed. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade — Supabase Storage
- [x] **P1-S05-AC-046** — Enforce 60 completions/min/user, 120/min/party, maximum three concurrent uploads, and the exact 15-second command deadline. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-047** — Upload completion exposes ready only after size, type, checksum, and state verification. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-06 / INF-06
- [x] **P1-S05-AC-048** — Bytes without matching metadata/checksum never reach consumers. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 13
- [x] **P1-S05-AC-049** — `uploadIntentId` path binding rejects non-UUID input. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-050** — `byteSize` requires a safe positive integer. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-051** — `byteSize` cannot exceed the intent maximum. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-052** — `byteSize` must reconcile with provider-observed bytes. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-053** — `mediaType` is normalized and allowlisted. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-054** — `mediaType` must match provider metadata. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-055** — `checksum` uses lowercase SHA-256 hexadecimal. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-056** — `checksum` must match verified bytes before ready. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-057** — Upload-completion form renders for Free as not-rendered without capability. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-058** — Upload-completion form renders for Paid as full only with server capability, otherwise disabled. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-059** — Upload-completion form renders for Creator as full owned/mandated, otherwise not-rendered. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-060** — Upload-completion form renders for Guardian as full only within guardian mandate. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-061** — Upload-completion form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-062** — Upload-completion form renders for Business as full only in organization mandate. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-063** — Upload-completion form renders for Staff as full only with operation/case capability. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-064** — Upload-completion form renders for Admin as full only with named capability, recent step-up, and audited reason. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-065** — Completion deep links preserve intent/object identity without placing secrets or signed URLs in the URL. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-066** — Back navigation cannot resubmit completion. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-067** — Multi-tab invalidation refetches verification state and preserves each tab's local draft only. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-068** — Completion validation links summary and exact field errors and focuses the first invalid field. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-069** — Verification job progress is announced politely without focus theft. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-070** — Conflict UI presents current version and preserved draft with Review, Reapply when permitted, and Discard. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-071** — Completion over 250 ms shows pending state and no ready state. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-072** — 429 waits for server time and preserves completion evidence. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-073** — Safe 5xx retry reconciles job status before reusing the idempotency binding. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-074** — Offline completion stays noncanonical until identity, authority, content, and version revalidate. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-075** — Completion renders loading until the job resource is available. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §State Management
- [x] **P1-S05-AC-076** — Completion renders typed error without converting failure to empty. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §State Management
- [x] **P1-S05-AC-077** — Completion success renders job ID, object version, and next verification action from validated data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S05-AC-078** — Every completion/job field and declared error has one typed UI owner. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Response field ownership, Error class ownership

## Implementation Notes

- Completed contract-first RED→GREEN implementation for all 78 criteria with
  one unique executable trace marker per criterion and no duplicate IDs.
- Implemented exact upload completion, immutable `object.uploaded/1` origin
  evidence, verification-job creation, quarantine lifecycle, job polling,
  bounded retries, offline reconciliation, and disclosure-safe conflict UX.
- Closed legacy service-role authority bypasses. Verification now binds the
  locked object aggregate, `{objectId}` payload, correlation, and completion
  event before any mutation; unrelated `job.requested` rows cannot authorize it.
- Production object verification executes only through an explicitly injected
  typed internal dependency. Missing/failed dependencies remain manual review;
  no external storage/provider call is fabricated.

## Validation Evidence

- Aggregate Vitest: 144 files and 810 tests passed at 100% statement, branch,
  function, and line coverage.
- Playwright: 21 browser, responsive, accessibility, and disclosure-safety
  tests passed.
- Database: reset, lint, generated-type drift, and 392 pgTAP checks passed.
- Contract audit, format, ESLint, TypeScript, build/Wrangler dry-run, and
  `git diff --check` passed.

## Depth Ratio

- Depth ratio: 1.0; 78/78 authored acceptance criteria satisfied.
- Spec depth floor: 78, so the floor is met.

## Files Changed

- `packages/contracts/src/upload-completion/` and job/quarantine contracts
- `packages/application/src/infrastructure/upload-completion/` and jobs
- `apps/worker/src/upload-completion/` and production job-effect dispatcher
- `apps/web/src/components/infrastructure/upload-completion/`
- `supabase/migrations/20260830160000_upload_completion_authority.sql`
- `supabase/migrations/20260830190000_close_legacy_authority_bypasses.sql`
- `supabase/tests/upload_completion_authority.sql` and `authority_closure.sql`
- Slice contract, security, integration, accessibility, and E2E tests

## Completion Signature

- Completed: 2026-08-30
- Runtime: codex
- Verifier: `pnpm validate`, `pnpm db:verify`, and `pnpm progress:check`
- Depth ratio: 1.0 (78/78 authored criteria satisfied; floor 78)
