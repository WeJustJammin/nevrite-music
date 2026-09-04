import type { Context } from 'hono';
import { Hono } from 'hono';

import type { ContentSchemaRegistryOperationId } from './types';

export type FeatureVariables = Readonly<{
  requestId: string;
  operationId: ContentSchemaRegistryOperationId;
}>;
export type FeatureApp = Hono<{ Variables: FeatureVariables }>;
export type FeatureContext = Context<{ Variables: FeatureVariables }>;

export const routeIds = {
  typeId: 'contentTypeId',
  versionId: 'versionId',
  blockId: 'blockDefinitionVersionId',
} as const;

export const operations = {
  create: 'CMS-03A-01',
  field: 'CMS-03A-02',
  relation: 'CMS-03A-03',
  activate: 'CMS-03A-04',
  register: 'CMS-03A-05',
  list: 'CMS-03A-06',
  detail: 'CMS-03A-07',
  lifecycle: 'CMS-03A-08',
} as const;

export const statusFor: Readonly<
  Record<ContentSchemaRegistryOperationId, number>
> = {
  'CMS-03A-01': 201,
  'CMS-03A-02': 201,
  'CMS-03A-03': 201,
  'CMS-03A-04': 202,
  'CMS-03A-05': 201,
  'CMS-03A-06': 200,
  'CMS-03A-07': 200,
  'CMS-03A-08': 201,
};
