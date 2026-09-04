import { z } from 'zod';

export const ProfileCommandIdSchema = z.enum(['CMD-01', 'CMD-02']);

export const ProfileCommandPolicySchema = z
  .object({
    commandId: ProfileCommandIdSchema,
    active: z.boolean(),
    transport: z.literal('protected'),
    httpExposure: z.literal(false),
    requestSchema: z.string().min(1),
    successSchema: z.string().min(1),
  })
  .strict()
  .readonly();

const activeCommandIds = new Set(['CMD-01']);

export const ProfileCommandPolicyRegistrySchema = z
  .array(ProfileCommandPolicySchema)
  .length(2)
  .superRefine((values, context) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value.commandId))
        context.addIssue({
          code: 'custom',
          path: [index, 'commandId'],
          message: 'duplicate_command',
        });
      if (value.active !== activeCommandIds.has(value.commandId))
        context.addIssue({
          code: 'custom',
          path: [index, 'active'],
          message: 'active_state_mismatch',
        });
      seen.add(value.commandId);
    });
  })
  .readonly();

export const profileCommandPolicies = [
  {
    commandId: 'CMD-01',
    active: true,
    transport: 'protected',
    httpExposure: false,
    requestSchema: 'CreateShadowByReferenceRequestSchema',
    successSchema: 'ShadowResourceSchema',
  },
  {
    commandId: 'CMD-02',
    active: false,
    transport: 'protected',
    httpExposure: false,
    requestSchema: 'RecordOwnershipCaseOutcomeRequestSchema',
    successSchema: 'OutcomeReceiptSchema',
  },
] as const satisfies readonly z.infer<typeof ProfileCommandPolicySchema>[];

export type ProfileCommandPolicy = z.infer<typeof ProfileCommandPolicySchema>;
