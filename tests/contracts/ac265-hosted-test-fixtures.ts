import { createHash } from 'node:crypto';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
  type ContentSchemaRegistryHostedE2eReportV3,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
  CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';

export type HostedRole = (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number];
export type HostedScenario =
  (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS)[number];
export type RoleAssertion =
  ContentSchemaRegistryHostedE2eReportV3['roles'][number]['assertion'];

export const sourceRevision = 'a'.repeat(40);
export const deploymentId = 'deployment-33460000000';
export const migrationVersion = '20260903120000';
export const runId = '10000000-0000-4000-8000-000000000001';

export const uuidFor = (index: number): string =>
  `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
export const digestFor = (index: number): string =>
  (index % 16).toString(16).repeat(64);
export const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');
export const jsonBytes = (value: unknown): Uint8Array =>
  Buffer.from(JSON.stringify(value) ?? 'null', 'utf8');
export const sha256Ref = (ref: string): string =>
  sha256(Buffer.from(ref, 'utf8'));

export const identity: ContentSchemaRegistryHostedRunnerContract['identity'] = {
  environment: 'staging',
  ciRunId: '34751474024',
  ciRunAttempt: 2,
  stagingRunId: '34751910125',
  stagingRunAttempt: 1,
  sourceRevision,
  deploymentId,
  deployedAt: '2026-09-03T10:25:00.000Z',
  buildId: 'build-34751474024-2',
  buildManifestSha256: digestFor(50),
  artifactSha256: digestFor(51),
  hostingAccountId: 'b'.repeat(32),
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: 'abcdefghijklmnopqrst',
  migrationVersion,
  migrationSha256: digestFor(52),
  webOrigin: 'https://staging.wejamm.in',
  apiOrigin: 'https://wejammin-api-staging.wejammin.workers.dev',
  supabaseOrigin: 'https://abcdefghijklmnopqrst.supabase.co',
};

export const roleAssertions: Record<HostedRole, RoleAssertion> = {
  entitled_read: 'authorized_access',
  owner_full: 'authorized_access',
  guardian_mandate: 'denied_no_disclosure',
  junior_restricted: 'denied_no_disclosure',
  business_mandate: 'denied_no_disclosure',
  staff_case_scoped: 'authorized_access',
  admin_step_up: 'authorized_access',
  forbidden_hidden: 'denied_no_disclosure',
  disabled_prerequisite: 'disabled_no_mutation',
};

export const sessionHandles = Object.fromEntries(
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => {
    const ref = `ac265-session://${role}/${uuidFor(index + 1)}`;
    return [role, { ref, sha256: sha256Ref(ref) }];
  }),
) as ContentSchemaRegistryHostedRunnerContract['sessionHandles'];

export const resourceRefs = CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.map(
  (kind, index) => {
    const ref = `ac265-resource://${kind}/${uuidFor(index + 20)}`;
    return { kind, ref, sha256: sha256Ref(ref) };
  },
) as ContentSchemaRegistryHostedRunnerContract['resourceRefs'];

export const runnerContract = (
  overrides: Partial<ContentSchemaRegistryHostedRunnerContract> = {},
): ContentSchemaRegistryHostedRunnerContract => {
  const effectiveResources = overrides.resourceRefs ?? resourceRefs;
  const resourceReference = (
    kind: (typeof effectiveResources)[number]['kind'],
  ) => {
    const resource = effectiveResources.find(
      (candidate) => candidate.kind === kind,
    );
    if (resource === undefined)
      throw new Error(`Missing hosted test resource kind: ${kind}`);
    return resource.ref;
  };

  return {
    schemaVersion:
      CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION,
    criterion: 'P2-S09-AC-265',
    runId,
    identity,
    sessionHandles,
    resourceRefs: effectiveResources,
    scenarioParameters: {
      viewportWidthsCssPx: { mobile: 320, tablet: 769, desktop: 1_025 },
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
      dependencyOutage: {
        dependencyId: 'supabase-auth',
        route: {
          operationId: 'CMS-03A-06',
          method: 'GET',
          path: '/api/v1/cms/content-types',
        },
        leaseSeconds: 60,
        maxRequests: 1,
        outageLease: {
          ref: `ac265-lease://staging/${uuidFor(300)}`,
          sha256: sha256Ref(`ac265-lease://staging/${uuidFor(300)}`),
          acquiredAt: '2026-09-03T10:59:00.000Z',
          expiresAt: '2026-09-03T10:59:50.000Z',
        },
      },
    },
    roleResourceBindings: Object.fromEntries([
      ['entitled_read', [resourceReference('content_schema')]],
      ['owner_full', [resourceReference('organization')]],
      ['guardian_mandate', [resourceReference('content_schema')]],
      ['junior_restricted', [resourceReference('content_schema')]],
      ['business_mandate', [resourceReference('organization')]],
      ['staff_case_scoped', [resourceReference('staff_case')]],
      ['admin_step_up', [resourceReference('organization')]],
      ['forbidden_hidden', [resourceReference('content_schema')]],
      ['disabled_prerequisite', [resourceReference('prerequisite')]],
    ] as const) as ContentSchemaRegistryHostedRunnerContract['roleResourceBindings'],
    scenarioRoleBindings: Object.fromEntries(
      CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario) => [
        scenario,
        [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES],
      ]),
    ) as ContentSchemaRegistryHostedRunnerContract['scenarioRoleBindings'],
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
    ...overrides,
  };
};

export const makeContract = runnerContract;

export const serverReceipt = (index: number) => ({
  ref: `ac265-receipt://server/${uuidFor(index + 100)}`,
  sha256: digestFor(index + 100),
});

const schemaOnlyExecutionEvidence = <
  Kind extends 'role_assertion' | 'scenario_observation' | 'session_teardown',
>(
  kind: Kind,
  index: number,
) => ({
  kind,
  ref: `ac265-evidence://blob/${uuidFor(index + 10_000)}`,
  sha256: digestFor(index + 10_000),
});

export const hostedReportV3 = (
  runnerContractBytes?: Uint8Array,
): ContentSchemaRegistryHostedE2eReportV3 => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
  runId,
  ...identity,
  idpProvider: 'google',
  startedAt: '2026-09-03T10:30:00.000Z',
  completedAt: '2026-09-03T11:00:00.000Z',
  outcome: 'passed',
  redacted: true,
  runnerContractSha256:
    runnerContractBytes === undefined
      ? digestFor(5)
      : sha256(runnerContractBytes),
  candidateIdentityReceipt: serverReceipt(50),
  roles: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => ({
    role,
    assertion: roleAssertions[role],
    outcome: 'passed',
    durationMs: 1,
    serverReceipt: serverReceipt(index),
    ...(roleAssertions[role] === 'authorized_access'
      ? {}
      : {
          beforeStateSha256: digestFor(index + 60),
          afterStateSha256: digestFor(index + 60),
        }),
    executionEvidence: [schemaOnlyExecutionEvidence('role_assertion', index)],
  })),
  scenarios: CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map(
    (scenario, index) => ({
      scenario,
      outcome: 'passed',
      durationMs: 1,
      serverReceipt: serverReceipt(index + 20),
      browserObservationSha256: digestFor(index + 80),
      executionEvidence: [
        schemaOnlyExecutionEvidence('scenario_observation', index + 100),
      ],
    }),
  ),
  cleanup: {
    outcome: 'passed',
    completedAt: '2026-09-03T11:00:00.000Z',
    verifiedResources: resourceRefs,
    outageLeaseReleased: true,
    dependencyRecovered: true,
    logoutPolicy: 'current_session_only',
    sessionTeardowns: Object.fromEntries(
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => [
        role,
        {
          sessionRefSha256: sessionHandles[role].sha256,
          outcome: 'logged_out',
          evidence: schemaOnlyExecutionEvidence(
            'session_teardown',
            index + 200,
          ),
        },
      ]),
    ),
    currentSessionsLoggedOut: 9,
    sessionMaterialDestroyed: true,
    serverReceipt: serverReceipt(40),
  },
});
