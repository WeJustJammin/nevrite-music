import { diagnoseSloCounts } from './content-schema-registry-slo-diagnostic.ts';

try {
  const result = await diagnoseSloCounts({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    token: process.env.CLOUDFLARE_OBSERVABILITY_API_TOKEN ?? '',
    sourceSha: process.env.SOURCE_REVISION ?? '',
    window: {
      startedAt: process.env.WINDOW_START ?? '',
      endedAt: process.env.WINDOW_END ?? '',
    },
  });
  console.log(JSON.stringify(result));
} catch {
  // Never print provider errors, raw events, headers, or credential values.
  console.error(
    'AC211 diagnostic unavailable; normal collection still required.',
  );
  process.exitCode = 1;
}
