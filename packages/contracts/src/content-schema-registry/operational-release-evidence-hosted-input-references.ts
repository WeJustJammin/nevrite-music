import { z } from 'zod';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';

export const CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS = [
  'content_schema',
  'staff_case',
  'organization',
  'prerequisite',
] as const;

const HOSTED_REFERENCE_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const HostedResourceReferenceValueSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-resource://(?:${CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.join('|')})/${HOSTED_REFERENCE_UUID}$`,
      'u',
    ),
  );

const HostedSessionReferenceSchema = z
  .object({
    ref: z
      .string()
      .regex(
        new RegExp(
          `^ac265-session://(?:${CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.join('|')})/${HOSTED_REFERENCE_UUID}$`,
          'u',
        ),
      ),
    sha256: ReleaseEvidenceDigestSchema,
  })
  .strict()
  .readonly();

export const HostedSessionHandlesSchema = z
  .record(
    z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
    HostedSessionReferenceSchema,
  )
  .superRefine((value, context) => {
    const references = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map(
      (role) => value[role]?.ref,
    );
    for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
      if (!value[role]?.ref.startsWith(`ac265-session://${role}/`))
        context.addIssue({
          code: 'custom',
          path: [role, 'ref'],
          message: 'Hosted session reference role must match its manifest key',
        });
    }
    if (
      new Set(references).size !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length
    )
      context.addIssue({
        code: 'custom',
        message: 'Hosted session references must be distinct',
      });
  })
  .readonly();

export const ContentSchemaRegistryHostedResourceReferenceSchema = z
  .object({
    kind: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS),
    ref: HostedResourceReferenceValueSchema,
    sha256: ReleaseEvidenceDigestSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.ref.startsWith(`ac265-resource://${value.kind}/`))
      context.addIssue({
        code: 'custom',
        path: ['ref'],
        message: 'Hosted resource reference kind must match its manifest kind',
      });
  })
  .readonly();

export const HostedResourceReferencesSchema = z
  .array(ContentSchemaRegistryHostedResourceReferenceSchema)
  .length(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
  .superRefine((value, context) => {
    const kinds = value.map(({ kind }) => kind);
    const references = value.map(({ ref }) => ref);
    if (
      new Set(kinds).size !==
        CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length ||
      !CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.every((kind) =>
        kinds.includes(kind),
      )
    )
      context.addIssue({
        code: 'custom',
        message:
          'Hosted resource manifest must include every safe kind exactly once',
      });
    if (new Set(references).size !== references.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted resource references must be distinct',
      });
  })
  .readonly();
