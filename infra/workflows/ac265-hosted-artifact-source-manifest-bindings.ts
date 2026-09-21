import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import {
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import {
  HostedArtifactSourceManifestAuthorizationReferenceSchema,
  HostedArtifactSourceManifestReferenceSchema,
  type HostedArtifactSourceManifestV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../../packages/contracts/src/release-recovery-common.ts';
import { isRecord } from './content-schema-registry-hosted-e2e-protected-context-inputs.ts';

const FAILURE = 'AC265 hosted artifact-source authority is invalid.';
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export interface Ac265HostedArtifactSourceManifestExpectedBindings {
  readonly authorityId: string;
  readonly authorityKeyId: string;
  readonly manifestRef: string;
  readonly manifestSha256: string;
  readonly authorizationRef: string;
  readonly authorization: Readonly<{
    readonly authorizedAt: string;
    readonly expiresAt: string;
  }>;
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly sourceRevision: string;
  readonly deploymentId: string;
  readonly runnerContractSha256: string;
}

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

export const snapshotExpectedBindings = (
  input: unknown,
  manifest: HostedArtifactSourceManifestV1,
): Ac265HostedArtifactSourceManifestExpectedBindings => {
  if (!isRecord(input))
    return fail('AC265 source-manifest bindings are invalid.');
  const authorization = input['authorization'];
  if (!isRecord(authorization))
    return fail('AC265 source-manifest authorization bindings are invalid.');
  const values = {
    authorityId: input['authorityId'],
    authorityKeyId: input['authorityKeyId'],
    manifestRef: input['manifestRef'],
    manifestSha256: input['manifestSha256'],
    authorizationRef: input['authorizationRef'],
    authorizedAt: authorization['authorizedAt'],
    authorizationExpiresAt: authorization['expiresAt'],
    runId: input['runId'],
    candidateIdentitySha256: input['candidateIdentitySha256'],
    sourceRevision: input['sourceRevision'],
    deploymentId: input['deploymentId'],
    runnerContractSha256: input['runnerContractSha256'],
  };
  if (
    !SafeReleaseIdSchema.safeParse(values.authorityId).success ||
    !CmsReleaseKeyIdSchema.safeParse(values.authorityKeyId).success ||
    !HostedArtifactSourceManifestReferenceSchema.safeParse(values.manifestRef)
      .success ||
    !ReleaseEvidenceDigestSchema.safeParse(values.manifestSha256).success ||
    !HostedArtifactSourceManifestAuthorizationReferenceSchema.safeParse(
      values.authorizationRef,
    ).success ||
    !SafeReleaseTimestampSchema.safeParse(values.authorizedAt).success ||
    !SafeReleaseTimestampSchema.safeParse(values.authorizationExpiresAt)
      .success ||
    typeof values.runId !== 'string' ||
    !UUID_V4_PATTERN.test(values.runId) ||
    !ReleaseEvidenceDigestSchema.safeParse(values.candidateIdentitySha256)
      .success ||
    !ReleaseEvidenceSourceRevisionSchema.safeParse(values.sourceRevision)
      .success ||
    !SafeReleaseIdSchema.safeParse(values.deploymentId).success ||
    !ReleaseEvidenceDigestSchema.safeParse(values.runnerContractSha256).success
  )
    return fail('AC265 source-manifest bindings are invalid.');
  const authorizedAt = SafeReleaseTimestampSchema.parse(values.authorizedAt);
  const authorizationExpiresAt = SafeReleaseTimestampSchema.parse(
    values.authorizationExpiresAt,
  );
  const authorizedAtMs = Date.parse(authorizedAt);
  const authorizationExpiresAtMs = Date.parse(authorizationExpiresAt);
  const manifestIssuedAtMs = Date.parse(manifest.issuedAt);
  const manifestExpiresAtMs = Date.parse(manifest.expiresAt);
  if (
    authorizationExpiresAtMs <= authorizedAtMs ||
    authorizationExpiresAtMs - authorizedAtMs >
      AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS ||
    authorizedAtMs > manifestIssuedAtMs ||
    manifestExpiresAtMs > authorizationExpiresAtMs
  )
    return fail('AC265 source-manifest authorization chronology is invalid.');
  return Object.freeze({
    authorityId: values.authorityId as string,
    authorityKeyId: values.authorityKeyId as string,
    manifestRef: values.manifestRef as string,
    manifestSha256: values.manifestSha256 as string,
    authorizationRef: values.authorizationRef as string,
    authorization: Object.freeze({
      authorizedAt,
      expiresAt: authorizationExpiresAt,
    }),
    runId: values.runId,
    candidateIdentitySha256: values.candidateIdentitySha256 as string,
    sourceRevision: values.sourceRevision as string,
    deploymentId: values.deploymentId as string,
    runnerContractSha256: values.runnerContractSha256 as string,
  });
};

export const matchesExpectedBindings = (
  manifest: HostedArtifactSourceManifestV1,
  manifestSha256: string,
  expected: Ac265HostedArtifactSourceManifestExpectedBindings,
): boolean =>
  manifest.authorityId === expected.authorityId &&
  manifest.authorityKeyId === expected.authorityKeyId &&
  manifest.manifestRef === expected.manifestRef &&
  manifestSha256 === expected.manifestSha256 &&
  manifest.authorizationRef === expected.authorizationRef &&
  manifest.runId === expected.runId &&
  manifest.candidateIdentitySha256 === expected.candidateIdentitySha256 &&
  manifest.sourceRevision === expected.sourceRevision &&
  manifest.deploymentId === expected.deploymentId &&
  manifest.runnerContractSha256 === expected.runnerContractSha256;
