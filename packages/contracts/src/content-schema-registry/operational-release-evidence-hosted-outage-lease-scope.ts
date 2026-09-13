import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import { HostedDependencyOutageRouteSchema } from './operational-release-evidence-hosted-route.ts';

export const HostedOutageLeaseScopeSchema = z
  .object({
    runId: z.string().uuid(),
    hostingProjectId: SafeReleaseIdSchema,
    supabaseProjectRef: z.string().regex(/^[a-z0-9]{20}$/u),
    deploymentId: SafeReleaseIdSchema,
    dependencyId: SafeReleaseIdSchema,
    route: HostedDependencyOutageRouteSchema,
  })
  .strict()
  .readonly();

export type HostedOutageLeaseScope = z.infer<
  typeof HostedOutageLeaseScopeSchema
>;
