import { z } from 'zod';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';

const HOSTED_EVIDENCE_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const HostedExecutionEvidenceKindSchema = z.enum([
  'role_assertion',
  'scenario_observation',
  'session_teardown',
]);

const HostedExecutionEvidenceReferenceShape = {
  ref: z
    .string()
    .regex(new RegExp(`^ac265-evidence://blob/${HOSTED_EVIDENCE_UUID}$`, 'u')),
  sha256: ReleaseEvidenceDigestSchema,
};

export const HostedRoleExecutionEvidenceReferenceSchema = z
  .object({
    ...HostedExecutionEvidenceReferenceShape,
    kind: z.literal('role_assertion'),
  })
  .strict()
  .readonly();

export const HostedScenarioExecutionEvidenceReferenceSchema = z
  .object({
    ...HostedExecutionEvidenceReferenceShape,
    kind: z.literal('scenario_observation'),
  })
  .strict()
  .readonly();

export const HostedSessionTeardownEvidenceReferenceSchema = z
  .object({
    ...HostedExecutionEvidenceReferenceShape,
    kind: z.literal('session_teardown'),
  })
  .strict()
  .readonly();

export const HostedRoleExecutionEvidenceListSchema = z
  .array(HostedRoleExecutionEvidenceReferenceSchema)
  .min(1)
  .max(10)
  .readonly();

export const HostedScenarioExecutionEvidenceListSchema = z
  .array(HostedScenarioExecutionEvidenceReferenceSchema)
  .min(1)
  .max(10)
  .readonly();

export const HostedSessionTeardownSchema = z
  .object({
    sessionRefSha256: ReleaseEvidenceDigestSchema,
    outcome: z.literal('logged_out'),
    evidence: HostedSessionTeardownEvidenceReferenceSchema,
  })
  .strict()
  .readonly();

export const HostedSessionTeardownsSchema = z
  .record(
    z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
    HostedSessionTeardownSchema,
  )
  .readonly();

const HostedExecutionEvidencePayloadFields = {
  schemaVersion: z.literal('ac265-execution-evidence-v1'),
  candidateIdentitySha256: ReleaseEvidenceDigestSchema,
  subjectSha256: ReleaseEvidenceDigestSchema,
  artifactSha256: ReleaseEvidenceDigestSchema,
};

export const HostedExecutionEvidencePayloadSchema = z.discriminatedUnion(
  'kind',
  [
    z
      .object({
        ...HostedExecutionEvidencePayloadFields,
        kind: z.literal('role_assertion'),
      })
      .strict(),
    z
      .object({
        ...HostedExecutionEvidencePayloadFields,
        kind: z.literal('scenario_observation'),
      })
      .strict(),
    z
      .object({
        ...HostedExecutionEvidencePayloadFields,
        kind: z.literal('session_teardown'),
        sessionRefSha256: ReleaseEvidenceDigestSchema,
      })
      .strict(),
  ],
);
