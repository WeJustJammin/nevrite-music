import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  ChallengeRequestSchema,
  ClaimCreateRequestSchema,
  ConversionRequestSchema,
  InvitationRequestSchema,
  MatchRequestSchema,
  RemedyRequestSchema,
  ProofRequestSchema,
} from '@wejammin/contracts';
import AccountFreeRemedyForm from './AccountFreeRemedyForm';
import ShadowClaimOwnershipWorkbench, {
  type ShadowClaimOwnershipWorkbenchProps,
} from './ShadowClaimOwnershipWorkbench';
import {
  bodyFor,
  parseProfileOwnershipResponse,
  readCommandResult,
  type ProfileOwnershipOperation,
} from './profile-ownership-command-transport';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const CLAIM_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const ROUTE_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d5';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';
const POINTER = 'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCd';

const formData = (values: Readonly<Record<string, string>>): FormData => {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return form;
};

const jsonResponse = (
  value: unknown,
  status = 200,
  headers: Readonly<Record<string, string>> = {},
): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const responseCases: ReadonlyArray<
  readonly [ProfileOwnershipOperation, unknown]
> = [
  [
    'PRF-API-03',
    {
      accepted: true,
      action: 'suppress',
      scope: 'both',
      state: 'active',
      version: '1',
    },
  ],
  [
    'PRF-API-04',
    {
      id: CLAIM_ID,
      state: 'proving',
      targetPartyId: PARTY_ID,
      controlLevel: 'none',
      windowEndsAt: null,
      version: '2',
    },
  ],
  [
    'PRF-API-05',
    {
      id: CLAIM_ID,
      state: 'provisional',
      targetPartyId: PARTY_ID,
      controlLevel: 'provisional',
      windowEndsAt: '2026-09-02T00:00:00Z',
      eligibleMethods: ['domain_challenge'],
      version: '3',
    },
  ],
  [
    'PRF-API-06',
    {
      id: CLAIM_ID,
      method: 'domain_challenge',
      expiresAt: '2026-09-01T19:00:00Z',
      attemptsRemaining: 5,
    },
  ],
  [
    'PRF-API-07',
    {
      id: CLAIM_ID,
      state: 'full',
      targetPartyId: PARTY_ID,
      controlLevel: 'full',
      windowEndsAt: null,
      version: '4',
    },
  ],
  [
    'PRF-API-08',
    {
      id: CLAIM_ID,
      state: 'full',
      targetPartyId: PARTY_ID,
      controlLevel: 'full',
      windowEndsAt: null,
      version: '5',
    },
  ],
];

const record = {
  id: CLAIM_ID,
  version: '2',
  state: 'proving',
  provenance: [
    {
      source: 'profile-ownership',
      evidence: 'server-authorized-claim',
      at: '2026-09-01T00:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    targetPartyId: PARTY_ID,
    controlLevel: 'none',
  },
} as const;

const workbenchProps = {
  contractFields: {
    source: '02a-shadow-claim-ownership.md',
    fields: {
      claim: ['id', 'state', 'targetPartyId', 'controlLevel', 'version'],
    },
  },
  variant: 'ownerFull',
  initial: { status: 'success', data: [record], version: '2', stale: false },
  actorId: PARTY_ID,
  actingPartyId: PARTY_ID,
  access: 'full',
  query: { tab: 'ownership', selected: CLAIM_ID },
  selectedId: CLAIM_ID,
  expectedVersion: '"2"',
  onCanonicalRefetch: () => undefined,
} satisfies ShadowClaimOwnershipWorkbenchProps;

const renderWorkbench = (
  overrides: Partial<ShadowClaimOwnershipWorkbenchProps> = {},
): string =>
  renderToStaticMarkup(
    React.createElement(ShadowClaimOwnershipWorkbench, {
      ...workbenchProps,
      ...overrides,
    }),
  );

describe('P2-S05 web remediation contracts', () => {
  it('[P2-S05-AC-230, P2-S05-AC-231, P2-S05-AC-232, P2-S05-AC-233, P2-S05-AC-234, P2-S05-AC-235] parses every active PRF-API-03..08 response with its named schema before UI state updates', async () => {
    for (const [operation, value] of responseCases) {
      const parsed = parseProfileOwnershipResponse(operation, value) as {
        success: boolean;
        data?: unknown;
      };
      expect(parsed).toMatchObject({ success: true, data: value });
      await expect(
        readCommandResult(jsonResponse(value), operation),
      ).resolves.toMatchObject({ payload: value });
    }
    expect(
      await readCommandResult(
        jsonResponse({
          id: CLAIM_ID,
          state: 'proving',
          targetPartyId: 'invalid',
          controlLevel: 'none',
          windowEndsAt: null,
          version: '2',
        }),
        'PRF-API-04',
      ),
    ).toEqual({
      message: 'The service returned an invalid ownership response.',
    });
  });

  it('[P2-S05-AC-249] maps typed conflict, capability, rate, and validation failures without claiming success', async () => {
    await expect(
      readCommandResult(
        jsonResponse({ message: 'invalid fields' }, 422),
        'PRF-API-04',
      ),
    ).resolves.toEqual({ message: 'invalid fields' });
    await expect(
      readCommandResult(jsonResponse({}, 403), 'PRF-API-04'),
    ).resolves.toEqual({
      message: 'This capability is not available in this context.',
    });
    await expect(
      readCommandResult(jsonResponse({}, 409), 'PRF-API-04'),
    ).resolves.toEqual({
      message: 'The ownership state changed. Refresh and retry.',
    });
    await expect(
      readCommandResult(
        jsonResponse({}, 429, { 'retry-after': '7' }),
        'PRF-API-04',
      ),
    ).resolves.toEqual({ message: 'Try again after cooldown (7 seconds).' });
  });

  it('[P2-S05-AC-218, P2-S05-AC-219, P2-S05-AC-220] emits strict request bodies and keeps path identifiers out of JSON', () => {
    const match = bodyFor(
      'PRF-API-01',
      formData({
        partyId: PARTY_ID,
        sourceDomain: 'projects',
        sourceEntityId: 'work-812',
        sourceVersion: '3',
        roleCode: 'performer',
        claimId: CLAIM_ID,
        extra: 'ignored',
      }),
    );
    expect(MatchRequestSchema.parse(match)).toEqual({
      partyId: PARTY_ID,
      sourceDomain: 'projects',
      sourceEntityId: 'work-812',
      sourceVersion: '3',
      roleCode: 'performer',
    });
    const invitation = bodyFor(
      'PRF-API-02',
      formData({
        contactRouteId: ROUTE_ID,
        trigger: 'initial',
        shadowId: CLAIM_ID,
      }),
    );
    expect(InvitationRequestSchema.parse(invitation)).toEqual({
      contactRouteId: ROUTE_ID,
      trigger: 'initial',
    });
    const remedy = bodyFor(
      'PRF-API-03',
      formData({
        pointerToken: POINTER,
        action: 'correct',
        scope: 'publication',
        proofKind: 'route_code',
        proofCode: '482901',
      }),
    );
    expect(RemedyRequestSchema.parse(remedy)).toEqual({
      pointerToken: POINTER,
      action: 'correct',
      scope: 'publication',
      proof: { kind: 'route_code', code: '482901' },
    });
    expect(
      ClaimCreateRequestSchema.parse(
        bodyFor(
          'PRF-API-04',
          formData({
            targetPartyId: PARTY_ID,
            claimKind: 'self',
            claimId: CLAIM_ID,
          }),
        ),
      ),
    ).toEqual({ targetPartyId: PARTY_ID, claimKind: 'self' });
    expect(
      ChallengeRequestSchema.parse(
        bodyFor(
          'PRF-API-06',
          formData({
            method: 'domain_challenge',
            routeId: ROUTE_ID,
            claimId: CLAIM_ID,
          }),
        ),
      ),
    ).toEqual({ method: 'domain_challenge', routeId: ROUTE_ID });
    expect(
      ProofRequestSchema.parse(
        bodyFor(
          'PRF-API-07',
          formData({
            kind: 'challenge_code',
            challengeId: CLAIM_ID,
            code: '482901',
            reasonCode: 'claim_proof',
            claimId: CLAIM_ID,
          }),
        ),
      ),
    ).toEqual({
      kind: 'challenge_code',
      challengeId: CLAIM_ID,
      code: '482901',
      reasonCode: 'claim_proof',
    });
    expect(
      ConversionRequestSchema.parse(
        bodyFor(
          'PRF-API-08',
          formData({ reasonCode: 'ownership_conversion', claimId: CLAIM_ID }),
        ),
      ),
    ).toEqual({ reasonCode: 'ownership_conversion' });
  });

  it('[P2-S05-AC-148] exposes native action forms with stable status, JSON transport, and required replay protection', () => {
    const markup = renderWorkbench();
    expect(markup).toContain('data-json-body="true"');
    expect(markup).toContain('data-idempotency="required"');
    expect(markup).toContain('data-csrf="required"');
    expect(markup).toContain('role="status"');
    expect(markup).toMatch(/<button type="submit"/u);
  });

  it('[P2-S05-AC-149] renders a disabled capability boundary without protected command labels or handlers', () => {
    const markup = renderWorkbench({
      access: 'disabled',
      variant: 'disabledPrerequisite',
      actorId: null,
      actingPartyId: null,
      selectedId: null,
      initial: { status: 'empty', data: [], stale: false },
    });
    expect(markup).toContain('data-capability-state="disabled"');
    expect(markup).toContain('Disabled prerequisite');
    expect(markup).not.toContain('data-operation="PRF-API-01"');
    expect(markup).not.toContain(PARTY_ID);
  });

  it('[P2-S05-AC-154, P2-S05-AC-155] exposes idle and loading state classes with truthful busy copy', () => {
    expect(renderWorkbench()).toContain('data-async-state="success"');
    expect(renderWorkbench({ initial: { status: 'idle' } })).toContain(
      'data-state-copy="idle">Ready.',
    );
    expect(renderWorkbench({ initial: { status: 'loading' } })).toContain(
      'data-state-copy="loading">Loading current records',
    );
  });

  it('[P2-S05-AC-157, P2-S05-AC-158] distinguishes empty records from validated success and renders canonical state/version/provenance', () => {
    const empty = renderWorkbench({
      initial: { status: 'empty', data: [], stale: false },
      selectedId: null,
    });
    expect(empty).toContain('No ownership records are available.');
    expect(empty).toContain('Open invitation remediation');
    const success = renderWorkbench();
    expect(success).toContain('State <strong>proving</strong>');
    expect(success).toContain('Provenance source: profile-ownership');
    expect(success).toContain('data-version="2"');
  });

  it('[P2-S05-AC-161, P2-S05-AC-162] renders disabled and degraded recovery boundaries with request scope', () => {
    const degraded = renderWorkbench({
      initial: {
        status: 'degraded',
        data: [],
        stale: true,
        error: {
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Profile ownership records are temporarily unavailable.',
          requestId: REQUEST_ID,
        },
        retryable: true,
      },
    });
    expect(degraded).toContain('data-degraded-scope="profile-ownership"');
    expect(degraded).toContain('Request ID:');
    expect(degraded).toContain(REQUEST_ID);
    expect(degraded).toContain('Retry canonical read');
  });

  it('[P2-S05-AC-003, P2-S05-AC-066..069] keeps the account-free remedy as a valid JSON/idempotent React flow with no URL pointer', () => {
    const markup = renderToStaticMarkup(
      React.createElement(AccountFreeRemedyForm),
    );
    expect(markup).toContain('data-authentication="anonymous"');
    expect(markup).toContain('data-json-body="true"');
    expect(markup).toContain('data-idempotency="required"');
    expect(markup).toContain('name="pointerToken"');
    expect(markup).not.toContain('pointer=');
  });
});
