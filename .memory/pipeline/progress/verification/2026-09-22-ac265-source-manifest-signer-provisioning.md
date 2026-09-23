# AC265 first-time source-manifest signer provisioning

**Date**: 2026-09-22 local (GitHub metadata timestamps fall on 2026-09-23 UTC)
**Scope**: first-time creation of the owner-controlled AC265 source-manifest
signing key and configuration of the protected staging secret and variable.
No bundle publication, no workflow dispatch, no application code change, no
tracker change.

**Verdict**: the signer exists, is stored owner-only outside the repository,
signs and authenticates through the repository's own AC265 code, and the
protected staging secret and variable are configured. The owner accepted this
provisioning and the root operator independently re-verified the secret
metadata, the key-ID readback, the local 0700/0600 permissions, the Ed25519
public-key type, and the SPKI fingerprint-to-key-ID match. The protected
AC265_PUBLICATION_CONTEXT_BUNDLE_B64 value remains entirely **unset**, and the
concrete remaining blocker is genuine signed hosted source artifacts with an
approved issuer and pinning plus a fresh authorization at publication time.

**Status of this document**: first issue recorded signer creation as awaiting
owner authority. That authority was granted and the signer was accepted, so the
2026-09-23 annotations below supersede only that framing. Historical evidence
and the original statements are preserved.

## Key material

Generated with OS randomness through Node's generateKeyPairSync('ed25519'):
one Ed25519 key pair, PKCS#8 private PEM and SPKI public PEM. No key was
imported, reused, or fabricated.

| Field               | Value                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Algorithm           | Ed25519                                                                                            |
| Public fingerprint  | sha256:456f32d0f927339df47e5df35fde5257bd5049562d842f0339b68947ac16e4df (SPKI DER SHA-256)         |
| Non-secret key ID   | ac265-source-manifest-ed25519-456f32d0f927339df47e5df35fde5257 (62 chars; matches the key-ID rule) |
| Local root          | /home/rob/.config/wejammin/ac265 (0700)                                                            |
| Private key         | ac265-source-manifest-signing-key.pem (0600, PKCS#8 PEM)                                           |
| Public key          | ac265-source-manifest-signing-key.pub.pem (0644, SPKI PEM)                                         |
| Nonsecret manifest  | ac265-source-manifest-signer.manifest.json (0644)                                                  |
| Provisioning script | provision-ac265-source-manifest-signer.mjs (0700)                                                  |

The local manifest records the public key, fingerprint, key ID, intended uses,
GitHub scope, and creation time, and contains no private key material and no
context bundle. The provisioning script refuses to overwrite existing material
and prints only the key ID, fingerprint, and paths. Private bytes never entered
the repository, a patch, a command argument, or a log.

### Verification performed (local synthetic probe, not hosted acceptance)

The local sign/verify round trip inside the provisioning script returned a
64-byte signature and successful verification. A separate probe then drove the
repository's real code with the generated material and produced a 64-byte
manifest signature, manifest digest
c66688716b9488c0fa1b2afed764ae90aec75cc18402c51ba5ce079fe35c2b30, and
authority_authenticated=true through createAc265HostedArtifactSourceAuthority
with the public key pinned as the trusted authority key. The probe used
synthetic bindings and an independent placeholder artifact-attestation key, was
written outside the repository, and was removed afterward. No signed production
or staging content was produced.

This is a **local synthetic probe, not hosted acceptance**. It demonstrates that
the generated private key produces a signature the repository's own verifier
accepts against the matching public key. It does not produce, authenticate, or
stand in for any hosted server receipt or execution-evidence artifact, and it
does not close any acceptance criterion.

The schema authenticates the authority manifest embedded in the bundle and
signs the finalized publication manifest with the same trusted authority key,
so one Ed25519 key serves both roles. A distinct artifactTrustedKeys issuer key
that signs hosted receipt/evidence bytes is not covered by this task scope and
was not requested in GitHub.

## GitHub configuration

| Location         | Name                                          | Value                                                          |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------- |
| staging secret   | AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM | private key PEM (read from the 0600 file on stdin)             |
| staging variable | AC265_SOURCE_MANIFEST_SIGNING_KEY_ID          | ac265-source-manifest-ed25519-456f32d0f927339df47e5df35fde5257 |

The secret was set with gh secret set --env staging reading the private key file
from standard input, not from a command argument. The variable was set with
gh variable set --env staging reading the key ID from standard input.

### Metadata verification and limits

- The staging environment secret list now reports
  AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM with update timestamp
  2026-09-23T00:00:57Z. The four pre-existing staging secrets retain their
  original timestamps, so nothing was overwritten.
- The staging variable reads back the exact key ID string above.
- GitHub returns no secret plaintext for environment secrets. The secret value
  is **not** independently readable and is not claimed to be verified
  byte-for-byte; only existence, name, and update timestamp were confirmed.
- Environment protection is unchanged: environment staging id 20859761817,
  can_admins_bypass true, branch-policy rule 64645815, and the sole custom
  deployment branch policy main (id 59128236). No reviewer, protection, or
  branch policy was added or altered.
- Repository-level secrets remain empty (total_count 0), and no AC265 secret
  exists in the production environment.
- No new application identity, role, or provider state was created.

Root operator follow-up (2026-09-23): the owner accepted this provisioning, and
the root operator independently re-verified the staging secret existence and
update metadata, the variable key-ID readback, the local 0700 directory and 0600
private-file permissions, the Ed25519 public-key type, and the SPKI fingerprint
match against both the local manifest and the configured key ID. No key, secret,
variable, workflow, or protected state was created or modified during this
documentation pass.

## Bundle field prerequisites (schema-derived)

AC265_PUBLICATION_CONTEXT_BUNDLE_B64 is base64 of a UTF-8 JSON document with
schema ac265-hosted-artifact-source-manifest-context-v1 and exactly these
top-level members: schemaVersion, repository, branch, sourceRevision,
authorizationRef, candidateRef, optional idempotencyRef, optional
finalizationRef, authorization, candidate, authority, provenance, and archives.

- repository equals WeJustJammin/wejammin; branch equals main; sourceRevision is
  40-hex lowercase.
- authorizationRef is ac265-authorization://staging/ with a UUID v4 suffix and
  must equal the dispatched authorization_ref input.
- candidateRef is ac265-candidate://staging/ with a UUID v4 suffix and must
  equal the dispatched candidate_ref input.
- authorization carries authorizedAt and expiresAt as offset-bearing ISO
  timestamps, with a positive window of at most 5 minutes
  (AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS).
- candidate carries candidateId, runId, identitySha256, deploymentId, and
  runnerContractSha256; candidateId and runId are UUID v4, and the digests are
  64-hex.
- authority carries manifestBytesBase64, expected, trustedAuthorityKeys,
  artifactTrustedKeys, and trustedCutoffAt.
  - manifestBytesBase64 is the canonical signed
    ac265-hosted-artifact-source-manifest-v1 bytes: schema version, domain
    WEJAMMIN-AC265-HOSTED-ARTIFACT-SOURCE-MANIFEST-V1, algorithm Ed25519,
    criterion P2-S09-AC-265, environment staging, source
    protected-upstream-artifact-authority, authorityId (SafeReleaseId, max 128),
    authorityKeyId (key-ID pattern), manifestRef
    ac265-artifact-manifest://staging/ plus UUID v4, authorizationRef, runId,
    candidateIdentitySha256, sourceRevision, deploymentId,
    runnerContractSha256, sorted unique sources, issuedAt, expiresAt, and
    signature (base64 64-byte Ed25519).
  - expected mirrors authorityId, authorityKeyId, manifestRef, manifestSha256,
    authorizationRef, authorization, runId, candidateIdentitySha256,
    sourceRevision, deploymentId, and runnerContractSha256.
  - trustedAuthorityKeys entries carry authorityId, keyId, publicKeyPem,
    validFrom, validUntil, and status; at least one active key must cover
    issuedAt through expiresAt.
  - artifactTrustedKeys entries carry keyId, publicKeyPem, validFrom,
    validUntil, and status.
  - trustedCutoffAt must be at or after the authority manifest expiresAt.
- provenance carries ci and staging, each with runId, runAttempt, artifactId,
  and artifactDigest (64-hex, optionally sha256:-prefixed).
- archives holds exactly two envelopes, one per selector, each with selector,
  expectedBytes, expectedSha256, allowedMembers, requiredMembers, and sources.
  expectedSha256 must equal the matching provenance artifactDigest, and each
  source entry is ref, artifactMember, and attestationMember, where ref is an
  ac265-receipt://server/ or ac265-evidence://blob/ UUID v4 reference. At
  runtime each selector directory must hold exactly one file: the downloaded
  artifact archive.

Chronology constraints: authorizedAt at or before issuedAt, and expiresAt at or
before authorization.expiresAt.

AC265_SOURCE_MANIFEST_SIGNING_KEY_ID must equal the manifest authorityKeyId,
and the private secret must be the matching Ed25519 key.

## Upstream artifact audit (2026-09-23)

Every upstream artifact named below was downloaded and its ZIP bytes were
SHA-256-verified against the GitHub API digest before its central directory was
read for member inventory and each member JSON document was parsed for its
`schemaVersion` value. All four artifacts are unexpired and every digest
matched. No AC265 signed `server_receipt` or `execution_evidence` document and
no attestation companion exists in any of them; no parsed JSON declares an
AC265 schema version. Ordinary build, deployment, coverage, and automated-axe
reports are not AC265 hosted evidence and must not be relabeled as such. Work
below was in-memory only: no artifact bytes were retained.

| Selector | Artifact                       | Run         | ID          | Bytes   | Members | JSON docs | AC265 docs | Notable schemaVersion values                              |
| -------- | ------------------------------ | ----------- | ----------- | ------- | ------- | --------- | ---------- | --------------------------------------------------------- |
| ci       | test-evidence-1                | 35758939205 | 10710216044 | 10274   | 1       | 1         | 0          | none (`coverage/coverage-summary.json`)                   |
| ci       | workspace-build-37c0a86e...    | 35758939205 | 10709087358 | 1960041 | 240     | 6         | 0          | none                                                      |
| staging  | staging-deployment-37c0a86e... | 35759725855 | 10709686685 | 14924   | 5       | 3         | 0          | `ac266-automated-axe-v1`                                  |
| staging  | staging-verified-candidate     | 35759725855 | 10709521766 | 1982805 | 250     | 13        | 0          | `ac266-automated-axe-v1`, `ac266-staging-run-identity-v1` |

Product-side check: `createAc265HostedArtifactAttestation` has no non-test
callsite, and no workflow produces these attestations outside tests and
fixtures. There is no live producer of AC265 signed hosted source artifacts.

## Genuine missing data, and what is recoverable

Existing authentic artifacts for the last verified candidate, sourceRevision
37c0a86ee0a39d337dacfcefed15ece891ad5e2d:

| Selector            | Run         | Attempt | Artifact                       | Artifact ID | Digest                                                                  | Bytes   | Expired |
| ------------------- | ----------- | ------- | ------------------------------ | ----------- | ----------------------------------------------------------------------- | ------- | ------- |
| ci                  | 35758939205 | 1       | workspace-build-37c0a86e...    | 10709087358 | sha256:930c0619a68b1e38edf12baa089c625545e052fc89745ecb3ca79e4c0c72af81 | 1960041 | no      |
| ci (alternate)      | 35758939205 | 1       | test-evidence-1                | 10710216044 | sha256:395ea17680fdb60591c4ce6233ab82fb3b3f81ea0fe2939c47b2e6589df89ac9 | 10274   | no      |
| staging             | 35759725855 | 1       | staging-deployment-37c0a86e... | 10709686685 | sha256:c90ce94f9d37de68c8d8909a49ef59abac9bc1c1a227eab360f7f6ddc9bf55a4 | 14924   | no      |
| staging (alternate) | 35759725855 | 1       | staging-verified-candidate     | 10709521766 | sha256:616bd0eb2f5d3928c3fba19964fb88bf39634491d518a3dd468c3d245e4017bb | 1982805 | no      |

Deployment 6596526062 is environment staging, ref main, sha
37c0a86ee0a39d337dacfcefed15ece891ad5e2d. An
ac265-candidate-ref-35760013434-1 artifact (id 10709871838, 221 bytes, digest
sha256:073c03151f89b0fd78d33c0d50452cea20f07b2dbc4780296d65992158e0d6d9) exists
from preflight run 35760013434. Authorization run 35760318394 uploaded no
artifact, and its authorization reference has expired and must not be reused.

CI and staging run IDs, attempts, artifact IDs, and artifact digests are
therefore recoverable from genuine GitHub metadata, and sourceRevision,
deploymentId, and the candidate identity digest are recoverable from authentic
preflight/candidate evidence. The candidateRef must come from the registered
candidate, and the authorizationRef must come from a fresh, unexpired
authorization run.

The `allowedMembers`, `requiredMembers`, `artifactMember`, and
`attestationMember` values are also derivable from this authentic ZIP
inventory once the hosted sources exist; they are not a separate unknown
awaiting a user decision.

The `authorityId` is not an external unknown either. The owner approved
first-time authority creation, so it is chosen at bundle authoring time. The
code and tests demonstrate only the fixture value `ac265-source-authority-v1`.

The `manifestRef` and `manifestSha256` in the bundle bind the **owner-signed
authority manifest document itself**, which the owner authors and signs with
this signer, rather than a server-derived publication output. The database
register RPC does generate its own `ac265-artifact-manifest://staging/<uuid>`
reference as the _registration row_ identifier, and that value is not available
before the call; the bundle's pinned `manifestRef` is the inline signed
document reference above, which the downstream consistency check requires to
match the authority-manifest field. The two must not be conflated.

Genuinely missing, and not derivable from any existing artifact:

- authentic AC265 signed hosted source artifacts (at least one
  `server_receipt` and one `execution_evidence`, each with its signed
  attestation companion), since no live producer exists;
- the approved artifact-attestation issuer key and its `artifactTrustedKeys`
  pinning, which follow from those artifacts;
- a fresh, unexpired authorization at publication time.

## Blockers before a protected publication dispatch

1. No genuine AC265 signed hosted source artifacts exist yet. The concrete
   blocker is producing them with an approved issuer plus pinning.
2. A fresh, unexpired authorization reference from a real authorization run is
   required, because the last one expired.
3. The authority manifest embedded in the bundle must be signed with this
   signer, and its authorityKeyId must equal both the configured variable and
   the bundle expected.authorityKeyId.
4. AC265_PUBLICATION_CONTEXT_BUNDLE_B64 remains entirely unset. It must be
   authored by the owner once items 1-3 exist, and no placeholder bundle or
   expired reference may be written to make the name present.
5. Coordinator review of these prerequisites is required before any protected
   workflow dispatch.

## Boundaries this record does not cross

No acceptance criterion is closed. No hosted acceptance, retained hosted
artifact, or independently authenticated receipt exists, so AC265 remains open,
Slice 09 stays at 279/282 active, Phase 2 stays 8/17, and Slice 10 remains
locked. AC209 and AC211 were not touched. No protections, reviewers, roles, app
identities, or provider state were changed, and no paid service was enabled. No
workflow was dispatched, and no application code was edited.

The 2026-09-23 update added the upstream artifact audit, corrected the
prerequisites wording, and recorded the root verification. It generated no key
material, secret, variable, bundle, signature, or hosted observation, and it
changed no tracker count. No criterion is marked passed, and the totals above
are unchanged.

## Local sources

- Upstream artifact inventory (2026-09-23): GitHub Actions artifacts for CI run
  35758939205 and staging run 35759725855, digest-verified and inventoried in
  memory.
- infra/workflows/publish-ac265-hosted-artifact-source-manifest-bundle.ts and
  the matching context module: bundle shape, bounds, and field validation.
- infra/workflows/publish-ac265-hosted-artifact-source-manifest-publisher.ts:
  key-ID-to-manifest binding and the fail-closed publication sequence.
- infra/workflows/ac265-hosted-artifact-source-manifest-crypto.ts and the
  matching bindings module: Ed25519 signing, trusted-key windows, bindings.
- packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts:
  canonical manifest schema and the five-minute lifetime bound.
- .github/SECRETS.md: authorized protected secret and variable ownership.
- .github/workflows/attest-ac265-hosted-artifact-source-manifest.yml: the
  protected publication workflow and its secret/variable wiring.
