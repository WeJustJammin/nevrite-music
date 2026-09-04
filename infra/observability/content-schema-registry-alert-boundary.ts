import {
  evaluateContentSchemaRegistryAlerts,
  type ContentSchemaRegistryAlert,
  type ContentSchemaRegistryOperationalSnapshot,
} from './content-schema-registry-alert-policy';

export type ContentSchemaRegistryAlertSink = (
  alert: ContentSchemaRegistryAlert,
) => void;

/**
 * Provider-free delivery seam for a scheduled/native observability query.
 * Callers pass only the redacted aggregate snapshot and own the final sink
 * (Cloudflare log/metric event, Supabase query result, or on-call adapter).
 * Missing measurements remain non-alerting according to the policy module.
 */
export const evaluateAndEmitContentSchemaRegistryAlerts = (
  snapshot: ContentSchemaRegistryOperationalSnapshot,
  sink: ContentSchemaRegistryAlertSink,
): readonly ContentSchemaRegistryAlert[] => {
  const alerts = evaluateContentSchemaRegistryAlerts(snapshot);
  for (const alert of alerts) sink(alert);
  return alerts;
};
