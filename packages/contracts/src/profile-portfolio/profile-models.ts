import { z } from 'zod';

import {
  ProfilePortfolioInstantSchema,
  ProfilePortfolioSafeShortTextSchema,
  ProfilePortfolioSafeTextSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioSectionCodeSchema,
  ProfilePortfolioSectionStateSchema,
} from './enums.ts';

export const ProfilePortfolioFactRefShape = {
  sourceType: z.enum([
    'credit',
    'attendance',
    'party',
    'media',
    'consent',
    'asserted_section',
  ]),
  sourceId: ProfilePortfolioUuidSchema,
  sourceVersion: ProfilePortfolioVersionSchema,
} as const;
export const FactRefSchema = z
  .strictObject(ProfilePortfolioFactRefShape)
  .readonly();
export type FactRef = z.infer<typeof FactRefSchema>;

export const StructuredBlockSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('paragraph'),
    text: ProfilePortfolioSafeTextSchema,
  }),
  z.strictObject({
    kind: z.literal('heading'),
    level: z.enum(['2', '3']),
    text: ProfilePortfolioSafeShortTextSchema,
  }),
  z.strictObject({
    kind: z.literal('list'),
    items: z.array(ProfilePortfolioSafeShortTextSchema).min(1).max(20),
  }),
]);
export type StructuredBlock = z.infer<typeof StructuredBlockSchema>;

export const ProfileSectionRevisionSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    sectionCode: ProfilePortfolioSectionCodeSchema,
    blocks: z.array(StructuredBlockSchema).max(40),
    authorPersonId: ProfilePortfolioUuidSchema,
    actingPartyId: ProfilePortfolioUuidSchema,
    state: ProfilePortfolioSectionStateSchema,
    version: ProfilePortfolioVersionSchema,
    clientReason: ProfilePortfolioSafeTextSchema.max(240),
    createdAt: ProfilePortfolioInstantSchema,
    activatedAt: ProfilePortfolioInstantSchema.nullable(),
    archivedAt: ProfilePortfolioInstantSchema.nullable(),
  })
  .superRefine((value, context) => {
    if (value.state === 'draft' && value.activatedAt !== null)
      context.addIssue({
        code: 'custom',
        path: ['activatedAt'],
        message: 'draft_activation_forbidden',
      });
    if (value.state === 'active' && value.activatedAt === null)
      context.addIssue({
        code: 'custom',
        path: ['activatedAt'],
        message: 'active_activation_required',
      });
    if (value.state !== 'archived' && value.archivedAt !== null)
      context.addIssue({
        code: 'custom',
        path: ['archivedAt'],
        message: 'archive_timestamp_invalid',
      });
    if (value.state === 'archived' && value.archivedAt === null)
      context.addIssue({
        code: 'custom',
        path: ['archivedAt'],
        message: 'archive_timestamp_required',
      });
  })
  .readonly();
export type ProfileSectionRevision = z.infer<
  typeof ProfileSectionRevisionSchema
>;

export const ProfileSectionHeadSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    sectionCode: ProfilePortfolioSectionCodeSchema,
    activeRevisionId: ProfilePortfolioUuidSchema.nullable(),
    latestRevisionId: ProfilePortfolioUuidSchema.nullable(),
    version: ProfilePortfolioVersionSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export type ProfileSectionHead = z.infer<typeof ProfileSectionHeadSchema>;
