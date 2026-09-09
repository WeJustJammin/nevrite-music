import { describe, expect, it, vi } from 'vitest';

import { resolveExpectedSourceRevision } from '../infra/staging-release-identity.mjs';
import { verifyStaging as verifyStagingImplementation } from '../infra/verify-staging.mjs';
import {
  protectedHeaders,
  verifyStaging,
  webHtmlWithStaticAsset,
} from './verify-staging.test-support';

describe('verifyStaging release identity', () => {
  it('binds command-line verification to DEPLOY_SHA', () => {
    const deploySha = 'a'.repeat(40);

    expect(
      resolveExpectedSourceRevision({
        deploySha,
        configuredRelease: undefined,
      }),
    ).toBe(deploySha);
    expect(
      resolveExpectedSourceRevision({
        deploySha,
        configuredRelease: deploySha,
      }),
    ).toBe(deploySha);
    expect(() =>
      resolveExpectedSourceRevision({
        deploySha,
        configuredRelease: 'b'.repeat(40),
      }),
    ).toThrow('STAGING_EXPECTED_RELEASE must match DEPLOY_SHA');
    expect(() =>
      resolveExpectedSourceRevision({
        deploySha: 'release-alias',
        configuredRelease: deploySha,
      }),
    ).toThrow('DEPLOY_SHA must be a lowercase 40-character SHA');
  });

  it('requires the expected release identity before probing hosted services', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      verifyStagingImplementation({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      } as never),
    ).rejects.toThrow('Expected staging release is required');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a served release identity mismatch before probing the API', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(webHtmlWithStaticAsset, {
        headers: {
          ...protectedHeaders({ 'x-wejammin-release': 'b'.repeat(40) }),
          'content-type': 'text/html; charset=utf-8',
        },
        status: 200,
      }),
    );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('Staging web release identity mismatch');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
