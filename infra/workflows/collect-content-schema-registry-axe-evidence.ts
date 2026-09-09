import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';

import { ContentSchemaRegistryAutomatedAxeReportSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-axe-report.ts';
import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
import {
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { SafeReleaseIdSchema } from '../../packages/contracts/src/release-recovery-common.ts';

import { launchPinnedPlaywrightChromium } from './content-schema-registry-axe-browser.ts';
import {
  assertExpectedAxeNavigation,
  assertExpectedReleaseHeader,
  blockCrossOriginDocumentRequests,
  relativePathFromHostedUrl,
  waitForExpectedReleaseNavigation,
} from './content-schema-registry-axe-navigation.ts';
import {
  buildContentSchemaRegistryAutomatedAxeReport,
  type AxeAnalysisResult,
} from './content-schema-registry-axe-report-builder.ts';
import {
  resolveReportRoot,
  writeReportAtomically,
} from './content-schema-registry-axe-report-files.ts';

export { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
export {
  assertExpectedAxeNavigation,
  assertExpectedReleaseHeader,
  blockCrossOriginDocumentRequests,
  isApprovedHostedDocumentUrl,
  relativePathFromHostedUrl,
  targetForRequestedPath,
  waitForExpectedReleaseNavigation,
} from './content-schema-registry-axe-navigation.ts';
export {
  buildContentSchemaRegistryAutomatedAxeReport,
  summarizeAxeResult,
} from './content-schema-registry-axe-report-builder.ts';
export { resolveReportRoot } from './content-schema-registry-axe-report-files.ts';
export type {
  AxeAnalysisResult,
  AxePageInput,
} from './content-schema-registry-axe-report-builder.ts';

const requiredEnvironment = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.length === 0)
    throw new Error(`${name} is required`);
  return value;
};

const parseEnvironment = (): {
  sourceRevision: string;
  deploymentId: string;
  webOrigin: string;
  reportRoot: string;
  workspaceRoot: string;
} => {
  const sourceRevision = requiredEnvironment('SOURCE_REVISION');
  const deploymentId = requiredEnvironment('STAGING_DEPLOYMENT_ID');
  const webOrigin = requiredEnvironment('STAGING_WEB_ORIGIN');
  const workspaceRoot = requiredEnvironment('GITHUB_WORKSPACE');
  if (!ReleaseEvidenceSourceRevisionSchema.safeParse(sourceRevision).success)
    throw new Error('SOURCE_REVISION must be a lowercase 40-character SHA');
  if (!SafeReleaseIdSchema.safeParse(deploymentId).success)
    throw new Error('STAGING_DEPLOYMENT_ID is invalid');
  if (!ReleaseEvidenceHostedOriginSchema.safeParse(webOrigin).success)
    throw new Error('STAGING_WEB_ORIGIN must be a public HTTPS origin');
  resolveReportRoot('promotion-candidate', workspaceRoot);
  return {
    sourceRevision,
    deploymentId,
    webOrigin,
    reportRoot: 'promotion-candidate',
    workspaceRoot,
  };
};

export const collectContentSchemaRegistryAutomatedAxeEvidence = async (
  options: Readonly<{
    sourceRevision: string;
    deploymentId: string;
    webOrigin: string;
    reportRoot: string;
    workspaceRoot?: string;
  }>,
): Promise<{
  report: Awaited<
    ReturnType<typeof buildContentSchemaRegistryAutomatedAxeReport>
  >;
  reportPath: string;
}> => {
  const startedAt = new Date().toISOString();
  const workspaceRoot =
    options.workspaceRoot ?? process.env.GITHUB_WORKSPACE ?? process.cwd();
  const reportRoot = resolveReportRoot(options.reportRoot, workspaceRoot);
  const expectedOrigin = new URL(options.webOrigin).origin;
  const { browser, metadata } = await launchPinnedPlaywrightChromium();
  try {
    const pages: Array<{
      requestedPath: (typeof CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS)[number]['requestedPath'];
      finalPath: string;
      httpStatus: number | null;
      coverage: (typeof CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS)[number]['coverage'];
      axe: AxeAnalysisResult;
    }> = [];
    for (const target of CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS) {
      pages.push(
        await waitForExpectedReleaseNavigation({
          navigate: async () => {
            const context = await browser.newContext({
              serviceWorkers: 'block',
              viewport: { width: 1_280, height: 900 },
            });
            try {
              await blockCrossOriginDocumentRequests(context, expectedOrigin);
              const page = await context.newPage();
              const response = await page.goto(
                new URL(target.requestedPath, options.webOrigin).toString(),
                { waitUntil: 'networkidle', timeout: 60_000 },
              );
              const finalPath = relativePathFromHostedUrl(
                page.url(),
                expectedOrigin,
              );
              const httpStatus = response?.status() ?? null;
              assertExpectedAxeNavigation({
                requestedPath: target.requestedPath,
                finalPath,
                httpStatus,
              });
              assertExpectedReleaseHeader({
                sourceRevision: options.sourceRevision,
                releaseHeader:
                  response?.headers()['x-wejammin-release'] ?? null,
              });
              return {
                requestedPath: target.requestedPath,
                finalPath,
                httpStatus,
                coverage: target.coverage,
                axe: await new AxeBuilder({ page }).analyze(),
              };
            } finally {
              await context.close();
            }
          },
        }),
      );
    }
    const report = buildContentSchemaRegistryAutomatedAxeReport({
      sourceRevision: options.sourceRevision,
      deploymentId: options.deploymentId,
      webOrigin: options.webOrigin,
      browser: metadata,
      environment: 'staging',
      startedAt,
      completedAt: new Date().toISOString(),
      pages,
    });
    const parsed =
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(report);
    if (!parsed.success)
      throw new Error('Generated automated axe report is invalid.');
    const reportPath = writeReportAtomically(
      reportRoot,
      parsed.data,
      workspaceRoot,
    );
    if (parsed.data.axeSerious !== 0 || parsed.data.axeCritical !== 0)
      throw new Error(
        `Automated axe gate failed (serious=${parsed.data.axeSerious}, critical=${parsed.data.axeCritical}).`,
      );
    return { report: parsed.data, reportPath };
  } finally {
    await browser.close();
  }
};

const run = async (): Promise<void> => {
  const options = parseEnvironment();
  const result =
    await collectContentSchemaRegistryAutomatedAxeEvidence(options);
  process.stdout.write(
    `content_schema_registry_automated_axe=passed\nreport=${result.reportPath}\n`,
  );
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(entrypoint).href
)
  void run().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
