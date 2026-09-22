import { createHash } from 'node:crypto';

import { createAc265HostedArtifactSourceAuthority } from './ac265-hosted-artifact-source-manifest.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';
import {
  AC265_PUBLICATION_FAILURE,
  validateAc265ProtectedPublicationContext,
  type Ac265HostedArtifactSourceManifestProtectedContext,
  type Ac265PublicationEnv,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import {
  allowed,
  archivePath,
  decodeBase64,
  MAX_BUNDLE_BASE64_BYTES,
  MAX_BUNDLE_BYTES,
  normalizeAuthority,
  requireRecord,
  strictString,
  validateArchiveEnvelope,
  walkBounds,
} from './publish-ac265-hosted-artifact-source-manifest-bundle-support.ts';

const FAILURE = AC265_PUBLICATION_FAILURE;
const BUNDLE_SCHEMA = 'ac265-hosted-artifact-source-manifest-context-v1';
const fail = (): never => {
  throw new Error(FAILURE);
};

const decodeProtectedBundle = (value: unknown): Uint8Array =>
  decodeBase64(value, MAX_BUNDLE_BYTES);

export const digestAc265ProtectedContextBundle = (value: unknown): string => {
  const bytes = decodeProtectedBundle(value);
  try {
    return createHash('sha256').update(bytes).digest('hex');
  } finally {
    bytes.fill(0);
  }
};

export const loadAc265ProtectedContextFromWorkflowBundle = (input: {
  readonly env: Ac265PublicationEnv;
  readonly requireArchives: boolean;
}): Ac265HostedArtifactSourceManifestProtectedContext => {
  const encoded = strictString(
    input.env['AC265_PUBLICATION_CONTEXT_BUNDLE_B64'],
    MAX_BUNDLE_BASE64_BYTES,
  );
  const bundleBytes = decodeProtectedBundle(encoded);
  try {
    let parsed: unknown;
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(
        bundleBytes,
      );
      if (text.charCodeAt(0) === 0xfeff) return fail();
      parsed = parseJsonBytesWithoutDuplicateMembers(
        Buffer.from(text, 'utf8'),
        'AC265 protected context bundle',
      );
    } catch {
      return fail();
    }
    walkBounds(parsed);
    const root = requireRecord(parsed);
    allowed(root, [
      'schemaVersion',
      'repository',
      'branch',
      'sourceRevision',
      'authorizationRef',
      'candidateRef',
      'idempotencyRef',
      'finalizationRef',
      'authorization',
      'candidate',
      'authority',
      'provenance',
      'archives',
    ]);
    if (root['schemaVersion'] !== BUNDLE_SCHEMA) return fail();
    const authorization = requireRecord(root['authorization']);
    allowed(authorization, ['authorizedAt', 'expiresAt']);
    const candidate = requireRecord(root['candidate']);
    allowed(candidate, [
      'candidateId',
      'runId',
      'identitySha256',
      'deploymentId',
      'runnerContractSha256',
    ]);
    const provenance = requireRecord(root['provenance']);
    for (const selector of ['ci', 'staging'] as const) {
      const selected = requireRecord(provenance[selector]);
      allowed(selected, [
        'runId',
        'runAttempt',
        'artifactId',
        'artifactDigest',
      ]);
    }
    const rawArchives = root['archives'];
    if (!Array.isArray(rawArchives) || rawArchives.length !== 2) return fail();
    const envelopes = rawArchives.map(validateArchiveEnvelope);
    const selectors = new Set(envelopes.map((archive) => archive['selector']));
    if (selectors.size !== 2) return fail();
    const authority = normalizeAuthority(requireRecord(root['authority']));
    const rest = Object.fromEntries(
      Object.entries(root).filter(
        ([key]) => key !== 'schemaVersion' && key !== 'archives',
      ),
    );
    const validationArchives = envelopes.map((archive) => ({
      ...archive,
      path: `/ac265-protected-runtime/${archive['selector'] as string}.zip`,
    }));
    const validationContext = validateAc265ProtectedPublicationContext(
      { ...rest, authority, archives: validationArchives },
      { requireArchives: true },
    );
    createAc265HostedArtifactSourceAuthority(validationContext.authority);
    if (!input.requireArchives)
      return validateAc265ProtectedPublicationContext(
        { ...rest, authority },
        { requireArchives: false },
      );
    const runtimeArchives = envelopes.map((archive) => ({
      ...archive,
      path: archivePath(input.env, archive['selector'] as 'ci' | 'staging'),
    }));
    return validateAc265ProtectedPublicationContext(
      { ...rest, authority, archives: runtimeArchives },
      { requireArchives: true },
    );
  } finally {
    bundleBytes.fill(0);
  }
};
