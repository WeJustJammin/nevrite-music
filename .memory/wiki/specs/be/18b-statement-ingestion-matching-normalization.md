# Statement Ingestion, Matching & Normalization — Backend Specification

**Status:** Complete
**IA source:** [Shard 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
**Deep-dive source:** [Deep Dive 18 — Royalty accounting](../ia/deep-dives/18-royalty-accounting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns statement-source relationships, complete immutable statement ingestion, deterministic adapter selection and whole-file parsing, source identity mapping, value-ranked royalty exceptions, and source-period/currency normalization. It contains `ROY-05` through `ROY-10`. It never edits original bytes, guesses a parser or identity, interprets contract text, moves money, or drops an unmatched residual.

## Classification

- **Type:** custody-preserving ingestion and deterministic normalization boundary with human-reversible matching.
- **Boundary:** `statement_source`, `statement_ingest`, `statement_object`, `adapter_version`, `statement_parse`, `normalized_line`, `source_identity_mapping`, `royalty_exception` and `fx_rate_pin` ownership; rights, catalogue, contract terms, calculation and disputes remain explicit downstream or upstream seams.
- **Expected operations:** six HTTP operations, one for each assigned IA interaction (`ROY-05`, `ROY-06`, `ROY-07`, `ROY-08`, `ROY-09`, `ROY-10`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** original bytes/custody/checksums are immutable; deterministic source/version/date adapters parse whole files; probabilistic matches never move money; every row retains source amount and residual; four accounting dates remain distinct and FX never gets invented.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `18-royalty-accounting.md` | `Overview`, `Scope Reconciliation`, `Accounting Decisions`, `Features`, `Acceptance Criteria` lines 1–68 | Immutable custody, deterministic parsing, reconciliation, matching, residual and source-period decisions. |
| `18-royalty-accounting.md` | `Interactions` lines 69–100 | Exact `ROY-05`–`ROY-10` preconditions, complete transfer, duplicate, adapter, matching, exception and FX behavior. |
| `18-royalty-accounting.md` | `Contracts`, `Core Types and Errors`, `Registration, Ingestion and Matching` lines 103–164 | `ExactAmount`, `MoneyFact`, `ParseState`, `MappingState`, ingest/parse/mapping/exception contracts and exact errors. |
| `18-royalty-accounting.md` | `Data Models` and `Typed Field and Cardinality Registry` lines 165–226 | Canonical statement, adapter, parse, line, mapping, exception and FX model names and fields. |
| `18-royalty-accounting.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 227–263 | Payee/counterparty/adapter role scope, third-party isolation, evidence handling and accessible job progress. |
| `18-royalty-accounting.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 264–345 | Exact ingestion/parse/mapping/exception events, duplicate bytes, parser failure, residual and deletion recovery. |
| `18-royalty-accounting.md` | `Dependency References` and `Cross-Shard Section Contract Map` lines 314–357 | BE00, Shards 01, 06, 07, 10, 22 and downstream calculation ownership. |
| `deep-dives/18-royalty-accounting.md` | `Ingestion and Parsing Algorithm` lines 19–29 | Custody, checksum, deterministic adapter, whole-file classification and reconciliation. |
| `deep-dives/18-royalty-accounting.md` | `Identity Mapping and Exception Algorithm` lines 31–42 | Identifier cascade, two-signal candidate rule, human reversibility and value-ranked exceptions. |
| `deep-dives/18-royalty-accounting.md` | `Normalization and Calculation Algorithm` lines 44–55 | Four distinct dates, exact source amounts, FX pinning and named residuals. |
| `deep-dives/18-royalty-accounting.md` | `Abuse and Recovery Verification`, `Implementation Envelope` lines 88–121 | Third-party isolation, deterministic replay, retry, outbox and privacy tests. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, actor/acting context, replay ledger, limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundary, private source bytes, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `ROY-05` Authorized party registers statement source | Bind counterparty/payee/reporting relationship, remittee, cadence, correction window and custody channels with version. | `ROY-ING-API-01` | `statement_source`; no event until source version changes through this operation. |
| `ROY-06` User uploads/forwards/fetches statement | Verify complete bytes, checksum and custody; certain-byte dedupe; retain private immutable original even when unparseable. | `ROY-ING-API-02` | `statement_ingest`, `statement_object`; `royalty.statement-ingest.changed.v1` |
| `ROY-07` System parses statement | Select declared source/fingerprint adapter effective for statement date; deterministic whole-file parse, classification and source-total reconciliation. | `ROY-ING-API-03` | `adapter_version`, `statement_parse`, `normalized_line`; `royalty.statement-parse.changed.v1` |
| `ROY-08` User resolves catalogue identities | Apply identifier cascade, show two-signal candidates, human-confirm/reject reversible mapping, preserve value and restatement trigger. | `ROY-ING-API-04` | `source_identity_mapping`, `normalized_line`; `royalty.identity-mapping.changed.v1` |
| `ROY-09` User works exception queue | Rank by open value, age and closed reason; resolve or escalate with named route; no materiality threshold drops history. | `ROY-ING-API-05` | `royalty_exception`, `source_identity_mapping`; `royalty.exception.changed.v1` |
| `ROY-10` System normalizes periods/currency | Preserve source amount/currency/precision, distinguish four dates, pin source FX and label converted residual when unavailable. | `ROY-ING-API-06` | `normalized_line`, `fx_rate_pin`, `royalty_exception`; `royalty.exception.changed.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `ROY-05` | `ROY-ING-API-01` | `POST /api/v1/royalties/statement-sources` | `RegisterStatementSourceRequest` → `RegisterStatementSourceSuccess` (`201`) | Relationship, remittee/cadence/custody, expected version, RLS and typed `ApiError`. |
| `ROY-06` | `ROY-ING-API-02` | `POST /api/v1/royalties/statement-sources/{sourceId}/ingests` | `IngestStatementRequest` → `IngestStatementSuccess` (`201`) | Complete transfer, checksum, custody, duplicate and private object state with typed `ApiError`. |
| `ROY-07` | `ROY-ING-API-03` | `POST /api/v1/royalties/statement-ingests/{ingestId}/parses` | `ParseStatementRequest` → `ParseStatementSuccess` (`201`) | Declared adapter/fingerprint/date, whole-file deterministic parse, reconciliation and typed `ApiError`. |
| `ROY-08` | `ROY-ING-API-04` | `POST /api/v1/royalties/statement-parses/{parseId}/identity-mappings` | `ConfirmIdentityMappingRequest` → `ConfirmIdentityMappingSuccess` (`200`) | Human payee scope, two-signal candidate, reversible mapping, no money movement and typed `ApiError`. |
| `ROY-09` | `ROY-ING-API-05` | `POST /api/v1/royalties/exceptions/{exceptionId}/resolutions` | `ResolveExceptionRequest` → `ResolveExceptionSuccess` (`200`) | Closed taxonomy, named route/value preservation, escalation and typed `ApiError`. |
| `ROY-10` | `ROY-ING-API-06` | `POST /api/v1/royalties/normalized-lines/{lineId}/normalize` | `NormalizeLineRequest` → `NormalizeLineSuccess` (`200`) | Four dates, exact decimal/source-native amount, seven-day FX rule and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| `ROY-ING-API-01` | `POST` | `/api/v1/royalties/statement-sources` | `ROY-05` | Payee/rightsholder or mandated administrator owns the counterparty reporting relationship. | `201` `RegisterStatementSourceSuccess` |
| `ROY-ING-API-02` | `POST` | `/api/v1/royalties/statement-sources/{sourceId}/ingests` | `ROY-06` | Bound payee/counterparty actor or scoped service principal supplies custody bytes. | `201` `IngestStatementSuccess` |
| `ROY-ING-API-03` | `POST` | `/api/v1/royalties/statement-ingests/{ingestId}/parses` | `ROY-07` | Authorized adapter worker or payee-scoped operator invokes the declared adapter. | `201` `ParseStatementSuccess` |
| `ROY-ING-API-04` | `POST` | `/api/v1/royalties/statement-parses/{parseId}/identity-mappings` | `ROY-08` | Payee/rightsholder or catalogue-mandated collaborator acts only on that payee’s catalogue. | `200` `ConfirmIdentityMappingSuccess` |
| `ROY-ING-API-05` | `POST` | `/api/v1/royalties/exceptions/{exceptionId}/resolutions` | `ROY-09` | Payee/rightsholder or mandated administrator resolves only authorized exception scope. | `200` `ResolveExceptionSuccess` |
| `ROY-ING-API-06` | `POST` | `/api/v1/royalties/normalized-lines/{lineId}/normalize` | `ROY-10` | Authorized normalization worker or payee-scoped administrator updates source-derived view. | `200` `NormalizeLineSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, mandateVersion, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Shard 10/09 reporting-relationship resolver | `{counterpartyId, payeePartyId, expectedVersion}` → `{relationshipVersion, remitteeId, allowedChannels, correctionWindow}` | 600 ms | 2 retries at 100 ms/300 ms with same read key | Open after 4 failures/30 s; source write stops; half-open after 20 s. |
| Private custody/object store | `{transferId, objectRef, byteLength, checksum, custodyChannel}` → `{acceptedLength, checksum, immutableObjectRef, custodyReceipt}` | 1,500 ms | 3 retries at 2 s/8 s/32 s only when provider confirms offset; no retry on checksum mismatch | Open after 5 failures/60 s; ingest remains transferring/incomplete; half-open after 30 s. |
| Deterministic adapter registry/worker | `{sourceId, fingerprint, statementDate, adapterVersion}` → `{schema, classification, normalizedRows[], declaredTotal, tolerance}` | 2,500 ms | 2 retries at 200 ms/600 ms with same input checksum | Open after 4 failures/60 s; parse remains blocked; half-open after 30 s. |
| Catalogue identity candidate service | `{payeePartyId, sourceIdentityKeys[], signalClasses}` → `{candidates[], evidenceClasses[], catalogueVersion}` | 800 ms | 2 retries at 100 ms/300 ms; no retry as confirmation | Open after 4 failures/30 s; mapping remains review_required; half-open after 20 s. |
| FX rate provider/pin service | `{fromCurrency, toCurrency, asOfDate, sourceAmount}` → `{rate, rateDate, provider, method}` | 700 ms | 2 retries at 100 ms/300 ms; no rate invented after exhaustion | Open after 5 failures/60 s; source-native line plus named residual; half-open after 30 s. |
| Shard 06/10 exception or conflict handoff | `{exceptionId, routeClass, openValue, evidenceRef}` → `{caseId, accepted}` | 800 ms | 2 retries at 100 ms/300 ms through durable outbox | Open after 4 failures/30 s; exception remains open; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; timestamps are RFC 3339 with offset, dates are ISO calendar dates, IDs are UUIDs, and every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Key = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const ExactAmount = z.string().regex(/^-?(0|[1-9]\\d*)(\\.\\d{1,18})?$/);
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
const MoneyFact = z.object({ amount: ExactAmount, currency: z.string().regex(/^[A-Z]{3}$/), precision: z.int().min(0).max(18) }).strict();
const Blocker = z.object({ code: z.string().trim().min(1).max(80), ownerPartyId: Uuid.nullable(), message: z.string().trim().min(1).max(500) }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const RegisterStatementSourceRequest = z.object({ ...Context.shape, idempotencyKey: Key, counterpartyId: Uuid, payeePartyId: Uuid, remitteePartyId: Uuid, cadence: z.enum(["weekly", "monthly", "quarterly", "irregular"]), correctionWindowDays: z.int().nonnegative().max(3650), custodyChannels: z.array(z.enum(["upload", "dkim_forward", "platform_fetch"])).min(1).max(3), expectedVersion: z.int().positive().nullable() }).strict();
export const RegisterStatementSourceSuccess = z.object({ sourceId: Uuid, relationshipVersion: z.int().positive(), state: z.enum(["active", "suspended"]), version: z.int().positive() }).strict();

export const IngestStatementRequest = z.object({ ...Context.shape, idempotencyKey: Key, sourceId: Uuid, custodyChannel: z.enum(["upload", "dkim_forward", "platform_fetch"]), transferId: Key, objectRef: Key, byteLength: z.int().positive().max(10737418240), checksum: z.string().length(64).regex(/^[a-f0-9]+$/), receivedAt: DateTime, declaredStatementId: z.string().trim().max(160).nullable() }).strict();
export const IngestStatementSuccess = z.object({ ingestId: Uuid, objectId: Uuid, state: z.enum(["received", "duplicate", "notification_only"]), checksum: z.string().length(64).regex(/^[a-f0-9]+$/), duplicateOfId: Uuid.nullable(), version: z.int().positive() }).strict();

export const ParseStatementRequest = z.object({ ...Context.shape, idempotencyKey: Key, ingestId: Uuid, adapterVersionId: Uuid, sourceFingerprint: z.string().trim().min(1).max(160), statementDate: DateOnly, expectedVersion: z.int().positive() }).strict();
export const ParseStatementSuccess = z.object({ parseId: Uuid, state: z.enum(["reconciled", "unoracled", "blocked"]), rowCount: z.int().nonnegative(), classifiedCount: z.int().nonnegative(), sourceTotal: ExactAmount.nullable(), tolerance: ExactAmount.nullable(), adapterVersionId: Uuid, version: z.int().positive() }).strict();

export const ConfirmIdentityMappingRequest = z.object({ ...Context.shape, idempotencyKey: Key, parseId: Uuid, sourceIdentityKey: Key, targetCatalogueId: Uuid.nullable(), decision: z.enum(["confirm", "reject"]), signalClasses: z.array(z.enum(["title", "isrc", "iswc", "writer", "source_identifier", "publisher"])).min(2).max(6), evidenceRef: Key, attributedValue: ExactAmount.nullable(), expectedVersion: z.int().positive() }).strict();
export const ConfirmIdentityMappingSuccess = z.object({ mappingId: Uuid, state: z.enum(["confirmed", "rejected", "review_required", "reversed"]), targetCatalogueId: Uuid.nullable(), attributedValue: ExactAmount.nullable(), version: z.int().positive() }).strict();

export const ResolveExceptionRequest = z.object({ ...Context.shape, idempotencyKey: Key, exceptionId: Uuid, action: z.enum(["not_mine", "mapping", "missing_period", "missing_rights", "escalate"]), mappingId: Uuid.nullable(), routeId: Key.nullable(), evidenceRef: Key.nullable(), expectedVersion: z.int().positive() }).strict();
export const ResolveExceptionSuccess = z.object({ exceptionId: Uuid, state: z.enum(["resolved", "escalated", "dismissed"]), action: z.enum(["not_mine", "mapping", "missing_period", "missing_rights", "escalate"]), openValue: ExactAmount, routeId: Key.nullable(), version: z.int().positive() }).strict();

export const NormalizeLineRequest = z.object({ ...Context.shape, idempotencyKey: Key, lineId: Uuid, sourceMoney: MoneyFact, usageDate: DateOnly.nullable(), distributionDate: DateOnly.nullable(), receiptDate: DateOnly.nullable(), payoutDate: DateOnly.nullable(), reportingCurrency: z.string().regex(/^[A-Z]{3}$/).nullable(), fxRatePinId: Uuid.nullable(), reportingRate: z.string().regex(/^\\d+(\\.\\d{1,18})?$/).nullable(), rateDate: DateOnly.nullable(), expectedVersion: z.int().positive() }).strict();
export const NormalizeLineSuccess = z.object({ lineId: Uuid, sourceAmount: ExactAmount, sourceCurrency: z.string().regex(/^[A-Z]{3}$/), periodBasis: z.enum(["usage", "distribution", "receipt", "payout", "unknown"]), fxRatePinId: Uuid.nullable(), convertedAmount: ExactAmount.nullable(), residual: ExactAmount.nullable(), state: z.enum(["normalized", "exception"]), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `ROY-ING-API-01` | `RegisterStatementSourceRequest` | `RegisterStatementSourceSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-ING-API-02` | `IngestStatementRequest` | `IngestStatementSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-ING-API-03` | `ParseStatementRequest` | `ParseStatementSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-ING-API-04` | `ConfirmIdentityMappingRequest` | `ConfirmIdentityMappingSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-ING-API-05` | `ResolveExceptionRequest` | `ResolveExceptionSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-ING-API-06` | `NormalizeLineRequest` | `NormalizeLineSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `ROY-ING-API-01` | Require payee/counterparty reporting relationship, remittee, cadence, correction window and at least one custody channel. Expected version serializes edits; uploader status alone cannot create a relationship. |
| `ROY-ING-API-02` | Require bound source, complete positive byte length, lowercase SHA-256, supported custody receipt and private object reference. Same source/payee checksum returns `DUPLICATE_STATEMENT` without second parse/calculation; mismatch returns `TRANSFER_INCOMPLETE` and no half-ingest. |
| `ROY-ING-API-03` | Require `received` immutable ingest, declared source fingerprint, adapter effective for statement date and expected version. Parse whole file deterministically; unclassified rows or source-total mismatch outside file-derived tolerance return `PARSE_UNRECONCILED`; missing total is `unoracled`, never silently reconciled. |
| `ROY-ING-API-04` | Require payee catalogue scope and at least two independent signal classes before presenting a candidate. Human confirm/reject is reversible; title-only candidates remain open exceptions and no probability threshold moves money. |
| `ROY-ING-API-05` | Require open exception, closed action taxonomy and value/evidence-preserving route. No materiality threshold drops an item; mapping, period, rights and escalation actions retain closed history and a named route. |
| `ROY-ING-API-06` | Require source amount/currency/precision and keep usage, distribution, receipt and payout dates distinct. A usable period must be proven; FX is pinned on or before the date within seven days or source-native value plus named converted residual returns `FX_UNAVAILABLE`. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `ROY-ING-API-01` | `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for no reporting relationship; `404` hides unknown payee/counterparty/source. | Required 24 h; hash includes counterparty/payee/remittee/cadence/window/channels. Replay returns source; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 source writes/hour/payee; 100/day/administrator. | Log operationId, requestId, payee/counterparty hashes, cadence/channel classes and version; no bank/custody detail. |
| `ROY-ING-API-02` | `TRANSFER_INCOMPLETE`, `DUPLICATE_STATEMENT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for unbound uploader; `404` hides source/object. | Required 30 days per source/checksum/byte length. Replay returns ingest/object state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 ingests/hour/source; 10 GiB/day/payee. | Log operationId, requestId, source/transfer hashes, byte bucket, checksum prefix, custody class and provider latency; no object ref/bytes. |
| `ROY-ING-API-03` | `ADAPTER_MISMATCH`, `PARSE_UNRECONCILED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for unauthorized adapter/payee scope; `404` hides ingest/adapter. | Required 24 h; hash includes ingest checksum/adapter/fingerprint/date. Replay returns parse; mismatch returns `IDEMPOTENCY_MISMATCH`. | 30 parses/hour/source; 5 concurrent/ingest. | Log operationId, requestId, ingest/adapter hashes, state, row counts, tolerance class and latency; no statement lines. |
| `ROY-ING-API-04` | `MAPPING_CONFIRMATION_REQUIRED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for foreign catalogue; `404` hides parse/source identity/mapping. | Required 30 days; hash includes parse/source key/decision/signals/evidence hash. Replay returns mapping; mismatch returns `IDEMPOTENCY_MISMATCH`. | 120 mapping decisions/hour/payee; 20/minute/actor. | Log operationId, requestId, parse/mapping hashes, signal classes, decision and value bucket; no title/evidence/party names. |
| `ROY-ING-API-05` | `NOT_AUTHORIZED`, `MAPPING_CONFIRMATION_REQUIRED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for out-of-scope exception; `404` hides exception. | Required 24 h; hash includes exception/action/mapping/route/evidence hash. Replay returns resolution; mismatch returns `IDEMPOTENCY_MISMATCH`. | 300 resolutions/hour/payee; 50 escalations/day. | Log operationId, requestId, exception hash, action/reason/age/value classes and route state; no raw source identity. |
| `ROY-ING-API-06` | `PERIOD_UNKNOWN`, `FX_UNAVAILABLE`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for foreign line; `404` hides parse/line. | Required 24 h; hash includes line/source money/four dates/rate inputs. Replay returns normalized view/residual; mismatch returns `IDEMPOTENCY_MISMATCH`. | 600 normalizations/hour/worker; 100/minute/line scope. | Log operationId, requestId, line hash, currency/period class, FX availability, residual class and latency; no amount or payee identity. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `royalty`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL` and `version bigint NOT NULL CHECK (version > 0)`. Original objects/checksums and source amounts are immutable; provider tokens and raw statement bytes are private.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `statement_source` | `id uuid PK`; `counterparty_id uuid NOT NULL FK identity.party`; `payee_party_id uuid NOT NULL FK identity.party`; `remittee_party_id uuid NOT NULL FK identity.party`; `cadence text NOT NULL CHECK (cadence IN ('weekly','monthly','quarterly','irregular'))`; `correction_window_days integer NOT NULL CHECK (correction_window_days BETWEEN 0 AND 3650)`; `custody_channels jsonb NOT NULL CHECK (jsonb_typeof(custody_channels) = 'array')`; `state text NOT NULL CHECK (state IN ('active','suspended'))`; `relationship_version bigint NOT NULL CHECK (relationship_version > 0)`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(counterparty_id, payee_party_id, version)`; `(payee_party_id, state, updated_at DESC)`; `(counterparty_id, cadence)`. | Payee/rightsholder and mandated administrator read/write own relationship; counterparty sees own submission scope; service worker verifies custody; anon no grant. |
| `statement_ingest` | `id uuid PK`; `source_id uuid NOT NULL FK royalty.statement_source`; `custody_channel text NOT NULL CHECK (custody_channel IN ('upload','dkim_forward','platform_fetch'))`; `transfer_id text NOT NULL`; `object_id uuid NOT NULL FK royalty.statement_object`; `byte_length bigint NOT NULL CHECK (byte_length > 0)`; `checksum char(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$')`; `received_at timestamptz NOT NULL`; `declared_statement_id text NULL`; `state text NOT NULL CHECK (state IN ('transferring','received','duplicate','notification_only','unparseable'))`; `duplicate_of_id uuid NULL FK royalty.statement_ingest`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(source_id, checksum)`; `(source_id, received_at DESC)`; `(state, received_at)`; `(duplicate_of_id)`. | Bound payee reads own ingest metadata; custody worker writes object/state; adapter reads immutable accepted object through scoped RPC; raw object ref private; anon no grant. |
| `statement_object` | `id uuid PK`; `ingest_id uuid NULL FK royalty.statement_ingest`; `storage_object_ref text NOT NULL`; `byte_length bigint NOT NULL CHECK (byte_length > 0)`; `checksum char(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$')`; `custody_receipt_ref text NOT NULL`; `immutable boolean NOT NULL CHECK (immutable = true)`; `retention_until timestamptz NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(checksum, byte_length)`; `(ingest_id)`; `(retention_until)`. | Source owner reads no raw object through API; storage worker has object access; parser receives one signed private stream; anon and cross-payee grants denied. |
| `adapter_version` | `id uuid PK`; `source_name text NOT NULL`; `fingerprint text NOT NULL`; `effective_from date NOT NULL`; `effective_to date NULL CHECK (effective_to IS NULL OR effective_to >= effective_from)`; `schema_version text NOT NULL`; `classification_rules jsonb NOT NULL CHECK (jsonb_typeof(classification_rules) = 'object')`; `reconciliation_rules jsonb NOT NULL CHECK (jsonb_typeof(reconciliation_rules) = 'object')`; `state text NOT NULL CHECK (state IN ('review','active','retired'))`; `reviewed_by uuid NULL FK identity.party`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(source_name, fingerprint, effective_from, version)`; `(state, effective_from DESC)`; `(fingerprint)`. | Adapter maintainer reads redacted samples and writes reviewed versions; production statement browsing denied; parser worker reads active version; anon no grant. |
| `statement_parse` | `id uuid PK`; `ingest_id uuid NOT NULL FK royalty.statement_ingest`; `adapter_version_id uuid NOT NULL FK royalty.adapter_version`; `input_checksum char(64) NOT NULL`; `statement_date date NOT NULL`; `state text NOT NULL CHECK (state IN ('received','parsing','reconciled','unoracled','blocked','superseded'))`; `row_count integer NOT NULL CHECK (row_count >= 0)`; `classified_count integer NOT NULL CHECK (classified_count BETWEEN 0 AND row_count)`; `source_total text NULL`; `classified_total text NULL`; `tolerance text NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(ingest_id, adapter_version_id, input_checksum)`; `(statement_date, state)`; `(adapter_version_id, created_at DESC)`. | Payee sees safe parse summary; adapter worker writes parse/lines; downstream matching reads only accepted parse; raw lines private; anon no grant. |
| `normalized_line` | `id uuid PK`; `parse_id uuid NOT NULL FK royalty.statement_parse`; `source_row_key text NOT NULL`; `source_amount text NOT NULL`; `currency char(3) NOT NULL`; `precision smallint NOT NULL CHECK (precision BETWEEN 0 AND 18)`; `usage_date date NULL`; `distribution_date date NULL`; `receipt_date date NULL`; `payout_date date NULL`; `payee_party_id uuid NULL FK identity.party`; `source_identity_key text NULL`; `aggregation_level text NOT NULL CHECK (aggregation_level IN ('line','repeated_source','statement'))`; `state text NOT NULL CHECK (state IN ('parsed','normalized','exception','attributed'))`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(parse_id, source_row_key, version)`; `(payee_party_id, currency, state)`; `(parse_id, source_identity_key)`. | Payee reads own scoped lines; parser/normalizer workers write; third-party rows never cross payee projection; calculation reads accepted version; anon no grant. |
| `source_identity_mapping` | `id uuid PK`; `parse_id uuid NOT NULL FK royalty.statement_parse`; `source_identity_key text NOT NULL`; `target_catalogue_id uuid NULL FK catalogue.work`; `state text NOT NULL CHECK (state IN ('proposed','confirmed','rejected','reversed','review_required'))`; `signal_classes jsonb NOT NULL CHECK (jsonb_typeof(signal_classes) = 'array')`; `evidence_ref text NOT NULL`; `decided_by uuid NOT NULL FK identity.party`; `decided_at timestamptz NOT NULL`; `attributed_value text NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(parse_id, source_identity_key, version)`; `(target_catalogue_id, state)`; `(decided_by, decided_at DESC)`. | Payee/catalogue actor reads and appends own mappings; probabilistic candidates are private; calculation sees confirmed mapping only; anon no grant. |
| `royalty_exception` | `id uuid PK`; `line_id uuid NULL FK royalty.normalized_line`; `parse_id uuid NOT NULL FK royalty.statement_parse`; `reason text NOT NULL CHECK (reason IN ('not_mine','mapping','missing_period','missing_rights','escalation'))`; `open_amount text NOT NULL`; `age_days numeric(12,3) NOT NULL CHECK (age_days >= 0)`; `correction_deadline timestamptz NULL`; `route_id text NULL`; `state text NOT NULL CHECK (state IN ('open','resolved','escalated','dismissed'))`; `closed_at timestamptz NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | `(state, open_amount DESC, age_days DESC)`; `(parse_id, state)`; `(correction_deadline, state)`; `(route_id)`. | Payee sees own queue and closed history; mandated administrator resolves; Shard 06/10 receives named handoff; no materiality drop or anon grant. |
| `fx_rate_pin` | `id uuid PK`; `line_id uuid NOT NULL FK royalty.normalized_line`; `from_currency char(3) NOT NULL`; `to_currency char(3) NOT NULL`; `rate numeric(30,18) NOT NULL CHECK (rate > 0)`; `rate_date date NOT NULL`; `provider text NOT NULL`; `method text NOT NULL CHECK (method IN ('source_asserted','provider_close','nearest_prior'))`; `source_fact boolean NOT NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(line_id, from_currency, to_currency, rate_date, version)`; `(from_currency, to_currency, rate_date DESC)`; `(provider)`. | Normalization worker writes pin; payee sees rate method/date without provider credential; calculation reads immutable pin; anon no grant. |

### State, Concurrency and Transaction Rules

- Source registry is `active → suspended` and versioned by expected relationship revision. Ingest is `transferring → received` or `duplicate`/`notification_only`/`unparseable`; object bytes/checksum/custody receipt are immutable and duplicate checksum cannot create a second parse.
- Adapter versions are reviewed deterministic data, selected by declared source/fingerprint and statement date. Parse is `received → parsing → reconciled`, `unoracled` or `blocked`; prior output remains immutable when a corrected adapter is activated.
- A normalized line preserves source amount/currency/precision and four independent dates. Mapping is `proposed → confirmed` or `rejected`/`review_required`, with `reversed` as a new append-only fact that triggers downstream restatement.
- Exceptions are `open → resolved`/`escalated`/`dismissed`; closed history and open value remain queryable. Normalization writes a source-native result and optional immutable FX pin; no rate within seven days yields an exception/residual.
- All mutations use expected-version CAS and idempotency. Ingest, parse, mapping and normalization events commit with their local mutation; external provider work uses durable outbox and never fabricates acceptance.

### Grants, RLS and Retention

`royalty_api` receives execute on scoped source/ingest/parse/mapping/exception/normalization RPCs; `royalty_worker` writes objects, parses, mappings, pins, projections and outbox; `royalty_migrator` owns DDL. RLS uses BE00 `current_actor_id()`, payee/counterparty relationship predicates, catalogue scope and service-job claims. Original statement objects, custody receipts and mapping evidence retain seven years or legal minimum; derived lines may be revoked without deleting immutable source history.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed actor and ownership | 403 behavior | 404 behavior |
|---|---|---|---|
| `ROY-ING-API-01` | Payee/rightsholder or mandated administrator with counterparty reporting relationship. | `403 NOT_AUTHORIZED` outside relationship. | `404 NOT_AUTHORIZED` hides unknown payee/counterparty/source. |
| `ROY-ING-API-02` | Bound payee/counterparty actor or custody service for source. | `403 NOT_AUTHORIZED` for unbound uploader. | `404 NOT_AUTHORIZED` hides unknown source/object. |
| `ROY-ING-API-03` | Adapter worker or operator with source/payee scope. | `403 NOT_AUTHORIZED` for foreign adapter/source. | `404 NOT_AUTHORIZED` hides unknown ingest/adapter. |
| `ROY-ING-API-04` | Payee/rightsholder or catalogue collaborator for that payee. | `403 NOT_AUTHORIZED` for foreign catalogue. | `404 NOT_AUTHORIZED` hides unknown parse/identity. |
| `ROY-ING-API-05` | Payee/rightsholder or mandated administrator for exception. | `403 NOT_AUTHORIZED` outside queue scope. | `404 NOT_AUTHORIZED` hides unknown exception. |
| `ROY-ING-API-06` | Normalization worker or payee-scoped administrator. | `403 NOT_AUTHORIZED` for foreign line. | `404 NOT_AUTHORIZED` hides unknown line/parse. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `ROY-ING-API-01` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(statementSourceWrite)` → `parseZod(RegisterStatementSourceRequest)` → `idempotency(24h)` → `authorizeReportingRelationship` → `sourceVersionGuard` → `sourceTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-ING-API-02` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(statementIngest)` → `parseZod(IngestStatementRequest)` → `idempotency(30d)` → `authorizeSourceCustody` → `checksumAndLengthGuard` → `privateObjectStore` → `ingestTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-ING-API-03` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(statementParse)` → `parseZod(ParseStatementRequest)` → `idempotency(24h)` → `authorizeAdapterScope` → `adapterEffectiveDateGuard` → `deterministicWholeFileParse` → `parseTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-ING-API-04` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(identityMapping)` → `parseZod(ConfirmIdentityMappingRequest)` → `idempotency(30d)` → `authorizePayeeCatalogue` → `twoSignalGuard` → `appendMappingTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-ING-API-05` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(exceptionResolution)` → `parseZod(ResolveExceptionRequest)` → `idempotency(24h)` → `authorizeExceptionScope` → `closedReasonGuard` → `valuePreservationGuard` → `exceptionTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-ING-API-06` | `requestId` → `strictCors(royaltyIngestionOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(lineNormalization)` → `parseZod(NormalizeLineRequest)` → `idempotency(24h)` → `authorizeLineScope` → `fourDateGuard` → `fxPinGuard` → `normalizationTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use private storage, signed one-use stream URLs, custody receipts, opaque IDs, encrypted evidence refs and payee-scoped projections. Never expose statement bytes, third-party rows, bank/tax data, precise source identity or raw provider credentials. CORS never permits `*` with credentials; ingestion/parse/mapping/normalization responses are `private, no-store`. Runtime LLM parsing, client column mapping, title-only auto-match and cross-payee aggregation are forbidden.

## Data Flow

1. BE00 authenticates actor/context, verifies reporting relationship and reserves idempotency.
2. Source registration stores counterparty/payee/custody/correction facts. Ingest verifies complete bytes and checksum, then stores an immutable private object or returns duplicate.
3. Parse selects the declared deterministic adapter by source fingerprint and statement date, parses the whole file, classifies rows and reconciles only with file-derived tolerance.
4. Matching collapses repeated lines to source identities, shows two-signal candidates, and appends a human reversible mapping or value-bearing exception.
5. Exception resolution preserves open value and closed history; escalation sends a named evidence handoff.
6. Normalization keeps four dates and exact source money distinct, pins qualifying FX or returns source-native value plus a named residual, then hands normalized lines to calculation.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `royalty.statement-ingest.changed.v1` | `{eventId, ingestId, sourceId, state, checksumPrefix, custodyChannel, byteLengthClass, version, occurredAt}`; no bytes/object ref. | Parse/operations projectors; at-least-once ordered by source/ingest/version and deduped by eventId. |
| `royalty.statement-parse.changed.v1` | `{eventId, parseId, ingestId, adapterVersionId, state, rowCount, classifiedCount, reconciliationClass, version, occurredAt}`; no lines/amounts. | Matching/exceptions and calculation readiness; stale versions rejected. |
| `royalty.identity-mapping.changed.v1` | `{eventId, mappingId, parseId, sourceIdentityHash, targetCatalogueId, state, signalClassCount, version, occurredAt}`; no titles/evidence. | Replay/restatement projectors; only confirmed mappings feed calculation. |
| `royalty.exception.changed.v1` | `{eventId, exceptionId, parseId, reason, state, openValueClass, ageClass, routeClass, version, occurredAt}`; no source rows/amounts. | Exception queue, coverage and rights handoff; closed history remains auditable. |

Consumers reject stale versions, retry at 2 s/8 s/32 s, dead-letter after five attempts with an alert, preserve the last safe projection and carry BE00 `requestId`/`correlationId`. Consumers must not reinterpret parsed identity or normalized money as ownership, calculation or payment.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Reporting relationship or catalogue authorization denial | Typed `NOT_AUTHORIZED` before object/provider mutation; `403` for known foreign scope and `404` for hidden unknown resources. |
| Partial transfer, checksum mismatch or duplicate checksum | Return `TRANSFER_INCOMPLETE` or `DUPLICATE_STATEMENT`; preserve complete prior object, never half-ingest or parse duplicate bytes. |
| Adapter mismatch or unclassified/reconciled total failure | Return `ADAPTER_MISMATCH` or `PARSE_UNRECONCILED`; block downstream matching/calculation, preserve original/prior adapter output and name remediation. |
| No declared statement total | Mark parse `unoracled` and carry it visibly downstream; never silently reconcile. |
| Candidate has only title signal or mapping reverses | Keep/open value-bearing exception; mapping reversal appends new fact and emits a restatement trigger without erasing rejection history. |
| Exception action outside taxonomy or handoff outage | Refuse mutation or leave exception open; durable outbox retries named Shard 06/10 handoff and preserves value/age. |
| Period unknown or FX unavailable | Return `PERIOD_UNKNOWN` or `FX_UNAVAILABLE`, retain source-native amount and named converted residual; never guess a date/rate. |
| Owner erasure/revocation or third-party rows | Preserve minimum legal source/tombstone, remove derived access, parse privately and never notify/aggregate unrelated third parties. |
| Duplicate request/event/provider retry | Dedupe by idempotency, checksum, mapping version or eventId and return the original state without second parse, match or pin. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `ROY-ING-API-01` | Relationship/cadence/channel/version schema and exact error envelope. | Payee/counterparty mandate, no uploader authority, CORS/rate. | Source uniqueness, CAS, RLS and source event. | Relationship outage, version race and redacted audit. |
| `ROY-ING-API-02` | Byte/checksum/custody bounds and duplicate response. | Source binding, private object, no third-party projection, CORS/rate. | Immutable object, duplicate dedupe, retention and ingest event. | Partial transfer, provider retry/breaker and object leak. |
| `ROY-ING-API-03` | Adapter/fingerprint/date and parse-state schema. | Deterministic whole-file rule, no LLM/column map, CORS/rate. | Input checksum, row classification, tolerance and parse event. | Adapter mismatch, no-total, outage and stale version. |
| `ROY-ING-API-04` | Two-signal/decision/evidence mapping schema. | Payee catalogue scope, no probabilistic money movement, CORS/rate. | Reversible append-only mapping, value history and event. | Candidate service outage, reversal cascade and redaction. |
| `ROY-ING-API-05` | Closed action/route/value schema. | Queue ownership, no materiality drop, evidence privacy, CORS/rate. | Exception CAS, closed history, handoff outbox and event. | Duplicate resolution, route outage and aging alarm. |
| `ROY-ING-API-06` | Exact decimal/four dates/FX/residual schema. | Line scope, source-native preservation, no invented rate, CORS/rate. | FX pin uniqueness, date basis, exception and replay. | Seven-day FX failure, period overlap, provider breaker and metrics. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, exact decimal strings, adapter state, duplicate handling, two-signal mapping and four-date/FX rules. PostgreSQL tests run RLS, source/ingest/object uniqueness, immutable bytes, parse classification, mapping reversal and exception retention. Adapter tests exercise custody, resolver, parser, matcher, exception handoff and FX seams with exact timeout, retry/backoff, breaker and idempotency. Worker tests prove deterministic replay, event ordering, outbox handoff and third-party isolation. Playwright covers upload progress, blocker ownership, value-ranked queue, source-native residual and accessible financial tables. The gate fails on half-ingest, duplicate parse, guessed adapter/date/rate, auto-match, cross-payee leak or dropped residual.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all six routes have strict Zod 4 request/success/error contracts, exact decimal fields, statuses and global error envelope.
- **Pass 2 — macro boundary:** custody, deterministic parsing, matching, exceptions, FX, rights/catalogue and downstream calculation ownership are explicit; no original or contract truth is duplicated.
- **Pass 3 — lifecycle/race:** checksum dedupe, adapter version selection, reversible mapping, closed exception history, expected-version CAS and four-date normalization are explicit.
- **Pass 4 — failure/abuse:** partial transfer, no-total, title-only candidate, provider outage, third-party rows, guessed FX/date and residual loss are testable.
- **Pass 5 — data/privacy:** all nine canonical models have typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`ROY-05`–`ROY-10`), all six routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, recovery and tests. Custody, adapter, catalogue, exception, FX and Shard 06/10 seams specify exact request/response, timeout, retries/backoff and circuit-breaker behavior. Duplicate bytes, unoracled totals, reversible matching, closed exceptions and source-native residuals are resolved.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 18 and deep dive; locked immutable statement custody, deterministic parsing, reversible matching and source-native normalization. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) provides auth, acting context, errors, idempotency, rate limits, CORS, audit and outbox.
- [Shard 01 — Identity and authority](../ia/01-identity-authority.md#contracts) provides human, party and mandate resolution.
- [Shard 06 — Trust and safety](../ia/06-trust-safety.md#contracts) receives evidence/conflict routes.
- [Shard 07 — Credits core](../ia/07-credits-core.md#contracts) supplies performer/catalogue credit inputs where applicable.
- [Shard 10 — Rights and ownership](../ia/10-rights-ownership.md#contracts) owns works, rights, splits and source conflict truth.
- [Shard 22 — Release and distribution](../ia/22-release-distribution.md#contracts) owns recording identifiers used by catalogue matching.
