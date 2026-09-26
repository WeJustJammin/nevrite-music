import { expect, test, type Page } from '@playwright/test';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-role';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common';
import {
  AC265_HOSTED_ROLE_STORAGE_STATE_ENV,
  type Ac265HostedRole,
} from './support/ac265-hosted-prerequisites';

/**
 * Genuinely hosted AC265 role matrix.
 *
 * This suite runs only through playwright.s09-hosted.config.ts against the
 * public staging origin. It never intercepts a route, never starts a local
 * server process, and never reuses the local registry fixture: the only
 * authority is the protected storage-state session resolved by the server.
 *
 * The assertions are intentionally class-level. The approved contracts lock
 * each role to an assertion class (authorized_access / denied_no_disclosure /
 * disabled_no_mutation); they do NOT lock a role-to-presentation-variant map,
 * so this spec must not invent one.
 */

const REGISTRY_PATH = '/app/cms-content-modeling';
const WORKBENCH = '[data-workbench="content-schema-registry"]';
const MUTATION_CONTROL = 'form, input, select, textarea, button[type="submit"]';
const MUTATION_METHOD = /^(?:POST|PUT|PATCH|DELETE)$/u;
// Protected CMS registry namespace. The locked human mutation operations
// (CMS-03A-01..04) all live under `/api/v1/cms/`, and the Astro registry page
// at REGISTRY_PATH accepts a POST that forwards CMS-03A-01, so a protected SSR
// mutation can also target the page path or one of its child paths. Scoping the
// observer to these paths avoids false positives from unrelated
// POST/PUT/PATCH/DELETE traffic (session refresh, telemetry) on page load.
const CMS_MUTATION_PREFIX = '/api/v1/cms/';
const isProtectedMutationPath = (pathname: string): boolean =>
  pathname.startsWith(CMS_MUTATION_PREFIX) ||
  pathname === REGISTRY_PATH ||
  pathname.startsWith(`${REGISTRY_PATH}/`);

type HostedRoleAssertion =
  (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS)[Ac265HostedRole];

// Explicit, auditable coverage of every locked role. The contract-equality
// test below fails closed if this drifts from the approved assertion policy.
const ROLE_ASSERTION_MATRIX = [
  ['entitled_read', 'authorized_access'],
  ['owner_full', 'authorized_access'],
  ['guardian_mandate', 'denied_no_disclosure'],
  ['junior_restricted', 'denied_no_disclosure'],
  ['business_mandate', 'denied_no_disclosure'],
  ['staff_case_scoped', 'authorized_access'],
  ['admin_step_up', 'authorized_access'],
  ['forbidden_hidden', 'denied_no_disclosure'],
  ['disabled_prerequisite', 'disabled_no_mutation'],
] as const satisfies ReadonlyArray<
  readonly [Ac265HostedRole, HostedRoleAssertion]
>;

const storageStatePathFor = (role: Ac265HostedRole): string => {
  const variable = AC265_HOSTED_ROLE_STORAGE_STATE_ENV[role];
  const value = process.env[variable];
  if (value === undefined || value.length === 0)
    throw new Error(
      `${variable} must name the protected storage-state file for the ${role} hosted session.`,
    );
  return value;
};

const collectMutationRequests = (page: Page): string[] => {
  const mutationRequests: string[] = [];
  page.on('request', (request) => {
    if (!MUTATION_METHOD.test(request.method())) return;
    let pathname: string;
    try {
      pathname = new URL(request.url()).pathname;
    } catch {
      return;
    }
    if (!isProtectedMutationPath(pathname)) return;
    // Retain only the HTTP verb. Storing the URL/path would echo protected CMS
    // resource identifiers into the failure output of a security assertion.
    mutationRequests.push(request.method());
  });
  return mutationRequests;
};

test('[P2-S09-AC-265] the locked role matrix matches the approved assertion contract', async () => {
  expect(
    ROLE_ASSERTION_MATRIX.map(([role, assertion]) => [role, assertion]),
  ).toEqual(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
      role,
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS[role],
    ]),
  );
});

for (const [role, assertion] of ROLE_ASSERTION_MATRIX) {
  test.describe(`[P2-S09-AC-265] hosted role ${role} (${assertion})`, () => {
    test.use({ storageState: storageStatePathFor(role) });

    test(`${assertion} via the live staging authority`, async ({ page }) => {
      const mutationRequests = collectMutationRequests(page);

      const response = await page.goto(REGISTRY_PATH, {
        waitUntil: 'domcontentloaded',
      });
      expect(response, `${role} must receive a hosted response`).not.toBeNull();
      const status = response?.status() ?? 0;

      // A protected session must never fall back to the sign-in redirect in
      // place of an authority decision.
      expect(
        new URL(page.url()).pathname.startsWith('/auth/sign-in'),
        `${role} protected session must not land on sign-in`,
      ).toBe(false);

      if (assertion === 'authorized_access') {
        expect(status, `${role} authorized response`).toBe(200);
        const workbench = page.locator(WORKBENCH);
        await expect(workbench, `${role} workbench`).toHaveCount(1);
        await expect(workbench).toHaveAttribute(
          'data-role-policy',
          'server-authoritative',
        );
        await expect(workbench).toHaveAttribute(
          'data-access',
          /^(?:full|read-only)$/u,
        );
        // The hydrated marker only proves the client island hydrated against
        // the server response; it does NOT by itself prove actor or
        // acting-party authority. Real authority is the server-authoritative
        // response above, corroborated by the absence of any route
        // interception plus the separate receipt/RLS evidence that this
        // browser spec cannot produce.
        await expect(workbench).toHaveAttribute(
          'data-content-schema-registry-hydrated',
          'true',
          { timeout: 30_000 },
        );
        await expect(
          page.getByRole('heading', {
            level: 1,
            name: 'Content schema registry',
          }),
        ).toBeVisible();
        await expect(page.locator('[data-variant="disabled"]')).toHaveCount(0);
        expect(mutationRequests).toEqual([]);
        return;
      }

      if (assertion === 'disabled_no_mutation') {
        // FE03 locked named variant: the disabled prerequisite gate. The
        // hosted route mounts ContentSchemaRegistryWorkbenchIsland, whose
        // disabled gate forwards the server presentation variant as the reason
        // code; the server emits "disabledPrerequisite" for this class, so the
        // hosted gate renders data-reason-code="disabledPrerequisite". (The
        // directly-rendered ContentSchemaRegistryWorkbench fixture instead emits
        // SCHEMA_REGISTRY_UNAVAILABLE, but that component is not mounted on this
        // route.)
        const gate = page.locator('[data-variant="disabled"]');
        await expect(gate, `${role} disabled gate`).toHaveCount(1);
        await expect(gate).toBeVisible();
        await expect(gate).toHaveAttribute('role', 'status');
        await expect(gate).toHaveAttribute(
          'data-reason-code',
          'disabledPrerequisite',
        );
        await expect(gate).toContainText('Schema changes unavailable');
        await expect(page.locator(WORKBENCH)).toHaveCount(0);
        await expect(page.locator('[data-access="full"]')).toHaveCount(0);
        await expect(page.locator(MUTATION_CONTROL)).toHaveCount(0);
        await expect(page.getByRole('table')).toHaveCount(0);
        expect(mutationRequests).toEqual([]);
        return;
      }

      // denied_no_disclosure: guardian_mandate, junior_restricted,
      // business_mandate, forbidden_hidden. A rendered protected read-only
      // projection is NOT acceptable, so assert the class-level invariant:
      // no protected workbench, table, rows, disclosure labels, or controls,
      // and no mutation request. A hard 403/404 or a safe denial shell (200)
      // both satisfy non-disclosure.
      expect(
        [200, 403, 404].includes(status),
        `${role} denial response (${status})`,
      ).toBe(true);
      await expect(page.locator(WORKBENCH)).toHaveCount(0);
      await expect(page.locator('[data-access="read-only"]')).toHaveCount(0);
      await expect(page.locator('[data-access="full"]')).toHaveCount(0);
      await expect(page.getByRole('table')).toHaveCount(0);
      await expect(page.locator('tbody tr')).toHaveCount(0);
      await expect(
        page.getByRole('link', { name: 'View details' }),
      ).toHaveCount(0);
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator(MUTATION_CONTROL)).toHaveCount(0);
      await expect(
        page.getByText('Registry records', { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText('Content schema registry', { exact: true }),
      ).toHaveCount(0);
      expect(mutationRequests).toEqual([]);
    });
  });
}
