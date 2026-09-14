import { describe, expect, it } from 'vitest';

import {
  AC265_STAGING_API_ORIGIN,
  AC265_GITHUB_OIDC_AUDIENCE,
  AC265_GITHUB_OIDC_ISSUER,
  AC265_GITHUB_OIDC_REPOSITORY,
  AC265_GITHUB_OIDC_REPOSITORY_ID,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  AC265_GITHUB_OIDC_SUBJECT,
  AC265_GITHUB_OIDC_WORKFLOW_REF,
  CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  ContentSchemaRegistryAc265PrepareRunCommandSchema,
  ContentSchemaRegistryAc265PrepareRunRequestSchema,
  ContentSchemaRegistryAc265RunnerAuthorizationSchema,
  ContentSchemaRegistryAc265VerifiedGithubIdentitySchema,
} from './index.ts';

const sourceRevision = 'a'.repeat(40);
const digest = 'b'.repeat(64);

const runId = '10000000-0000-4000-8000-000000000001';
const candidateRef =
  'ac265-candidate://staging/40000000-0000-4000-8000-000000000004';

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  runId,
  candidateRef,
} as const;

const github = {
  issuer: AC265_GITHUB_OIDC_ISSUER,
  audience: AC265_GITHUB_OIDC_AUDIENCE,
  subject: AC265_GITHUB_OIDC_SUBJECT,
  repository: AC265_GITHUB_OIDC_REPOSITORY,
  repositoryId: AC265_GITHUB_OIDC_REPOSITORY_ID,
  repositoryOwner: AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  repositoryOwnerId: AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  repositoryVisibility: 'public',
  ref: 'refs/heads/main',
  refProtected: true,
  eventName: 'workflow_dispatch',
  environment: 'staging',
  runnerEnvironment: 'github-hosted',
  workflowRef: AC265_GITHUB_OIDC_WORKFLOW_REF,
  workflowSha: sourceRevision,
  sha: sourceRevision,
  githubRunId: '34796668543',
  githubRunAttempt: 1,
  jtiSha256: digest,
  tokenIssuedAt: '2026-09-14T01:45:00.000Z',
  tokenNotBefore: '2026-09-14T01:44:55.000Z',
  tokenExpiresAt: '2026-09-14T01:50:00.000Z',
} as const;

describe('AC265 hosted control-plane contracts', () => {
  it('accepts only an exact, opaque staging candidate-reference request', () => {
    expect(AC265_STAGING_API_ORIGIN).toBe(
      'https://wejammin-api-staging.wejammin.workers.dev',
    );
    expect(
      ContentSchemaRegistryAc265PrepareRunRequestSchema.parse(request),
    ).toEqual(request);
    expect(
      ContentSchemaRegistryAc265PrepareRunRequestSchema.safeParse({
        ...request,
        unexpected: true,
      }).success,
    ).toBe(false);
    for (const invalidRef of [
      'https://collector.example/candidate',
      'ac265-candidate://production/40000000-0000-4000-8000-000000000004',
      'ac265-candidate://staging/../candidate',
      'ac265-candidate://staging/not-a-uuid',
      'ac265-candidate://staging/40000000-0000-1000-8000-000000000004',
    ]) {
      expect(
        ContentSchemaRegistryAc265PrepareRunRequestSchema.safeParse({
          ...request,
          candidateRef: invalidRef,
        }).success,
      ).toBe(false);
    }

    for (const forbiddenRunnerSuppliedField of ['identity', 'identitySha256']) {
      expect(
        ContentSchemaRegistryAc265PrepareRunRequestSchema.safeParse({
          ...request,
          [forbiddenRunnerSuppliedField]: {},
        }).success,
      ).toBe(false);
    }
  });

  it('pins the immutable GitHub identity rather than trusting names alone', () => {
    expect(
      ContentSchemaRegistryAc265VerifiedGithubIdentitySchema.parse(github),
    ).toEqual(github);

    for (const candidate of [
      { ...github, repositoryId: '1297208153' },
      { ...github, repositoryOwnerId: '305953067' },
      { ...github, workflowRef: github.workflowRef.replace('main', 'feature') },
      { ...github, refProtected: false },
      { ...github, runnerEnvironment: 'self-hosted' },
    ]) {
      expect(
        ContentSchemaRegistryAc265VerifiedGithubIdentitySchema.safeParse(
          candidate,
        ).success,
      ).toBe(false);
    }
  });

  it('rejects GitHub OIDC timestamps outside the issued-at tolerance and lifetime', () => {
    const cases = [
      {
        candidate: {
          ...github,
          tokenNotBefore: '2026-09-14T01:45:05.001Z',
        },
        path: ['tokenNotBefore'],
        message: 'GitHub OIDC not-before time exceeds the issued-at tolerance',
      },
      {
        candidate: {
          ...github,
          tokenExpiresAt: '2026-09-14T01:45:00.000Z',
        },
        path: ['tokenExpiresAt'],
        message: 'GitHub OIDC lifetime exceeds the AC265 authorization window',
      },
      {
        candidate: {
          ...github,
          tokenExpiresAt: '2026-09-14T01:50:00.001Z',
        },
        path: ['tokenExpiresAt'],
        message: 'GitHub OIDC lifetime exceeds the AC265 authorization window',
      },
    ];

    for (const { candidate, path, message } of cases) {
      const parsed =
        ContentSchemaRegistryAc265VerifiedGithubIdentitySchema.safeParse(
          candidate,
        );

      expect(parsed.success).toBe(false);
      if (parsed.success)
        throw new Error('Invalid GitHub OIDC timing must be rejected.');
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({ code: 'custom', path, message }),
      );
    }
  });

  it('passes only the opaque reference and verified GitHub identity to the server', () => {
    const command = { ...request, github };
    expect(
      ContentSchemaRegistryAc265PrepareRunCommandSchema.parse(command),
    ).toEqual(command);

    const differentCandidateRevision = {
      ...github,
      sha: '1'.repeat(40),
      workflowSha: '1'.repeat(40),
    };
    expect(
      ContentSchemaRegistryAc265PrepareRunCommandSchema.safeParse({
        ...request,
        github: differentCandidateRevision,
      }).success,
    ).toBe(true);

    for (const changedGithub of [{ ...github, sha: '1'.repeat(40) }]) {
      expect(
        ContentSchemaRegistryAc265PrepareRunCommandSchema.safeParse({
          ...command,
          github: changedGithub,
        }).success,
      ).toBe(false);
    }
  });

  it('accepts only a short-lived, redacted, candidate-bound authorization', () => {
    const authorization = {
      criterion: 'P2-S09-AC-265',
      schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
      authorizationRef:
        'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
      runId,
      identitySha256: digest,
      sourceRevision,
      deploymentId: '6428523608',
      githubRunId: github.githubRunId,
      githubRunAttempt: github.githubRunAttempt,
      workflowSha: sourceRevision,
      authorizedAt: '2026-09-14T01:45:00.000Z',
      expiresAt: '2026-09-14T01:50:00.000Z',
      state: 'authorized',
      redacted: true,
    } as const;

    expect(
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.parse(authorization),
    ).toEqual(authorization);
    expect(
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse({
        ...authorization,
        redacted: false,
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse({
        ...authorization,
        expiresAt: '2026-09-14T01:50:00.001Z',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse({
        ...authorization,
        expiresAt: authorization.authorizedAt,
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse({
        ...authorization,
        workflowSha: '3'.repeat(40),
      }).success,
    ).toBe(false);
  });
});
