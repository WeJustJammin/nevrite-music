import * as React from 'react';

import { CommandForm, TextField } from './ProfileOwnershipCommandForms';

const AccountFreeRemedyForm = (): React.ReactElement => {
  const [status, setStatus] = React.useState('Ready.');
  return (
    <section aria-labelledby="account-free-remedy-heading">
      <h2 id="account-free-remedy-heading">
        Suppress or correct an invitation
      </h2>
      <p>
        Enter the invitation pointer and one-time route code. Creating an
        account is not required, and the pointer never grants ownership.
      </p>
      <CommandForm
        operation="PRF-API-03"
        action="/api/v1/shadow-remedies"
        label="Continue without an account"
        expectedVersion=""
        csrfToken=""
        anonymous
        onStatus={setStatus}
      >
        <TextField
          id="claim-pointer"
          name="pointerToken"
          label="Invitation pointer"
          maxLength={2048}
        />
        <label htmlFor="remedy-action">
          Action
          <select
            id="remedy-action"
            name="action"
            defaultValue="suppress"
            required
          >
            <option value="suppress">Suppress</option>
            <option value="correct">Correct</option>
          </select>
        </label>
        <label htmlFor="remedy-scope">
          Scope
          <select id="remedy-scope" name="scope" defaultValue="both" required>
            <option value="outreach">Outreach</option>
            <option value="publication">Publication</option>
            <option value="both">Both</option>
          </select>
        </label>
        <input type="hidden" name="proofKind" value="route_code" />
        <TextField
          id="claim-code"
          name="proofCode"
          label="Route code"
          inputMode="numeric"
          maxLength={6}
        />
      </CommandForm>
      <p role="status" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </section>
  );
};

export default AccountFreeRemedyForm;
