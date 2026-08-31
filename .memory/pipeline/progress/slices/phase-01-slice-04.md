# Phase 1 / Slice 04: Object upload admission and signed-intent integrity

**Status**: complete
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slices 01–03  
**Spec depth floor**: 86  
**Acceptance criteria**: 86  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [x] Contract: lock Zod/config/registry contracts
- [x] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [x] `BE` implementation
- [x] `FE` implementation
- [x] `QA` GREEN and adversarial verification
- [x] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [x] **P1-S04-AC-001** — `POST /api/v1/upload-intents` returns `201 UploadIntentResource`, `Location`, signed transfer data, and object ETag only after target authorization. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-02, Response Reconciliation
- [x] **P1-S04-AC-002** — Idempotency key length is 8–128 characters. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-003** — Idempotency key contains printable ASCII only. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-004** — Trimmed idempotency key remains byte-identical. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-005** — `If-Match` is an exact quoted positive bigint when required. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-006** — `If-Match` may be absent only for a registry-declared immutable/new target. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-007** — `targetType` is a registered closed enum. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-008** — `targetType` is 1–64 lowercase ASCII/dot characters. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-009** — `targetId` is a UUID. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-010** — `purpose` is a target-registry closed enum. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-011** — `mediaType` is lowercase-normalized. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-012** — `mediaType` belongs to the target allowlist. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-013** — `byteSize` is a safe integer. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-014** — `byteSize` is at least 1. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-015** — `byteSize` does not exceed `target.maxBytes`. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-016** — `checksum.algorithm` is exactly `sha256`. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-017** — `checksum.value` is exactly 64 lowercase hexadecimal characters. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-018** — Malformed boundary/header input uses the safe `INVALID_REQUEST` message. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Global Error Envelope, Endpoint Field Validation Matrix
- [x] **P1-S04-AC-019** — Semantic field failures use the safe `VALIDATION_FAILED` message and field-pointer details only. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Global Error Envelope, Endpoint Field Validation Matrix
- [x] **P1-S04-AC-020** — Return the declared INVALID_REQUEST status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-021** — Return the declared UNAUTHENTICATED status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-022** — Return the declared FORBIDDEN status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-023** — Return the declared NOT_FOUND status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-024** — Return the declared CONFLICT status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-025** — Return the declared PAYLOAD_TOO_LARGE status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-026** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-027** — Return the declared VALIDATION_FAILED status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-028** — Return the declared RATE_LIMITED status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-029** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-030** — Return the declared INTERNAL_ERROR status/envelope for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-031** — Anonymous browser receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-032** — Authenticated user receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-033** — Acting-party principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-034** — Internal capability operator receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-035** — Queue/schedule principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-036** — Provider webhook principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-037** — Deployment principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-038** — Service/maintenance role receives the declared allow/deny behavior for upload-intent creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-039** — Resolve acting party server-side and require owning-domain target/purpose policy. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-040** — Reject client-selected target authority even when the target exists. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-041** — Operator admission requires recent step-up and a separately registered target capability. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-042** — Concealed targets return 404 while visible unauthorized targets return 403. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-043** — Reserve idempotency atomically by actor, operation, key digest, and normalized request hash. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-044** — Validate mutable-target `If-Match` in the same transaction that creates metadata and intent. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-045** — Same binding replays the authoritative intent; different content/version returns 409 without a second intent. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-046** — If Storage admission fails before metadata commit, create neither intent nor authorized object. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix — Supabase Storage
- [x] **P1-S04-AC-047** — Bytes can never become usable without governing metadata and later verification. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix — Supabase Storage
- [x] **P1-S04-AC-048** — Enforce 20 creations/hour/user, maximum three concurrent uploads, a 15-second command deadline, and response target under two seconds. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-049** — Object upload admission creates database metadata plus a maximum-15-minute actor/target-bound signed intent. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-06 / INF-06
- [x] **P1-S04-AC-050** — An intent expiring during transfer cannot authorize; the object remains unusable and a new authorized intent is required. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 12
- [x] **P1-S04-AC-051** — Thirty seconds without a transferred byte aborts; any byte resets the inactivity timer. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 14
- [x] **P1-S04-AC-052** — Traversal/control characters are rejected before signing and keys are server-generated. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 21
- [x] **P1-S04-AC-053** — `targetType` rejects unknown registry values and invalid lowercase/dot syntax. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-054** — `targetId` rejects non-UUID values before ownership lookup. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-055** — `purpose` rejects unknown target-policy keys. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-056** — `mediaType` normalizes input and rejects types outside the target allowlist. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-057** — `byteSize` rejects nonsafe integers. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-058** — `byteSize` rejects values below one. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-059** — `byteSize` rejects values above the target maximum. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-060** — `checksum.algorithm` permits only SHA-256. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-061** — `checksum.value` requires 64 lowercase hexadecimal characters. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-062** — `Idempotency-Key` exposes required length/character correction without echoing the key. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-063** — `If-Match` exposes quoted-version correction and preserves the draft on conflict. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-064** — Upload-admission form renders for Free as not-rendered without capability. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-065** — Upload-admission form renders for Paid as full only with server capability, otherwise disabled. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-066** — Upload-admission form renders for Creator as full owned/mandated, otherwise not-rendered. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-067** — Upload-admission form renders for Guardian as full only within guardian mandate. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-068** — Upload-admission form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-069** — Upload-admission form renders for Business as full only in organization mandate. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-070** — Upload-admission form renders for Staff as full only with operation/case capability. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-071** — Upload-admission form renders for Admin as full only with named capability, recent step-up, and audited reason. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-072** — Upload-admission route deep links preserve canonical target and safe return data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-073** — Browser Back restores the prior target/filter without resubmission. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-074** — A multi-tab invalidation refetches intent/object state and never copies another tab's cache. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-075** — Upload fields have persistent labels, linked summary, exact correction text, and focus the first invalid field. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-076** — Pending upload admission announces progress without disabling unrelated navigation. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-077** — High-risk target admission names consequence, scope, expected version, acting context, and step-up before commit. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-078** — Admission over 250 ms shows loading and no false success. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-079** — 429 preserves fields and waits for `Retry-After`. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-080** — Safe 5xx retry uses at most 250 ms and 750 ms delays with the same idempotency binding. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-081** — Offline admission stays a local noncanonical intent until reconnect revalidation. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-082** — Transfer inactivity uses the exact 30-second byte-reset rule. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-083** — Admission renders loading through the shared AsyncState contract. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-084** — Admission maps each declared error code to its deterministic error owner. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-085** — Admission success renders intent expiry, accepted constraints, and transfer action from validated data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-086** — Every response field is consumed by a typed owner; security-only fields never serialize. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping

## Implementation Notes

- Completed contract-first RED→GREEN implementation for all 86 criteria with
  one unique executable trace marker per criterion and no duplicate IDs.
- Locked strict Zod/OpenAPI upload-admission contracts, exact idempotency and
  CAS behavior, validation-before-authentication, bounded rate/deadline
  handling, and disclosure-safe error ownership.
- Added PostgreSQL admission authority, RLS/RPC abuse coverage, Worker routing,
  server-owned Astro capability projection, accessible form/state behavior,
  offline preservation, and 30-second transfer inactivity enforcement.
- Production upload storage remains deliberately unavailable: the production
  registry rejects every non-empty configuration, while local tests use only
  injected fakes. No storage provider or paid add-on was activated.

## Validation Evidence

- Aggregate Vitest: 144 files and 810 tests passed at 100% statement, branch,
  function, and line coverage.
- Playwright: 21 browser, responsive, accessibility, and disclosure-safety
  tests passed.
- Database: reset, lint, generated-type drift, and 392 pgTAP checks passed.
- Contract audit, format, ESLint, TypeScript, build/Wrangler dry-run, and
  `git diff --check` passed.

## Depth Ratio

- Depth ratio: 1.0; 86/86 authored acceptance criteria satisfied.
- Spec depth floor: 86, so the floor is met.

## Files Changed

- `packages/contracts/src/upload-admission/` and generated OpenAPI surfaces
- `packages/application/src/infrastructure/upload-admission/`
- `apps/worker/src/upload-admission/` and `apps/worker/src/storage/`
- `apps/web/src/components/infrastructure/upload-admission/` and server
  capability projection/pages
- `supabase/migrations/20260830140000_upload_admission_authority.sql`
- `supabase/tests/upload_admission.sql`
- Slice contract, security, integration, accessibility, and E2E tests

## Completion Signature

- Completed: 2026-08-30
- Runtime: codex
- Verifier: `pnpm validate`, `pnpm db:verify`, and `pnpm progress:check`
- Depth ratio: 1.0 (86/86 authored criteria satisfied; floor 86)
