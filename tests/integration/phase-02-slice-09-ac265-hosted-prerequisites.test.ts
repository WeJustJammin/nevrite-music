import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_ROLE_STORAGE_STATE_ENV,
  AC265_HOSTED_CONTROLS_BLOCKED_REASON,
  assertAc265HostedStorageStatePermissions,
  assertAc265HostedControlsApproved,
  validateAc265HostedPrerequisites,
} from '../e2e/support/ac265-hosted-prerequisites';
import { createAc265HostedPlaywrightConfig } from '../e2e/support/ac265-hosted-config';

const temporaryRoots: string[] = [];

const createFixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-ac265-hosted-'));
  temporaryRoots.push(root);
  const repositoryRoot = join(root, 'repository');
  const operatorStateRoot = join(root, 'operator-state');
  mkdirSync(repositoryRoot);
  mkdirSync(operatorStateRoot, { mode: 0o700 });
  const environment: Record<string, string | undefined> = {
    STAGING_WEB_ORIGIN: 'https://staging.wejammin.net',
  };

  for (const [role, variable] of Object.entries(
    AC265_HOSTED_ROLE_STORAGE_STATE_ENV,
  )) {
    const storageStatePath = join(operatorStateRoot, `${role}.json`);
    writeFileSync(storageStatePath, '{"cookies":[],"origins":[]}', {
      mode: 0o600,
    });
    environment[variable] = storageStatePath;
  }

  return { root, repositoryRoot, operatorStateRoot, environment };
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('AC265 hosted-runner prerequisites', () => {
  it('requires the explicit staging origin before role-state inputs', () => {
    const fixture = createFixture();
    const environment: Record<string, string | undefined> = {};

    expect(() =>
      validateAc265HostedPrerequisites(environment, fixture.repositoryRoot),
    ).toThrow(/STAGING_WEB_ORIGIN/u);
  });

  it.each([
    ['missing', undefined],
    ['loopback', 'https://127.0.0.1'],
    ['private network', 'https://10.20.30.40'],
    ['local hostname', 'https://localhost'],
    ['non-HTTPS', 'http://staging.wejammin.net'],
    ['path', 'https://staging.wejammin.net/app'],
    ['query', 'https://staging.wejammin.net?token=not-a-credential'],
    ['credentials', 'https://operator:pass@staging.wejammin.net'],
  ])('rejects an unsafe or implicit staging origin (%s)', (_label, origin) => {
    const fixture = createFixture();
    if (origin === undefined) delete fixture.environment.STAGING_WEB_ORIGIN;
    else fixture.environment.STAGING_WEB_ORIGIN = origin;

    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(/STAGING_WEB_ORIGIN/u);
  });

  it('requires one outside-repository storage-state file for every locked role', () => {
    const fixture = createFixture();
    const missingVariable = AC265_HOSTED_ROLE_STORAGE_STATE_ENV.admin_step_up;
    delete fixture.environment[missingVariable];

    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(missingVariable);
  });

  it('rejects role storage-state paths that resolve to the same file', () => {
    const fixture = createFixture();
    const aliasRoot = join(fixture.root, 'operator-state-alias');
    symlinkSync(fixture.operatorStateRoot, aliasRoot, 'dir');
    fixture.environment[AC265_HOSTED_ROLE_STORAGE_STATE_ENV.entitled_read] =
      join(aliasRoot, 'owner_full.json');

    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(/distinct/u);
  });

  it('rejects repository-local and symlinked role state files', () => {
    const fixture = createFixture();
    const variable = AC265_HOSTED_ROLE_STORAGE_STATE_ENV.owner_full;
    const repositoryStatePath = join(fixture.repositoryRoot, 'owner.json');
    writeFileSync(repositoryStatePath, '{"cookies":[],"origins":[]}', {
      mode: 0o600,
    });
    fixture.environment[variable] = repositoryStatePath;
    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(/outside the repository/u);

    const outsideStatePath =
      fixture.environment[AC265_HOSTED_ROLE_STORAGE_STATE_ENV.owner_full];
    if (outsideStatePath === undefined)
      throw new Error('fixture state missing');
    const symlinkPath = join(fixture.root, 'owner-link.json');
    symlinkSync(outsideStatePath, symlinkPath);
    fixture.environment[variable] = symlinkPath;
    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(/non-symlink/u);
  });

  it.each([
    ['missing owner read', 0o200],
    ['group read', 0o640],
    ['other read', 0o604],
  ])('rejects storage-state permissions with %s on POSIX', (_label, mode) => {
    if (process.platform === 'win32') return;
    const fixture = createFixture();
    const variable = AC265_HOSTED_ROLE_STORAGE_STATE_ENV.entitled_read;
    const statePath = fixture.environment[variable];
    if (statePath === undefined) throw new Error('fixture state missing');
    chmodSync(statePath, mode);

    expect(() =>
      validateAc265HostedPrerequisites(
        fixture.environment,
        fixture.repositoryRoot,
      ),
    ).toThrow(/owner-readable with no group or other permissions/u);
  });

  it('blocks Windows because portable owner-only ACL verification is unavailable', () => {
    expect(() =>
      assertAc265HostedStorageStatePermissions(
        'AC265_STORAGE_STATE_OWNER_FULL',
        0o600,
        'win32',
      ),
    ).toThrow(/Windows.*cannot be verified portably/u);
  });

  it('accepts owner-readable POSIX state with no group or other permissions', () => {
    expect(() =>
      assertAc265HostedStorageStatePermissions(
        'AC265_STORAGE_STATE_OWNER_FULL',
        0o400,
        'linux',
      ),
    ).not.toThrow();
    expect(() =>
      assertAc265HostedStorageStatePermissions(
        'AC265_STORAGE_STATE_OWNER_FULL',
        0o600,
        'linux',
      ),
    ).not.toThrow();
  });

  it('returns the canonical origin and exact role paths without reading state contents', () => {
    const fixture = createFixture();
    fixture.environment.STAGING_WEB_ORIGIN = 'https://staging.wejammin.net/';

    const inputs = validateAc265HostedPrerequisites(
      fixture.environment,
      fixture.repositoryRoot,
    );

    expect(inputs.webOrigin).toBe('https://staging.wejammin.net');
    expect(Object.keys(inputs.storageStatePaths).sort()).toEqual(
      Object.keys(AC265_HOSTED_ROLE_STORAGE_STATE_ENV).sort(),
    );
    expect(inputs.storageStatePaths.owner_full).toBe(
      fixture.environment[AC265_HOSTED_ROLE_STORAGE_STATE_ENV.owner_full],
    );
  });

  it('blocks execution while the approved role-authority and fault-control contract is absent', () => {
    expect(assertAc265HostedControlsApproved).toThrow(
      AC265_HOSTED_CONTROLS_BLOCKED_REASON,
    );
  });
});

describe('AC265 hosted Playwright configuration', () => {
  it('targets only the dedicated hosted suite and disables every browser artifact', () => {
    const config = createAc265HostedPlaywrightConfig(
      'https://staging.wejammin.net',
    );

    expect(config.testDir).toBe('./tests/e2e');
    expect(config.testMatch).toEqual(['**/*.ac265-hosted.spec.ts']);
    expect('webServer' in config).toBe(false);
    expect(config.globalSetup).toBe(
      './tests/e2e/support/ac265-hosted-global-setup.ts',
    );
    expect(config.use).toMatchObject({
      baseURL: 'https://staging.wejammin.net',
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    });
    expect(config.retries).toBe(0);
    expect(config.workers).toBe(1);
    expect(config.fullyParallel).toBe(false);
  });
});
