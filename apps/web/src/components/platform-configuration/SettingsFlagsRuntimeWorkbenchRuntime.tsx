import SettingsFlagsRuntimeWorkbenchView from './SettingsFlagsRuntimeWorkbenchView';
import { useSettingsFlagsRuntimeWorkbenchController } from './settings-flags-runtime-workbench-controller';
import type { SettingsFlagsRuntimeWorkbenchProps } from './platform-configuration-workbench-types';

/** Full interactive implementation, split from the server-first island entry. */
export function SettingsFlagsRuntimeWorkbenchRuntime(
  props: SettingsFlagsRuntimeWorkbenchProps,
): React.ReactElement {
  return (
    <SettingsFlagsRuntimeWorkbenchView
      {...useSettingsFlagsRuntimeWorkbenchController(props)}
      contractFields={props.contractFields}
      variant={props.variant}
      access={props.access}
      actorId={props.actorId}
      actingPartyId={props.actingPartyId}
      expectedVersion={props.expectedVersion}
      csrfToken={props.csrfToken ?? ''}
      requestId={props.requestId ?? 'platform-configuration-request'}
    />
  );
}

export default SettingsFlagsRuntimeWorkbenchRuntime;
