import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from '../../infra/generate-openapi.mjs';

type JsonObject = Record<string, unknown>;

const object = (value: unknown): JsonObject => {
  expect(value).toBeTypeOf('object');
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as JsonObject;
};

describe('slice 05 upload-completion OpenAPI contract', () => {
  it('publishes the canonical path, headers, body, and asynchronous response', () => {
    const document = buildOpenApiDocument();
    const paths = object(document.paths);
    const path = object(
      paths['/api/v1/upload-intents/{uploadIntentId}/complete'],
    );
    const operation = object(path.post);
    const parameters = operation.parameters as readonly unknown[];
    const parameterNames = parameters.map(
      (parameter) => object(parameter).name,
    );

    expect(operation.operationId).toBe('uploadIntentComplete');
    expect(parameterNames).toEqual([
      'uploadIntentId',
      'Idempotency-Key',
      'If-Match',
    ]);

    const requestBody = object(operation.requestBody);
    const content = object(requestBody.content);
    const media = object(content['application/json']);
    const schema = object(media.schema);
    const properties = object(schema.properties);

    expect(Object.keys(properties).sort()).toEqual([
      'byteSize',
      'checksum',
      'mediaType',
    ]);

    const responses = object(operation.responses);
    expect(responses).toHaveProperty('202');
    expect(object(responses['202']).headers).toEqual(
      expect.objectContaining({
        ETag: expect.any(Object),
        Location: expect.any(Object),
      }),
    );
  });
});
