import { lazy, Suspense, type ComponentType } from 'react';

import type { SettingsFlagsRuntimeWorkbenchProps } from './platform-configuration-workbench-types';

export {
  SETTINGS_FLAGS_RUNTIME_BOUNDARY,
  SETTINGS_FLAGS_RUNTIME_ERROR_CODES,
  SETTINGS_FLAGS_RUNTIME_INTERACTION_CONTRACT,
} from './settings-flags-runtime-workbench-contract';

export type {
  PlatformConfigurationAccess,
  PlatformConfigurationAsyncState,
  PlatformConfigurationContractFields,
  PlatformConfigurationError,
  PlatformConfigurationRecord,
  PlatformConfigurationVariant,
  PlatformConfigurationWorkbenchProps,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';

const SettingsFlagsRuntimeWorkbenchRuntime: ComponentType<SettingsFlagsRuntimeWorkbenchProps> =
  import.meta.env.SSR
    ? (await import('./SettingsFlagsRuntimeWorkbenchRuntime')).default
    : (lazy(
        () => import('./SettingsFlagsRuntimeWorkbenchRuntime'),
      ) as ComponentType<SettingsFlagsRuntimeWorkbenchProps>);

/** Server-first island entry; the full client controller is a bounded chunk. */
export function SettingsFlagsRuntimeWorkbench(
  props: SettingsFlagsRuntimeWorkbenchProps,
): React.ReactElement {
  return (
    <Suspense
      fallback={
        <section
          className="platform-configuration-workbench"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-labelledby="settings-flags-runtime-heading"
        >
          <h2 id="settings-flags-runtime-heading">Settings and flags</h2>
          <p>Loading interactive controls from the verified server view.</p>
        </section>
      }
    >
      <SettingsFlagsRuntimeWorkbenchRuntime {...props} />
    </Suspense>
  );
}

export default SettingsFlagsRuntimeWorkbench;
