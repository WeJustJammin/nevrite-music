import { z } from 'zod';

import { RepresentationEdgeResourceSchema } from './representation-resources.ts';
import { NameOwnershipStatementResourceSchema } from './name-treasury-resources.ts';

const collection = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      items: z.array(item).max(50),
      nextCursor: z.string().max(512).nullable(),
      hasMore: z.boolean(),
    })
    .strict();

export const RepresentationCollectionSchema = collection(
  RepresentationEdgeResourceSchema,
);
export const NameStatementCollectionSchema = collection(
  NameOwnershipStatementResourceSchema,
);

export const NameOwnershipStatementCollectionSchema =
  NameStatementCollectionSchema;

export type RepresentationCollection = z.infer<
  typeof RepresentationCollectionSchema
>;
export type NameStatementCollection = z.infer<
  typeof NameStatementCollectionSchema
>;
