import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION,
  ContentSchemaRegistryHostedRunnerContractSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';

const uuidFor = (index: number): string =>
  `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
const digest = 'a'.repeat(64);
const outageLeaseRef = `ac265-lease://staging/${uuidFor(300)}`;
const outageLeaseSha256 = createHash('sha256')
  .update(outageLeaseRef)
  .digest('hex');

const resourceRefs = [
  'content_schema',
  'staff_case',
  'organization',
  'prerequisite',
].map((kind, index) => ({
  kind,
  ref: `ac265-resource://${kind}/${uuidFor(index + 1)}`,
  sha256: digest,
}));

const runnerContract = (): Record<string, unknown> => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION,
  runId: '10000000-0000-4000-8000-000000000001',
  identity: {
    environment: 'staging',
    ciRunId: '34751474024',
    ciRunAttempt: 2,
    stagingRunId: '34751910125',
    stagingRunAttempt: 1,
    sourceRevision: 'a'.repeat(40),
    deploymentId: 'deployment-33460000000',
    deployedAt: '2026-09-03T10:25:00.000Z',
    buildId: 'build-34751474024-2',
    buildManifestSha256: digest,
    artifactSha256: digest,
    hostingAccountId: 'b'.repeat(32),
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: 'abcdefghijklmnopqrst',
    migrationVersion: '20260903120000',
    migrationSha256: digest,
    webOrigin: 'https://staging.wejamm.in',
    apiOrigin: 'https://wejammin-api-staging.wejammin.workers.dev',
    supabaseOrigin: 'https://abcdefghijklmnopqrst.supabase.co',
  },
  sessionHandles: Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => [
      role,
      {
        ref: `ac265-session://${role}/${uuidFor(index + 20)}`,
        sha256: digest,
      },
    ]),
  ),
  resourceRefs,
  controls: {
    googleMode: 'fresh_google_oauth_through_supabase',
    logoutScope: 'current_session_only',
    faultControlMode: 'staging_one_use_lease',
    subjectPolicy: 'existing_adults_only',
    resourcePolicy: 'preexisting_synthetic_staging_only',
    authorityPolicy: 'server_verified_no_grant_mutation',
    rateLimitMaxRequests: 121,
    dependencyOutageLeaseSeconds: 60,
    dependencyOutageMaxRequests: 1,
  },
});

const issuePaths = (candidate: unknown): string[] => {
  const result =
    ContentSchemaRegistryHostedRunnerContractSchema.safeParse(candidate);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.'));
};

const scenarioParameters = () => ({
  // FE03 locks the breakpoint bands and the 320px mobile no-overflow floor.
  // These values sample those source-defined limits; they are not display-derived.
  viewportWidthsCssPx: { mobile: 320, tablet: 769, desktop: 1025 },
  rateLimit429: {
    target: {
      operationId: 'CMS-03A-06',
      method: 'GET',
      path: '/api/v1/cms/content-types',
      rateClass: 'cms-definition-read',
      perUserPerMinute: 120,
    },
    maxRequests: 121,
  },
  // The contract must require these fields. No outage dependency or route is
  // supplied here because the locked specs do not identify a safe fault target.
  dependencyOutage: { route: {} },
});

const completeScenarioParameters = () => ({
  ...scenarioParameters(),
  dependencyOutage: {
    dependencyId: 'approved-staging-dependency',
    route: {
      operationId: 'AC265-STAGING-FAULT-READ',
      method: 'GET',
      path: '/api/v1/ac265/fault-probe',
    },
    leaseSeconds: 60,
    maxRequests: 1,
    outageLease: {
      ref: outageLeaseRef,
      sha256: outageLeaseSha256,
      acquiredAt: '2026-09-03T10:59:00.000Z',
      expiresAt: '2026-09-03T10:59:50.000Z',
    },
  },
});

const allToAllResourceBindings = (): Record<string, string[]> =>
  Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
      role,
      resourceRefs.map(({ ref }) => ref),
    ]),
  );

const allRolesForEveryScenario = (): Record<string, string[]> =>
  Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario) => [
      scenario,
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES],
    ]),
  );

describe('AC265 hosted runner scenario parameters', () => {
  it('requires source-bounded scenarios and explicit complete role/resource mappings', () => {
    const paths = issuePaths(runnerContract());

    expect(paths).toEqual(
      expect.arrayContaining([
        'scenarioParameters',
        'roleResourceBindings',
        'scenarioRoleBindings',
      ]),
    );
  });

  it('rejects viewport widths outside the FE03 mobile, tablet, and desktop bands', () => {
    const base = runnerContract();
    const invalidWidths = [
      { mobile: 769, tablet: 769, desktop: 1025, field: 'mobile' },
      { mobile: 320, tablet: 768, desktop: 1025, field: 'tablet' },
      { mobile: 320, tablet: 1024, desktop: 1024, field: 'desktop' },
    ];

    for (const widths of invalidWidths) {
      const paths = issuePaths({
        ...base,
        scenarioParameters: {
          ...scenarioParameters(),
          viewportWidthsCssPx: {
            mobile: widths.mobile,
            tablet: widths.tablet,
            desktop: widths.desktop,
          },
        },
      });

      expect(paths).toContain(
        `scenarioParameters.viewportWidthsCssPx.${widths.field}`,
      );
    }
  });

  it('pins the safe 120-per-user read route and caps its 429 probe at request 121', () => {
    const base = runnerContract();
    const wrongTarget = {
      ...scenarioParameters(),
      rateLimit429: {
        target: {
          operationId: 'CMS-03A-01',
          method: 'POST',
          path: '/api/v1/cms/content-types',
          rateClass: 'cms-definition-write',
          perUserPerMinute: 30,
        },
        maxRequests: 121,
      },
    };
    const overCap = {
      ...scenarioParameters(),
      rateLimit429: {
        ...scenarioParameters().rateLimit429,
        maxRequests: 122,
      },
    };

    expect(issuePaths({ ...base, scenarioParameters: wrongTarget })).toContain(
      'scenarioParameters.rateLimit429.target.operationId',
    );
    expect(issuePaths({ ...base, scenarioParameters: overCap })).toContain(
      'scenarioParameters.rateLimit429.maxRequests',
    );
  });

  it('requires one explicit outage dependency, deployed route, and bounded one-request lease', () => {
    const base = runnerContract();
    const paths = issuePaths({
      ...base,
      scenarioParameters: scenarioParameters(),
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        'scenarioParameters.dependencyOutage.dependencyId',
        'scenarioParameters.dependencyOutage.route.operationId',
        'scenarioParameters.dependencyOutage.route.method',
        'scenarioParameters.dependencyOutage.route.path',
        'scenarioParameters.dependencyOutage.leaseSeconds',
        'scenarioParameters.dependencyOutage.maxRequests',
      ]),
    );
  });

  it('requires a distinct, declared safe resource binding for every locked role', () => {
    const base = runnerContract();
    const missingRole = allToAllResourceBindings();
    delete missingRole['forbidden_hidden'];
    const pathsForMissingRole = issuePaths({
      ...base,
      scenarioParameters: completeScenarioParameters(),
      roleResourceBindings: missingRole,
      scenarioRoleBindings: allRolesForEveryScenario(),
    });

    const unknownResource = allToAllResourceBindings();
    unknownResource['entitled_read'] = [
      'ac265-resource://content_schema/00000000-0000-4000-8000-999999999999',
    ];
    const pathsForUnknownResource = issuePaths({
      ...base,
      scenarioParameters: completeScenarioParameters(),
      roleResourceBindings: unknownResource,
      scenarioRoleBindings: allRolesForEveryScenario(),
    });

    expect(pathsForMissingRole).toContain(
      'roleResourceBindings.forbidden_hidden',
    );
    expect(pathsForUnknownResource).toContain(
      'roleResourceBindings.entitled_read',
    );
  });

  it('requires all ten scenarios to bind at least one distinct known role', () => {
    const base = runnerContract();
    const missingScenario = allRolesForEveryScenario();
    delete missingScenario['dependency_outage'];
    const emptyRoles = allRolesForEveryScenario();
    emptyRoles['idp_sign_in'] = [];
    const duplicateRole = allRolesForEveryScenario();
    duplicateRole['rate_limit_429'] = ['owner_full', 'owner_full'];
    const unknownRole = allRolesForEveryScenario();
    unknownRole['dependency_outage'] = ['unlocked_role'];

    for (const [bindings, expectedPath] of [
      [missingScenario, 'scenarioRoleBindings.dependency_outage'],
      [emptyRoles, 'scenarioRoleBindings.idp_sign_in'],
      [duplicateRole, 'scenarioRoleBindings.rate_limit_429'],
      [unknownRole, 'scenarioRoleBindings.dependency_outage.0'],
    ] as const) {
      expect(
        issuePaths({
          ...base,
          scenarioParameters: completeScenarioParameters(),
          roleResourceBindings: allToAllResourceBindings(),
          scenarioRoleBindings: bindings,
        }),
      ).toContain(expectedPath);
    }
  });

  it('rejects duplicated control limits that diverge from scenario parameters', () => {
    const base = runnerContract();
    const controls = base.controls as Record<string, unknown>;
    const valid = {
      ...base,
      scenarioParameters: completeScenarioParameters(),
      roleResourceBindings: allToAllResourceBindings(),
      scenarioRoleBindings: allRolesForEveryScenario(),
    };

    expect(
      issuePaths({
        ...valid,
        controls: { ...controls, rateLimitMaxRequests: 120 },
      }),
    ).toContain('controls.rateLimitMaxRequests');
    expect(
      issuePaths({
        ...valid,
        controls: { ...controls, dependencyOutageLeaseSeconds: 59 },
      }),
    ).toContain('controls.dependencyOutageLeaseSeconds');
  });
});
