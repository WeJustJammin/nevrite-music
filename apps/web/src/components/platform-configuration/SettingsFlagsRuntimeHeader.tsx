import * as React from 'react';

export interface SettingsFlagsRuntimeHeaderProps {
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
}

export const SettingsFlagsRuntimeHeader = ({
  actorId,
  actingPartyId,
}: SettingsFlagsRuntimeHeaderProps): React.ReactElement => (
  <header className="platform-configuration-workbench-header">
    <p className="platform-configuration-eyebrow">
      Server-authorized settings surface
    </p>
    <h2 id="settings-flags-runtime-heading">Settings and flags runtime</h2>
    <p>
      Effective values remain tied to the canonical definition, version, source
      scope, and provenance.
    </p>
    <p className="platform-configuration-help">
      Actor: {actorId === null ? 'not signed in' : 'server verified'}. Acting
      context: {actingPartyId === null ? 'not selected' : 'server selected'}.
    </p>
  </header>
);

export default SettingsFlagsRuntimeHeader;
