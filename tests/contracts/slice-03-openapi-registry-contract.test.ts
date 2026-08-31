import { createRegistrySet, platformRegistrySet } from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from '../../infra/generate-openapi.mjs';

type Schema = { $ref: string } | { oneOf: readonly { $ref: string }[] };
type Response = {
  content?: { 'application/json'?: { schema?: Schema } };
};
type Operation = {
  parameters?: readonly {
    name: string;
    in: string;
    required: boolean;
    schema: Record<string, unknown>;
  }[];
  responses: Record<string, Response>;
};
type OpenApiDocument = {
  paths: Record<string, Record<string, Operation>>;
};

const registryWithRoute = (
  operationId: string,
  changes: Record<string, unknown>,
) =>
  createRegistrySet({
    ...platformRegistrySet,
    routes: platformRegistrySet.routes.map((route) =>
      route.operationId === operationId ? { ...route, ...changes } : route,
    ),
  });

const schemaRef = (response: Response): string | undefined => {
  const schema = response.content?.['application/json']?.schema;
  return schema && '$ref' in schema ? schema.$ref : undefined;
};

describe('Slice 03 OpenAPI registry authority', () => {
  it('derives request, success, and error schemas from route declarations', () => {
    const registry = registryWithRoute('jobStatusRead', {
      successSchema: 'DiagnosticResponseSchema',
      errorSchemas: ['DiagnosticResponseSchema'],
    });
    const document = buildOpenApiDocument(registry) as OpenApiDocument;
    const operation = document.paths['/api/v1/jobs/{jobId}']?.get;

    expect(operation?.parameters).toEqual([
      {
        name: 'jobId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          pattern:
            '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        },
      },
    ]);
    expect(schemaRef(operation?.responses['200'] ?? {})).toBe(
      '#/components/schemas/DiagnosticResponse',
    );
    expect(schemaRef(operation?.responses['400'] ?? {})).toBe(
      '#/components/schemas/DiagnosticResponse',
    );
  });

  it('rejects a registry schema name that has no runtime contract', () => {
    const registry = registryWithRoute('healthRead', {
      successSchema: 'MissingResponseSchema',
    });

    expect(() => buildOpenApiDocument(registry)).toThrow(
      'MissingResponseSchema',
    );
  });

  it('rejects an unbound request schema before emitting a path operation', () => {
    const registry = registryWithRoute('jobStatusRead', {
      requestSchema: 'MissingRequestSchema',
    });

    expect(() => buildOpenApiDocument(registry)).toThrow(
      'MissingRequestSchema',
    );
  });

  it('uses registry method and path declarations for operation locations', () => {
    const registry = registryWithRoute('healthRead', {
      method: 'POST',
      path: '/api/v1/health-v2',
    });
    const document = buildOpenApiDocument(registry) as OpenApiDocument;

    expect(document.paths['/api/v1/health-v2']?.post?.operationId).toBe(
      'healthRead',
    );
    expect(document.paths['/api/v1/health']).toBeUndefined();
  });

  it('publishes only the canonical job operation and documents malformed paths as transport validation', () => {
    const document = buildOpenApiDocument(
      platformRegistrySet,
    ) as OpenApiDocument;
    const jobPaths = Object.keys(document.paths).filter(
      (path) => path === '/api/v1/jobs' || path.startsWith('/api/v1/jobs/'),
    );

    expect(jobPaths).toEqual(['/api/v1/jobs/{jobId}']);
    expect(document.paths['/api/v1/jobs']).toBeUndefined();
    expect(document.paths['/api/v1/jobs/{jobId}']?.get.parameters).toEqual([
      expect.objectContaining({ name: 'jobId', in: 'path', required: true }),
    ]);
  });
});
