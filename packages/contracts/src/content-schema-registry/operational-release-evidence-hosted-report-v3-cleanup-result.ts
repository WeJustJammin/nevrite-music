import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from './operational-release-evidence-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
  ContentSchemaRegistryHostedResourceReferenceSchema,
} from './operational-release-evidence-hosted-input-references.ts';
import { HostedOutageLeaseReleaseProofSchema } from './operational-release-evidence-hosted-outage-lease.ts';
import { HostedSessionTeardownsSchema } from './operational-release-evidence-hosted-execution-evidence.ts';
import { ContentSchemaRegistryHostedServerReceiptSchema } from './operational-release-evidence-hosted-server-receipt.ts';

export const HostedCleanupResultSchema = z
  .object({
    outcome: z.literal('passed'),
    completedAt: SafeReleaseTimestampSchema,
    verifiedResources: z
      .array(ContentSchemaRegistryHostedResourceReferenceSchema)
      .length(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
      .readonly(),
    outageLeaseReleased: z.literal(true),
    dependencyRecovered: z.literal(true),
    outageLeaseReleaseProof: HostedOutageLeaseReleaseProofSchema.optional(),
    logoutPolicy: z.literal('current_session_only').optional(),
    sessionTeardowns: HostedSessionTeardownsSchema.optional(),
    currentSessionsLoggedOut: z.literal(
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length,
    ),
    sessionMaterialDestroyed: z.literal(true),
    serverReceipt: ContentSchemaRegistryHostedServerReceiptSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.logoutPolicy === undefined) !==
      (value.sessionTeardowns === undefined)
    )
      context.addIssue({
        code: 'custom',
        path: ['sessionTeardowns'],
        message:
          'Hosted cleanup must bind its logout policy and session teardowns together',
      });
    if (
      value.sessionTeardowns !== undefined &&
      !CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.every(
        (role) => value.sessionTeardowns?.[role] !== undefined,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['sessionTeardowns'],
        message: 'Hosted cleanup must bind every declared session teardown',
      });
    const kinds = value.verifiedResources.map(({ kind }) => kind);
    if (
      new Set(value.verifiedResources.map(({ ref }) => ref)).size !==
        value.verifiedResources.length ||
      new Set(kinds).size !==
        CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length ||
      !CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.every((kind) =>
        kinds.includes(kind),
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['verifiedResources'],
        message: 'Cleanup must bind every safe resource reference exactly once',
      });
  })
  .readonly();
