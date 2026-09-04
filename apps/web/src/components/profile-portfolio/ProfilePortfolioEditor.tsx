import * as React from 'react';

import type { ProfilePortfolioProjection } from '../../server/profile-portfolio-projection.ts';
import { profilePortfolioTagline } from './profile-portfolio-workbench-helpers';
import type { ProfilePortfolioContractFields } from './profile-portfolio-workbench-types';

export const ProfilePortfolioEditor = ({
  contractFields,
  partyId,
  projection,
  version,
  csrfToken,
  idempotencyKey,
  mutationBusy,
  errorField,
  onMutationSubmit,
}: Readonly<{
  contractFields: ProfilePortfolioContractFields;
  partyId: string;
  projection: ProfilePortfolioProjection | null;
  version: string;
  csrfToken: string;
  idempotencyKey: string;
  mutationBusy: boolean;
  errorField: boolean;
  onMutationSubmit: React.FormEventHandler<HTMLFormElement>;
}>): React.ReactElement => (
  <form
    method="post"
    action={`/api/v1/profiles/${encodeURIComponent(partyId)}/sections/now`}
    data-operation="PRF-PROF-03"
    data-contract-source={contractFields.source}
    data-draft={mutationBusy ? 'preserved' : undefined}
    onSubmit={onMutationSubmit}
  >
    <h2>Edit asserted profile</h2>
    <p>Current version {version}.</p>
    <label htmlFor="profile-portfolio-headline">Headline</label>
    <textarea
      id="profile-portfolio-headline"
      name="headline"
      defaultValue={profilePortfolioTagline(projection) ?? ''}
      aria-invalid={errorField ? 'true' : undefined}
      aria-describedby={
        errorField ? 'profile-portfolio-error-summary' : undefined
      }
    />
    <input type="hidden" name="expected-version" value={version} />
    <input type="hidden" name="idempotency-key" value={idempotencyKey} />
    <input type="hidden" name="csrf" value={csrfToken} />
    <button
      type="submit"
      aria-busy={mutationBusy ? 'true' : undefined}
      data-duplicate-active={mutationBusy ? 'true' : undefined}
    >
      Save
    </button>
  </form>
);
