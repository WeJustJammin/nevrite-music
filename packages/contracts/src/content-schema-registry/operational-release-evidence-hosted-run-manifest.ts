import { z } from 'zod';

import { CorrelationIdSchema } from '../identifiers.ts';
import {
  HostedResourceReferencesSchema,
  HostedSessionHandlesSchema,
} from './operational-release-evidence-hosted-input-references.ts';
import { ContentSchemaRegistryHostedRunnerIdentitySchema } from './operational-release-evidence-hosted-input-identity.ts';
import { HostedRunnerControlsSchema } from './operational-release-evidence-hosted-input-scenarios.ts';

export const AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION =
  'ac265-hosted-run-manifest-v1' as const;

export const AC265_HOSTED_RUN_MANIFEST_CRITERION = 'P2-S09-AC-265' as const;

export const AC265_HOSTED_RUN_MANIFEST_CONTRACT_VERSION =
  'ac265-hosted-runner-v1' as const;

// `correlationId` is a non-authority correlation label. The schema accepts any
// UUID version, including nil and v1, so it is neither asserted nor checked for
// global uniqueness. It carries no anti-replay meaning, no ordering or
// sequence meaning, and no binding or ownership meaning, and it is not derived
// from `runId`. It distinguishes records; it authorizes nothing.
//
// `controls` carries the shared bounded control schema only. That schema
// constrains declared modes and numeric ranges; the pinned policy values (for
// example the 121-request rate-limit budget and the 60-second lease) are
// enforced by the separately versioned `ac265-hosted-runner-policy-v1`
// comparison at verification time, not by this schema.
// The runner contract (docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md,
// section 'Run manifest and external references') fixes the manifest membership.
// This schema carries those members and nothing else: it is a reference
// container, never session state, credentials, resource contents, or a
// role/resource or scenario/role mapping. Mapping authority stays with the
// independently attested ac265-approved-runner-mappings-v1 source; a manifest
// that validated here is not thereby authorized.
export const Ac265HostedRunManifestV1Schema = z
  .object({
    schemaVersion: z.literal(AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION),
    criterion: z.literal(AC265_HOSTED_RUN_MANIFEST_CRITERION),
    contractVersion: z.literal(AC265_HOSTED_RUN_MANIFEST_CONTRACT_VERSION),
    runId: z.string().uuid(),
    correlationId: CorrelationIdSchema,
    identity: ContentSchemaRegistryHostedRunnerIdentitySchema,
    sessionHandles: HostedSessionHandlesSchema,
    resourceRefs: HostedResourceReferencesSchema,
    controls: HostedRunnerControlsSchema,
  })
  .strict()
  .readonly();

export type Ac265HostedRunManifestV1 = z.infer<
  typeof Ac265HostedRunManifestV1Schema
>;
