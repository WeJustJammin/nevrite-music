import { realpathSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_SOURCES } from './issue-ac265-hosted-artifact-attestation-contract.ts';
import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_FILE_NAME,
  AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_SCHEMA_VERSION,
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUANCE_FAILURE,
  AC265_HOSTED_ARTIFACT_ATTESTATION_OUTPUT_DIRECTORY_NAME,
  AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_MEMBERS,
  AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_SCHEMA_VERSION,
  AC265_HOSTED_ARTIFACT_ATTESTATION_SHA256_PATTERN,
  AC265_HOSTED_ARTIFACT_ATTESTATION_UUID_V4_PATTERN,
  failAc265HostedArtifactAttestationIssuance,
  type Ac265HostedArtifactAttestationEntrypointOptions,
  type Ac265HostedArtifactAttestationIssuanceSummary,
} from './issue-ac265-hosted-artifact-attestation-contract.ts';
import {
  createAc265AttestationOutputDirectory,
  isAc265AttestationDirectory,
  isAc265AttestationFileInside,
  publishAc265AttestationBytes,
  readAc265AttestationArtifactMember,
  readAc265AttestationRequestDocument,
  sha256Ac265AttestationBytes,
} from './issue-ac265-hosted-artifact-attestation-files.ts';
import {
  parseAc265HostedArtifactAttestationDeclaredSource,
  subjectSha256ForAc265HostedExecutionEvidence,
  subjectSha256ForAc265HostedServerReceipt,
} from './issue-ac265-hosted-artifact-attestation-sources.ts';
import {
  createAc265HostedArtifactAttestationIssuer,
  type Ac265HostedArtifactAttestationIssuerResult,
} from './ac265-hosted-artifact-attestation-issuer.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';

export type {
  Ac265HostedArtifactAttestationEntrypointOptions,
  Ac265HostedArtifactAttestationIssuanceSummary,
} from './issue-ac265-hosted-artifact-attestation-contract.ts';

const requireEnv = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes('\0')
  )
    return failAc265HostedArtifactAttestationIssuance();
  return value;
};

/**
 * Private-key PEM values are multi-line by nature, so they bypass the
 * single-line environment hygiene rules and are validated by the issuer.
 */
const requirePrivateKeyEnv = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0'))
    return failAc265HostedArtifactAttestationIssuance();
  return value;
};

const requireTimestamp = (value: unknown): string => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success) return failAc265HostedArtifactAttestationIssuance();
  return parsed.data;
};

const requireDigest = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !AC265_HOSTED_ARTIFACT_ATTESTATION_SHA256_PATTERN.test(value)
  )
    return failAc265HostedArtifactAttestationIssuance();
  return value;
};

/**
 * Signs caller-supplied receipt and execution-evidence bytes with the pinned
 * key and publishes the exact signed companions plus a digest index that the
 * CP-04c/CP-04d protected resolver consumes directly.
 */
export const runIssueAc265HostedArtifactsAttestations = async ({
  env,
}: Ac265HostedArtifactAttestationEntrypointOptions): Promise<Ac265HostedArtifactAttestationIssuanceSummary> => {
  try {
    const runnerTemp = requireEnv(env, 'RUNNER_TEMP');
    if (!isAc265AttestationDirectory(runnerTemp))
      return failAc265HostedArtifactAttestationIssuance();
    const summaryPath = requireEnv(env, 'GITHUB_STEP_SUMMARY');
    if (!isAc265AttestationFileInside(runnerTemp, summaryPath))
      return failAc265HostedArtifactAttestationIssuance();
    const requestPath = requireEnv(env, 'AC265_ATTESTATION_REQUEST_PATH');
    if (!isAc265AttestationFileInside(runnerTemp, requestPath))
      return failAc265HostedArtifactAttestationIssuance();
    const artifactDirectory = requireEnv(env, 'AC265_ATTESTATION_ARTIFACT_DIR');
    if (!isAc265AttestationDirectory(artifactDirectory))
      return failAc265HostedArtifactAttestationIssuance();
    if (!artifactDirectory.startsWith(`${runnerTemp}${sep}`))
      return failAc265HostedArtifactAttestationIssuance();
    const outputDirectory = requireEnv(env, 'AC265_ATTESTATION_OUTPUT_DIR');
    if (
      outputDirectory !==
      resolve(
        runnerTemp,
        AC265_HOSTED_ARTIFACT_ATTESTATION_OUTPUT_DIRECTORY_NAME,
      )
    )
      return failAc265HostedArtifactAttestationIssuance();
    if (statSync(outputDirectory, { throwIfNoEntry: false }) !== undefined)
      return failAc265HostedArtifactAttestationIssuance();
    const keyId = requireEnv(env, 'AC265_HOSTED_ARTIFACT_SIGNING_KEY_ID');
    const privateKeyPem = requirePrivateKeyEnv(
      env,
      'AC265_HOSTED_ARTIFACT_SIGNING_PRIVATE_KEY_PEM',
    );
    const keyValidFrom = requireTimestamp(
      requireEnv(env, 'AC265_HOSTED_ARTIFACT_SIGNING_KEY_VALID_FROM'),
    );
    const keyValidUntil = requireTimestamp(
      requireEnv(env, 'AC265_HOSTED_ARTIFACT_SIGNING_KEY_VALID_UNTIL'),
    );
    const request = readAc265AttestationRequestDocument(requestPath);
    if (
      Object.keys(request).sort().join(',') !==
      [...AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_MEMBERS].sort().join(',')
    )
      return failAc265HostedArtifactAttestationIssuance();
    if (
      request['schemaVersion'] !==
      AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_SCHEMA_VERSION
    )
      return failAc265HostedArtifactAttestationIssuance();
    const runId = request['runId'];
    if (
      typeof runId !== 'string' ||
      !AC265_HOSTED_ARTIFACT_ATTESTATION_UUID_V4_PATTERN.test(runId)
    )
      return failAc265HostedArtifactAttestationIssuance();
    const candidateIdentitySha256 = requireDigest(
      request['candidateIdentitySha256'],
    );
    const runnerContractSha256 = requireDigest(request['runnerContractSha256']);
    const declaredSources = request['sources'];
    if (
      !Array.isArray(declaredSources) ||
      declaredSources.length === 0 ||
      declaredSources.length > AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_SOURCES
    )
      return failAc265HostedArtifactAttestationIssuance();
    const issuer = createAc265HostedArtifactAttestationIssuer({
      keyId,
      privateKeyPem,
      validFrom: keyValidFrom,
      validUntil: keyValidUntil,
    });
    const seen = new Set<string>();
    const issued: Ac265HostedArtifactAttestationIssuerResult[] = [];
    const members: string[] = [];
    for (const declared of declaredSources) {
      const source =
        parseAc265HostedArtifactAttestationDeclaredSource(declared);
      if (seen.has(source.ref))
        return failAc265HostedArtifactAttestationIssuance();
      seen.add(source.ref);
      const artifactBytes = readAc265AttestationArtifactMember(
        artifactDirectory,
        source.artifactMember,
      );
      if (source.kind === 'server_receipt')
        subjectSha256ForAc265HostedServerReceipt(artifactBytes, source.subject);
      else
        subjectSha256ForAc265HostedExecutionEvidence(
          artifactBytes,
          source.subject,
          candidateIdentitySha256,
        );
      const member = `${source.kind}-${source.ref.slice(source.ref.lastIndexOf('/') + 1)}.json`;
      if (members.includes(member))
        return failAc265HostedArtifactAttestationIssuance();
      members.push(member);
      issued.push(
        issuer.signArtifact(
          {
            kind: source.kind,
            artifactRef: source.ref,
            artifactBytes,
            subject: source.subject,
            issuedAt: source.issuedAt,
            expiresAt: source.expiresAt,
          },
          { runId, candidateIdentitySha256, runnerContractSha256 },
        ),
      );
    }
    createAc265AttestationOutputDirectory(outputDirectory);
    const entries = issued.map((result, index) => {
      const attestationMember = members[index]!;
      publishAc265AttestationBytes(
        outputDirectory,
        attestationMember,
        result.attestationBytes,
      );
      return {
        kind: result.kind,
        ref: result.artifactRef,
        keyId: result.keyId,
        artifactSha256: result.artifactSha256,
        attestationSha256: sha256Ac265AttestationBytes(result.attestationBytes),
        subjectSha256: result.subjectSha256,
        attestationMember,
        issuedAt: result.issuedAt,
        expiresAt: result.expiresAt,
      };
    });
    const indexPath = publishAc265AttestationBytes(
      outputDirectory,
      AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_FILE_NAME,
      Buffer.from(
        `${JSON.stringify(
          {
            schemaVersion:
              AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_SCHEMA_VERSION,
            runId,
            candidateIdentitySha256,
            runnerContractSha256,
            keyId,
            trustedKeys: issuer.trustedKeys,
            entries,
          },
          null,
          2,
        )}\n`,
        'utf8',
      ),
    );
    writeFileSync(
      summaryPath,
      [
        '## AC265 hosted artifact attestation issuance',
        '',
        'Local signing boundary only. Hosted browser acceptance was not run.',
        '',
        `- Run ID: \`${runId}\``,
        `- Signing key ID: \`${keyId}\``,
        `- Attested sources: \`${entries.length}\``,
        `- Index: \`${AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_FILE_NAME}\``,
        '',
      ].join('\n'),
      { encoding: 'utf8', flag: 'w', mode: 0o600 },
    );
    return Object.freeze({
      runId,
      keyId,
      sources: entries.length,
      outputDirectory,
      indexPath,
      trustedKeys: issuer.trustedKeys,
    });
  } catch {
    return failAc265HostedArtifactAttestationIssuance();
  }
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  if (typeof entrypoint !== 'string') return false;
  try {
    return pathToFileURL(realpathSync(entrypoint)).href === import.meta.url;
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  try {
    await runIssueAc265HostedArtifactsAttestations({ env: process.env });
  } catch {
    console.error(AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUANCE_FAILURE);
    process.exitCode = 1;
  }
}
