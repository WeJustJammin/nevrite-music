import { z } from 'zod';

import {
  ContentSchemaRegistryAc211DatasetReportSchema,
  ContentSchemaRegistryAc211MeasurementReportSchema,
} from './operational-release-evidence-collector-reports.ts';
import { ContentSchemaRegistrySloEvidenceSchema } from './operational-release-evidence-observability.ts';

export type Dataset = z.infer<
  typeof ContentSchemaRegistryAc211DatasetReportSchema
>;
export type Measurement = z.infer<
  typeof ContentSchemaRegistryAc211MeasurementReportSchema
>;
export type Slo = z.infer<typeof ContentSchemaRegistrySloEvidenceSchema>;
export type CollectorOutputParts = Readonly<{
  dataset: Dataset;
  measurement: Measurement;
  slo: Slo;
}>;
