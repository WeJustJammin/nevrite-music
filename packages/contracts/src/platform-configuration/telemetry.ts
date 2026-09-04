import { z } from 'zod';

import {
  ConfigChangeProposedTelemetrySchema,
  ConfigChangeTransitionedTelemetrySchema,
} from './telemetry-change.ts';
import {
  ConfigDefinitionRegisteredTelemetrySchema,
  ConfigValueResolvedTelemetrySchema,
} from './telemetry-definition.ts';
import {
  ConfigExperimentChangedTelemetrySchema,
  ConfigFlagChangedTelemetrySchema,
  ConfigKillSwitchChangedTelemetrySchema,
} from './telemetry-runtime.ts';

export {
  ConfigChangeProposedTelemetrySchema,
  ConfigChangeTransitionedTelemetrySchema,
} from './telemetry-change.ts';
export {
  ConfigDefinitionRegisteredTelemetrySchema,
  ConfigValueResolvedTelemetrySchema,
} from './telemetry-definition.ts';
export {
  ConfigExperimentChangedTelemetrySchema,
  ConfigFlagChangedTelemetrySchema,
  ConfigKillSwitchChangedTelemetrySchema,
} from './telemetry-runtime.ts';

export const PlatformConfigurationTelemetrySchema = z.discriminatedUnion(
  'eventName',
  [
    ConfigDefinitionRegisteredTelemetrySchema,
    ConfigValueResolvedTelemetrySchema,
    ConfigChangeProposedTelemetrySchema,
    ConfigChangeTransitionedTelemetrySchema,
    ConfigFlagChangedTelemetrySchema,
    ConfigExperimentChangedTelemetrySchema,
    ConfigKillSwitchChangedTelemetrySchema,
  ],
);

export type PlatformConfigurationTelemetry = z.infer<
  typeof PlatformConfigurationTelemetrySchema
>;
