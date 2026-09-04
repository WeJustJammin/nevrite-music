import * as React from 'react';

import type { PlatformConfigurationBreakpoint } from './platform-configuration-workbench-types';

export interface SettingsFlagsRuntimeBackLinkProps {
  readonly breakpoint: PlatformConfigurationBreakpoint;
  readonly selectedId: string | null;
  readonly selectionUrl: string;
}

/** Keeps the mobile list-to-detail path available without client-only state. */
export const SettingsFlagsRuntimeBackLink = ({
  breakpoint,
  selectedId,
  selectionUrl,
}: SettingsFlagsRuntimeBackLinkProps): React.ReactElement | null => {
  if (selectedId === null) return null;
  const backUrl = new URL(selectionUrl, 'https://wejamm.in');
  backUrl.searchParams.delete('selected');
  backUrl.hash = '';
  const className =
    breakpoint === 'mobile'
      ? 'platform-configuration-back-action'
      : 'platform-configuration-back-action platform-configuration-back-action-mobile-only';
  return (
    <p className={className}>
      <a href={`${backUrl.pathname}${backUrl.search}`}>
        Back to settings records
      </a>
    </p>
  );
};

export default SettingsFlagsRuntimeBackLink;
