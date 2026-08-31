import { describe, expect, it, vi } from 'vitest';

import {
  createProductionJobStatusDependencies,
  JobStatusProductionInternalError,
  type JobStatusProductionFetch,
} from './job-status-production';
import {
  authorityFromResolver,
  principalFromAuthority,
} from './job-status-production-authority';

const URL = 'https://staging.example.supabase.co';
const SECRET = 'server-secret-test-only';
const USER = '22222222-2222-4222-8222-222222222222';
const PARTY = '44444444-4444-4444-8444-444444444444';
const JOB = '66666666-6666-4666-8666-666666666666';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.test-token.signature';
const environment = { SUPABASE_SECRET_KEY: SECRET, SUPABASE_URL: URL } as const;

const json = (value: unknown): Response =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });

const request = () =>
  new Request(`https://api.example.test/api/v1/jobs/${JOB}`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });

describe('production JobStatus authority defensive branches', () => {
  it('defaults omitted resolver fields without widening authority', async () => {
    const cases = [
      {
        authority: { actingPartyId: PARTY },
        expected: { kind: 'acting_party', actingPartyId: PARTY },
      },
      {
        authority: { capabilities: ['jobs.read'] },
        expected: { kind: 'user', userId: USER },
      },
      {
        authority: { stepUpVerified: true },
        expected: { kind: 'operator', capabilities: [], reason: null },
      },
    ] as const;
    for (const { authority, expected } of cases) {
      const fetchImpl = vi.fn<JobStatusProductionFetch>(async () =>
        json({ id: USER }),
      );
      const dependencies = createProductionJobStatusDependencies({
        environment,
        fetchImpl,
        resolveServerAuthority: async () => authority,
      });
      const principal = await dependencies.resolvePrincipal(
        request(),
        new AbortController().signal,
      );
      expect(principal).toMatchObject(expected);
    }
  });

  it('rejects non-object and unknown-key resolver output', () => {
    for (const value of [42, { role: 'operator' }]) {
      expect(() => authorityFromResolver(USER, value)).toThrow(
        JobStatusProductionInternalError,
      );
    }
  });

  it('rejects an invalid actor binding before constructing authority', () => {
    expect(() => authorityFromResolver('not-a-uuid', null)).toThrow(
      JobStatusProductionInternalError,
    );
  });

  it('guards malformed acting-party authority before principal projection', () => {
    expect(() =>
      principalFromAuthority({
        actorId: USER,
        actingPartyId: null,
        capabilities: [],
        capability: null,
        kind: 'acting_party',
        reason: null,
        stepUpVerified: false,
      }),
    ).toThrow(JobStatusProductionInternalError);
  });
});
