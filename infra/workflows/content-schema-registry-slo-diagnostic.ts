import { SloDiagnosticCountResponseSchema } from '../../packages/contracts/src/content-schema-registry/operational-slo-diagnostic.ts';

import { requestJson } from './content-schema-registry-slo-provider-http.ts';
import {
  CLOUDFLARE_API_ROOT,
  WORKERS_DATASET,
  parseUtcWindow,
  validateCommonInput,
  validateSourceSha,
  type QueryWorkersObservabilityEventsInput,
} from './content-schema-registry-slo-provider-types.ts';

/** Provider event counts are diagnostic hints, never qualifying SLO samples. */
export const diagnoseSloCounts = async (
  input: QueryWorkersObservabilityEventsInput,
) => {
  validateCommonInput(input);
  validateSourceSha(input.sourceSha);
  const timeframe = parseUtcWindow(input);
  const environment = {
    key: 'environment',
    operation: 'eq',
    type: 'string',
    value: 'production',
  };
  const release = {
    key: 'release',
    operation: 'eq',
    type: 'string',
    value: input.sourceSha,
  };
  const queries = [
    { name: 'dataset', filters: [], registry: false },
    { name: 'registry', filters: [], registry: true },
    { name: 'productionRegistry', filters: [environment], registry: true },
    {
      name: 'releaseRegistry',
      filters: [environment, release],
      registry: true,
    },
  ] as const;
  const counts: Record<string, number | null> = {};
  for (const query of queries) {
    const payload = await requestJson(
      input.fetchImpl ?? fetch,
      `${CLOUDFLARE_API_ROOT}/accounts/${input.accountId}/workers/observability/telemetry/query`,
      input.token,
      {
        limit: 1,
        offsetDirection: 'next',
        view: 'events',
        queryId: `ac211-diagnostic-${query.name}`,
        timeframe,
        parameters: {
          datasets: [WORKERS_DATASET],
          filterCombination: 'and',
          filters: [...query.filters],
          ...(query.registry
            ? { needle: { isRegex: false, value: 'cms.registry.' } }
            : {}),
        },
      },
      10_000,
      2 * 1024 * 1024,
    );
    const result = SloDiagnosticCountResponseSchema.safeParse(payload);
    if (!result.success) throw new Error('AC211 diagnostic count unavailable');
    counts[query.name] = result.data.result.events?.count ?? null;
  }
  return { diagnosticOnly: true as const, counts };
};
