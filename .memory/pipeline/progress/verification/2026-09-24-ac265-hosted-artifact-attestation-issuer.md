# AC265 hosted-artifact attestation issuer — CP-04j

**Date**: 2026-09-24  
**Verdict**: local/private implementation GREEN; hosted acceptance OPEN  
**Closes**: no AC265 criterion

## Implemented boundary

CP-04j adds the missing live producer for the CP-04c/CP-04d hosted-artifact
attestation path. The designation is CP-04j because the CP-04i label is
already owned by the run-manifest producer-side integration on the
`codex/ac265-manifest-v3-integration` branch. The repository could already
authenticate exact receipt and execution-evidence bytes and resolve them
through a branded resolver, but
`createAc265HostedArtifactAttestation` had no non-test callsite, so nothing could
produce the signed companions the resolver consumes.

`createAc265HostedArtifactAttestationIssuer` signs caller-supplied artifact
bytes into canonical `HostedArtifactAttestationV1` companions with pinned key
material, and `runIssueAc265HostedArtifactsAttestations` runs the protected
issuance entrypoint that reads one bounded request document plus the exact
artifact members, derives every subject from the bytes, and publishes the
signed companions with a digest index beneath `RUNNER_TEMP`.

## Key pinning

The issuer key ID is derived from the signing key's own public half as
`ac265-hosted-artifact-ed25519-<sha256(SPKI DER) first 32 hex>`, and any key ID
that does not name the exact public half of the supplied private key is
rejected. The issuer returns the single active trusted key the CP-04c resolver
requires, with the caller-pinned validity window. No secret is read, written,
generated, or configured by this change.

## Byte-derived subjects

Server receipts must be complete, duplicate-member-free `ac265-hosted-e2e-receipt-v1`
envelopes: the strict receipt envelope schema, the caller run identity, and the
canonical serialized identity digest are all checked before signing, so a
bare-subject document, a foreign run, or a foreign identity fails closed.
Canonical byte form is not required there: the artifact digest is over the
exact bytes and the resolver digests the same bytes, so member order and
whitespace carry no meaning. Execution-evidence payloads are validated against
their contract, and their embedded `subjectSha256` and
`candidateIdentitySha256` must agree with the declared descriptor and the
caller run binding. Each descriptor kind also pins the payload's own `kind`
— `role` to `role_assertion`, `scenario` to `scenario_observation`, and
`session_teardown` to `session_teardown` — because that discriminator is
what the CP-04c verifier compares, so a self-consistent payload whose kind
contradicts its descriptor fails closed instead of being signed into evidence
nothing can resolve.

## Run identity

The boundary is v4-only and lowercase-exact, because the run authority mints
`randomUUID()` (version 4) and both the CP-04d source manifest and the
retained-report provenance are v4-only. One shared
`HostedArtifactAttestationRunIdSchema` is enforced by the issuer, the
entrypoint, the CP-04c attestation contract, and the resolver trust clone, so
no layer can accept a run identity another layer rejects.

An earlier revision on this branch widened three of those gates to a
version-agnostic form while the entrypoint still enforced v4-only. That made a
v7 acceptance path unreachable and would have let a signed companion exist for
a run the rest of the pipeline cannot carry. It was corrected in this branch,
not on promoted main: the widened gates were restored to v4-only, the
entrypoint gate was folded onto the same shared schema, and the entrypoint now
has direct end-to-end coverage for both a non-v4 rejection and a v4 issuance.
The layer-level v7 tests that missed the gap were inverted to assert rejection.

## Publication properties

The output directory must be exactly
`${RUNNER_TEMP}/ac265-hosted-artifact-attestations` and must not pre-exist; it
is created `0700` with the mode re-asserted on a held descriptor. Each
attestation and the index are written `O_CREAT|O_EXCL|O_NOFOLLOW` at `0600`
with `fsync` and a digest-bound readback. Request and artifact reads use one
held `O_RDONLY|O_NOFOLLOW` descriptor with `fstat` size rechecks and symlink
rejection. The step summary is appended with `O_APPEND|O_NOFOLLOW` so earlier
steps are preserved.

## Verification evidence

- Focused: **10 files / 120 tests** pass (measured on the final tree), including
  the CP-04c foundation, protected-context, security, coverage, and slice-09
  contract suites.
- The positive assembly control signs the real `createFixture` canonical
  envelopes through the protected entrypoint and requires the protected
  resolver to return byte-identical receipt and evidence bytes.
- Negative controls: bare-subject receipt, foreign run ID, mutated identity,
  declared-subject contradiction, kind/reference swap, duplicate reference,
  unbounded source set, unsafe member name, symlinked request, symlinked
  artifact, foreign signing key, out-of-window attestation, pre-existing output
  directory, and malformed request document.
- Full repository checks under pinned Node `22.23.1` / pnpm `11.24.0`:
  `pnpm test` **593 files, 4,868 passed + 1 skipped / 4,869**; `contracts:check`,
  `db:types:check`, `progress:check`, `format:check`, `lint`, `type-check`,
  `test:evidence:s09` (**7 passed**), `build`, `bundle:check`, and
  `performance:smoke` (p95 **1.358 ms** against the **500 ms** threshold) all
  exit 0. The browser gate also passed under system Chrome: **101 functional
  Playwright tests** and **5 Slice 09 real-route tests** (production-built
  server-authorized list/detail/sign-in, forged-token, expired-token, and
  revoked-session rejection) with the temporary `channel: 'chrome'` override,
  which was restored byte-identically afterward.

### Validation chronology

The first full-validate attempt at this SHA failed in the Slice 09 real-route
spec with `ERR_CONNECTION_REFUSED` on port `4324`; the wrangler dev server had
exited with `Network connection lost` inside its proxy worker while the host
carried load ~18.7 on 8 cores with significant memory pressure. An isolated
rerun of that spec on a quiet host passed **5/5**, and the subsequent full
validate on the quiet host passed with exit 0, so the failure is attributed to
host contention rather than to this change. Both runs are retained as evidence.

## Residual limitations

### Local implementation boundaries pending owner/hosted verification (2026-09-24)

An independent implementation review raised five follow-ups against this
local-only module. They are recorded here as local implementation boundaries
that remain open pending owner and hosted verification; none is an owner
decision, a locked product or architecture decision, or a hosted-acceptance
claim, and none is claimed as implemented:

- **Run identity and clock source.** The request `runId` and the source
  `issuedAt`/`expiresAt` window are caller-asserted here. A future protected
  harness must derive them from authenticated runner context; this module
  deliberately does not invent an unauthenticated clock or run authority.
- **Reference-to-content digest binding.** Kind/reference shape and exact
  membership are enforced, but the reference-to-artifact digest binding belongs
  to the CP-04d source manifest, which already pins
  `ref -> artifactSha256/attestationSha256`; it is not duplicated here.
- **Partial output on failure.** A mid-loop failure can leave signed
  attestations in the fresh owner-only directory, but no index is written, so
  the artifact is unusable and fails closed on read. Partials are preserved
  rather than deleted, matching the existing entrypoint precedent that never
  deletes a path it cannot prove it owns.
- **Underlying UI-evidence digest.** The execution-evidence payload's
  `artifactSha256` references UI evidence this producer never sees; it must be
  checked by a future independently authenticated evidence service, not here,
  exactly as in the resolver fixtures. No hosted evidence service currently
  exists, so this remains unverified.
- **Issuer primitive byte-opacity.** `createAc265HostedArtifactAttestation`
  remains byte-opaque by design; the protected wrapper derives every subject
  from the bytes and must be the only production entrypoint.

These boundaries are recorded as current implementation facts, not as resolved
decisions, and they do not close, defer, or waive any acceptance criterion.

No hosted acceptance is claimed for any of these, and the deferred items add no
new tracker count.

- No hosted acceptance, session broker, artifact store, or receipt issuer is
  added or implied. A local issuance is not hosted evidence.
- The distinct artifact-attestation issuer key and its `artifactTrustedKeys`
  pinning remain owner decisions, so the protected harness stays unwired.
- The request run ID, source window, and reference set are caller-asserted at
  this boundary; the protected wiring must supply them from authenticated
  runner context.
- No identity, credential, safe resource, or grant was created; no registry row
  was seeded; no AC265 criterion is closed and no count moves.
- AC209, AC211, and AC265 remain open; Slice 10 remains locked; AC266 remains
  owner-deferred.

## Local sources

- `infra/workflows/ac265-hosted-artifact-attestation-issuer.ts` and its
  `-inputs`, `-contract`, and `-signing` siblings.
- `infra/workflows/issue-ac265-hosted-artifact-attestations.ts` and its
  `-contract`, `-files`, and `-sources` siblings.
- `infra/workflows/ac265-hosted-artifact-attestation.ts` (CP-04c verifier) and
  `content-schema-registry-hosted-e2e-protected-context.ts` (resolver).
- `docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md` sections CP-04c and
  the server-receipt/report requirements.
