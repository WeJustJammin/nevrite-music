import { z } from 'zod';

import { ProfilePortfolioRoleCodeSchema } from './primitives.ts';
import {
  ProfilePortfolioRightsBasisSchema,
  ProfilePortfolioSurfaceSchema,
} from './enums.ts';
import {
  FactRefSchema,
  ProfilePortfolioFactRefShape,
  StructuredBlockSchema,
} from './profile-models.ts';
import { ProfilePortfolioMutationHeadersSchema } from './transport.ts';
import {
  PublicProfilePathSchema,
  SectionRevisionPathSchema,
} from './profile-read-requests.ts';
import { ReelItemPathSchema } from './profile-write-paths.ts';

export * from './profile-observation-requests.ts';

export const SectionPutRequestSchema = z
  .strictObject({
    state: z.enum(['draft', 'active']),
    blocks: z.array(StructuredBlockSchema).max(40),
    clientReason: z.string().trim().min(1).max(240),
  })
  .readonly();
export const SectionPutApiRequestSchema = z
  .strictObject({
    path: SectionRevisionPathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: SectionPutRequestSchema,
  })
  .readonly();

const emphasisFilter = z
  .strictObject({
    roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(20),
  })
  .readonly();
export const EmphasisPutRequestSchema = z
  .strictObject({
    surface: ProfilePortfolioSurfaceSchema,
    defaultFilter: emphasisFilter.nullable(),
    orderedRefs: z.array(FactRefSchema).max(100),
  })
  .superRefine((value, context) => {
    const keys = value.orderedRefs.map(
      ({ sourceId, sourceVersion }) => `${sourceId}/${sourceVersion}`,
    );
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: 'custom',
        path: ['orderedRefs'],
        message: 'duplicate_fact_reference',
      });
  })
  .readonly();
export const EmphasisPutApiRequestSchema = z
  .strictObject({
    path: PublicProfilePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: EmphasisPutRequestSchema,
  })
  .readonly();

const creditRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('credit'),
});
const mediaRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('media'),
});
const rightsRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.enum(['media', 'consent']),
});
export const ReelCreateRequestSchema = z
  .strictObject({
    creditRef,
    mediaRef,
    roleCode: ProfilePortfolioRoleCodeSchema,
    rightsBasis: ProfilePortfolioRightsBasisSchema,
    rightsRef,
    order: z.number().int().min(0).max(999),
  })
  .readonly();
export const ReelCreateApiRequestSchema = z
  .strictObject({
    path: PublicProfilePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: ReelCreateRequestSchema,
  })
  .readonly();
export const ReelPutRequestSchema = z
  .strictObject({
    roleCode: ProfilePortfolioRoleCodeSchema,
    rightsBasis: ProfilePortfolioRightsBasisSchema,
    rightsRef,
    order: z.number().int().min(0).max(999),
    desiredState: z.enum(['draft', 'verifying_rights']),
  })
  .readonly();
export const ReelPutApiRequestSchema = z
  .strictObject({
    path: ReelItemPathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: ReelPutRequestSchema,
  })
  .readonly();
export const ReelRemoveRequestSchema = z
  .strictObject({
    reasonCode: z.enum(['controller_unlisted', 'rights_revoked', 'takedown']),
    note: z.string().trim().max(500).optional(),
  })
  .readonly();
export const ReelRemoveApiRequestSchema = z
  .strictObject({
    path: ReelItemPathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: ReelRemoveRequestSchema,
  })
  .readonly();

export type SectionPutRequest = z.infer<typeof SectionPutRequestSchema>;
export type EmphasisPutRequest = z.infer<typeof EmphasisPutRequestSchema>;
export type ReelCreateRequest = z.infer<typeof ReelCreateRequestSchema>;
export type ReelPutRequest = z.infer<typeof ReelPutRequestSchema>;
export type ReelRemoveRequest = z.infer<typeof ReelRemoveRequestSchema>;
