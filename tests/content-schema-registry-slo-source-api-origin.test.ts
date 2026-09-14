import { describe, expect, it, vi } from 'vitest';

import { verifyContentSchemaRegistrySloSource } from '../infra/workflows/verify-content-schema-registry-slo-source';

const invalidApiUrls = [
  'http://api.github.com/',
  'https://github.com/',
  'https://user@api.github.com/',
  'https://api.github.com:8443/',
  'https://api.github.com:443/',
  'https://api.github.com/v3/',
  'https://api.github.com/?repo=owner',
  'https://api.github.com/#fragment',
] as const;

describe('AC211 GitHub API origin guard', () => {
  it.each(invalidApiUrls)(
    'rejects an untrusted API URL before sending the bearer token (%s)',
    async (apiUrl) => {
      const fetchImpl = vi.fn<typeof fetch>();
      const result = verifyContentSchemaRegistrySloSource(
        {
          apiUrl,
          repository: 'owner/repo',
          token: 'synthetic-bearer-token',
          productionDeploymentId: '123456789',
          sourceRevision: 'a'.repeat(40),
          utcDay: '2026-09-05',
          now: () => Date.parse('2026-09-06T00:00:01.000Z'),
        },
        fetchImpl,
      );

      await expect(result).rejects.toThrow(/GITHUB_API_URL/u);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
});
