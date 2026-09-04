import { z } from 'zod';

import { AdminRegistryCodeSchema } from './admin-common.ts';
import {
  ConfigurationInstantSchema,
  ConfigurationJsonObjectSchema,
  ConfigurationKeySchema,
  ConfigurationTextSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

const DiagnosticActionSchema = z.enum(['read_audit', 'run_diagnostic']);

export const Cfg05b05AuditDiagnosticRequestSchema = z
  .strictObject({
    action: DiagnosticActionSchema,
    targetType: AdminRegistryCodeSchema,
    targetId: ConfigurationUuidSchema,
    targetVersion: ConfigurationVersionSchema.nullable(),
    auditLinkId: ConfigurationUuidSchema.nullable(),
    diagnosticDefinitionKey: ConfigurationKeySchema.nullable(),
    diagnosticDefinitionVersion: ConfigurationVersionSchema.nullable(),
    input: ConfigurationJsonObjectSchema.nullable(),
    expectedFreshnessAt: ConfigurationInstantSchema.nullable(),
    reason: ConfigurationTextSchema,
  })
  .superRefine((value, context) => {
    if (value.action === 'read_audit' && value.auditLinkId === null) {
      context.addIssue({
        code: 'custom',
        path: ['auditLinkId'],
        message: 'audit_link_required',
      });
    }
    if (
      value.action === 'run_diagnostic' &&
      (value.diagnosticDefinitionKey === null ||
        value.diagnosticDefinitionVersion === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['diagnosticDefinitionKey'],
        message: 'diagnostic_definition_required',
      });
    }
  });

export const Cfg05b05AuditDiagnosticResponseSchema = z.strictObject({
  action: DiagnosticActionSchema,
  auditLinkId: ConfigurationUuidSchema.nullable(),
  diagnosticRunId: ConfigurationUuidSchema.nullable(),
  targetType: AdminRegistryCodeSchema,
  targetId: ConfigurationUuidSchema,
  targetVersion: ConfigurationVersionSchema.nullable(),
  state: z.enum(['unknown', 'running', 'healthy', 'stale', 'failed']),
  freshnessAt: ConfigurationInstantSchema.nullable(),
  evidenceRef: z.string().max(256).nullable(),
  resultCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/u)).max(32),
  outboxEventId: ConfigurationUuidSchema.nullable(),
});

export type Cfg05b05AuditDiagnosticRequest = z.infer<
  typeof Cfg05b05AuditDiagnosticRequestSchema
>;
export type Cfg05b05AuditDiagnosticResponse = z.infer<
  typeof Cfg05b05AuditDiagnosticResponseSchema
>;
