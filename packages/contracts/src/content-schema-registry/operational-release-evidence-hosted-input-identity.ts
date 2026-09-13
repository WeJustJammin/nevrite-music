import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';

const HOSTING_ACCOUNT_ID = /^[0-9a-f]{32}$/u;
const SUPABASE_PROJECT_REF = /^[a-z0-9]{20}$/u;

export const ContentSchemaRegistryHostedRunnerIdentityShape = {
  environment: z.literal('staging'),
  ciRunId: SafeReleaseIdSchema,
  ciRunAttempt: z.number().int().positive().max(1_000),
  stagingRunId: SafeReleaseIdSchema,
  stagingRunAttempt: z.number().int().positive().max(1_000),
  sourceRevision: ReleaseEvidenceSourceRevisionSchema,
  deploymentId: SafeReleaseIdSchema,
  deployedAt: SafeReleaseTimestampSchema,
  buildId: SafeReleaseIdSchema,
  buildManifestSha256: ReleaseEvidenceDigestSchema,
  artifactSha256: ReleaseEvidenceDigestSchema,
  hostingAccountId: z.string().regex(HOSTING_ACCOUNT_ID),
  hostingProjectId: SafeReleaseIdSchema,
  supabaseProjectRef: z.string().regex(SUPABASE_PROJECT_REF),
  migrationVersion: z.string().regex(/^[0-9]{14,20}$/u),
  migrationSha256: ReleaseEvidenceDigestSchema,
  webOrigin: ReleaseEvidenceHostedOriginSchema,
  apiOrigin: ReleaseEvidenceHostedOriginSchema,
  supabaseOrigin: ReleaseEvidenceHostedOriginSchema,
} as const;

export const ContentSchemaRegistryHostedRunnerIdentitySchema = z
  .object(ContentSchemaRegistryHostedRunnerIdentityShape)
  .strict()
  .superRefine((value, context) => {
    const supabaseHost = new URL(value.supabaseOrigin).hostname;
    if (supabaseHost !== `${value.supabaseProjectRef}.supabase.co`)
      context.addIssue({
        code: 'custom',
        path: ['supabaseOrigin'],
        message: 'Hosted Supabase origin must match the pinned staging project',
      });
    const normalizedOrigins = [
      value.webOrigin,
      value.apiOrigin,
      value.supabaseOrigin,
    ].map((origin) => new URL(origin).origin);
    if (new Set(normalizedOrigins).size !== normalizedOrigins.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted web, API, and Supabase origins must be distinct',
      });
  })
  .readonly();
