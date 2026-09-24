import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES,
  Ac209EmailPresenceWindowSchema,
} from '../infra/workflows/ac209-email-presence-contract.ts';
import {
  AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_DATASET,
  AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
  Ac209EmailDatasetsProbeReportSchema,
  Ac209EmailRoutingPresenceReportSchema,
} from '../infra/workflows/ac209-email-routing-presence-contract.ts';

const WORKFLOW_DIRECTORY = resolve(import.meta.dirname, '../infra/workflows');

const MODULE_PATHS = [
  resolve(WORKFLOW_DIRECTORY, 'ac209-email-routing-presence-contract.ts'),
  resolve(WORKFLOW_DIRECTORY, 'ac209-email-routing-presence.ts'),
  // The shared union is declared by the sibling presence contract, so the scan
  // must include the declaring module to compare against it.
  resolve(WORKFLOW_DIRECTORY, 'ac209-email-presence-contract.ts'),
] as const;

const sourceFiles = MODULE_PATHS.map((path) =>
  ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  ),
);

const stringLiterals = (node: ts.Node): readonly string[] => {
  const literals: string[] = [];
  const visit = (current: ts.Node): void => {
    if (ts.isStringLiteral(current)) literals.push(current.text);
    ts.forEachChild(current, visit);
  };
  visit(node);
  return literals;
};

const unionLiterals = (name: string): readonly string[] => {
  let found: readonly string[] = [];
  for (const sourceFile of sourceFiles) {
    const visit = (node: ts.Node): void => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === name)
        found = stringLiterals(node.type);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return found;
};

const schemaEnumLiterals = (schema: {
  toJSONSchema: () => unknown;
}): readonly string[] => {
  const json = schema.toJSONSchema() as {
    readonly properties?: {
      readonly classification?: { readonly enum?: readonly string[] };
    };
  };
  return json.properties?.classification?.enum ?? [];
};

/**
 * `infra/` is outside every tsconfig, so `pnpm type-check` never compiles these
 * modules. This restores a type-level guard for the routing/combined report
 * vocabulary, which would otherwise be free to drift between the report schema
 * enums and the closed codes the probe can carry.
 */
describe('AC209 email datasets probe type safety', () => {
  it('declares the combined schema versions the report actually uses', () => {
    expect(AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION).toBe(
      'ac209-email-datasets-presence-v1',
    );
    expect(AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION).toBe(
      'ac209-email-routing-presence-v1',
    );
    expect(AC209_EMAIL_ROUTING_DATASET).toBe('emailRoutingAdaptive');
  });

  it('keeps the routing classification vocabulary aligned with the shared union', () => {
    const routingSchema = schemaEnumLiterals(
      Ac209EmailRoutingPresenceReportSchema,
    );
    expect(routingSchema.length).toBeGreaterThan(0);
    expect([...routingSchema].sort()).toEqual(
      [...unionLiterals('Ac209EmailPresenceClassification')].sort(),
    );
  });

  it('accepts every closed provider failure code the routing artifact can carry', () => {
    expect(AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES.length).toBeGreaterThan(0);
    for (const code of AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES)
      expect(
        Ac209EmailPresenceWindowSchema.parse({ status: 'unavailable', code }),
      ).toEqual({ status: 'unavailable', code });
  });

  it('rejects a routing or combined report that smuggles a free-text code', () => {
    expect(() =>
      Ac209EmailRoutingPresenceReportSchema.parse({
        schemaVersion: AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision: '5a23155a2296562cd3e3edf5b3b66f8a49c35a17',
        probedAt: '2026-09-24T12:00:00.000Z',
        dataset: AC209_EMAIL_ROUTING_DATASET,
        windows: {
          last24Hours: { status: 'unavailable', code: 'unknown field leaked' },
          last30Days: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
        },
        classification: 'provider_unavailable',
      }),
    ).toThrow();
    expect(() =>
      Ac209EmailDatasetsProbeReportSchema.parse({
        schemaVersion: AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision: '5a23155a2296562cd3e3edf5b3b66f8a49c35a17',
        probedAt: '2026-09-24T12:00:00.000Z',
        sending: {},
        routing: {},
        extra: 'nope',
      }),
    ).toThrow();
  });

  it('requires the combined report to carry both dataset reports', () => {
    const parsed = Ac209EmailDatasetsProbeReportSchema.safeParse({
      schemaVersion: AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: '5a23155a2296562cd3e3edf5b3b66f8a49c35a17',
      probedAt: '2026-09-24T12:00:00.000Z',
      sending: {
        schemaVersion: 'ac209-email-presence-v1',
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision: '5a23155a2296562cd3e3edf5b3b66f8a49c35a17',
        probedAt: '2026-09-24T12:00:00.000Z',
        windows: {
          last24Hours: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
          last30Days: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
        },
        alternateCandidate: { status: 'not_configured' },
        classification: 'provider_unavailable',
      },
    });
    expect(parsed.success).toBe(false);
  });
});
