import { z } from 'zod';

import {
  Ac265SessionBrokerAuthorizeResultSchema,
  Ac265SessionBrokerResolveResultSchema,
  Ac265SessionBrokerTeardownResultSchema,
} from './operational-release-evidence-hosted-session-broker-control-results.ts';

export const Ac265SessionBrokerConflictSchema = z
  .object({ status: z.literal('conflict') })
  .strict()
  .readonly();

export const Ac265SessionBrokerAuthorizeResponseSchema = z
  .union([
    Ac265SessionBrokerAuthorizeResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export const Ac265SessionBrokerResolveResponseSchema = z
  .union([
    Ac265SessionBrokerResolveResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export const Ac265SessionBrokerTeardownResponseSchema = z
  .union([
    Ac265SessionBrokerTeardownResultSchema,
    Ac265SessionBrokerConflictSchema,
  ])
  .readonly();

export type Ac265SessionBrokerConflict = z.infer<
  typeof Ac265SessionBrokerConflictSchema
>;
