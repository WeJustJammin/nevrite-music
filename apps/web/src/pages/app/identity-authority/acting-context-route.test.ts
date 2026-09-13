import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const fromHere = (relative: string): string =>
  fileURLToPath(new URL(relative, import.meta.url));

describe('production identity authority acting-context route', () => {
  it('mounts the deliberate switcher with server self context as the SSR default', () => {
    const index = readFileSync(fromHere('./index.astro'), 'utf8');
    const readyShell = readFileSync(
      fromHere(
        '../../../components/identity-authority/IdentityAuthorityShellReady.astro',
      ),
      'utf8',
    );

    expect(index).toContain('selectedContextId');
    expect(index).toMatch(
      /contexts\.items\.find\(\s*\(item\)\s*=>\s*item\.partyId\s*===\s*personId\s*,?\s*\)/u,
    );
    expect(index).toContain('actingPartyId = personId');
    expect(index).not.toMatch(
      /contexts\.items\.find\(\s*\(item\)\s*=>\s*item\.selectable\s*\)\?\.partyId/u,
    );
    expect(readyShell).toContain('actingContexts');
    expect(readyShell).toContain('ActingContextSwitcherIsland');
    expect(readyShell).toContain('client:load');
    expect(readyShell).toContain('Server-selected context for this session');
  });
});
