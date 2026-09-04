import { z } from 'zod';

import {
  CmsCapabilityKeySchema,
  CmsHashSchema,
  CmsVersionSchema,
} from './primitives.ts';

export const WorkflowPolicyEvidenceSchema = z
  .strictObject({
    key: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/u),
    version: CmsVersionSchema,
    policyHash: CmsHashSchema,
    riskClass: z.enum(['ordinary', 'protected']),
    requiredDecisionCount: z.number().int().min(1).max(8),
    requiredCapabilities: z.array(CmsCapabilityKeySchema).max(16).readonly(),
    approvalEvidenceHash: CmsHashSchema,
  })
  .superRefine((value, context) => {
    if (
      value.riskClass === 'protected' &&
      (value.requiredDecisionCount < 2 ||
        value.requiredCapabilities.length === 0)
    )
      context.addIssue({
        code: 'custom',
        path: ['requiredDecisionCount'],
        message: 'protected_policy_requires_dual_named_approval',
      });
  })
  .readonly();
