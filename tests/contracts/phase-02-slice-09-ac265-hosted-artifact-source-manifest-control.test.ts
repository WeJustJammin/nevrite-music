import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';
import * as contentSchemaRegistry from '../../packages/contracts/src/content-schema-registry/index.ts';
import * as contracts from '../../packages/contracts/src/index.ts';

const schemaVersion = 'ac265-hosted-artifact-source-manifest-v1' as const;
const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const idempotencyRef =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
const manifestId = '60000000-0000-4000-8000-000000000006';
const manifestRef =
  'ac265-artifact-manifest://staging/60000000-0000-4000-8000-000000000006';
const finalizationRef =
  'ac265-finalization://staging/70000000-0000-4000-8000-000000000007';
const candidateId = '80000000-0000-4000-8000-000000000008';
const runId = '90000000-0000-4000-8000-000000000009';
const authorizedAt = '2026-09-21T10:00:00.000Z';
const authorizationExpiresAt = '2026-09-21T10:05:00.000Z';
const registeredAt = '2026-09-21T10:00:30.000Z';
const finalizedAt = '2026-09-21T10:01:00.000Z';

const source = (kind: 'server_receipt' | 'execution_evidence', id: string) => ({
  kind,
  artifactRef:
    kind === 'server_receipt'
      ? `ac265-receipt://server/${id}`
      : `ac265-evidence://blob/${id}`,
  artifactSha256: 'a'.repeat(64),
  attestationSha256: 'b'.repeat(64),
  attestationKeyId: 'release-key-2026-09',
  subjectSha256: 'c'.repeat(64),
  issuedAt: '2026-09-21T10:00:30.000Z',
  expiresAt: '2026-09-21T10:02:30.000Z',
});

const requestSources = [
  source('server_receipt', '10000000-0000-4000-8000-000000000011'),
  source('execution_evidence', '10000000-0000-4000-8000-000000000010'),
] as const;

const registerRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion,
  authorizationRef,
  idempotencyRef,
  sources: requestSources,
};

const resultBase = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion,
  manifestId,
  manifestRef,
  authorizationRef,
  authorization: { authorizedAt, expiresAt: authorizationExpiresAt },
  idempotencyRef,
  candidateId,
  runId,
  identitySha256: 'd'.repeat(64),
  environment: 'staging' as const,
  sourceRevision: 'e'.repeat(40),
  deploymentId: 'staging-deployment-1',
  hostingProjectId: 'wejammin-staging' as const,
  supabaseProjectRef: 'abcdefghijklmnopqrst',
  sourceCount: requestSources.length,
  sourceSetComplete: true as const,
  kindComplete: true,
  registeredAt,
  sources: requestSources
    .slice()
    .sort((a, b) =>
      a.artifactRef.localeCompare(b.artifactRef, 'en', { sensitivity: 'case' }),
    )
    .map((value, ordinal) => ({ ...value, ordinal: ordinal + 1 })),
  redacted: true as const,
};

const registeredResult = {
  ...resultBase,
  lifecycle: 'registered' as const,
  manifestSha256: null,
  finalizationRef: null,
  finalizedAt: null,
};

const finalizedResult = {
  ...resultBase,
  lifecycle: 'finalized' as const,
  manifestSha256: 'f'.repeat(64),
  finalizationRef,
  finalizedAt,
};

const finalizeRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion,
  authorizationRef,
  manifestId,
  finalizationRef,
  manifestSha256: 'f'.repeat(64),
};

const readRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion,
  authorizationRef,
  manifestId,
};

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
) => expect(schema.safeParse(value).success).toBe(false);

describe('AC265 CP04e hosted-artifact source-manifest control contracts', () => {
  it('exports the control version and validates exact register/finalize/read exchanges', () => {
    expect(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION).toBe(
      schemaVersion,
    );
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema.parse(
        registerRequest,
      ),
    ).toEqual(registerRequest);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema.parse(
        registeredResult,
      ),
    ).toEqual(registeredResult);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema.parse(
        finalizeRequest,
      ),
    ).toEqual(finalizeRequest);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema.parse(
        finalizedResult,
      ),
    ).toEqual(finalizedResult);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema.parse(
        readRequest,
      ),
    ).toEqual(readRequest);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema.parse(
        finalizedResult,
      ),
    ).toEqual(finalizedResult);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema.parse(
        { status: 'conflict' },
      ),
    ).toEqual({ status: 'conflict' });
    expect(
      contentSchemaRegistry.ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
    ).toBe(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
    );
    expect(
      contracts.ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
    ).toBe(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
    );
  });

  it('discriminates registered and finalized lifecycle fields', () => {
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema.safeParse(
        registeredResult,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema.safeParse(
        finalizedResult,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema.safeParse(
        registeredResult,
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema.safeParse(
        registeredResult,
      ).success,
    ).toBe(false);

    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
      { ...registeredResult, manifestSha256: 'f'.repeat(64) },
    );
    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
      { ...registeredResult, finalizationRef },
    );
    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
      { ...finalizedResult, manifestSha256: null },
    );
    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
      { ...finalizedResult, finalizedAt: null },
    );
    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
      { ...finalizedResult, lifecycle: 'registered' },
    );
  });

  it('requires source counts, contiguous ordinals, sorted unique refs, both kinds, and redaction', () => {
    for (const value of [
      { ...registeredResult, sourceCount: 1 },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry, i) => ({
          ...entry,
          ordinal: i + 2,
        })),
      },
      { ...registeredResult, sources: [...registeredResult.sources].reverse() },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry, i) =>
          i === 1
            ? {
                ...entry,
                artifactRef: registeredResult.sources[0]!.artifactRef,
              }
            : entry,
        ),
      },
      { ...registeredResult, sourceSetComplete: false },
      { ...registeredResult, kindComplete: false },
      { ...registeredResult, redacted: false },
    ])
      expectRejected(
        ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
        value,
      );

    const evidenceOnly = {
      ...registeredResult,
      kindComplete: false,
      sources: [
        registeredResult.sources.find(
          (entry) => entry.kind === 'execution_evidence',
        )!,
      ].map((entry) => ({ ...entry, ordinal: 1 })),
      sourceCount: 1,
    };
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema.safeParse(
        evidenceOnly,
      ).success,
    ).toBe(true);

    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
      {
        ...registerRequest,
        sources: [
          {
            ...requestSources[0],
            artifactRef: requestSources[1]!.artifactRef,
          },
        ],
      },
    );
  });

  it('requires positive source windows inside the server authorization window', () => {
    for (const value of [
      {
        ...registeredResult,
        authorization: { authorizedAt, expiresAt: authorizedAt },
      },
      {
        ...registeredResult,
        authorization: { authorizedAt, expiresAt: '2026-09-21T10:05:00.001Z' },
      },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry) => ({
          ...entry,
          issuedAt: '2026-09-21T09:59:59.999Z',
        })),
      },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry) => ({
          ...entry,
          expiresAt: '2026-09-21T10:05:00.001Z',
        })),
      },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry) => ({
          ...entry,
          expiresAt: entry.issuedAt,
        })),
      },
      {
        ...registeredResult,
        sources: registeredResult.sources.map((entry) => ({
          ...entry,
          expiresAt: '2026-09-21T10:06:00.000Z',
        })),
      },
    ])
      expectRejected(
        ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
        value,
      );

    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
      {
        ...registerRequest,
        sources: requestSources.map((entry) => ({
          ...entry,
          expiresAt: entry.issuedAt,
        })),
      },
    );
    expectRejected(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
      {
        ...registerRequest,
        sources: requestSources.map((entry) => ({
          ...entry,
          expiresAt: '2026-09-21T10:06:00.000Z',
        })),
      },
    );
  });

  it('keeps callers from supplying server-owned envelope fields or unknown data', () => {
    for (const extra of [
      { manifestId },
      { candidateId },
      { runId },
      { sourceCount: 2 },
      { sourceSetComplete: true },
      { lifecycle: 'registered' },
      { rawBytes: 'secret' },
      { unknown: true },
    ])
      expectRejected(
        ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
        { ...registerRequest, ...extra },
      );

    for (const [schema, value] of [
      [
        ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema,
        finalizeRequest,
      ],
      [
        ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema,
        readRequest,
      ],
    ] as const) {
      for (const extra of [
        { candidateId },
        { sources: requestSources },
        { rawBytes: 'secret' },
        { unknown: true },
      ])
        expectRejected(schema, { ...value, ...extra });
    }
  });
});
