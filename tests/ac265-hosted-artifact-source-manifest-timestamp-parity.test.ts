import { describe, expect, it, vi } from 'vitest';

import { registerAc265HostedArtifactSourceManifest } from '../infra/workflows/ac265-hosted-artifact-source-manifest-rpc.ts';
import {
  ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestSchema,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';

const projectRef = 'abcdefghijklmnopqrst';
const source = {
  kind: 'server_receipt' as const,
  artifactRef: 'ac265-receipt://server/10000000-0000-4000-8000-000000000010',
  artifactSha256: 'a'.repeat(64),
  attestationSha256: 'b'.repeat(64),
  attestationKeyId: 'release-key-2026-09',
  subjectSha256: 'c'.repeat(64),
  issuedAt: '2026-09-21T10:00:30.000Z',
  expiresAt: '2026-09-21T10:02:30.000Z',
};
const request = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: 'ac265-hosted-artifact-source-manifest-v1' as const,
  authorizationRef:
    'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  idempotencyRef:
    'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004',
  sources: [source],
};
const nonCanonicalTimestamps = [
  '2026-09-21T10:00:30.1234Z',
  '2026-09-21T10:00:30.123+00:00',
  '2026-09-21T10:00:30Z',
  '2026-09-21T10:00:30.12Z',
] as const;

describe('AC265 hosted artifact-source timestamp parity', () => {
  it('accepts only canonical UTC timestamps with exactly three fractional digits', () => {
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestSchema.safeParse(
        source,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema.safeParse(
        {
          authorizedAt: '2026-09-21T10:00:00.000Z',
          expiresAt: '2026-09-21T10:05:00.000Z',
        },
      ).success,
    ).toBe(true);

    for (const value of nonCanonicalTimestamps) {
      expect(
        ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestSchema.safeParse(
          { ...source, issuedAt: value },
        ).success,
        value,
      ).toBe(false);
      expect(
        ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema.safeParse(
          { authorizedAt: value, expiresAt: '2026-09-21T10:05:00.000Z' },
        ).success,
        value,
      ).toBe(false);
    }
  });

  it('rejects non-canonical source timestamps before an RPC request is sent', async () => {
    for (const value of nonCanonicalTimestamps) {
      const fetchImpl = vi.fn<typeof fetch>();
      await expect(
        registerAc265HostedArtifactSourceManifest(
          {
            supabaseUrl: `https://${projectRef}.supabase.co`,
            supabaseProjectRef: projectRef,
            serviceRoleKey: 'sb_secret_ac265-source-manifest-fixture',
            fetchImpl,
          },
          { ...request, sources: [{ ...source, expiresAt: value }] },
        ),
      ).rejects.toThrow(
        'AC265 hosted artifact-source manifest register failed',
      );
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});
