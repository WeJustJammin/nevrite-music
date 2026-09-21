import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM,
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';
import {
  authenticateAc265ApprovedRunnerMappingsV1,
  assertAc265ApprovedRunnerMappingAttestationWindow,
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
} from '../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import { runAttestAc265ApprovedRunnerMapping } from '../infra/workflows/attest-ac265-approved-runner-mapping.ts';
import { makeContract } from './contracts/ac265-hosted-test-fixtures.ts';

/**
 * Fixed RFC 8032 Ed25519 material for tests only. The production workflow
 * must consume a protected key; it must never generate or persist this key.
 */
const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;

const TEST_KEY_ID = 'ac265-runner-mapping-v1';
const ISSUED_AT = '2026-09-03T11:00:00.000Z';
const EXPIRES_AT = '2026-09-03T11:05:00.000Z';
const TRUSTED_CUTOFF_AT = '2026-09-03T11:30:00.000Z';

const trustedKey = {
  keyId: TEST_KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active' as const,
};

const mappingFixture = () => {
  const contract = makeContract();
  return {
    schemaVersion: 'ac265-approved-runner-mappings-v1' as const,
    source: 'protected-ac265-runner-mapping-control-plane' as const,
    mappingId: '60000000-0000-4000-8000-000000000001',
    approvedAt: '2026-09-03T10:29:00.000Z',
    runId: contract.runId,
    identity: contract.identity,
    roleResourceBindings: contract.roleResourceBindings,
    scenarioRoleBindings: contract.scenarioRoleBindings,
  };
};

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const sortJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, sortJson(nested)]),
    ) as { [key: string]: JsonValue };
  }
  return value;
};

const canonicalJson = (value: unknown): string =>
  JSON.stringify(sortJson(value as JsonValue));

const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const text = (bytes: Uint8Array): string => Buffer.from(bytes).toString('utf8');

const bytes = (value: string): Uint8Array => Buffer.from(value, 'utf8');

const replaceJsonString = (
  source: Uint8Array,
  key: string,
  replacement: string,
): Uint8Array => {
  const sourceText = text(source);
  const token = `"${key}":"`;
  const start = sourceText.indexOf(token);
  if (start < 0) throw new Error(`Missing JSON string member: ${key}`);
  const valueStart = start + token.length;
  const valueEnd = sourceText.indexOf('"', valueStart);
  if (valueEnd < 0) throw new Error(`Missing JSON string value: ${key}`);
  return bytes(
    `${sourceText.slice(0, valueStart)}${replacement}${sourceText.slice(valueEnd)}`,
  );
};

const duplicateJsonMember = (
  source: Uint8Array,
  key: string,
  rawValue: string,
): Uint8Array => {
  const sourceText = text(source);
  const token = `"${key}":`;
  const start = sourceText.indexOf(token);
  if (start < 0) throw new Error(`Missing JSON member: ${key}`);
  return bytes(
    `${sourceText.slice(0, start)}"${key}":${rawValue},${sourceText.slice(start)}`,
  );
};

const makeSignedFixture = () => {
  const mapping = mappingFixture();
  const canonical = canonicalizeAc265ApprovedRunnerMappingsV1(mapping);
  const created = createAc265ApprovedRunnerMappingAttestation({
    mappingBytes: canonical.bytes,
    keyId: TEST_KEY_ID,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
  });
  return { mapping, canonical, created };
};

const authenticate = (
  mappingBytes: Uint8Array,
  attestationBytes: Uint8Array,
  keys = [trustedKey],
) =>
  authenticateAc265ApprovedRunnerMappingsV1({
    mappingBytes,
    attestationBytes,
    trustedKeys: keys,
  });

describe('AC265 approved runner-mapping attestation crypto source', () => {
  it('canonicalizes the exact receipt-context mapping to stable sorted UTF-8 bytes', () => {
    const mapping = mappingFixture();
    const canonical = canonicalizeAc265ApprovedRunnerMappingsV1(mapping);
    const reordered = {
      scenarioRoleBindings: mapping.scenarioRoleBindings,
      identity: mapping.identity,
      runId: mapping.runId,
      mappingId: mapping.mappingId,
      source: mapping.source,
      roleResourceBindings: mapping.roleResourceBindings,
      approvedAt: mapping.approvedAt,
      schemaVersion: mapping.schemaVersion,
    };

    const reorderedCanonical =
      canonicalizeAc265ApprovedRunnerMappingsV1(reordered);

    expect(canonical.mapping).toEqual(mapping);
    expect(text(canonical.bytes)).toBe(canonicalJson(mapping));
    expect(canonical.bytes).toEqual(reorderedCanonical.bytes);
    expect(text(canonical.bytes)).not.toMatch(/[\n\r\t]|:\s/u);
  });

  it('creates an attestation whose strict fields bind mapping identity, digest, domain, key, and window', () => {
    const { mapping, canonical, created } = makeSignedFixture();

    expect(created.mapping).toEqual(mapping);
    expect(created.attestation).toMatchObject({
      schemaVersion: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
      domain: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
      algorithm: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM,
      keyId: TEST_KEY_ID,
      mappingId: mapping.mappingId,
      runId: mapping.runId,
      mappingSha256: sha256(canonical.bytes),
      issuedAt: ISSUED_AT,
      expiresAt: EXPIRES_AT,
    });
    expect(created.attestation.signature).toMatch(/^[A-Za-z0-9+/]{86}==$/u);
    expect(text(created.attestationBytes)).toBe(
      canonicalJson(created.attestation),
    );
  });

  it('authenticates a signed canonical mapping with the independently trusted active public key', () => {
    const { mapping, canonical, created } = makeSignedFixture();

    expect(authenticate(canonical.bytes, created.attestationBytes)).toEqual({
      mapping,
      attestation: created.attestation,
    });
  });

  it('rejects a mapping changed after signing', () => {
    const { created } = makeSignedFixture();
    const changedMapping = canonicalizeAc265ApprovedRunnerMappingsV1({
      ...mappingFixture(),
      mappingId: '60000000-0000-4000-8000-000000000002',
    });

    expect(() =>
      authenticate(changedMapping.bytes, created.attestationBytes),
    ).toThrow(/digest|mapping|signature|mismatch/i);
  });

  it('rejects a signature changed without re-signing', () => {
    const { canonical, created } = makeSignedFixture();
    const tamperedSignature = replaceJsonString(
      created.attestationBytes,
      'signature',
      `A${created.attestation.signature.slice(1)}`,
    );

    expect(() => authenticate(canonical.bytes, tamperedSignature)).toThrow(
      /signature|authentic|verify/i,
    );
  });

  it.each([
    ['domain', 'WEJAMMIN-AC265-OTHER-DOMAIN-V1'],
    ['algorithm', 'Ed448'],
    ['keyId', 'ac265-runner-mapping-unknown-v1'],
  ] as const)('rejects an attestation with a wrong %s', (key, value) => {
    const { canonical, created } = makeSignedFixture();
    const tamperedAttestation = replaceJsonString(
      created.attestationBytes,
      key,
      value,
    );

    expect(() => authenticate(canonical.bytes, tamperedAttestation)).toThrow(
      /attestation|domain|algorithm|key|signature|authentic|invalid/i,
    );
  });

  it('rejects an unknown signing key even when its PEM is otherwise valid', () => {
    const { canonical, created } = makeSignedFixture();

    expect(() =>
      authenticate(canonical.bytes, created.attestationBytes, [
        { ...trustedKey, keyId: 'ac265-another-trusted-key-v1' },
      ]),
    ).toThrow(/unknown|trusted|key/i);
  });

  it.each([
    ['revoked', { ...trustedKey, status: 'revoked' as const }],
    ['expired', { ...trustedKey, validUntil: '2026-09-03T10:59:59.999Z' }],
    ['not-yet-valid', { ...trustedKey, validFrom: '2026-09-03T11:00:00.001Z' }],
  ] as const)('rejects a %s signing key', (_name, key) => {
    const { canonical, created } = makeSignedFixture();

    expect(() =>
      authenticate(canonical.bytes, created.attestationBytes, [key]),
    ).toThrow(/revoked|expired|valid|trusted|key/i);
  });

  it('rejects duplicate JSON members before schema validation', () => {
    const { canonical, created } = makeSignedFixture();
    const duplicateMapping = duplicateJsonMember(
      bytes(JSON.stringify(mappingFixture())),
      'schemaVersion',
      JSON.stringify('ac265-approved-runner-mappings-v1'),
    );
    const duplicateAttestation = duplicateJsonMember(
      bytes(JSON.stringify(created.attestation)),
      'keyId',
      JSON.stringify(TEST_KEY_ID),
    );

    expect(() =>
      authenticate(duplicateMapping, created.attestationBytes),
    ).toThrow(/duplicate|mapping|json|invalid/i);
    expect(() => authenticate(canonical.bytes, duplicateAttestation)).toThrow(
      /duplicate|attestation|json|invalid/i,
    );
  });

  it('rejects noncanonical mapping and attestation bytes even when their parsed values are valid', () => {
    const { mapping, canonical, created } = makeSignedFixture();
    const noncanonicalMapping = bytes(JSON.stringify(mapping));
    const noncanonicalAttestation = bytes(
      JSON.stringify(created.attestation, null, 2),
    );

    expect(noncanonicalMapping).not.toEqual(canonical.bytes);
    expect(() =>
      authenticate(noncanonicalMapping, created.attestationBytes),
    ).toThrow(/canonical|mapping|bytes|invalid/i);
    expect(() =>
      authenticate(canonical.bytes, noncanonicalAttestation),
    ).toThrow(/canonical|attestation|bytes|invalid/i);
  });

  it.each([
    ['mappingId', '60000000-0000-4000-8000-000000000002'],
    ['runId', '20000000-0000-4000-8000-000000000001'],
  ] as const)('rejects a mapping with a wrong %s', (key, value) => {
    const { created } = makeSignedFixture();
    const changedMapping = canonicalizeAc265ApprovedRunnerMappingsV1({
      ...mappingFixture(),
      [key]: value,
    });

    expect(() =>
      authenticate(changedMapping.bytes, created.attestationBytes),
    ).toThrow(/digest|mapping|identity|run|signature|mismatch/i);
  });

  it('rejects an attestation with a wrong mapping digest', () => {
    const { canonical, created } = makeSignedFixture();
    const tamperedDigest = replaceJsonString(
      created.attestationBytes,
      'mappingSha256',
      '0'.repeat(64),
    );

    expect(() => authenticate(canonical.bytes, tamperedDigest)).toThrow(
      /digest|mapping|signature|authentic|mismatch/i,
    );
  });

  it('rejects attestation time tampering because the signed window is part of the authenticated envelope', () => {
    const { canonical, created } = makeSignedFixture();
    const tamperedIssuedAt = replaceJsonString(
      created.attestationBytes,
      'issuedAt',
      '2026-09-03T10:30:00.000Z',
    );

    expect(() => authenticate(canonical.bytes, tamperedIssuedAt)).toThrow(
      /signature|authentic|attestation|invalid/i,
    );
  });

  it('rejects malformed private and public key types', () => {
    const mapping = mappingFixture();
    const canonical = canonicalizeAc265ApprovedRunnerMappingsV1(mapping);

    expect(() =>
      createAc265ApprovedRunnerMappingAttestation({
        mappingBytes: canonical.bytes,
        keyId: TEST_KEY_ID,
        privateKeyPem: 42 as unknown as string,
        issuedAt: ISSUED_AT,
        expiresAt: EXPIRES_AT,
      }),
    ).toThrow(/private|key|pem|invalid/i);

    const created = createAc265ApprovedRunnerMappingAttestation({
      mappingBytes: canonical.bytes,
      keyId: TEST_KEY_ID,
      privateKeyPem: TEST_PRIVATE_KEY_PEM,
      issuedAt: ISSUED_AT,
      expiresAt: EXPIRES_AT,
    });
    expect(() =>
      authenticate(canonical.bytes, created.attestationBytes, [
        { ...trustedKey, publicKeyPem: 42 as unknown as string },
      ]),
    ).toThrow(/public|key|pem|invalid/i);
  });

  it('accepts an attestation covering report start and rejects replay or cutoff violations', () => {
    const { mapping, created } = makeSignedFixture();
    const authenticated = authenticate(
      canonicalizeAc265ApprovedRunnerMappingsV1(mapping).bytes,
      created.attestationBytes,
    );

    expect(() =>
      assertAc265ApprovedRunnerMappingAttestationWindow({
        mapping: authenticated.mapping,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-03T11:02:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();

    for (const candidate of [
      {
        reportStartedAt: '2026-09-03T10:59:59.999Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      },
      {
        reportStartedAt: '2026-09-03T11:05:00.001Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      },
      {
        reportStartedAt: '2026-09-03T11:02:00.000Z',
        trustedCutoffAt: '2026-09-03T11:04:59.999Z',
      },
    ])
      expect(() =>
        assertAc265ApprovedRunnerMappingAttestationWindow({
          mapping: authenticated.mapping,
          attestation: authenticated.attestation,
          ...candidate,
        }),
      ).toThrow(/window|replay|issued|expired|cutoff|time|valid/i);
  });
});

const ENTRYPOINT_FAILURE = 'AC265 approved runner mapping attestation failed';
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/attest-ac265-approved-runner-mapping.ts',
    import.meta.url,
  ),
);
const ENTRYPOINT_AUTHORIZATION_REF =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const ENTRYPOINT_MAPPING_ID = '60000000-0000-4000-8000-000000000006';
const ENTRYPOINT_SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const ENTRYPOINT_SUPABASE_URL = `https://${ENTRYPOINT_SUPABASE_PROJECT_REF}.supabase.co`;
const ENTRYPOINT_SERVICE_KEY = 'sb_secret_ac265-entrypoint-test';
const ENTRYPOINT_NOW_MS = Date.parse('2026-09-21T12:00:00.000Z');
const ENTRYPOINT_NOW = (): number => ENTRYPOINT_NOW_MS;

type EntrypointEnvironment = Readonly<Record<string, string | undefined>>;

type EntrypointFixture = Readonly<{
  runnerTemp: string;
  outputDirectory: string;
  summaryPath: string;
  env: EntrypointEnvironment;
  mapping: ReturnType<typeof mappingFixture>;
  response: Readonly<Record<string, unknown>>;
}>;

const entrypointScratchDirectories: string[] = [];

const entrypointResponseFor = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const createEntrypointFixture = (): EntrypointFixture => {
  const runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-runner-mapping-'));
  entrypointScratchDirectories.push(runnerTemp);
  const outputDirectory = join(runnerTemp, 'ac265-runner-mapping');
  const summaryPath = join(runnerTemp, 'step-summary.md');
  writeFileSync(summaryPath, 'existing workflow summary\n', {
    encoding: 'utf8',
    mode: 0o600,
  });

  const contract = makeContract();
  const mapping = {
    schemaVersion: 'ac265-approved-runner-mappings-v1' as const,
    source: 'protected-ac265-runner-mapping-control-plane' as const,
    mappingId: ENTRYPOINT_MAPPING_ID,
    approvedAt: '2026-09-21T11:59:00.000Z',
    runId: contract.runId,
    identity: contract.identity,
    roleResourceBindings: contract.roleResourceBindings,
    scenarioRoleBindings: contract.scenarioRoleBindings,
  };
  const response = {
    criterion: 'P2-S09-AC-265',
    schemaVersion: 'ac265-hosted-approved-registry-control-v1',
    authorizationRef: ENTRYPOINT_AUTHORIZATION_REF,
    environment: 'staging',
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: ENTRYPOINT_SUPABASE_PROJECT_REF,
    redacted: true,
    mapping,
    resources: contract.resourceRefs,
  } as const;

  return {
    runnerTemp,
    outputDirectory,
    summaryPath,
    env: {
      RUNNER_TEMP: runnerTemp,
      AC265_RUNNER_MAPPING_OUTPUT_DIR: outputDirectory,
      AC265_AUTHORIZATION_REF: ENTRYPOINT_AUTHORIZATION_REF,
      AC265_MAPPING_ID: ENTRYPOINT_MAPPING_ID,
      SUPABASE_URL: ENTRYPOINT_SUPABASE_URL,
      SUPABASE_PROJECT_REF: ENTRYPOINT_SUPABASE_PROJECT_REF,
      SUPABASE_SECRET_KEY: ENTRYPOINT_SERVICE_KEY,
      AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM: TEST_PRIVATE_KEY_PEM,
      AC265_RUNNER_MAPPING_SIGNING_KEY_ID: TEST_KEY_ID,
      GITHUB_STEP_SUMMARY: summaryPath,
    },
    mapping,
    response,
  };
};

const runEntrypoint = (fixture: EntrypointFixture, fetchImpl: typeof fetch) =>
  runAttestAc265ApprovedRunnerMapping({
    env: fixture.env,
    fetchImpl,
    now: ENTRYPOINT_NOW,
  });

const expectNoEntrypointOutput = (fixture: EntrypointFixture): void => {
  const entries = readdirSync(fixture.runnerTemp).sort();
  expect(entries).toEqual(
    existsSync(fixture.outputDirectory)
      ? ['ac265-runner-mapping', 'step-summary.md']
      : ['step-summary.md'],
  );
  if (existsSync(fixture.outputDirectory)) {
    expect(lstatSync(fixture.outputDirectory).mode & 0o777).toBe(0o700);
    expect(readdirSync(fixture.outputDirectory)).toEqual([]);
  }
};

afterEach(() => {
  for (const directory of entrypointScratchDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('AC265 protected runner-mapping attestation entrypoint', () => {
  it('loads under the raw Node runtime used by the protected workflow', () => {
    const secret = 'do-not-print-entrypoint-secret';
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', ENTRYPOINT_PATH],
      {
        encoding: 'utf8',
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          SUPABASE_SECRET_KEY: secret,
          AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM: TEST_PRIVATE_KEY_PEM,
        },
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(output).toContain(ENTRYPOINT_FAILURE);
    expect(output).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(output).not.toContain(secret);
    expect(output).not.toContain(TEST_PRIVATE_KEY_PEM);
    expect(output).not.toContain('Error:');
  });

  it('reads the protected RPC, writes canonical signed artifacts, and returns only safe fields', async () => {
    const fixture = createEntrypointFixture();
    let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      request = { input, init };
      return entrypointResponseFor(fixture.response);
    });

    await expect(runEntrypoint(fixture, fetchImpl)).resolves.toEqual({
      mappingId: ENTRYPOINT_MAPPING_ID,
      runId: fixture.mapping.runId,
      keyId: TEST_KEY_ID,
      expiresAt: '2026-09-21T12:05:00.000Z',
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(request?.input)).toBe(
      `${ENTRYPOINT_SUPABASE_URL}/rest/v1/rpc/ac265_approved_runner_mapping_read`,
    );
    expect(request?.init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
    });
    const body = JSON.parse(String(request?.init?.body)) as unknown;
    expect(body).toEqual({
      p_request: {
        criterion: 'P2-S09-AC-265',
        schemaVersion: 'ac265-hosted-approved-registry-control-v1',
        authorizationRef: ENTRYPOINT_AUTHORIZATION_REF,
        mappingId: ENTRYPOINT_MAPPING_ID,
      },
    });
    expect(JSON.stringify(body)).not.toContain(ENTRYPOINT_SERVICE_KEY);

    const outputStat = lstatSync(fixture.outputDirectory);
    expect(outputStat.isDirectory()).toBe(true);
    expect(outputStat.isSymbolicLink()).toBe(false);
    expect(outputStat.mode & 0o777).toBe(0o700);
    expect(readdirSync(fixture.outputDirectory).sort()).toEqual([
      'canonical-runner-mapping.json',
      'runner-mapping-attestation.json',
    ]);

    const mappingPath = join(
      fixture.outputDirectory,
      'canonical-runner-mapping.json',
    );
    const attestationPath = join(
      fixture.outputDirectory,
      'runner-mapping-attestation.json',
    );
    const mappingBytes = readFileSync(mappingPath);
    const attestationBytes = readFileSync(attestationPath);
    for (const path of [mappingPath, attestationPath]) {
      const stat = lstatSync(path);
      expect(stat.isFile()).toBe(true);
      expect(stat.isSymbolicLink()).toBe(false);
      expect(stat.mode & 0o777).toBe(0o600);
    }

    const parsedMapping = JSON.parse(mappingBytes.toString('utf8')) as unknown;
    const parsedAttestation = JSON.parse(
      attestationBytes.toString('utf8'),
    ) as Record<string, unknown>;
    expect(mappingBytes.toString('utf8')).toBe(canonicalJson(fixture.mapping));
    expect(parsedAttestation).toMatchObject({
      schemaVersion: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
      domain: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
      algorithm: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM,
      keyId: TEST_KEY_ID,
      mappingId: ENTRYPOINT_MAPPING_ID,
      runId: fixture.mapping.runId,
      issuedAt: '2026-09-21T12:00:00.000Z',
      expiresAt: '2026-09-21T12:05:00.000Z',
    });
    expect(attestationBytes.toString('utf8')).toBe(
      canonicalJson(parsedAttestation),
    );

    const authenticated = authenticate(mappingBytes, attestationBytes, [
      {
        ...trustedKey,
        keyId: TEST_KEY_ID,
      },
    ]);
    expect(authenticated.mapping).toEqual(parsedMapping);
    expect(authenticated.attestation).toEqual(parsedAttestation);
    expect(authenticated.attestation.mappingSha256).toBe(sha256(mappingBytes));

    const summary = readFileSync(fixture.summaryPath, 'utf8');
    for (const safe of [
      ENTRYPOINT_MAPPING_ID,
      fixture.mapping.runId,
      TEST_KEY_ID,
      '2026-09-21T12:05:00.000Z',
    ])
      expect(summary).toContain(safe);
    expect(summary).toMatch(/redacted|protected|attestation/iu);
    for (const secret of [
      ENTRYPOINT_SERVICE_KEY,
      TEST_PRIVATE_KEY_PEM,
      ENTRYPOINT_AUTHORIZATION_REF,
      ENTRYPOINT_SUPABASE_URL,
      fixture.mapping.identity.sourceRevision,
      ...fixture.response.resources.map((resource) => resource.ref),
    ])
      expect(summary).not.toContain(secret);
    expect(summary).not.toContain(JSON.stringify(fixture.mapping));
  });

  it('rejects missing, malformed, mismatched, or unsafe environment values before RPC access', async () => {
    const invalidEnvironments: Array<
      [string, (fixture: EntrypointFixture) => EntrypointEnvironment]
    > = [
      [
        'missing RUNNER_TEMP',
        (fixture) => ({ ...fixture.env, RUNNER_TEMP: undefined }),
      ],
      [
        'relative RUNNER_TEMP',
        (fixture) => ({ ...fixture.env, RUNNER_TEMP: 'runner-temp' }),
      ],
      [
        'noncanonical RUNNER_TEMP',
        (fixture) => ({
          ...fixture.env,
          RUNNER_TEMP: `${fixture.runnerTemp}/`,
        }),
      ],
      [
        'wrong output path',
        (fixture) => ({
          ...fixture.env,
          AC265_RUNNER_MAPPING_OUTPUT_DIR: join(fixture.runnerTemp, 'other'),
        }),
      ],
      [
        'missing authorization reference',
        (fixture) => ({ ...fixture.env, AC265_AUTHORIZATION_REF: '' }),
      ],
      [
        'invalid mapping identifier',
        (fixture) => ({ ...fixture.env, AC265_MAPPING_ID: 'not-a-uuid' }),
      ],
      [
        'wrong Supabase origin',
        (fixture) => ({
          ...fixture.env,
          SUPABASE_URL: 'https://other.supabase.co',
        }),
      ],
      [
        'invalid project reference',
        (fixture) => ({
          ...fixture.env,
          SUPABASE_PROJECT_REF: 'not-a-project-ref',
        }),
      ],
      [
        'missing service key',
        (fixture) => ({ ...fixture.env, SUPABASE_SECRET_KEY: undefined }),
      ],
      [
        'invalid private key',
        (fixture) => ({
          ...fixture.env,
          AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM: 'not-a-private-key',
        }),
      ],
      [
        'invalid signing key identifier',
        (fixture) => ({
          ...fixture.env,
          AC265_RUNNER_MAPPING_SIGNING_KEY_ID: 'not a key id',
        }),
      ],
      [
        'missing summary',
        (fixture) => ({
          ...fixture.env,
          GITHUB_STEP_SUMMARY: join(fixture.runnerTemp, 'missing-summary.md'),
        }),
      ],
    ];

    for (const [label, mutate] of invalidEnvironments) {
      const fixture = createEntrypointFixture();
      const fetchImpl = vi.fn<typeof fetch>();
      await expect(
        runAttestAc265ApprovedRunnerMapping({
          env: mutate(fixture),
          fetchImpl,
          now: ENTRYPOINT_NOW,
        }),
      ).rejects.toThrow(ENTRYPOINT_FAILURE);
      expect(fetchImpl, label).not.toHaveBeenCalled();
      expectNoEntrypointOutput(fixture);
    }
  });

  it('rejects runner-temp, output, and summary symlinks without following them', async () => {
    const runnerTempTarget = mkdtempSync(
      join(tmpdir(), 'ac265-runner-target-'),
    );
    entrypointScratchDirectories.push(runnerTempTarget);
    const fixture = createEntrypointFixture();
    const runnerTempLink = `${fixture.runnerTemp}-link`;
    symlinkSync(runnerTempTarget, runnerTempLink, 'dir');
    const runnerTempLinkFixture: EntrypointEnvironment = {
      ...fixture.env,
      RUNNER_TEMP: runnerTempLink,
      AC265_RUNNER_MAPPING_OUTPUT_DIR: join(
        runnerTempLink,
        'ac265-runner-mapping',
      ),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: runnerTempLinkFixture,
        fetchImpl,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();

    const outputLinkFixture = createEntrypointFixture();
    const outsideOutput = mkdtempSync(join(tmpdir(), 'ac265-output-target-'));
    entrypointScratchDirectories.push(outsideOutput);
    symlinkSync(outsideOutput, outputLinkFixture.outputDirectory, 'dir');
    const outputFetch = vi.fn<typeof fetch>();
    await expect(runEntrypoint(outputLinkFixture, outputFetch)).rejects.toThrow(
      ENTRYPOINT_FAILURE,
    );
    expect(outputFetch).not.toHaveBeenCalled();
    expect(readdirSync(outsideOutput)).toEqual([]);

    const summaryLinkFixture = createEntrypointFixture();
    const outsideSummary = join(summaryLinkFixture.runnerTemp, 'outside.md');
    writeFileSync(outsideSummary, 'outside summary\n', 'utf8');
    const summaryLink = join(summaryLinkFixture.runnerTemp, 'summary-link.md');
    symlinkSync(outsideSummary, summaryLink, 'file');
    const summaryFetch = vi.fn<typeof fetch>();
    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: { ...summaryLinkFixture.env, GITHUB_STEP_SUMMARY: summaryLink },
        fetchImpl: summaryFetch,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(summaryFetch).not.toHaveBeenCalled();
  });

  it('rejects a pre-existing output directory and never replaces its contents', async () => {
    const fixture = createEntrypointFixture();
    mkdirSync(fixture.outputDirectory, { mode: 0o700 });
    const sentinel = join(fixture.outputDirectory, 'sentinel.txt');
    writeFileSync(sentinel, 'preserve this output\n', 'utf8');
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(runEntrypoint(fixture, fetchImpl)).rejects.toThrow(
      ENTRYPOINT_FAILURE,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readFileSync(sentinel, 'utf8')).toBe('preserve this output\n');
    expect(readdirSync(fixture.outputDirectory)).toEqual(['sentinel.txt']);
  });

  it.each([
    ['conflict', () => entrypointResponseFor({ status: 'conflict' })],
    [
      'network failure',
      () => Promise.reject(new Error(`upstream ${ENTRYPOINT_SERVICE_KEY}`)),
    ],
    [
      'HTTP failure',
      () =>
        entrypointResponseFor(`private body ${ENTRYPOINT_SERVICE_KEY}`, 503),
    ],
  ])(
    'normalizes RPC %s without creating output or leaking secrets',
    async (_label, response) => {
      const fixture = createEntrypointFixture();
      const fetchImpl = vi.fn<typeof fetch>(async () => await response());
      const thrown = await runEntrypoint(fixture, fetchImpl).catch(
        (error: unknown) => error,
      );

      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toBe(ENTRYPOINT_FAILURE);
      expect(String(thrown)).not.toContain(ENTRYPOINT_SERVICE_KEY);
      expect(String(thrown)).not.toContain(TEST_PRIVATE_KEY_PEM);
      expectNoEntrypointOutput(fixture);
    },
  );

  it('rejects wrong-project and wrong-result RPC payloads before writing artifacts', async () => {
    const variants: Array<
      [
        string,
        (fixture: EntrypointFixture) => Readonly<Record<string, unknown>>,
      ]
    > = [
      [
        'authorization reference',
        (fixture) => ({
          ...fixture.response,
          authorizationRef: ENTRYPOINT_AUTHORIZATION_REF.replace(/2$/u, '3'),
        }),
      ],
      [
        'mapping identifier',
        (fixture) => ({
          ...fixture.response,
          mapping: {
            ...fixture.mapping,
            mappingId: '60000000-0000-4000-8000-000000000007',
          },
        }),
      ],
      [
        'Supabase project',
        (fixture) => ({
          ...fixture.response,
          supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
        }),
      ],
      [
        'mapping identity project',
        (fixture) => ({
          ...fixture.response,
          mapping: {
            ...fixture.mapping,
            identity: {
              ...fixture.mapping.identity,
              supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
            },
          },
        }),
      ],
      [
        'environment',
        (fixture) => ({ ...fixture.response, environment: 'production' }),
      ],
    ];

    for (const [label, payloadFor] of variants) {
      const fixture = createEntrypointFixture();
      const fetchImpl = vi.fn<typeof fetch>(async () =>
        entrypointResponseFor(payloadFor(fixture)),
      );
      await expect(runEntrypoint(fixture, fetchImpl), label).rejects.toThrow(
        ENTRYPOINT_FAILURE,
      );
      expect(fetchImpl).toHaveBeenCalledOnce();
      expectNoEntrypointOutput(fixture);
    }
  });

  it('rejects invalid signing material and does not persist private or service credentials', async () => {
    const invalidPrivateKey = createEntrypointFixture();
    const invalidPrivateKeyFetch = vi.fn<typeof fetch>();
    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: {
          ...invalidPrivateKey.env,
          AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM:
            '-----BEGIN PRIVATE KEY-----invalid-----END PRIVATE KEY-----',
        },
        fetchImpl: invalidPrivateKeyFetch,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(invalidPrivateKeyFetch).not.toHaveBeenCalled();
    expectNoEntrypointOutput(invalidPrivateKey);

    const invalidKeyId = createEntrypointFixture();
    const invalidKeyIdFetch = vi.fn<typeof fetch>();
    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: { ...invalidKeyId.env, AC265_RUNNER_MAPPING_SIGNING_KEY_ID: '' },
        fetchImpl: invalidKeyIdFetch,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(invalidKeyIdFetch).not.toHaveBeenCalled();
    expectNoEntrypointOutput(invalidKeyId);
  });

  it('fails generically when artifact creation or summary writing is unavailable', async () => {
    const summaryFailure = createEntrypointFixture();
    mkdirSync(join(summaryFailure.runnerTemp, 'summary-directory'), {
      mode: 0o700,
    });
    const summaryFetch = vi.fn<typeof fetch>(async () =>
      entrypointResponseFor(summaryFailure.response),
    );
    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: {
          ...summaryFailure.env,
          GITHUB_STEP_SUMMARY: join(
            summaryFailure.runnerTemp,
            'summary-directory',
          ),
        },
        fetchImpl: summaryFetch,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(summaryFetch).not.toHaveBeenCalled();

    const outputFailure = createEntrypointFixture();
    const outputFailureFetch = vi.fn<typeof fetch>(async () =>
      entrypointResponseFor(outputFailure.response),
    );
    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: {
          ...outputFailure.env,
          RUNNER_TEMP: '/proc',
          AC265_RUNNER_MAPPING_OUTPUT_DIR: '/proc/ac265-runner-mapping',
        },
        fetchImpl: outputFailureFetch,
        now: ENTRYPOINT_NOW,
      }),
    ).rejects.toThrow(ENTRYPOINT_FAILURE);
    expect(
      String(await outputFailureFetch.mock.results[0]?.value),
    ).not.toContain(ENTRYPOINT_SERVICE_KEY);
    expect(readdirSync(outputFailure.runnerTemp).sort()).toEqual([
      'step-summary.md',
    ]);
  });
});
