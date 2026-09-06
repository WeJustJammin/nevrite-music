import { z } from 'zod';

import {
  ContentSchemaRegistryAc211DatasetReportSchema,
  ContentSchemaRegistryAc211MeasurementReportSchema,
} from './operational-release-evidence-collector-reports.ts';
import {
  validateOutputIdentity,
  validateSlo,
} from './operational-release-evidence-collector-output-invariants.ts';
import { validateOutputMetrics } from './operational-release-evidence-collector-output-metrics.ts';
import { ContentSchemaRegistrySloEvidenceSchema } from './operational-release-evidence-observability.ts';

const Ac211SloEvidenceSchema =
  ContentSchemaRegistrySloEvidenceSchema.superRefine(validateSlo).readonly();

export const ContentSchemaRegistryAc211CollectorOutputSchema = z
  .object({
    dataset: ContentSchemaRegistryAc211DatasetReportSchema,
    measurement: ContentSchemaRegistryAc211MeasurementReportSchema,
    slo: Ac211SloEvidenceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    validateOutputIdentity(value, context);
    validateOutputMetrics(value, context);
  })
  .readonly();

export type ContentSchemaRegistryAc211CollectorOutput = z.infer<
  typeof ContentSchemaRegistryAc211CollectorOutputSchema
>;
