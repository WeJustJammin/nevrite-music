import { z } from 'zod';

import { JobStatusSchema } from '../job-status.ts';
import {
  ProfilePortfolioDigestSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioEpkShareStateSchema,
  ProfilePortfolioLayerCodeSchema,
  ProfilePortfolioLayerStateSchema,
} from './enums.ts';
import { FactRefSchema } from './profile-models.ts';
import {
  ProfilePortfolioListMetaSchema,
  ProfilePortfolioRequestMetaSchema,
  PublicProfileFactSchema,
} from './profile-resources.ts';
import { EpkSelectionSchema } from './requests.ts';

const snapshotSummary = z
  .strictObject({
    snapshotId: ProfilePortfolioUuidSchema,
    currentAsOf: ProfilePortfolioInstantSchema,
    createdAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
const epkShareDataShape = {
  id: ProfilePortfolioUuidSchema,
  partyId: ProfilePortfolioUuidSchema,
  recipientLabel: z.string().min(1).max(160),
  purposeCode: ProfilePortfolioRegistryCodeSchema,
  selection: EpkSelectionSchema,
  state: ProfilePortfolioEpkShareStateSchema,
  expiresAt: ProfilePortfolioInstantSchema,
  revokedAt: ProfilePortfolioInstantSchema.nullable().optional(),
  version: ProfilePortfolioVersionSchema,
  createdAt: ProfilePortfolioInstantSchema,
  materialChangeCount: z.number().int().nonnegative().max(1_000_000),
  latestSnapshot: snapshotSummary.nullable().optional(),
} as const;
const epkShareData = z.strictObject(epkShareDataShape).readonly();

export const EpkShareResponseDataSchema = epkShareData;
export const EpkShareResponseSchema = z
  .strictObject({
    data: EpkShareResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export const EpkShareCreateResponseDataSchema = z
  .strictObject({
    ...epkShareDataShape,
    shareToken: z
      .string()
      .min(43)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/u),
  })
  .readonly();
export const EpkShareCreateResponseSchema = z
  .strictObject({
    data: EpkShareCreateResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export const EpkShareListResponseSchema = z
  .strictObject({
    data: z.array(epkShareData).max(50),
    meta: ProfilePortfolioListMetaSchema,
  })
  .readonly();
export type EpkShareResponse = z.infer<typeof EpkShareResponseSchema>;

export const LiveEpkDataSchema = z
  .strictObject({
    shareId: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    purposeCode: ProfilePortfolioRegistryCodeSchema,
    layers: z
      .array(
        z.strictObject({
          code: ProfilePortfolioLayerCodeSchema,
          state: ProfilePortfolioLayerStateSchema,
          facts: z.array(PublicProfileFactSchema).max(50).optional(),
        }),
      )
      .min(1)
      .max(4),
    selectedSourceVersions: z.array(FactRefSchema).max(200),
    currentAsOf: ProfilePortfolioInstantSchema,
    materialChangesPresent: z.boolean(),
  })
  .readonly();
export const LiveEpkResponseSchema = z
  .strictObject({
    data: LiveEpkDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();

export const EpkPdfSnapshotResponseDataSchema = z
  .strictObject({
    snapshotId: ProfilePortfolioUuidSchema,
    shareId: ProfilePortfolioUuidSchema,
    projectionDigest: ProfilePortfolioDigestSchema,
    currentAsOf: ProfilePortfolioInstantSchema,
    sourceVersions: z.array(FactRefSchema).max(200),
    objectAccess: z.strictObject({
      url: z.string().url().max(2_048),
      expiresAt: ProfilePortfolioInstantSchema,
    }),
    accessibilityReport: z.strictObject({ status: z.literal('passed') }),
    createdAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export const EpkPdfSnapshotResponseSchema = z
  .strictObject({
    data: EpkPdfSnapshotResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();

export const ProfilePortfolioJobStatusSchema = JobStatusSchema;
export const ProfilePortfolioLocationSchema = z
  .string()
  .min(1)
  .max(2_048)
  .regex(/^\/api\/v1\/jobs\/[A-Za-z0-9{}_.:-]+$/u);
export type LiveEpkResponse = z.infer<typeof LiveEpkResponseSchema>;
export type EpkPdfSnapshotResponse = z.infer<
  typeof EpkPdfSnapshotResponseSchema
>;
