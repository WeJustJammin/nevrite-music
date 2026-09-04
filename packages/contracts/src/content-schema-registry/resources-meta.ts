import {
  CmsHashSchema,
  CmsInstantSchema,
  CmsUuidSchema,
  CmsVersionSchema,
} from './primitives.ts';

export const resourceMetaShape = {
  id: CmsUuidSchema,
  version: CmsVersionSchema,
  contentHash: CmsHashSchema,
  createdAt: CmsInstantSchema,
  updatedAt: CmsInstantSchema,
} as const;
