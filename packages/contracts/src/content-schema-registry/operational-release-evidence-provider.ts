import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { ReleaseEvidenceSourceRevisionSchema } from './operational-release-evidence-common.ts';

const CloudflareUuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

export const CloudflareStagingWorkerNameSchema = z.enum([
  'wejammin-api-staging',
  'wejammin-web-staging',
]);

export const CloudflareGithubRunIdSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,19}$/);

export const CloudflareProviderReleaseWorkerEvidenceSchema = z
  .object({
    workerName: CloudflareStagingWorkerNameSchema,
    versionId: CloudflareUuidSchema,
    deploymentId: CloudflareUuidSchema,
    versionCreatedAt: SafeReleaseTimestampSchema,
    deploymentCreatedAt: SafeReleaseTimestampSchema,
    annotations: z
      .object({
        tag: ReleaseEvidenceSourceRevisionSchema,
        message: z.string().min(1).max(180),
      })
      .strict()
      .readonly(),
    traffic: z
      .object({
        strategy: z.literal('percentage'),
        versionPercentage: z.literal(100),
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly();

export const CloudflareProviderReleaseEvidenceSchema = z
  .object({
    provider: z.literal('cloudflare'),
    environment: z.literal('staging'),
    redacted: z.literal(true),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    githubRunId: CloudflareGithubRunIdSchema,
    collectedAt: SafeReleaseTimestampSchema,
    workers: z.array(CloudflareProviderReleaseWorkerEvidenceSchema).length(2),
  })
  .strict()
  .superRefine((report, context) => {
    const names = report.workers.map(({ workerName }) => workerName);
    if (new Set(names).size !== names.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workers'],
        message: 'Each staging Worker must have one provider evidence record.',
      });
    }
    const expectedMessage = `sourceRevision=${report.sourceRevision};githubRunId=${report.githubRunId}`;
    for (const [index, worker] of report.workers.entries()) {
      if (worker.annotations.tag !== report.sourceRevision) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workers', index, 'annotations', 'tag'],
          message: 'Cloudflare Worker tag does not match source revision.',
        });
      }
      if (worker.annotations.message !== expectedMessage) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workers', index, 'annotations', 'message'],
          message: 'Cloudflare Worker message does not match release identity.',
        });
      }
      if (
        Date.parse(worker.versionCreatedAt) >
        Date.parse(worker.deploymentCreatedAt)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workers', index],
          message: 'Cloudflare version was created after its deployment.',
        });
      }
      if (
        Date.parse(worker.deploymentCreatedAt) > Date.parse(report.collectedAt)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['workers', index, 'deploymentCreatedAt'],
          message:
            'Cloudflare deployment was created after evidence collection.',
        });
      }
    }
  })
  .readonly();

export type CloudflareProviderReleaseEvidence = z.infer<
  typeof CloudflareProviderReleaseEvidenceSchema
>;
