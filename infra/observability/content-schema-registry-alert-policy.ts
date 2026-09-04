/**
 * Public compatibility barrel for the provider-free S09 alert policy.
 * Thresholds, types, and evaluation stay in focused modules so callers keep
 * the original import path without a monolithic policy file.
 */

export { evaluateContentSchemaRegistryAlerts } from './content-schema-registry-alert-evaluator';
export { CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS } from './content-schema-registry-alert-thresholds';
export type {
  ContentSchemaRegistryAlert,
  ContentSchemaRegistryAlertCode,
  ContentSchemaRegistryOperationalSnapshot,
} from './content-schema-registry-alert-types';
