import {
  BlockLifecycleAdvanceRequestSchema,
  BlockRegistrationRequestSchema,
  ContentTypeDraftRequestSchema,
  FieldSchemaChangeRequestSchema,
  RelationBindingRequestSchema,
  SchemaActivationRequestSchema,
  type ContentTypeDraftRequest,
  type FieldSchemaChangeRequest,
  type RelationBindingRequest,
  type SchemaActivationRequest,
} from './contracts';

export type ParsedHumanBody =
  | ContentTypeDraftRequest
  | FieldSchemaChangeRequest
  | RelationBindingRequest
  | SchemaActivationRequest;

export const schemaForHumanOperation = (
  operationId: 'CMS-03A-01' | 'CMS-03A-02' | 'CMS-03A-03' | 'CMS-03A-04',
) => {
  switch (operationId) {
    case 'CMS-03A-01':
      return ContentTypeDraftRequestSchema;
    case 'CMS-03A-02':
      return FieldSchemaChangeRequestSchema;
    case 'CMS-03A-03':
      return RelationBindingRequestSchema;
    case 'CMS-03A-04':
      return SchemaActivationRequestSchema;
  }
};

export const schemaForReleaseOperation = (
  operationId: 'CMS-03A-05' | 'CMS-03A-08',
) =>
  operationId === 'CMS-03A-05'
    ? BlockRegistrationRequestSchema
    : BlockLifecycleAdvanceRequestSchema;

export const humanBodySchemas = {
  'CMS-03A-01': ContentTypeDraftRequestSchema,
  'CMS-03A-02': FieldSchemaChangeRequestSchema,
  'CMS-03A-03': RelationBindingRequestSchema,
  'CMS-03A-04': SchemaActivationRequestSchema,
} as const;
