import { diagnoseQueueAnalyticsShape } from './content-schema-registry-slo-queue-shape-diagnostic.ts';

const read = (name) => process.env[name] ?? '';

try {
  const result = await diagnoseQueueAnalyticsShape({
    accountId: read('CLOUDFLARE_ACCOUNT_ID'),
    queryId: read('QUERY_ID'),
    queueId: read('CLOUDFLARE_PLATFORM_QUEUE_ID'),
    token: read('CLOUDFLARE_OBSERVABILITY_API_TOKEN'),
    window: {
      endedAt: read('WINDOW_END'),
      startedAt: read('WINDOW_START'),
    },
  });
  // Bounded and value-free: closed class labels, counts, and gate names only.
  console.log(JSON.stringify(result));
} catch {
  // Never print provider errors, headers, row values, or credential values.
  console.error(
    'AC211 queue shape diagnostic unavailable; normal collection still required.',
  );
  process.exitCode = 1;
}
