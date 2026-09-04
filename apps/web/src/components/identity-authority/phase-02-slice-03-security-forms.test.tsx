import { describe, expect, it } from 'vitest';

import {
  AddFacetRequestSchema,
  CreateAliasRequestSchema,
  CreatePersonRequestSchema,
  LinkIntentRequestSchema,
} from '@wejammin/contracts';

import {
  authorizeUploadPresentation,
  escapeUntrustedText,
  normalizeReturnTo,
  projectRedactedClientState,
  verifyMutationBoundary,
  verifyProtectedRoute,
} from './security-boundary.ts';
import {
  buildLinkedValidationSummary,
  getIdentityFormDefinition,
  serializeFormError,
  serializeNamedForm,
  validateFormInteraction,
} from './identity-form-contracts.ts';

const validRoute = {
  token: {
    subject: 'auth-subject-1',
    expiresAt: 2_000,
    revokedAt: null,
  },
  serverContext: {
    contextId: 'self-context-1',
    actorId: 'person-1',
    capabilities: ['identity.write'],
    expiresAt: 2_000,
    revokedAt: null,
  },
  suggestedContextId: 'attacker-context',
  now: 1_000,
  returnTo: '/app/identity-authority',
  protectedProps: {
    email: 'private@example.test',
    capability: 'identity.write',
  },
} as const;

describe('P2-S03 security and form contract RED cases', () => {
  it('P2-S03-AC-244 verifies the server token and acting context, never the client role or deep-link suggestion', () => {
    const accepted = verifyProtectedRoute(validRoute);

    expect(accepted).toMatchObject({
      ok: true,
      actingContextId: 'self-context-1',
      protectedProps: validRoute.protectedProps,
    });

    const denied = verifyProtectedRoute({
      ...validRoute,
      token: { ...validRoute.token, expiresAt: 900 },
    });

    expect(denied).toMatchObject({
      ok: false,
      protectedProps: {},
      redirect: '/auth/sign-in?returnTo=%2Fapp%2Fidentity-authority',
    });
  });

  it('P2-S03-AC-245 requires same-origin session-bound CSRF for cookie mutations and never mutates on GET', () => {
    const valid = verifyMutationBoundary({
      method: 'POST',
      origin: 'https://app.wejammin.test',
      referer: 'https://app.wejammin.test/app/identity-authority',
      allowedOrigins: ['https://app.wejammin.test'],
      sessionRef: 'session-ref-1',
      csrfToken: 'csrf-token-bound-to-session-ref-1',
      expectedCsrfToken: 'csrf-token-bound-to-session-ref-1',
      cookies: { secure: true, httpOnly: true, sameSite: 'lax' },
    });
    expect(valid).toMatchObject({ ok: true });

    expect(
      verifyMutationBoundary({
        method: 'POST',
        origin: 'https://evil.example',
        allowedOrigins: ['https://app.wejammin.test'],
        sessionRef: 'session-ref-1',
        csrfToken: 'csrf-token-bound-to-session-ref-1',
        expectedCsrfToken: 'csrf-token-bound-to-session-ref-1',
        cookies: { secure: true, httpOnly: true, sameSite: 'lax' },
      }),
    ).toMatchObject({ ok: false });

    expect(
      verifyMutationBoundary({
        method: 'GET',
        origin: 'https://app.wejammin.test',
        allowedOrigins: ['https://app.wejammin.test'],
        sessionRef: 'session-ref-1',
        csrfToken: null,
        expectedCsrfToken: null,
        cookies: { secure: true, httpOnly: true, sameSite: 'lax' },
      }),
    ).toMatchObject({ ok: false });
  });

  it('P2-S03-AC-246 serializes only the strict Zod request fields and reports unknown keys without mutation', () => {
    const result = serializeNamedForm({
      schema: CreateAliasRequestSchema,
      values: {
        displayName: '  A Valid Alias  ',
        handle: 'valid-handle',
        publicLinkState: 'private',
        unexpected: 'must-not-cross-the-boundary',
      },
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(result).toHaveProperty(
      'error.violations',
      expect.arrayContaining([
        expect.objectContaining({ path: ['unexpected'] }),
      ]),
    );
    expect(
      CreatePersonRequestSchema.safeParse({ unexpected: true }).success,
    ).toBe(false);
    expect(
      AddFacetRequestSchema.safeParse({
        facetCode: 'writer',
        source: 'self_asserted',
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('P2-S03-AC-247 escapes untrusted text and permits only allowlisted URL schemes', () => {
    expect(escapeUntrustedText('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(normalizeReturnTo('/app/identity-authority?tab=aliases')).toBe(
      '/app/identity-authority?tab=aliases',
    );
    expect(normalizeReturnTo('javascript:alert(1)')).toBe('/app');
    expect(normalizeReturnTo('https://evil.example/steal')).toBe('/app');
  });

  it('P2-S03-AC-248 removes tokens, provider responses, evidence, contact data, media URLs, and drafts from client/log/URL surfaces', () => {
    const projected = projectRedactedClientState({
      requestId: 'request-1',
      status: 'success',
      token: 'secret-token',
      providerResponse: { access_token: 'provider-secret' },
      evidenceBody: 'private legal evidence',
      contactEmail: 'private@example.test',
      mediaUrl: 'https://private.example/media.mp4',
      draft: { displayName: 'unsaved private draft' },
      url: '/app/identity-authority?email=private@example.test',
    });

    expect(projected).toMatchObject({
      requestId: 'request-1',
      status: 'success',
    });
    expect(JSON.stringify(projected)).not.toMatch(
      /secret-token|provider-secret|private legal evidence|private@example\.test|media\.mp4|unsaved private draft/u,
    );
  });

  it('P2-S03-AC-249 keeps upload presentation server-authorized and quarantined bytes non-renderable', () => {
    const presentation = authorizeUploadPresentation({
      serverIntent: {
        actorId: 'person-1',
        targetId: 'party-1',
        type: 'identity-document',
        size: 128,
        checksum: 'sha256:server-checksum',
        canonicalObjectKey: 'server/opaque/key',
      },
      clientRequestedKey: 'client/chosen/key',
      byteState: 'quarantined',
    });

    expect(presentation).toMatchObject({ ready: false, renderable: false });
    expect(presentation).not.toHaveProperty('canonicalObjectKey');
    expect(presentation).not.toHaveProperty('serverIntent.actorId');
  });

  it('P2-S03-AC-250 normalizes only code-owned relative return targets and falls back from external or admin destinations', () => {
    expect(normalizeReturnTo('/app/identity-authority/aliases')).toBe(
      '/app/identity-authority/aliases',
    );
    expect(normalizeReturnTo('//evil.example/app')).toBe('/app');
    expect(normalizeReturnTo('/admin/settings')).toBe('/app');
    expect(normalizeReturnTo('/app/identity-authority/%0d%0aSet-Cookie')).toBe(
      '/app',
    );
  });

  it('P2-S03-AC-251 generates the account-linking form from its named Zod source schema with field metadata and canonical serialization', () => {
    const form = getIdentityFormDefinition('01a-auth-account-linking.md');

    expect(form.schemaNames).toEqual(
      expect.arrayContaining(['LinkIntentRequestSchema']),
    );
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'provider', required: true }),
        expect.objectContaining({ name: 'intent', required: true }),
        expect.objectContaining({ name: 'returnTo', required: true }),
      ]),
    );

    const serialized = serializeNamedForm({
      schema: LinkIntentRequestSchema,
      values: { returnTo: '/app/identity-authority' },
    });
    expect(serialized).toMatchObject({
      ok: true,
      data: { returnTo: '/app/identity-authority' },
    });
  });

  it('P2-S03-AC-252 generates the party-alias form and validates syntax on blur but cross-field rules on submit', () => {
    const form = getIdentityFormDefinition('01b-party-identity-aliases.md');
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'displayName' }),
        expect.objectContaining({ name: 'handle' }),
        expect.objectContaining({ name: 'publicLinkState' }),
      ]),
    );

    const blur = validateFormInteraction({
      form,
      values: {
        displayName: '',
        handle: 'valid-handle',
        publicLinkState: 'private',
      },
      phase: 'blur',
      field: 'displayName',
    });
    expect(blur).toMatchObject({ valid: false });
    expect(blur.fieldErrors).toHaveProperty('displayName');

    const submit = validateFormInteraction({
      form,
      values: { displayName: '', handle: '', publicLinkState: 'private' },
      phase: 'submit',
    });
    expect(submit).toMatchObject({ valid: false });
    expect(Object.keys(submit.fieldErrors)).toEqual(
      expect.arrayContaining(['displayName', 'handle']),
    );
  });

  it('P2-S03-AC-253 generates the relationships-governance form and links exact field errors through an accessible summary', () => {
    const form = getIdentityFormDefinition(
      '01c-relationships-authority-governance.md',
    );
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'capabilityCode' }),
        expect.objectContaining({ name: 'purposeCode' }),
        expect.objectContaining({ name: 'expiresAt' }),
      ]),
    );

    const summary = buildLinkedValidationSummary({
      '/capabilityCode': 'Choose a current capability.',
      '/expiresAt': 'Enter a future date.',
    });
    expect(summary).toMatchObject({
      heading: 'Check the highlighted fields.',
      firstInvalidPath: '/capabilityCode',
    });
    expect(summary.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: '#field-capabilityCode',
          path: '/capabilityCode',
        }),
      ]),
    );
  });

  it('P2-S03-AC-254 generates the identifiers-legacy form and emits only serializable safe errors', () => {
    const form = getIdentityFormDefinition('01d-identifiers-legacy.md');
    expect(form.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'namespace' }),
        expect.objectContaining({ name: 'normalizedValueHash' }),
        expect.objectContaining({ name: 'expectedVersion' }),
      ]),
    );

    const serialized = serializeFormError({
      code: 'VALIDATION_FAILED',
      message: 'Check the highlighted fields.',
      requestId: 'request-1',
      details: { violations: [{ path: '/namespace', code: 'required' }] },
      cause: new Error('raw upstream detail must not escape'),
    });
    expect(serialized).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'Check the highlighted fields.',
      requestId: 'request-1',
      details: { violations: [{ path: '/namespace', code: 'required' }] },
    });
    expect(JSON.stringify(serialized)).not.toContain('raw upstream detail');
  });
});
