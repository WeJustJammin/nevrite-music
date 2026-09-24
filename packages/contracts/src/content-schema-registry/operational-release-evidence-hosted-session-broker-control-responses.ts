import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';
import {
  AC265_SESSION_BROKER_LOGOUT_SCOPE,
  AC265_SESSION_BROKER_MAX_DURATION_MS,
  AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
  Ac265SessionBrokerIdempotencyReferenceSchema,
  Ac265SessionBrokerMaterialReferenceSchema,
  Ac265SessionBrokerRedactedResultShape,
  Ac265SessionBrokerRoleHandleShape,
  Ac265SessionBrokerRoleSchema,
  requireAc265SessionBrokerHandleRoleBinding,
} from './operational-release-evidence-hosted-session-broker-control-primitives.ts';

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
          .superRefine(requireAc265SessionBrokerHandleRoleBinding)
          .readonly(),
      )
      .length(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length)
      .superRefine((value, context) => {
        const roles = value.map(({ role }) => role);
        if (
          new Set(roles).size !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length ||
          !CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.every((role) =>
            roles.includes(role),
          )
        )
          context.addIssue({
            code: 'custom',
            message:
              'Session broker authorization must return every locked role exactly once',
          });
      })
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
    requireAc265SessionBrokerHandleRoleBinding(value, context);
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
    requireAc265SessionBrokerHandleRoleBinding(value, context);
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

export type Ac265SessionBrokerAuthorizeResult = z.infer<
  typeof Ac265SessionBrokerAuthorizeResultSchema
>;
export type Ac265SessionBrokerResolveResult = z.infer<
  typeof Ac265SessionBrokerResolveResultSchema
>;
export type Ac265SessionBrokerTeardownResult = z.infer<
  typeof Ac265SessionBrokerTeardownResultSchema
>;
export type Ac265SessionBrokerConflict = z.infer<
  typeof Ac265SessionBrokerConflictSchema
>;
export type Ac265SessionBrokerRole = z.infer<
  typeof Ac265SessionBrokerRoleSchema
>;
