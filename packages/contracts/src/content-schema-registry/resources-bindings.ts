import { z } from 'zod';

import { CmsDefinitionStateSchema } from './models.ts';
import {
  CmsCapabilityKeySchema,
  CmsUuidSchema,
  CmsVersionSchema,
} from './primitives.ts';

export const TemplateBindingResourceSchema = z
  .strictObject({
    resourceKind: z.literal('template_binding'),
    id: CmsUuidSchema,
    contentTypeVersionId: CmsUuidSchema,
    templateVersionId: CmsUuidSchema,
    position: z.number().int().nonnegative().max(31),
    version: CmsVersionSchema,
    state: CmsDefinitionStateSchema,
  })
  .readonly();

export const CapabilityBindingResourceSchema = z
  .strictObject({
    resourceKind: z.literal('capability_binding'),
    id: CmsUuidSchema,
    contentTypeVersionId: CmsUuidSchema,
    capabilityKey: CmsCapabilityKeySchema,
    capabilityVersion: CmsVersionSchema,
    version: CmsVersionSchema,
    state: CmsDefinitionStateSchema,
  })
  .readonly();
