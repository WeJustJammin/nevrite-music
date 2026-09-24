import { createHash } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { HostedExecutionEvidencePayloadSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-execution-evidence.ts';
import { ContentSchemaRegistryHostedReceiptSubjectSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  createAc265HostedArtifactAttestationIssuer,
  type Ac265HostedArtifactAttestationIssuer,
  type Ac265HostedArtifactAttestationIssuerResult,
} from './ac265-hosted-artifact-attestation-issuer.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const FAILURE = 'AC265 hosted artifact attestation issuance failed';
const REQUEST_SCHEMA_VERSION =
  'ac265-hosted-artifact-attestation-request-v1' as const;
const INDEX_SCHEMA_VERSION =
  'ac265-hosted-artifact-attestation-index-v1' as const;
const OUTPUT_DIRECTORY_NAME = 'ac265-hosted-artifact-attestations';
const INDEX_FILE_NAME = 'ac265-hosted-artifact-attestation-index.json';
const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_ARTIFACT_BYTES = 64 * 1024;
const MAX_SOURCES = 256;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const MEMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

const REQUEST_MEMBERS = [
  'candidateIdentitySha256',
  'runId',
  'runnerContractSha256',
  'schemaVersion',
  'sources',
];
const SOURCE_MEMBERS = [
  'artifactMember',
  'expiresAt',
  'issuedAt',
  'kind',
  'ref',
  'subject',
];

const EXCLUSIVE_FILE_OPEN_FLAGS =
  fsConstants.O_WRONLY |
  fsConstants.O_CREAT |
  fsConstants.O_EXCL |
  fsConstants.O_NOFOLLOW;

const fail = (): never => {
  throw new Error(FAILURE);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMemberName = (value: unknown): value is string =>
  typeof value === 'string' && MEMBER_PATTERN.test(value);

const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const isDir = (path: string): boolean => {
  if (!isAbsolute(path) || resolve(path) !== path || path.includes('\0'))
    return false;
  try {
    return (
      lstatSync(path).isDirectory() &&
      !lstatSync(path).isSymbolicLink() &&
      realpathSync(path) === path
    );
  } catch {
    return false;
  }
};

const isFileInside = (root: string, path: string | undefined): boolean => {
  if (
    typeof path !== 'string' ||
    !isAbsolute(path) ||
    resolve(path) !== path ||
    !path.startsWith(`${root}/`)
  )
    return false;
  try {
    return (
      lstatSync(path).isFile() &&
      !lstatSync(path).isSymbolicLink() &&
      realpathSync(path) === path
    );
  } catch {
    return false;
  }
};

/** Bounded, no-follow, non-symlink read of one artifact member. */
const readArtifactMember = (directory: string, member: string): Uint8Array => {
  const path = join(directory, member);
  if (!isFileInside(directory, path)) return fail();
  let fd: number | undefined;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
    const stat = fstatSync(fd);
    if (
      !stat.isFile() ||
      stat.size === 0 ||
      stat.size > MAX_ARTIFACT_BYTES ||
      !lstatSync(path).isFile() ||
      lstatSync(path).isSymbolicLink() ||
      realpathSync(path) !== path
    )
      return fail();
    const buffer = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < stat.size) {
      const read = readSync(fd, buffer, offset, stat.size - offset, offset);
      if (read <= 0) return fail();
      offset += read;
    }
    if (fstatSync(fd).size !== stat.size || offset !== stat.size) return fail();
    return buffer;
  } catch {
    return fail();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

const readRequestDocument = (path: string): Record<string, unknown> => {
  if (!isFileInside(resolve(path, '..'), path)) return fail();
  let bytes: Buffer;
  try {
    const stat = lstatSync(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.size === 0 ||
      stat.size > MAX_REQUEST_BYTES ||
      realpathSync(path) !== path
    )
      return fail();
    bytes = readFileSync(path);
  } catch {
    return fail();
  }
  const document = parseJsonBytesWithoutDuplicateMembers(
    bytes,
    'AC265 hosted artifact attestation request',
  );
  if (!isRecord(document)) return fail();
  return document;
};

const requireDigest = (value: unknown): string => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) return fail();
  return value;
};

const requireTimestamp = (value: unknown): string => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success) return fail();
  return parsed.data;
};

interface IssuedSource {
  readonly kind: 'server_receipt' | 'execution_evidence';
  readonly ref: string;
  readonly artifactMember: string;
  readonly subject: unknown;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

const parseSource = (value: unknown): IssuedSource => {
  if (!isRecord(value)) return fail();
  if (
    Object.keys(value).sort().join(',') !== [...SOURCE_MEMBERS].sort().join(',')
  )
    return fail();
  const kind = value['kind'];
  if (kind !== 'server_receipt' && kind !== 'execution_evidence') return fail();
  const ref = value['ref'];
  if (typeof ref !== 'string') return fail();
  if (!isMemberName(value['artifactMember'])) return fail();
  return {
    kind,
    ref,
    artifactMember: value['artifactMember'],
    subject: value['subject'],
    issuedAt: requireTimestamp(value['issuedAt']),
    expiresAt: requireTimestamp(value['expiresAt']),
  };
};

/**
 * Receipt subjects are read from the receipt bytes, never from the caller.
 * The declared descriptor, when present, must match the bytes exactly.
 */
const subjectSha256ForReceipt = (
  bytes: Uint8Array,
  declared: unknown,
): string => {
  const document = parseJsonBytesWithoutDuplicateMembers(
    bytes,
    'AC265 hosted server receipt',
  );
  if (!isRecord(document)) return fail();
  const parsed = ContentSchemaRegistryHostedReceiptSubjectSchema.safeParse(
    document['subject'],
  );
  if (!parsed.success) return fail();
  if (
    declared !== undefined &&
    sha256Ac265HostedSemanticSubject(parsed.data) !==
      sha256Ac265HostedSemanticSubject(declared)
  )
    return fail();
  return sha256Ac265HostedSemanticSubject(parsed.data);
};

/**
 * Execution-evidence payloads carry only the subject digest, so the declared
 * role/scenario/teardown descriptor must equal the digest inside the bytes.
 */
const subjectSha256ForEvidence = (
  bytes: Uint8Array,
  declared: unknown,
  candidateIdentitySha256: string,
): string => {
  const payload = HostedExecutionEvidencePayloadSchema.safeParse(
    parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 hosted execution evidence',
    ),
  );
  if (!payload.success) return fail();
  if (payload.data.candidateIdentitySha256 !== candidateIdentitySha256)
    return fail();
  const subjectSha256 = sha256Ac265HostedSemanticSubject(declared);
  if (payload.data.subjectSha256 !== subjectSha256) return fail();
  return subjectSha256;
};

/**
 * Writes one file under an owner-only directory with exclusive creation,
 * `fsync`, and a digest-bound readback of the published bytes.
 */
const publishBytes = (directory: string, member: string, bytes: Uint8Array) => {
  if (!isMemberName(member)) return fail();
  const path = join(directory, member);
  let fd: number | undefined;
  try {
    fd = openSync(path, EXCLUSIVE_FILE_OPEN_FLAGS, 0o600);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) return fail();
    const buffer = Buffer.from(bytes);
    let offset = 0;
    while (offset < buffer.byteLength) {
      const written = writeSync(
        fd,
        buffer,
        offset,
        buffer.byteLength - offset,
        null,
      );
      if (written <= 0) return fail();
      offset += written;
    }
    fchmodSync(fd, 0o600);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    if (readFileSync(path).byteLength !== buffer.byteLength) return fail();
    if (sha256(readFileSync(path)) !== sha256(buffer)) return fail();
    if ((statSync(path).mode & 0o777) !== 0o600) return fail();
    return path;
  } catch {
    return fail();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

export interface Ac265HostedArtifactAttestationEntrypointOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface Ac265HostedArtifactAttestationIssuanceSummary {
  readonly runId: string;
  readonly keyId: string;
  readonly sources: number;
  readonly outputDirectory: string;
  readonly indexPath: string;
  readonly trustedKeys: Ac265HostedArtifactAttestationIssuer['trustedKeys'];
}

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
    return fail();
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
    return fail();
  return value;
};

export const runIssueAc265HostedArtifactsAttestations = async ({
  env,
}: Ac265HostedArtifactAttestationEntrypointOptions): Promise<Ac265HostedArtifactAttestationIssuanceSummary> => {
  try {
    const runnerTemp = requireEnv(env, 'RUNNER_TEMP');
    if (!isDir(runnerTemp)) return fail();
    const summaryPath = requireEnv(env, 'GITHUB_STEP_SUMMARY');
    if (!isFileInside(runnerTemp, summaryPath)) return fail();
    const requestPath = requireEnv(env, 'AC265_ATTESTATION_REQUEST_PATH');
    if (!isFileInside(runnerTemp, requestPath)) return fail();
    const artifactDirectory = requireEnv(env, 'AC265_ATTESTATION_ARTIFACT_DIR');
    if (!isDir(artifactDirectory)) return fail();
    if (!artifactDirectory.startsWith(`${runnerTemp}${sep}`)) return fail();
    const outputDirectory = requireEnv(env, 'AC265_ATTESTATION_OUTPUT_DIR');
    if (outputDirectory !== resolve(runnerTemp, OUTPUT_DIRECTORY_NAME))
      return fail();
    if (statSync(outputDirectory, { throwIfNoEntry: false }) !== undefined)
      return fail();
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
    const request = readRequestDocument(requestPath);
    if (
      Object.keys(request).sort().join(',') !==
      [...REQUEST_MEMBERS].sort().join(',')
    )
      return fail();
    if (request['schemaVersion'] !== REQUEST_SCHEMA_VERSION) return fail();
    const runId = request['runId'];
    if (typeof runId !== 'string' || !UUID_V4_PATTERN.test(runId))
      return fail();
    const candidateIdentitySha256 = requireDigest(
      request['candidateIdentitySha256'],
    );
    const runnerContractSha256 = requireDigest(request['runnerContractSha256']);
    const declaredSources = request['sources'];
    if (
      !Array.isArray(declaredSources) ||
      declaredSources.length === 0 ||
      declaredSources.length > MAX_SOURCES
    )
      return fail();
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
      const source = parseSource(declared);
      if (seen.has(source.ref)) return fail();
      seen.add(source.ref);
      const artifactBytes = readArtifactMember(
        artifactDirectory,
        source.artifactMember,
      );
      if (source.kind === 'server_receipt')
        subjectSha256ForReceipt(artifactBytes, source.subject);
      else
        subjectSha256ForEvidence(
          artifactBytes,
          source.subject,
          candidateIdentitySha256,
        );
      const member = `${source.kind}-${source.ref.slice(source.ref.lastIndexOf('/') + 1)}.json`;
      if (members.includes(member)) return fail();
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
    mkdirSync(outputDirectory, { mode: 0o700 });
    if (
      !lstatSync(outputDirectory).isDirectory() ||
      lstatSync(outputDirectory).isSymbolicLink()
    )
      return fail();
    let directoryFd: number | undefined;
    try {
      directoryFd = openSync(
        outputDirectory,
        fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
      );
      if (!fstatSync(directoryFd).isDirectory()) return fail();
      fchmodSync(directoryFd, 0o700);
      fsyncSync(directoryFd);
    } finally {
      if (directoryFd !== undefined) closeSync(directoryFd);
    }
    const entries = issued.map((result, index) => {
      const attestationMember = members[index]!;
      publishBytes(outputDirectory, attestationMember, result.attestationBytes);
      return {
        kind: result.kind,
        ref: result.artifactRef,
        keyId: result.keyId,
        artifactSha256: result.artifactSha256,
        attestationSha256: sha256(result.attestationBytes),
        subjectSha256: result.subjectSha256,
        attestationMember,
        issuedAt: result.issuedAt,
        expiresAt: result.expiresAt,
      };
    });
    const indexPath = publishBytes(
      outputDirectory,
      INDEX_FILE_NAME,
      Buffer.from(
        `${JSON.stringify(
          {
            schemaVersion: INDEX_SCHEMA_VERSION,
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
        `- Index: \`${INDEX_FILE_NAME}\``,
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
    return fail();
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
    console.error(FAILURE);
    process.exitCode = 1;
  }
}
