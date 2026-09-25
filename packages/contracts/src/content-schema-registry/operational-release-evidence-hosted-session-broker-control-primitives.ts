import { z } from 'zod';

import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from './operational-release-evidence-common.ts';

export const CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION =
  'ac265-hosted-session-broker-control-v1' as const;
export const AC265_SESSION_BROKER_CRITERION = 'P2-S09-AC-265' as const;
export const AC265_SESSION_BROKER_ENVIRONMENT = 'staging' as const;
export const AC265_SESSION_BROKER_HOSTING_PROJECT_ID =
  'wejammin-staging' as const;
export const AC265_SESSION_BROKER_LOGOUT_SCOPE =
  'current_session_only' as const;
export const AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE = 1 as const;
export const AC265_SESSION_BROKER_MAX_DURATION_MS = 5 * 60 * 1_000;

const AC265_SESSION_BROKER_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

// The private RPCs accept only this exact lowercase v4 shape.  z.string().uuid()
// would also admit v1, nil, and uppercase spellings the database rejects.
export const Ac265SessionBrokerRunIdSchema = z
  .string()
  .regex(new RegExp(`^${AC265_SESSION_BROKER_UUID}$`, 'u'));

export const Ac265SessionBrokerAuthorizationReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-authorization://staging/${AC265_SESSION_BROKER_UUID}$`,
      'u',
    ),
  );

export const Ac265SessionBrokerIdempotencyReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-idempotency://staging/${AC265_SESSION_BROKER_UUID}$`,
      'u',
    ),
  );

// Session handles intentionally carry no environment segment; the locked role
// matrix and the protected run manifest already pin the staging environment.
export const Ac265SessionBrokerHandleReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-session://(?:${CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.join('|')})/${AC265_SESSION_BROKER_UUID}$`,
      'u',
    ),
  );

export const Ac265SessionBrokerMaterialReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-session-material://staging/${AC265_SESSION_BROKER_UUID}$`,
      'u',
    ),
  );

export const Ac265SessionBrokerRoleSchema = z.enum(
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
);

export const Ac265SessionBrokerControlBaseShape = {
  criterion: z.literal(AC265_SESSION_BROKER_CRITERION),
  schemaVersion: z.literal(
    CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  ),
  authorizationRef: Ac265SessionBrokerAuthorizationReferenceSchema,
  runId: Ac265SessionBrokerRunIdSchema,
  identitySha256: ReleaseEvidenceDigestSchema,
} as const;

export const Ac265SessionBrokerRedactedResultShape = {
  ...Ac265SessionBrokerControlBaseShape,
  environment: z.literal(AC265_SESSION_BROKER_ENVIRONMENT),
  hostingProjectId: z.literal(AC265_SESSION_BROKER_HOSTING_PROJECT_ID),
  redacted: z.literal(true),
} as const;

export const Ac265SessionBrokerRoleHandleShape = {
  role: Ac265SessionBrokerRoleSchema,
  handleRef: Ac265SessionBrokerHandleReferenceSchema,
  handleSha256: ReleaseEvidenceDigestSchema,
} as const;

export const requireAc265SessionBrokerHandleRoleBinding = (
  value: { readonly handleRef: string; readonly role: string },
  context: z.RefinementCtx,
): void => {
  if (!value.handleRef.startsWith(`ac265-session://${value.role}/`))
    context.addIssue({
      code: 'custom',
      path: ['handleRef'],
      message: 'Session handle reference role must match its bound role',
    });
};
