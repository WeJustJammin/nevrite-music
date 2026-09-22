import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';

export const CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION =
  'ac265-hosted-control-plane-v1' as const;
export const AC265_GITHUB_OIDC_ISSUER =
  'https://token.actions.githubusercontent.com' as const;
export const AC265_GITHUB_OIDC_AUDIENCE =
  'urn:wejammin:ac265:staging-runner:v1' as const;
export const AC265_GITHUB_OIDC_REPOSITORY = 'WeJustJammin/wejammin' as const;
export const AC265_GITHUB_OIDC_REPOSITORY_ID = '1297208152' as const;
export const AC265_GITHUB_OIDC_REPOSITORY_OWNER = 'WeJustJammin' as const;
export const AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID = '305953066' as const;
export const AC265_GITHUB_OIDC_SUBJECT =
  'repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging' as const;
export const AC265_GITHUB_OIDC_WORKFLOW_REF =
  'WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main' as const;
export const AC265_STAGING_API_ORIGIN =
  'https://wejammin-api-staging.wejammin.workers.dev' as const;
export const AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS = 5 * 60 * 1_000;

const POSITIVE_GITHUB_ID = /^[1-9][0-9]{0,19}$/u;
const AUTHORIZATION_REFERENCE =
  /^ac265-authorization:\/\/staging\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const CANDIDATE_REFERENCE =
  /^ac265-candidate:\/\/staging\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const ContentSchemaRegistryAc265PrepareRunRequestShape = {
  criterion: z.literal('P2-S09-AC-265'),
  schemaVersion: z.literal(
    CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  ),
  runId: z.string().uuid(),
  candidateRef: z.string().regex(CANDIDATE_REFERENCE),
} as const;

export const ContentSchemaRegistryAc265PrepareRunRequestSchema = z
  .object(ContentSchemaRegistryAc265PrepareRunRequestShape)
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265VerifiedGithubIdentitySchema = z
  .object({
    issuer: z.literal(AC265_GITHUB_OIDC_ISSUER),
    audience: z.literal(AC265_GITHUB_OIDC_AUDIENCE),
    subject: z.literal(AC265_GITHUB_OIDC_SUBJECT),
    repository: z.literal(AC265_GITHUB_OIDC_REPOSITORY),
    repositoryId: z.literal(AC265_GITHUB_OIDC_REPOSITORY_ID),
    repositoryOwner: z.literal(AC265_GITHUB_OIDC_REPOSITORY_OWNER),
    repositoryOwnerId: z.literal(AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID),
    repositoryVisibility: z.literal('public'),
    ref: z.literal('refs/heads/main'),
    refProtected: z.literal(true),
    eventName: z.literal('workflow_dispatch'),
    environment: z.literal('staging'),
    runnerEnvironment: z.literal('github-hosted'),
    workflowRef: z.literal(AC265_GITHUB_OIDC_WORKFLOW_REF),
    workflowSha: ReleaseEvidenceSourceRevisionSchema,
    sha: ReleaseEvidenceSourceRevisionSchema,
    githubRunId: z.string().regex(POSITIVE_GITHUB_ID),
    githubRunAttempt: z.number().int().positive().max(1_000),
    jtiSha256: ReleaseEvidenceDigestSchema,
    tokenIssuedAt: SafeReleaseTimestampSchema,
    tokenNotBefore: SafeReleaseTimestampSchema,
    tokenExpiresAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const issuedAt = Date.parse(value.tokenIssuedAt);
    const notBefore = Date.parse(value.tokenNotBefore);
    const expiresAt = Date.parse(value.tokenExpiresAt);
    if (notBefore > issuedAt + 5_000)
      context.addIssue({
        code: 'custom',
        path: ['tokenNotBefore'],
        message: 'GitHub OIDC not-before time exceeds the issued-at tolerance',
      });
    if (
      expiresAt <= issuedAt ||
      expiresAt - issuedAt > AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
    )
      context.addIssue({
        code: 'custom',
        path: ['tokenExpiresAt'],
        message: 'GitHub OIDC lifetime exceeds the AC265 authorization window',
      });
  })
  .superRefine((value, context) => {
    if (value.sha !== value.workflowSha)
      context.addIssue({
        code: 'custom',
        path: ['workflowSha'],
        message:
          'GitHub event revision must match the protected workflow revision',
      });
  })
  .readonly();

export const ContentSchemaRegistryAc265PrepareRunCommandSchema = z
  .object({
    ...ContentSchemaRegistryAc265PrepareRunRequestShape,
    github: ContentSchemaRegistryAc265VerifiedGithubIdentitySchema,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265RunnerAuthorizationSchema = z
  .object({
    criterion: z.literal('P2-S09-AC-265'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
    ),
    authorizationRef: z.string().regex(AUTHORIZATION_REFERENCE),
    runId: z.string().uuid(),
    identitySha256: ReleaseEvidenceDigestSchema,
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    deploymentId: SafeReleaseIdSchema,
    githubRunId: z.string().regex(POSITIVE_GITHUB_ID),
    githubRunAttempt: z.number().int().positive().max(1_000),
    workflowSha: ReleaseEvidenceSourceRevisionSchema,
    authorizedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
    state: z.literal('authorized'),
    redacted: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sourceRevision !== value.workflowSha)
      context.addIssue({
        code: 'custom',
        path: ['workflowSha'],
        message: 'Authorization workflow revision must match the candidate',
      });
    const authorizedAt = Date.parse(value.authorizedAt);
    const expiresAt = Date.parse(value.expiresAt);
    if (
      expiresAt <= authorizedAt ||
      expiresAt - authorizedAt > AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
    )
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message:
          'AC265 authorization must be positive and at most five minutes',
      });
  })
  .readonly();

export type ContentSchemaRegistryAc265PrepareRunRequest = z.infer<
  typeof ContentSchemaRegistryAc265PrepareRunRequestSchema
>;
export type ContentSchemaRegistryAc265VerifiedGithubIdentity = z.infer<
  typeof ContentSchemaRegistryAc265VerifiedGithubIdentitySchema
>;
export type ContentSchemaRegistryAc265PrepareRunCommand = z.infer<
  typeof ContentSchemaRegistryAc265PrepareRunCommandSchema
>;
export type ContentSchemaRegistryAc265RunnerAuthorization = z.infer<
  typeof ContentSchemaRegistryAc265RunnerAuthorizationSchema
>;
