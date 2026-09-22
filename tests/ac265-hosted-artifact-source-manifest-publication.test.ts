import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi } from 'vitest';

import {
  publishAc265HostedArtifactSourceManifest,
  resolveAc265HostedArtifactSourceSelectors,
  type Ac265HostedArtifactSourceManifestProtectedContext,
} from '../infra/workflows/publish-ac265-hosted-artifact-source-manifest.ts';
import {
  AUTHORITY_KEY_ID,
  AUTHORIZATION_REF,
  DEPLOYMENT_ID,
  EVIDENCE_BYTES,
  EVIDENCE_REF,
  MANIFEST_EXPIRES_AT,
  MANIFEST_ISSUED_AT,
  RUNNER_CONTRACT_SHA256,
  SOURCE_REVISION,
  authorityPrivateKeyPem,
  authorityTrustedKey,
  evidenceAttestation,
  expectedBindings,
  manifestSourceInputs,
  signedManifest,
  trustedKey,
  RECEIPT_REF,
  RUN_ID,
  CANDIDATE_IDENTITY_SHA256,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

const PROJECT_REF = 'abcdefghijklmnopqrst';
const CANDIDATE_REF =
  'ac265-candidate://staging/80000000-0000-4000-8000-000000000008';
const CANDIDATE_ID = '80000000-0000-4000-8000-000000000008';
const CI_RUN_ID = '111111111111';
const STAGING_RUN_ID = '222222222222';
const CI_ARTIFACT_ID = 12345;
const STAGING_ARTIFACT_ID = 67890;
const FINALIZATION_REF =
  'ac265-finalization://staging/90000000-0000-4000-8000-000000000009';

const digest = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const u16 = (value: number): Buffer => {
  const bytes = Buffer.alloc(2);
  bytes.writeUInt16LE(value);
  return bytes;
};
const u32 = (value: number): Buffer => {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value >>> 0);
  return bytes;
};
const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const zip = (
  entries: readonly { name: string; bytes: Uint8Array }[],
): Buffer => {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const bytes = Buffer.from(entry.bytes);
    const crc = crc32(bytes);
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(bytes.length),
      u32(bytes.length),
      u16(name.length),
      u16(0),
      name,
      bytes,
    ]);
    const directory = Buffer.concat([
      u32(0x02014b50),
      u16(30),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(bytes.length),
      u32(bytes.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    central.push(directory);
    offset += local.length;
  }
  const centralBytes = Buffer.concat(central);
  return Buffer.concat([
    ...locals,
    centralBytes,
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralBytes.length),
    u32(offset),
    u16(0),
  ]);
};

const makeArchives = () => {
  const root = mkdtempSync(join(tmpdir(), 'ac265-publication-'));
  const ciArtifact = 'ci/evidence.bin';
  const ciAttestation = 'ci/evidence.attestation';
  const stagingArtifact = 'staging/receipt.bin';
  const stagingAttestation = 'staging/receipt.attestation';
  const ciPath = join(root, 'ci.zip');
  const stagingPath = join(root, 'staging.zip');
  writeFileSync(
    ciPath,
    zip([
      { name: ciArtifact, bytes: EVIDENCE_BYTES },
      { name: ciAttestation, bytes: evidenceAttestation.attestationBytes },
    ]),
    { mode: 0o600 },
  );
  const receipt = manifestSourceInputs.find(
    (source) => source.expectation.ref === RECEIPT_REF,
  )!;
  writeFileSync(
    stagingPath,
    zip([
      { name: stagingArtifact, bytes: receipt.artifactBytes },
      { name: stagingAttestation, bytes: receipt.attestationBytes },
    ]),
    { mode: 0o600 },
  );
  const archiveSha256 = (path: string) => digest(readFileSync(path));
  return {
    root,
    archives: [
      {
        selector: 'ci' as const,
        path: ciPath,
        expectedBytes: statSync(ciPath).size,
        expectedSha256: archiveSha256(ciPath),
        allowedMembers: [ciArtifact, ciAttestation],
        requiredMembers: [ciArtifact, ciAttestation],
        sources: [
          {
            ref: EVIDENCE_REF,
            artifactMember: ciArtifact,
            attestationMember: ciAttestation,
          },
        ],
      },
      {
        selector: 'staging' as const,
        path: stagingPath,
        expectedBytes: statSync(stagingPath).size,
        expectedSha256: archiveSha256(stagingPath),
        allowedMembers: [stagingArtifact, stagingAttestation],
        requiredMembers: [stagingArtifact, stagingAttestation],
        sources: [
          {
            ref: RECEIPT_REF,
            artifactMember: stagingArtifact,
            attestationMember: stagingAttestation,
          },
        ],
      },
    ],
  };
};

const context = (
  archives: ReturnType<typeof makeArchives>['archives'],
): Ac265HostedArtifactSourceManifestProtectedContext => ({
  repository: 'WeJustJammin/nevrite-music',
  branch: 'main',
  sourceRevision: SOURCE_REVISION,
  authorizationRef: AUTHORIZATION_REF,
  candidateRef: CANDIDATE_REF,
  idempotencyRef:
    'ac265-idempotency://staging/90000000-0000-4000-8000-000000000012',
  finalizationRef: FINALIZATION_REF,
  authorization: {
    authorizedAt: MANIFEST_ISSUED_AT,
    expiresAt: MANIFEST_EXPIRES_AT,
  },
  candidate: {
    candidateId: CANDIDATE_ID,
    runId: RUN_ID,
    identitySha256: CANDIDATE_IDENTITY_SHA256,
    deploymentId: DEPLOYMENT_ID,
    runnerContractSha256: RUNNER_CONTRACT_SHA256,
  },
  authority: {
    manifestBytes: signedManifest().manifestBytes,
    expected: expectedBindings,
    trustedAuthorityKeys: [authorityTrustedKey],
    artifactTrustedKeys: [trustedKey],
    trustedCutoffAt: '2026-09-21T10:30:00.000Z',
  },
  provenance: {
    ci: {
      runId: CI_RUN_ID,
      runAttempt: '1',
      artifactId: CI_ARTIFACT_ID,
      artifactDigest: archives.find((archive) => archive.selector === 'ci')!
        .expectedSha256,
    },
    staging: {
      runId: STAGING_RUN_ID,
      runAttempt: '1',
      artifactId: STAGING_ARTIFACT_ID,
      artifactDigest: archives.find(
        (archive) => archive.selector === 'staging',
      )!.expectedSha256,
    },
  },
  archives,
});

const projection = (
  manifestSha256: string,
  lifecycle: 'registered' | 'finalized',
) => ({
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: 'ac265-hosted-artifact-source-manifest-v1' as const,
  lifecycle,
  manifestId: '70000000-0000-4000-8000-000000000010',
  manifestRef:
    'ac265-artifact-manifest://staging/70000000-0000-4000-8000-000000000010',
  authorizationRef: AUTHORIZATION_REF,
  authorization: {
    authorizedAt: MANIFEST_ISSUED_AT,
    expiresAt: MANIFEST_EXPIRES_AT,
  },
  idempotencyRef:
    'ac265-idempotency://staging/90000000-0000-4000-8000-000000000012',
  candidateId: CANDIDATE_ID,
  runId: RUN_ID,
  identitySha256: CANDIDATE_IDENTITY_SHA256,
  environment: 'staging' as const,
  sourceRevision: SOURCE_REVISION,
  deploymentId: DEPLOYMENT_ID,
  hostingProjectId: 'wejammin-staging' as const,
  supabaseProjectRef: PROJECT_REF,
  sourceCount: 2,
  sourceSetComplete: true as const,
  kindComplete: true as const,
  registeredAt: MANIFEST_ISSUED_AT,
  sources: [
    {
      ...signedManifest().manifest.sources[0]!,
      issuedAt: MANIFEST_ISSUED_AT,
      expiresAt: MANIFEST_EXPIRES_AT,
      ordinal: 1,
    },
    {
      ...signedManifest().manifest.sources[1]!,
      issuedAt: MANIFEST_ISSUED_AT,
      expiresAt: MANIFEST_EXPIRES_AT,
      ordinal: 2,
    },
  ],
  redacted: true as const,
  manifestSha256: lifecycle === 'finalized' ? manifestSha256 : null,
  finalizationRef: lifecycle === 'finalized' ? FINALIZATION_REF : null,
  finalizedAt: lifecycle === 'finalized' ? MANIFEST_ISSUED_AT : null,
});

describe('AC265 protected source-manifest publication', () => {
  it('resolves separate CI and staging selectors only from protected authority', async () => {
    const archives = makeArchives();
    const protectedContext = context(archives.archives);
    const writeOutput = vi.fn<(value: string) => void>();
    const result = await resolveAc265HostedArtifactSourceSelectors({
      env: {
        GITHUB_REPOSITORY: 'WeJustJammin/nevrite-music',
        GITHUB_REF: 'refs/heads/main',
        GITHUB_SHA: SOURCE_REVISION,
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_WORKFLOW: 'AC265 protected source-manifest publication',
        GITHUB_RUN_ID: '333333333333',
        GITHUB_RUN_ATTEMPT: '1',
        GITHUB_TOKEN: 'step-scoped-token',
        AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
        AC265_CANDIDATE_REF: CANDIDATE_REF,
      },
      loadProtectedContext: async () => protectedContext,
      writeOutput,
    });
    expect(result).toEqual({
      ciRunId: CI_RUN_ID,
      ciArtifactId: CI_ARTIFACT_ID,
      stagingRunId: STAGING_RUN_ID,
      stagingArtifactId: STAGING_ARTIFACT_ID,
    });
    expect(writeOutput).toHaveBeenCalledWith(
      `ci_run_id=${CI_RUN_ID}\nci_artifact_id=${CI_ARTIFACT_ID}\nstaging_run_id=${STAGING_RUN_ID}\nstaging_artifact_id=${STAGING_ARTIFACT_ID}\n`,
    );
  });

  it('authenticates exact archive bytes before register, finalizes, reads back, and writes one redacted bundle', async () => {
    const archives = makeArchives();
    const protectedContext = context(archives.archives);
    const registered = projection('', 'registered');
    const register = vi.fn(async () => registered);
    const finalize = vi.fn(async (request: { manifestSha256: string }) =>
      projection(request.manifestSha256, 'finalized'),
    );
    const read = vi.fn(async () =>
      projection(
        (await finalize.mock.results[0]!.value).manifestSha256,
        'finalized',
      ),
    );
    const outputDir = join(archives.root, 'output');
    const result = await publishAc265HostedArtifactSourceManifest({
      env: {
        GITHUB_REPOSITORY: 'WeJustJammin/nevrite-music',
        GITHUB_REF: 'refs/heads/main',
        GITHUB_SHA: SOURCE_REVISION,
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_WORKFLOW: 'AC265 protected source-manifest publication',
        GITHUB_RUN_ID: '333333333333',
        GITHUB_RUN_ATTEMPT: '1',
        GITHUB_TOKEN: 'step-scoped-token',
        AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
        AC265_CANDIDATE_REF: CANDIDATE_REF,
        AC265_RESOLVED_CI_RUN_ID: CI_RUN_ID,
        AC265_RESOLVED_CI_ARTIFACT_ID: String(CI_ARTIFACT_ID),
        AC265_RESOLVED_STAGING_RUN_ID: STAGING_RUN_ID,
        AC265_RESOLVED_STAGING_ARTIFACT_ID: String(STAGING_ARTIFACT_ID),
        AC265_SOURCE_MANIFEST_SOURCE_DIR: archives.root,
        AC265_SOURCE_MANIFEST_OUTPUT_DIR: outputDir,
        AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM: authorityPrivateKeyPem,
        AC265_SOURCE_MANIFEST_SIGNING_KEY_ID: AUTHORITY_KEY_ID,
        SUPABASE_URL: `https://${PROJECT_REF}.supabase.co`,
        SUPABASE_PROJECT_REF: PROJECT_REF,
        SUPABASE_SECRET_KEY: 'sb_secret_test-only',
      },
      loadProtectedContext: async () => protectedContext,
      rpc: { register, finalize, read },
      uuid: () => '40000000-0000-4000-8000-000000000004',
    });
    expect(result).toMatch(/ac265-source-manifest\.bundle$/u);
    expect(readdirSync(outputDir)).toEqual(['ac265-source-manifest.bundle']);
    expect(statSync(result).mode & 0o777).toBe(0o600);
    const bundle = JSON.parse(readFileSync(result, 'utf8')) as Record<
      string,
      unknown
    >;
    expect(bundle['manifestSha256']).toBe(
      (await finalize.mock.results[0]!.value).manifestSha256,
    );
    expect(JSON.stringify(bundle)).not.toContain('sb_secret_test-only');
    expect(JSON.stringify(bundle)).not.toContain(
      Buffer.from(EVIDENCE_BYTES).toString(),
    );
    expect(register).toHaveBeenCalledOnce();
    expect(finalize).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledOnce();
  });
});
