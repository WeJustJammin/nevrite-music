# AC209 email diagnostic, AC211 historical-slug provenance, and AC265 report assembler

**Date**: 2026-09-22 (local). The AC265 approval cited below was answered
2026-09-23 UTC.
**Scope**: bounded verification record for three in-flight Slice 09 changes - a
read-only AC209 failure-forensics diagnostic, the AC211 historical-repository-slug
provenance fix, and a pure AC265 hosted-E2E v3 report assembler. Documentation
only: this pass adds one note and one forward pointer and changes no code,
contract, migration, workflow, secret, deployment, or tracker count.

**Verdict**: all three changes are locally implemented with focused tests passing
under the pinned runtime. They are uncommitted work-in-progress in the working
tree, and the full `pnpm validate` gate is still running. No acceptance criterion
is closed. AC209, AC211, and AC265 stay open with the same external blockers,
AC266 stays owner-deferred, and every total below is unchanged.

## Status totals (unchanged)

Slice 09 remains **279/282 active** (**283 authored IDs**), Phase 2 remains
**8/17** with **1,999/2,000 active criteria**, Slice 10 remains locked on
AC209/AC211/AC265, and AC266 remains owner-deferred and unchecked. This record
marks no criterion passed, waived, or simulated.

## AC209 - read-only email failure-forensics diagnostic

The delivery gate collapses several distinct provider conditions into the single
`email_not_observed` code, so a failed exercise could not be told apart from zero
rows, an identity mismatch, a terminal-status mismatch, a full page, or multiple
matches. The diagnostic re-queries the documented zone settings node and a
requested historical window under the same read-only credentials, and emits
bounded counts, booleans, and closed non-PII codes only.

- `infra/workflows/ac209-email-diagnostics.ts` - bounded, read-only diagnostic.
  It reuses one provider envelope via `readAc209EmailSendingZoneRecord` and one
  request/classification/redaction boundary via
  `requestAc209EmailSendingGraphql`, both newly exported from
  `ac209-email-sending-analytics.ts` instead of duplicating provider-shape rules.
  Report schema `ac209-email-diagnostic-v1`; the window classification is one of
  `zero_rows`, `identity_mismatch`, `terminal_status_mismatch`,
  `page_truncated`, `unique_match`, `multiple_matches`, or
  `duplicate_matches`. It performs no mutation and never retains raw addresses,
  subjects, provider message IDs, provider bodies, or secrets.
- `infra/workflows/diagnose-production-ac209-email.ts` - entrypoint. Logs one
  closed status line, writes one redacted JSON artifact beneath the workspace, and
  fails closed with a code-only error.
- `.github/workflows/diagnose-production-ac209-email.yml` - explicit,
  confirmation-gated, `main`-only manual dispatch. It verifies the dispatched
  revision before any secret read, uses only the protected production environment
  and its read-only credentials, and retains only the bounded redacted artifact
  (7-day retention). Documented in `infra/workflows/README.md`.

Focused tests: `tests/ac209-email-diagnostics.test.ts` (25),
`tests/ac209-email-diagnostic-type-safety.test.ts` (3), and
`tests/ac209-email-diagnostic-workflow-contract.test.ts` (5).

## AC211 - historical-repository-slug provenance fix

The repository was renamed, and GitHub keeps serving deployment statuses and job
URLs under the slug recorded at deploy time. The production provenance verifier
rejected a genuine historical deployment because it required the exact current
`owner/name`. The fix accepts an exact, owner-scoped historical alias for this one
repository and normalizes every accepted URL to the canonical
`https://github.com/<owner>/<name>/...` before comparing the job's `html_url`.

- `infra/workflows/content-schema-registry-slo-deployment-provenance.ts` - adds
  the `HISTORICAL_REPOSITORY_SLUGS` mapping (`WeJustJammin/wejammin` ->
  `WeJustJammin/nevrite-music`), parses the status `target_url`/`log_url`
  against the accepted slugs, returns a `VerifiedProductionJobReference` that
  carries the canonical URL, and verifies the job against that canonical URL. Run,
  job, source revision, branch, and repository-identity checks are unchanged.
- `infra/workflows/verify-content-schema-registry-slo-source.ts` - drops the
  now-unused status argument to match the tightened reference type.

Focused tests: `tests/content-schema-registry-slo-deployment-provenance.test.ts`
(9). They accept the canonical URL and the genuine historical alias, and reject a
renamed fork, an archived successor, a truncated name, and hostile owners reusing
the current or historical name.

## AC265 - pure hosted-E2E v3 report assembler

This is local implementation only: a pure assembler that turns already-authenticated
inputs into the strict `ac265-hosted-e2e-v3` report. It authors no receipt, invents
no reference, and produces no hosted evidence.

- `infra/workflows/ac265-hosted-e2e-report-assembler.ts` -
  `assembleAc265HostedE2eReportV3` requires the exact strict runner-contract bytes,
  an authenticated resolver, a positive ordered window, and exact
  role/scenario/cleanup reference sets, and fails closed on any extra or missing
  key. Each slot projects only its allowlisted fields, and every emitted receipt
  digest is recomputed from the resolver-authenticated bytes rather than trusted
  from the input. Receipts are bound to the exact run ID, immutable identity,
  subject, and candidate digest, and the final report must still satisfy
  `ContentSchemaRegistryHostedE2eReportV3Schema`.
- `tests/contracts/phase-02-slice-09-ac265-hosted-e2e-report-assembler.test.ts`
  (11) covers the exact assembled report plus fail-closed cases: an
  unauthenticated resolver, input-supplied digests, cross-slot and unknown fields,
  an identity mismatch, references outside the authenticated source set, a
  non-positive window, wrong runner-contract bytes, and unknown input/reference
  fields.

No hosted server receipt, execution-evidence artifact, or publication run exists,
so AC265 remains open.

## Focused verification (first-hand)

- Pinned runtime: Node `22.23.1`, pnpm `11.24.0`.
- The five focused files above pass **5 files / 69 tests** under the pinned runtime.
- The workspace is dirty by design: these files are uncommitted. A full
  `pnpm validate` is running and its final result is not yet available, so this
  record claims no full-validation pass and presumes no green result. That result
  must be reported separately once it completes.

## External gates remaining

- AC209 needs one uniquely correlated provider event and one delivered
  `dlq_nonempty` row for the exact release, plus a retained exercise artifact. The
  diagnostic above is evidence-gathering only and closes nothing.
- AC211 needs one complete UTC day meeting every sample floor and SLO threshold;
  runs so far are sample-starved. The provenance fix unblocks legitimate historical
  statuses but produces no telemetry.
- AC265 needs hosted browser acceptance with real Auth/RLS/IdP receipts and the
  nine-role/ten-scenario matrix. `AC265_PUBLICATION_CONTEXT_BUNDLE_B64` is entirely
  unset, and genuine signed hosted source artifacts, their approved issuer/pinning,
  and a fresh publication-time authorization do not exist.
- AC266 stays owner-deferred pending genuine macOS/Safari/VoiceOver and
  Windows/Firefox/NVDA reports, which this host cannot supply.

## Approval provenance for dedicated staging accounts

The owner was asked in this session how the nine AC265 role sessions should be
obtained and answered at `2026-09-23T03:38:50Z`: **"Provision dedicated staging
test accounts (recommended)"** - approval in principle to provision dedicated
staging test accounts for the nine AC265 roles under the admin-controlled setup,
with no credentials shared in chat. This is an approval to provision, not hosted
evidence: no account, identity, grant, or session has been created, and the runner
contract still forbids the runner from creating identities, grants, mandates,
organizations, cases, content schemas, or prerequisites to make a case pass.

The **Google identity source decision is still pending**: whether the nine
identities come from a Google tenant on the owner-controlled `wejamm.in` domain
(paid Workspace seats above the locked ceiling, or a free Cloud Identity path whose
viability for consumer-style Google sign-in is unverified) or from nine personal
Google accounts, and whether the consumer owner account can participate in
`idp_sign_in`. Until that decision is made, no genuine
`fresh_google_oauth_through_supabase` flow can be produced.

This approval contradicts the recorded 2026-09-10 decision that named the owner
account the "sole intended CMS/admin principal" and rejected a second privileged
test account. Under the pipeline's progressive-lock rule that earlier decision must
be superseded by a new dated record before any account is provisioned; this note is
provenance only and does not make that change.

## Boundaries this record does not cross

No criterion is closed and no hosted acceptance is claimed. No account, identity,
grant, session, secret, bundle, signature, or provider state was created or changed.
No workflow was dispatched, no deployment or migration ran, and no tracker count
moved. The described changes are uncommitted local work: the focused results are
neither a full-validation verdict nor production or hosted evidence.

## Local sources

- `infra/workflows/ac209-email-diagnostics.ts`, `infra/workflows/diagnose-production-ac209-email.ts`, `infra/workflows/ac209-email-sending-analytics.ts` - AC209 diagnostic and its shared provider boundary.
- `.github/workflows/diagnose-production-ac209-email.yml` and `infra/workflows/README.md` - dispatch contract and entry documentation.
- `infra/workflows/content-schema-registry-slo-deployment-provenance.ts`, `infra/workflows/verify-content-schema-registry-slo-source.ts` - AC211 provenance binding and canonical-URL normalization.
- `infra/workflows/ac265-hosted-e2e-report-assembler.ts` and `packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts` - AC265 assembler and the strict report schema it must satisfy.
- `tests/ac209-email-diagnostics.test.ts`, `tests/ac209-email-diagnostic-type-safety.test.ts`, `tests/ac209-email-diagnostic-workflow-contract.test.ts`, `tests/content-schema-registry-slo-deployment-provenance.test.ts`, `tests/contracts/phase-02-slice-09-ac265-hosted-e2e-report-assembler.test.ts` - focused coverage.
- `docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md` - AC265 runner contract, nine-role/two-scenario matrix, and the no-identity-creation boundary.

Forward pointer: this note is the current AC209/AC211/AC265 change record following
`.memory/pipeline/progress/verification/2026-09-22-ac209-repair-ac211-readiness-ac265-handoff.md`,
which remains the operator handoff for the open external gates.
