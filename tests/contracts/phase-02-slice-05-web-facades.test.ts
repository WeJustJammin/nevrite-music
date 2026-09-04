import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const routes = [
  ['shadow-party-matches/index.ts', 'POST'],
  ['shadow-parties/[shadowId]/invitations.ts', 'POST'],
  ['shadow-remedies/index.ts', 'POST'],
  ['party-claims/index.ts', 'POST'],
  ['party-claims/[claimId].ts', 'GET'],
  ['party-claims/[claimId]/challenges.ts', 'POST'],
  ['party-claims/[claimId]/proofs.ts', 'POST'],
  ['party-claims/[claimId]/convert.ts', 'POST'],
] as const;

describe('P2-S05 mounted Astro profile API facades', () => {
  it('[P2-S05-AC-091..098] mounts all active PRF-API-01..08 routes with private forwarding', () => {
    for (const [relative, method] of routes) {
      const source = readFileSync(
        new URL(`../../apps/web/src/pages/api/v1/${relative}`, import.meta.url),
        'utf8',
      );
      expect(source).toContain('export const prerender = false');
      expect(source).toContain(`export const ${method}`);
      expect(source).toContain('forwardProfileOwnershipRequest');
    }
  });
});
