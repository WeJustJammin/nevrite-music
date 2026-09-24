import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';

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

const Ac265SessionBrokerControlBaseShape = {
  criterion: z.literal(AC265_SESSION_BROKER_CRITERION),
  schemaVersion: z.literal(
    CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  ),
  authorizationRef: Ac265SessionBrokerAuthorizationReferenceSchema,
  runId: z.string().uuid(),
  identitySha256: ReleaseEvidenceDigestSchema,
} as const;

const Ac265SessionBrokerRedactedResultShape = {
  ...Ac265SessionBrokerControlBaseShape,
  environment: z.literal(AC265_SESSION_BROKER_ENVIRONMENT),
  hostingProjectId: z.literal(AC265_SESSION_BROKER_HOSTING_PROJECT_ID),
  redacted: z.literal(true),
} as const;

const Ac265SessionBrokerRoleHandleShape = {
  role: Ac265SessionBrokerRoleSchema,
  handleRef: Ac265SessionBrokerHandleReferenceSchema,
  handleSha256: ReleaseEvidenceDigestSchema,
} as const;

const requireHandleRoleBinding = (
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

export const Ac265SessionBrokerAuthorizeRequestSchema = z
  .object({
    ...Ac265SessionBrokerControlBaseShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
    handles: z
      .array(
        z
          .object({
            ...Ac265SessionBrokerRoleHandleShape,
            materialRef: Ac265SessionBrokerMaterialReferenceSchema,
          })
          .strict()
          .superRefine(requireHandleRoleBinding)
          .readonly(),
      )
      .length(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length)
      .superRefine((value, context) => {
        const roles = value.map(({ role }) => role);
        const references = value.map(({ handleRef }) => handleRef);
        const material = value.map(({ materialRef }) => materialRef);
        if (
          new Set(roles).size !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length ||
          !CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.every((role) =>
            roles.includes(role),
          )
        )
          context.addIssue({
            code: 'custom',
            message: 'Session broker must bind every locked role exactly once',
          });
        if (new Set(references).size !== references.length)
          context.addIssue({
            code: 'custom',
            message: 'Session broker handles must be distinct',
          });
        if (new Set(material).size !== material.length)
          context.addIssue({
            code: 'custom',
            message: 'Session broker material references must be distinct',
          });
      })
      .readonly(),
  })
  .strict()
  .readonly();

export const Ac265SessionBrokerAuthorizeResultSchema = z
  .object({
    ...Ac265SessionBrokerRedactedResultShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
    state: z.literal('authorized'),
    handles: z
      .array(
        z
          .object(Ac265SessionBrokerRoleHandleShape)
          .strict()
          .superRefine(requireHandleRoleBinding)
          .readonly(),
      )
      .length(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length)
      .readonly(),
    maxResolvesPerHandle: z.literal(
      AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
    ),
    authorizedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const given = Date.parse(value.authorizedAt);
    const expires = Date.parse(value.expiresAt);
    if (
      expires <= given ||
      expires - given > AC265_SESSION_BROKER_MAX_DURATION_MS
    )
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message:
          'Session broker authorization must be positive and at most five minutes',
      });
  })
  .readonly();

export const Ac265SessionBrokerResolveRequestSchema = z
  .object({
    ...Ac265SessionBrokerControlBaseShape,
    ...Ac265SessionBrokerRoleHandleShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
  })
  .strict()
  .superRefine(requireHandleRoleBinding)
  .readonly();

export const Ac265SessionBrokerResolveResultSchema = z
  .object({
    ...Ac265SessionBrokerRedactedResultShape,
    ...Ac265SessionBrokerRoleHandleShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
    state: z.literal('resolved'),
    materialRef: Ac265SessionBrokerMaterialReferenceSchema,
    maxResolvesPerHandle: z.literal(
      AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
    ),
    resolvedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .superRefine((value, context) => {
    requireHandleRoleBinding(value, context);
    const resolved = Date.parse(value.resolvedAt);
    const expires = Date.parse(value.expiresAt);
    if (
      expires <= resolved ||
      expires - resolved > AC265_SESSION_BROKER_MAX_DURATION_MS
    )
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message:
          'Session broker material must expire within five minutes of resolution',
      });
  })
  .readonly();

export const Ac265SessionBrokerTeardownRequestSchema = z
  .object({
    ...Ac265SessionBrokerControlBaseShape,
    ...Ac265SessionBrokerRoleHandleShape,
    logoutScope: z.literal(AC265_SESSION_BROKER_LOGOUT_SCOPE),
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
  })
  .strict()
  .superRefine(requireHandleRoleBinding)
  .readonly();

export const Ac265SessionBrokerTeardownResultSchema = z
  .object({
    ...Ac265SessionBrokerRedactedResultShape,
    ...Ac265SessionBrokerRoleHandleShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
    state: z.literal('logged_out'),
    logoutScope: z.literal(AC265_SESSION_BROKER_LOGOUT_SCOPE),
    sessionRefSha256: ReleaseEvidenceDigestSchema,
    teardownsRemaining: z
      .number()
      .int()
      .min(0)
      .max(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length - 1),
    loggedOutAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .superRefine((value, context) => {
    requireHandleRoleBinding(value, context);
    if (value.sessionRefSha256 !== value.handleSha256)
      context.addIssue({
        code: 'custom',
        path: ['sessionRefSha256'],
        message:
          'Session teardown digest must bind the exact handle reference digest',
      });
  })
  .readonly();

export const Ac265SessionBrokerConflictSchema = z
  .object({ status: z.literal('conflict') })
  .strict()
  .readonly();

export const Ac265SessionBrokerAuthorizeResponseSchema = z
  .union([
    Ac265SessionBrokerAuthorizeResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export const Ac265SessionBrokerResolveResponseSchema = z
  .union([
    Ac265SessionBrokerResolveResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export const Ac265SessionBrokerTeardownResponseSchema = z
  .union([
    Ac265SessionBrokerTeardownResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export type Ac265SessionBrokerRole = z.infer<
  typeof Ac265SessionBrokerRoleSchema
>;
export type Ac265SessionBrokerAuthorizeRequest = z.infer<
  typeof Ac265SessionBrokerAuthorizeRequestSchema
>;
export type Ac265SessionBrokerAuthorizeResult = z.infer<
  typeof Ac265SessionBrokerAuthorizeResultSchema
>;
export type Ac265SessionBrokerResolveRequest = z.infer<
  typeof Ac265SessionBrokerResolveRequestSchema
>;
export type Ac265SessionBrokerResolveResult = z.infer<
  typeof Ac265SessionBrokerResolveResultSchema
>;
export type Ac265SessionBrokerTeardownRequest = z.infer<
  typeof Ac265SessionBrokerTeardownRequestSchema
>;
export type Ac265SessionBrokerTeardownResult = z.infer<
  typeof Ac265SessionBrokerTeardownResultSchema
>;
export type Ac265SessionBrokerConflict = z.infer<
  typeof Ac265SessionBrokerConflictSchema
>;
