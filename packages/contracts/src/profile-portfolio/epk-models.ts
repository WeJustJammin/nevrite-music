import { z } from 'zod';

import { JsonValueSchema } from '../api-error.ts';
import {
  ProfilePortfolioDateSchema,
  ProfilePortfolioDigestSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioEpkPdfStateSchema,
  ProfilePortfolioEpkShareStateSchema,
} from './enums.ts';
import { FactRefSchema } from './profile-models.ts';

const digestBytes = z
  .string()
  .min(1)
  .max(4_096)
  .regex(/^[A-Za-z0-9+/=_-]+$/u, 'digest_invalid');
const selectionRefs = z.array(FactRefSchema).max(200);

export const EpkShareSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    creatorPersonId: ProfilePortfolioUuidSchema,
    actingPartyId: ProfilePortfolioUuidSchema,
    tokenHash: ProfilePortfolioDigestSchema,
    tokenKeyVersion: z.number().int().positive().max(32),
    recipientLabelCiphertext: digestBytes,
    recipientLabelHash: ProfilePortfolioDigestSchema,
    purposeCode: ProfilePortfolioRegistryCodeSchema,
    selectedFactRefs: selectionRefs,
    consentRefs: z.array(FactRefSchema).max(120),
    approvedDisclosureRefs: z.array(FactRefSchema).max(20),
    selectionDigest: ProfilePortfolioDigestSchema,
    state: ProfilePortfolioEpkShareStateSchema,
    expiresAt: ProfilePortfolioInstantSchema,
    revokedAt: ProfilePortfolioInstantSchema.nullable(),
    revocationReason: ProfilePortfolioRegistryCodeSchema.nullable(),
    version: ProfilePortfolioVersionSchema,
    materialChangeCount: z.number().int().nonnegative().max(1_000_000),
    createdAt: ProfilePortfolioInstantSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .superRefine((value, context) => {
    if ((value.state === 'revoked') !== (value.revokedAt !== null))
      context.addIssue({
        code: 'custom',
        path: ['revokedAt'],
        message: 'revocation_timestamp_mismatch',
      });
    if (value.state !== 'revoked' && value.revocationReason !== null)
      context.addIssue({
        code: 'custom',
        path: ['revocationReason'],
        message: 'revocation_reason_forbidden',
      });
  })
  .readonly();
export type EpkShare = z.infer<typeof EpkShareSchema>;

export const EpkOpenEventSchema = z
  .strictObject({
    epkShareId: ProfilePortfolioUuidSchema,
    openedDay: ProfilePortfolioDateSchema,
    firstOpenedAt: ProfilePortfolioInstantSchema,
    lastOpenedAt: ProfilePortfolioInstantSchema,
    openCount: z.number().int().positive().max(1_000_000_000),
  })
  .superRefine((value, context) => {
    if (value.lastOpenedAt < value.firstOpenedAt)
      context.addIssue({
        code: 'custom',
        path: ['lastOpenedAt'],
        message: 'open_time_order_invalid',
      });
  })
  .readonly();
export type EpkOpenEvent = z.infer<typeof EpkOpenEventSchema>;

export const EpkPdfSnapshotSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    epkShareId: ProfilePortfolioUuidSchema,
    projectionDigest: ProfilePortfolioDigestSchema,
    sourceVersions: selectionRefs,
    objectId: ProfilePortfolioUuidSchema.nullable(),
    state: ProfilePortfolioEpkPdfStateSchema,
    accessibilityReport: JsonValueSchema.nullable(),
    currentAsOf: ProfilePortfolioInstantSchema,
    createdAt: ProfilePortfolioInstantSchema,
    completedAt: ProfilePortfolioInstantSchema.nullable(),
    failureCode: ProfilePortfolioRegistryCodeSchema.nullable(),
  })
  .readonly();
export type EpkPdfSnapshot = z.infer<typeof EpkPdfSnapshotSchema>;
