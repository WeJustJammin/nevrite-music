import * as React from 'react';

import { SETTINGS_FLAGS_RUNTIME_ERROR_CODES } from './settings-flags-runtime-workbench-contract';

export const SettingsFlagsRuntimeContractNotice = (): React.ReactElement => (
  <p
    className="platform-configuration-contract-errors"
    data-error-codes={SETTINGS_FLAGS_RUNTIME_ERROR_CODES.join(',')}
    hidden
    aria-hidden="true"
  >
    APPROVAL_INVALID, CONSENT_REQUIRED, RATE_LIMITED, STEP_UP_REQUIRED,
    VALUE_INVALID
  </p>
);

export default SettingsFlagsRuntimeContractNotice;
