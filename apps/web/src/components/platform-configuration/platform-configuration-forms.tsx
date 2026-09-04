import * as React from 'react';

import type { PlatformConfigurationError } from './platform-configuration-workbench-types';
import { ChangeActionForm } from './PlatformConfigurationChangeActionForm';
import { ProposeChangeForm } from './PlatformConfigurationProposeChangeForm';

export {
  ChangeActionForm,
  type ChangeActionFormProps,
} from './PlatformConfigurationChangeActionForm';
export {
  ProposeChangeForm,
  type ProposeChangeFormProps,
} from './PlatformConfigurationProposeChangeForm';
export {
  ValidationSummary,
  type ValidationSummaryProps,
} from './PlatformConfigurationValidation';
export { normalizeValidationPath } from './platform-configuration-form-validation';

export interface PlatformConfigurationFormsProps {
  readonly definitionId?: string;
  readonly reviewId?: string;
  readonly expectedVersion: string;
  readonly candidateHash?: string;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly error?: PlatformConfigurationError | undefined;
  readonly busy?: boolean;
  readonly onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

export function PlatformConfigurationForms(
  props: PlatformConfigurationFormsProps,
): React.ReactElement {
  if (props.reviewId !== undefined && props.candidateHash !== undefined) {
    return (
      <ChangeActionForm
        {...props}
        reviewId={props.reviewId}
        candidateHash={props.candidateHash}
      />
    );
  }
  if (props.definitionId !== undefined) {
    return <ProposeChangeForm {...props} definitionId={props.definitionId} />;
  }
  return (
    <p className="platform-configuration-help">
      No server-authorized command form is available.
    </p>
  );
}
