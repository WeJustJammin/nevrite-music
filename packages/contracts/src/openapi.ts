import { z } from 'zod';

import { ApiErrorSchema } from './api-error.ts';
import { JobIdPathSchema, JobStatusSchema } from './job-status.ts';
import {
  DiagnosticResponseSchema,
  HealthResponseSchema,
  ReadinessResponseSchema,
} from './operational.ts';
import { RequestContextSchema } from './request-context.ts';
import {
  UploadAdmissionRequestSchema,
  UploadIntentResourceSchema,
} from './upload-admission.ts';
import { UploadCompletionRequestSchema } from './upload-completion.ts';

const schemaContracts = {
  ApiErrorSchema,
  DiagnosticResponseSchema,
  HealthResponseSchema,
  JobIdPathSchema,
  JobStatusSchema,
  ReadinessResponseSchema,
  RequestContextSchema,
  UploadAdmissionRequestSchema,
  UploadCompletionRequestSchema,
  UploadIntentResourceSchema,
} as const;

const schemaIo = {
  UploadAdmissionRequestSchema: 'input',
  UploadCompletionRequestSchema: 'input',
} as const satisfies Partial<
  Record<keyof typeof schemaContracts, 'input' | 'output'>
>;

const schemaComponentName = (schemaName: string): string =>
  schemaName.slice(0, -'Schema'.length);

const schemaForName = (schemaName: string): z.ZodTypeAny => {
  const schema =
    schemaContracts[schemaName as keyof typeof schemaContracts] ?? undefined;
  if (schema === undefined) {
    throw new Error(
      `OpenAPI schema ${schemaName} is absent from runtime contracts.`,
    );
  }
  return schema;
};

export const getOpenApiSchemaJson = (schemaName: string): unknown =>
  z.toJSONSchema(schemaForName(schemaName), {
    io:
      schemaIo[schemaName as keyof typeof schemaIo] === 'input'
        ? 'input'
        : 'output',
    target: 'draft-7',
    unrepresentable: 'throw',
  });

export const getOpenApiSchemaReference = (
  schemaName: string,
): Readonly<{ $ref: string }> => {
  schemaForName(schemaName);
  return {
    $ref: `#/components/schemas/${schemaComponentName(schemaName)}`,
  };
};

export const getOpenApiComponentSchemas = (): Readonly<
  Record<string, unknown>
> =>
  Object.fromEntries(
    Object.keys(schemaContracts).map((schemaName) => [
      schemaComponentName(schemaName),
      getOpenApiSchemaJson(schemaName),
    ]),
  );
