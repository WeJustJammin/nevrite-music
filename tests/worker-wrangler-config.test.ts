import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type JsonObject = Record<string, unknown>;

const parseJsonc = (source: string): JsonObject =>
  JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/^\s*\/\/.*$/gmu, '')
      .replace(/,\s*([}\]])/gu, '$1'),
  ) as JsonObject;

const readConfig = (): JsonObject =>
  parseJsonc(
    readFileSync(
      new URL('../apps/worker/wrangler.jsonc', import.meta.url),
      'utf8',
    ),
  );

const asObject = (value: unknown, label: string): JsonObject => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as JsonObject;
};

const environment = (config: JsonObject, name: string): JsonObject =>
  asObject(asObject(config.env, 'env')[name], `env.${name}`);

describe('Worker Wrangler queue and schedule contract', () => {
  it('declares production, local, and staging queue bindings independently', () => {
    const config = readConfig();
    const expectedConsumer = {
      queue: 'platform-jobs',
      max_retries: 3,
      dead_letter_queue: 'platform-jobs-dlq',
    };

    const environments = [
      { label: 'production', value: config },
      { label: 'local', value: environment(config, 'local') },
      { label: 'staging', value: environment(config, 'staging') },
    ];

    for (const { label, value } of environments) {
      const queues = asObject(value.queues, `${label}.queues`);
      expect(queues.producers).toEqual([
        expect.objectContaining({
          binding: 'PLATFORM_JOBS',
          queue: 'platform-jobs',
        }),
      ]);
      expect(queues.consumers).toEqual([expectedConsumer]);
    }
  });

  it('schedules the outbox sweep once per minute in every environment', () => {
    const config = readConfig();

    const environments = [
      { label: 'production', value: config },
      { label: 'local', value: environment(config, 'local') },
      { label: 'staging', value: environment(config, 'staging') },
    ];

    for (const { value } of environments) {
      expect(value.triggers).toEqual({
        crons: ['* * * * *'],
      });
    }
  });

  it('keeps native observability and the approved Cloudflare-only boundary', () => {
    const config = readConfig();

    expect(config.observability).toEqual({
      enabled: true,
      head_sampling_rate: 0.1,
    });
    expect(config.env).not.toHaveProperty('production');
    expect(JSON.stringify(config).toLowerCase()).not.toContain('sentry');
  });
});
