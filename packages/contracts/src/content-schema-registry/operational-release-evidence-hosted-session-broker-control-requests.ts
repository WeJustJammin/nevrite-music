import { z } from 'zod';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from './operational-release-evidence-common.ts';
import {
  AC265_SESSION_BROKER_LOGOUT_SCOPE,
  Ac265SessionBrokerControlBaseShape,
  Ac265SessionBrokerIdempotencyReferenceSchema,
  Ac265SessionBrokerMaterialReferenceSchema,
  Ac265SessionBrokerRoleHandleShape,
  requireAc265SessionBrokerHandleRoleBinding,
} from './operational-release-evidence-hosted-session-broker-control-primitives.ts';

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
          .superRefine(requireAc265SessionBrokerHandleRoleBinding)
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

export const Ac265SessionBrokerResolveRequestSchema = z
  .object({
    ...Ac265SessionBrokerControlBaseShape,
    ...Ac265SessionBrokerRoleHandleShape,
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
  })
  .strict()
  .superRefine(requireAc265SessionBrokerHandleRoleBinding)
  .readonly();

export const Ac265SessionBrokerTeardownRequestSchema = z
  .object({
    ...Ac265SessionBrokerControlBaseShape,
    ...Ac265SessionBrokerRoleHandleShape,
    logoutScope: z.literal(AC265_SESSION_BROKER_LOGOUT_SCOPE),
    idempotencyRef: Ac265SessionBrokerIdempotencyReferenceSchema,
  })
  .strict()
  .superRefine(requireAc265SessionBrokerHandleRoleBinding)
  .readonly();

export type Ac265SessionBrokerAuthorizeRequest = z.infer<
  typeof Ac265SessionBrokerAuthorizeRequestSchema
>;
export type Ac265SessionBrokerResolveRequest = z.infer<
  typeof Ac265SessionBrokerResolveRequestSchema
>;
export type Ac265SessionBrokerTeardownRequest = z.infer<
  typeof Ac265SessionBrokerTeardownRequestSchema
>;
