import type { BrowserContext } from '@playwright/test';

import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';

export type AutomatedA11yTarget =
  (typeof CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS)[number];

export const targetForRequestedPath = (
  requestedPath: string,
): AutomatedA11yTarget => {
  const target = CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.find(
    (candidate) => candidate.requestedPath === requestedPath,
  );
  if (target === undefined)
    throw new Error(`Unsupported automated axe path: ${requestedPath}`);
  return target;
};

export const assertExpectedAxeNavigation = (input: {
  requestedPath: string;
  finalPath: string;
  httpStatus: number | null;
}): void => {
  const target = targetForRequestedPath(input.requestedPath);
  if (input.finalPath !== target.expectedFinalPath)
    throw new Error(
      `Automated axe path ${input.requestedPath} did not end at expected ${target.expectedFinalPath} (${target.coverage}).`,
    );
  if (input.httpStatus !== target.expectedHttpStatus)
    throw new Error(
      `Automated axe path ${input.requestedPath} returned HTTP ${String(input.httpStatus)}; expected ${target.expectedHttpStatus}.`,
    );
};

export const assertExpectedReleaseHeader = (input: {
  sourceRevision: string;
  releaseHeader: string | null;
}): void => {
  if (input.releaseHeader !== input.sourceRevision)
    throw new Error(
      'Automated axe document release header did not match SOURCE_REVISION.',
    );
};

export const isApprovedHostedDocumentUrl = (
  value: string,
  expectedOrigin: string,
): boolean => {
  try {
    const url = new URL(value);
    return (
      url.origin === expectedOrigin &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
};

export const relativePathFromHostedUrl = (
  value: string,
  expectedOrigin: string,
): string => {
  const url = new URL(value);
  if (url.origin !== expectedOrigin)
    throw new Error('Hosted axe navigation left the approved web origin');
  return url.pathname;
};

export const blockCrossOriginDocumentRequests = async (
  context: BrowserContext,
  expectedOrigin: string,
): Promise<void> => {
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (
      request.resourceType() === 'document' &&
      !isApprovedHostedDocumentUrl(request.url(), expectedOrigin)
    ) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
};
