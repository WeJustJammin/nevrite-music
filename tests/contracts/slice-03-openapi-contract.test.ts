import { readFileSync } from 'node:fs';

import {
  getOpenApiComponentSchemas,
  platformRegistrySet,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

describe('Slice 03 OpenAPI contract', () => {
  it('publishes JobStatus from the runtime Zod authority', () => {
    expect(getOpenApiComponentSchemas()).toHaveProperty('JobStatus');
  });

  it('declares the complete job-read response matrix', () => {
    const document = JSON.parse(
      readFileSync('docs/openapi/openapi.json', 'utf8'),
    ) as {
      paths: Record<
        string,
        {
          get: {
            operationId: string;
            responses: Record<
              string,
              { content?: unknown; headers?: Record<string, unknown> }
            >;
            [key: string]: unknown;
          };
        }
      >;
    };
    const operation = document.paths['/api/v1/jobs/{jobId}']?.get;
    const registry = platformRegistrySet.routes.find(
      ({ operationId }) => operationId === 'jobStatusRead',
    );
    expect(registry).toBeDefined();
    expect(operation?.operationId).toBe('jobStatusRead');
    expect(operation).toMatchObject({
      operationId: registry?.operationId,
      deprecated: registry?.deprecated,
      'x-auth-class': registry?.authClass,
      'x-cache-class': registry?.cacheClass,
      'x-timeout-ms': registry?.timeoutMs,
      'x-rate-class': registry?.rateClass,
      'x-slo-tier': registry?.sloTier,
      'x-criticality': registry?.criticality,
      'x-owner': registry?.owner,
      'x-runbook': registry?.runbook,
      'x-error-schemas': registry?.errorSchemas,
      'x-bola-test': registry?.bolaTest,
    });
    expect(Object.keys(operation?.responses ?? {})).toEqual([
      '200',
      '304',
      '400',
      '401',
      '404',
      '429',
      '500',
      '503',
    ]);
    expect(operation?.responses['304']).not.toHaveProperty('content');
    expect(operation?.responses['200']?.headers).toHaveProperty('ETag');
    expect(operation?.responses['429']?.headers).toHaveProperty('Retry-After');
  });
});
