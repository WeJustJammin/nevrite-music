# Content schema registry release evidence

Use this runbook to assemble and verify the release sidecar for
`P2-S09-AC-209`, `P2-S09-AC-211`, `P2-S09-AC-265`, and `P2-S09-AC-266`.
Passing local tests does not satisfy these gates.

## Immutable identity

Start from one successful immutable build. Record its full lowercase 40-character
source SHA, artifact SHA-256 digest, build ID, and migration version. Every
component report in the sidecar must name that same source SHA, and the hosted
E2E migration version must equal the artifact migration version.

The protected workflow must independently create an expected-release-identity
JSON containing the trusted source SHA, artifact digest, build ID, migration
version, production deployment ID/`productionDeployedAt`, hosted
environment/deployment ID/`hostedDeployedAt`, exact web/API/Supabase origins,
and trusted evidence cutoff `trustedCutoffAt`. Populate deployment times and
the cutoff from immutable deployment outputs/protected workflow state, never by
copying values from the sidecar being checked. The cutoff is captured after the
sidecar and reports are assembled, immediately before verification.

The protected workflow must retain the sidecar and its referenced reports as
workflow artifacts. Do not commit generated evidence, browser storage state,
provider exports, or manual-test recordings to the repository.

## Required reports

| Criterion | Required non-local evidence                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC209     | Production-native alert configuration containing every locked condition plus one redacted delivered `platform.on_call` receipt captured after that configuration.                                                 |
| AC211     | Production query/report and dataset, at least 200 command/RPC/acceptance samples, retained queue/DLQ counts, one complete UTC day, and all five observed values below their strict thresholds.                    |
| AC265     | Hosted staging or production Playwright report against pathless HTTPS origins, Google through Supabase Auth, all locked role variants, every resilience scenario, the deployed migration, and exact artifact SHA. |
| AC266     | Automated axe report with zero Serious/Critical findings and complete manual VoiceOver/Safari/macOS plus NVDA/Firefox/Windows runs against the exact hosted deployment, origin, and SHA.                          |

Manual accessibility reports record stable operator IDs rather than names or
email addresses. They include concrete OS, browser, and screen-reader versions,
completion time, report digest, `passed` outcome, and every canonical check
exactly once. A Linux screen reader or Chromium run cannot substitute for the
two locked platform pairs.

## Assemble the sidecar

Create the JSON only inside the protected workflow workspace. Its strict shape
is `ContentSchemaRegistryOperationalReleaseEvidenceSchema` in
`packages/contracts/src/content-schema-registry/operational-release-evidence.ts`.
Unknown fields fail. Raw provider payloads, request bodies, cookies, tokens,
authorization headers, email addresses, content values, and capability graphs
do not belong in the sidecar.

Every digest is paired with a safe path relative to one retained-report root.
The verifier resolves each path inside that root, rejects symlink escapes,
requires a unique regular file no larger than 10 MiB, recomputes every SHA-256
digest, and then confirms shape, exact check coverage,
immutable identity, ordering, strict SLO limits, derived daily DLQ rate,
hosted-origin safety, deployment chronology, trusted-cutoff bounds, and evidence
timing. It does not collect telemetry,
activate a provider, provision identities, attest provider truth independently,
or perform the manual tests. A local pass proves sidecar/report consistency; it
does not by itself satisfy any of the four release criteria.

Treat `approved_scheduled_boundary` as incomplete until the protected-workflow
reviewer confirms that its alert-configuration report contains the approved
change/reference record. The verifier hashes that report but does not interpret
its provider-specific contents; the enum value alone is not approval evidence.

## Verify

Run from the immutable checkout after all four report families exist:

```bash
node --experimental-strip-types \
  infra/workflows/verify-content-schema-registry-release-evidence.ts \
  "$S09_RELEASE_EVIDENCE_PATH" \
  "$S09_EXPECTED_RELEASE_IDENTITY_PATH" \
  "$S09_RELEASE_REPORT_ROOT"
```

The executable samples `Date.now()` once for its trusted clock. It rejects an
expected `trustedCutoffAt` later than that clock; equality is accepted. Direct
callers may inject a trusted clock for deterministic tests, but production
verification must use the default executable clock and create the expected
identity from protected deployment outputs.

Success emits exactly:

```text
content_schema_registry_release_evidence=passed
```

Any missing, malformed, duplicate, out-of-root, digest-mismatched, structurally
local/synthetic, stale-order, threshold-equal, threshold-exceeding, or sidecar
record declared non-redacted exits nonzero. Matching bytes and a `redacted: true`
declaration do not prove report truth or redaction; protected source review must
reject forged, synthetic, or sensitive report contents.
Keep Slice 09 and dependent Slice 10 blocked until the protected run produces a
passing sidecar and an operator reviews the retained source reports.

## Security boundary

- Provision hosted test identities and storage state outside repository files.
- Disable Playwright traces for authenticated hosted runs unless the protected
  artifact process proves they contain no cookies, tokens, email addresses, or
  OAuth query values.
- Retain only allowlisted aggregate measurements and opaque report IDs/digests.
- Never enable a paid provider or integration from this runbook.
