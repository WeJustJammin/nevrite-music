import { z } from 'zod';

import {
  AdminGrantScopeSchema,
  AdminPurposeRecoveryActionSchema,
  AdminPurposeResourceTypeSchema,
  AdminRegistryCodeSchema,
} from './admin-common.ts';
import {
  ConfigurationInstantSchema,
  ConfigurationKeySchema,
  ConfigurationTextSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

const GrantActionSchema = z.enum(['create', 'revoke']);

export const Cfg05b04CapabilityActionRequestSchema = z
  .strictObject({
    action: GrantActionSchema,
    grantId: ConfigurationUuidSchema.nullable(),
    expectedVersion: ConfigurationVersionSchema.nullable(),
    subjectPersonId: ConfigurationUuidSchema,
    capabilityKey: ConfigurationKeySchema,
    resourceType: AdminRegistryCodeSchema,
    resourceId: ConfigurationUuidSchema,
    scope: AdminGrantScopeSchema,
    actions: z.array(ConfigurationKeySchema).min(1).max(16),
    startsAt: ConfigurationInstantSchema,
    endsAt: ConfigurationInstantSchema,
    reason: ConfigurationTextSchema,
    approverPersonId: ConfigurationUuidSchema.nullable(),
    purposeGrant: z.boolean(),
    stepUpToken: z.string().min(20).max(4_096).optional(),
  })
  .superRefine((value, context) => {
    if (value.endsAt <= value.startsAt) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'end_must_follow_start',
      });
    }
    if (
      value.actions.some((action) => action === '*' || action.includes('*'))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['actions'],
        message: 'wildcard_action_prohibited',
      });
    }
    if (value.action === 'revoke' && value.grantId === null) {
      context.addIssue({
        code: 'custom',
        path: ['grantId'],
        message: 'revoke_requires_grant',
      });
    }
    if (
      value.purposeGrant &&
      value.actions.some((action) => action === 'grant' || action === 'revoke')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['actions'],
        message: 'purpose_grant_cannot_grant_or_revoke',
      });
    }
    if (
      value.purposeGrant &&
      !AdminPurposeResourceTypeSchema.safeParse(value.resourceType).success
    ) {
      context.addIssue({
        code: 'custom',
        path: ['resourceType'],
        message: 'purpose_grant_target_type_not_allowed',
      });
    }
    if (
      value.purposeGrant &&
      value.actions.some(
        (action) => !AdminPurposeRecoveryActionSchema.safeParse(action).success,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['actions'],
        message: 'purpose_grant_action_not_allowed',
      });
    }
  });

export const Cfg05b04CapabilityActionResponseSchema = z.strictObject({
  grantId: ConfigurationUuidSchema,
  subjectPersonId: ConfigurationUuidSchema,
  capabilityKey: ConfigurationKeySchema,
  resourceType: AdminRegistryCodeSchema,
  resourceId: ConfigurationUuidSchema,
  state: z.enum(['pending', 'active', 'expired', 'revoked']),
  startsAt: ConfigurationInstantSchema,
  endsAt: ConfigurationInstantSchema,
  version: ConfigurationVersionSchema,
  notificationTaskId: ConfigurationUuidSchema.nullable(),
  outboxEventId: ConfigurationUuidSchema,
});

export type Cfg05b04CapabilityActionRequest = z.infer<
  typeof Cfg05b04CapabilityActionRequestSchema
>;
export type Cfg05b04CapabilityActionResponse = z.infer<
  typeof Cfg05b04CapabilityActionResponseSchema
>;
