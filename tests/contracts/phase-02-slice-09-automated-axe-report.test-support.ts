import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
import { buildContentSchemaRegistryAutomatedAxeReport } from '../../infra/workflows/collect-content-schema-registry-axe-evidence.ts';

export const sourceRevision = 'a'.repeat(40);
export const deploymentId = '6328276096';
export const webOrigin = 'https://staging.wejamm.in';
export const startedAt = '2026-09-08T13:10:00.000Z';
export const completedAt = '2026-09-08T13:10:02.000Z';

export const emptyAxeResult = {
  violations: [],
  incomplete: [{ id: 'color-contrast' }],
  passes: [{ id: 'html-has-lang' }],
} as const;

export const report = buildContentSchemaRegistryAutomatedAxeReport({
  sourceRevision,
  environment: 'staging',
  deploymentId,
  webOrigin,
  browser: { name: 'chromium', version: '123.0.0.0' },
  startedAt,
  completedAt,
  pages: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.map((target) => ({
    requestedPath: target.requestedPath,
    finalPath: target.expectedFinalPath,
    httpStatus: target.expectedHttpStatus,
    coverage: target.coverage,
    axe: emptyAxeResult,
  })),
});

export const expectedIdentity = {
  sourceRevision,
  hostedEnvironment: 'staging' as const,
  hostedDeploymentId: deploymentId,
  hostedDeployedAt: '2026-09-08T13:00:00.000Z',
  trustedCutoffAt: '2026-09-08T13:11:00.000Z',
  webOrigin,
};
