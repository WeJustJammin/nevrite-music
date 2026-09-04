import { z } from 'zod';

import {
  ProfileRoutePolicySchema,
  type ProfileOperationId,
} from './route-policy.ts';

const activeOperationIds = new Set<ProfileOperationId>([
  'PRF-API-01',
  'PRF-API-02',
  'PRF-API-03',
  'PRF-API-04',
  'PRF-API-05',
  'PRF-API-06',
  'PRF-API-07',
  'PRF-API-08',
]);

export const ProfileRoutePolicyRegistrySchema = z
  .array(ProfileRoutePolicySchema)
  .length(16)
  .superRefine((values, context) => {
    const ids = new Set<string>();
    const paths = new Set<string>();
    values.forEach((value, index) => {
      if (ids.has(value.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'operationId'],
          message: 'duplicate_operation',
        });
      if (paths.has(`${value.method} ${value.path}`))
        context.addIssue({
          code: 'custom',
          path: [index, 'path'],
          message: 'duplicate_route',
        });
      ids.add(value.operationId);
      paths.add(`${value.method} ${value.path}`);
      if (value.active !== activeOperationIds.has(value.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'active'],
          message: 'active_state_mismatch',
        });
    });
  })
  .readonly();

export type ProfileRoutePolicyRegistry = z.infer<
  typeof ProfileRoutePolicyRegistrySchema
>;
