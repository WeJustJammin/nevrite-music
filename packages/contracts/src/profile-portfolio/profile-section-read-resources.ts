import { z } from 'zod';

import {
  ProfilePortfolioDateSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioLayerCodeSchema,
  ProfilePortfolioLayerStateSchema,
  ProfilePortfolioProvenanceStateSchema,
  ProfilePortfolioSourceTypeSchema,
} from './enums.ts';
import { StructuredBlockSchema } from './profile-models.ts';
import {
  ProfilePortfolioListMetaSchema,
  ProfilePortfolioRequestMetaSchema,
} from './profile-read-meta.ts';

export const PublicProfileFactSchema = z
  .strictObject({
    sourceType: ProfilePortfolioSourceTypeSchema,
    sourceId: ProfilePortfolioUuidSchema,
    sourceVersion: ProfilePortfolioVersionSchema,
    provenanceState: ProfilePortfolioProvenanceStateSchema,
    evidenceClass: ProfilePortfolioRegistryCodeSchema,
    evidenceCount: z.number().int().min(0).max(10_000),
    occurredOn: ProfilePortfolioDateSchema.nullable().optional(),
    roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(32).optional(),
  })
  .readonly();
export type PublicProfileFact = z.infer<typeof PublicProfileFactSchema>;

export const PublicProfileLayerSchema = z
  .strictObject({
    code: ProfilePortfolioLayerCodeSchema,
    state: ProfilePortfolioLayerStateSchema,
    facts: z.array(PublicProfileFactSchema).max(50).optional(),
  })
  .superRefine((value, context) => {
    if (value.state !== 'ready' && value.facts !== undefined)
      context.addIssue({
        code: 'custom',
        path: ['facts'],
        message: 'non_ready_facts_forbidden',
      });
  })
  .readonly();
export type PublicProfileLayer = z.infer<typeof PublicProfileLayerSchema>;

export const PublicProfileDataSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    projectionVersion: ProfilePortfolioVersionSchema,
    cacheKey: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9:_.-]+$/u),
    layers: z.array(PublicProfileLayerSchema).min(1).max(4),
    generatedAt: ProfilePortfolioInstantSchema,
  })
  .superRefine((value, context) => {
    const order = ['header', 'now', 'record', 'detail'];
    const indexes = value.layers.map(({ code }) => order.indexOf(code));
    if (new Set(indexes).size !== indexes.length)
      context.addIssue({
        code: 'custom',
        path: ['layers'],
        message: 'duplicate_layer',
      });
    if (
      indexes.some((index, position) => index < (indexes[position - 1] ?? -1))
    )
      context.addIssue({
        code: 'custom',
        path: ['layers'],
        message: 'layer_order_invalid',
      });
  })
  .readonly();
export const PublicProfileResponseSchema = z
  .strictObject({
    data: PublicProfileDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export type PublicProfileResponse = z.infer<typeof PublicProfileResponseSchema>;

export const SectionRevisionResponseDataSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    sectionCode: z.enum(['now', 'biography', 'services', 'availability']),
    blocks: z.array(StructuredBlockSchema).max(40),
    authorPersonId: ProfilePortfolioUuidSchema,
    actingPartyId: ProfilePortfolioUuidSchema,
    state: z.enum(['draft', 'active', 'archived']),
    version: ProfilePortfolioVersionSchema,
    createdAt: ProfilePortfolioInstantSchema,
    activatedAt: ProfilePortfolioInstantSchema.nullable().optional(),
  })
  .readonly();
export const SectionRevisionResponseSchema = z
  .strictObject({
    data: SectionRevisionResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export const SectionRevisionListResponseSchema = z
  .strictObject({
    data: z.array(SectionRevisionResponseDataSchema).max(50),
    meta: ProfilePortfolioListMetaSchema,
  })
  .readonly();
export type SectionRevisionResponse = z.infer<
  typeof SectionRevisionResponseSchema
>;
