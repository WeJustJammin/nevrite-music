import { z } from 'zod';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from './operational-release-evidence-common.ts';

/** Approved Phase 2 evidence policy; never grants runtime authority. */
export const CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS = {
  entitled_read: 'authorized_access',
  owner_full: 'authorized_access',
  guardian_mandate: 'denied_no_disclosure',
  junior_restricted: 'denied_no_disclosure',
  business_mandate: 'denied_no_disclosure',
  staff_case_scoped: 'authorized_access',
  admin_step_up: 'authorized_access',
  forbidden_hidden: 'denied_no_disclosure',
  disabled_prerequisite: 'disabled_no_mutation',
} as const;

export const HostedE2eRoleResultSchema = z
  .object({
    role: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
    assertion: z.enum([
      'authorized_access',
      'denied_no_disclosure',
      'disabled_no_mutation',
    ]),
    outcome: z.literal('passed'),
    durationMs: z.number().finite().int().nonnegative().max(86_400_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.assertion !==
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS[value.role]
    )
      context.addIssue({
        code: 'custom',
        path: ['assertion'],
        message: 'Hosted role assertion must match the approved Phase 2 policy',
      });
  })
  .readonly();
