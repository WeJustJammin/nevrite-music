import { assembleAc265HostedE2eReportV3 } from '../../infra/workflows/ac265-hosted-e2e-report-assembler.ts';
import type { ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  createProductionFixture,
  mutateProductionReport,
  redactionProvenanceFor,
} from './ac265-retained-report-production.test-support.ts';

export const PROHIBITED = /redaction|prohibited|invalid|sensitive/i;

/**
 * Assembles the retained report from the production fixture and pairs it with
 * the provenance the redaction boundary expects, so every case reasons about
 * the real assembled value rather than a hand-built report.
 */
export const assembleProductionReport = (
  identityOverrides: Parameters<typeof createProductionFixture>[0] = {},
) => {
  const production = createProductionFixture(identityOverrides);
  const report = assembleAc265HostedE2eReportV3({
    runnerContractBytes: production.fixture.contractBytes,
    resolver: production.context.resolver,
    startedAt: production.fixture.report.startedAt,
    completedAt: production.fixture.report.completedAt,
    receiptRefs: production.receiptRefs,
  });
  return {
    production,
    report,
    provenance: redactionProvenanceFor(production),
  };
};

export const stringLeafPaths = (
  value: unknown,
  path = '',
): readonly (readonly [string, string])[] => {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((entry, index) =>
      stringLeafPaths(entry, `${path}/${index}`),
    );
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).flatMap(([key, entry]) =>
      stringLeafPaths(entry, `${path}/${key}`),
    );
  return [];
};

export const mutateStringLeaf = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  targetPath: string,
  replacement: string,
): ContentSchemaRegistryHostedE2eReportV3 => {
  const segments = targetPath.split('/').slice(1);
  return mutateProductionReport(report, (copy) => {
    let cursor: Record<string, unknown> | unknown[] = copy as Record<
      string,
      unknown
    >;
    for (const segment of segments.slice(0, -1)) {
      const next = Array.isArray(cursor)
        ? cursor[Number(segment)]
        : cursor[segment];
      cursor = next as Record<string, unknown> | unknown[];
    }
    const last = segments.at(-1) as string;
    if (Array.isArray(cursor)) cursor[Number(last)] = replacement;
    else cursor[last] = replacement;
  });
};
