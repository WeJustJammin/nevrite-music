import type { SettingsFlagsRuntimeController } from './settings-flags-runtime-workbench-controller';
import type {
  PlatformConfigurationAccess,
  PlatformConfigurationContractFields,
  PlatformConfigurationVariant,
} from './platform-configuration-workbench-types';

export interface SettingsFlagsRuntimeWorkbenchViewProps extends SettingsFlagsRuntimeController {
  readonly contractFields: PlatformConfigurationContractFields;
  readonly variant: PlatformConfigurationVariant;
  readonly access: PlatformConfigurationAccess;
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
  readonly expectedVersion: string | null;
  readonly csrfToken: string;
  readonly requestId: string;
}
