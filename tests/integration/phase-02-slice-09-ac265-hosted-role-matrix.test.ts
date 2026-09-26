import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-role';
import {
  AC265_HOSTED_ROLE_STORAGE_STATE_ENV,
  assertAc265HostedControlsApproved,
} from '../e2e/support/ac265-hosted-prerequisites';

const HOSTED_SPEC_PATH = new URL(
  '../e2e/phase-02-slice-09-ac265-hosted-role-matrix.ac265-hosted.spec.ts',
  import.meta.url,
);
const GLOBAL_SETUP_PATH = new URL(
  '../e2e/support/ac265-hosted-global-setup.ts',
  import.meta.url,
);

// Read the hosted spec as text: it is a protected staging artifact that must
// never be imported (and therefore never executed) by the local unit runner.
const readSource = (url: URL): string => {
  try {
    return readFileSync(url, 'utf8');
  } catch {
    return '';
  }
};

const hostedSpecSource = readSource(HOSTED_SPEC_PATH);

// Role-shaped presentation variants that the hosted class-level assertions must
// never pin per role. `disabledPrerequisite` is intentionally excluded: FE03
// locks it as the server reason code for the disabled class, so the hosted spec
// asserts that literal (see the dedicated test below) rather than a role map.
const ROLE_SHAPED_PRESENTATION_VARIANTS = [
  'entitledRead',
  'ownerFull',
  'guardianMandate',
  'juniorRestricted',
  'businessMandate',
  'staffCaseScoped',
  'adminStepUp',
  'forbiddenHidden',
] as const;

const DISABLED_REASON_CODE = 'disabledPrerequisite';

const FORBIDDEN_AUTHORING = [
  'page.route(',
  'routeFromHAR',
  'webServer',
  'setRegistryFixture',
  'phase-02-slice-09-content-schema-registry.fixture',
  'page.setContent',
] as const;

describe('[P2-S09-AC-265] hosted role-matrix spec contract', () => {
  it('ships a browser spec inside the isolated hosted-only namespace', () => {
    expect(HOSTED_SPEC_PATH.pathname.endsWith('.ac265-hosted.spec.ts')).toBe(
      true,
    );
    expect(hostedSpecSource.length).toBeGreaterThan(0);
  });

  it('exercises every locked hosted role', () => {
    for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
      expect(hostedSpecSource, role).toContain(role);
  });

  it('derives each role expectation from the locked assertion contract', () => {
    expect(hostedSpecSource).toContain(
      'CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS',
    );
    for (const assertion of new Set(
      Object.values(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS),
    ))
      expect(hostedSpecSource, assertion).toContain(assertion);
  });

  it('loads protected storage state from the approved role variables', () => {
    expect(hostedSpecSource).toContain('AC265_HOSTED_ROLE_STORAGE_STATE_ENV');
    expect(hostedSpecSource).toContain('storageState');
    expect(Object.keys(AC265_HOSTED_ROLE_STORAGE_STATE_ENV)).toHaveLength(
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length,
    );
  });

  it('never intercepts a route, reuses a fixture, or mounts a local server', () => {
    for (const forbidden of FORBIDDEN_AUTHORING)
      expect(hostedSpecSource, forbidden).not.toContain(forbidden);
  });

  it('does not hard-code a role-to-presentation-variant map', () => {
    expect(hostedSpecSource).not.toContain('presentationVariant');
    for (const variant of ROLE_SHAPED_PRESENTATION_VARIANTS)
      expect(hostedSpecSource, variant).not.toContain(variant);
  });

  it('asserts the FE03-locked disabled reason code without a role map', () => {
    expect(hostedSpecSource).toContain(DISABLED_REASON_CODE);
  });

  it('scopes mutation recording to protected CMS routes without echoing paths', () => {
    expect(hostedSpecSource).toContain("'/api/v1/cms/'");
    // The Astro registry page forwards CMS-03A-01, so the page path and its
    // children must also be observed.
    expect(hostedSpecSource).toContain('isProtectedMutationPath');
    expect(hostedSpecSource).toContain('push(request.method())');
    // Only the verb is retained; a stored URL/path could echo protected CMS
    // resource identifiers into the failure output of a security assertion.
    expect(hostedSpecSource).not.toContain(
      '${request.method()} ${new URL(request.url()).pathname}',
    );
  });

  it('leaves every browser evidence artifact disabled', () => {
    for (const artifact of ['screenshot:', 'video:', 'trace:'])
      expect(hostedSpecSource, artifact).not.toContain(artifact);
  });

  it('asserts the server-authoritative projection from the live response', () => {
    expect(hostedSpecSource).toContain('data-workbench');
    expect(hostedSpecSource).toContain('data-role-policy');
    expect(hostedSpecSource).toContain('server-authoritative');
    expect(hostedSpecSource).toContain("page.on('request'");
  });

  it('keeps the unconditional hosted-controls guard in the shared setup', () => {
    expect(assertAc265HostedControlsApproved).toThrow();
    expect(readSource(GLOBAL_SETUP_PATH)).toContain(
      'assertAc265HostedControlsApproved()',
    );
  });
});
