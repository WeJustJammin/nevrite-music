import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  AC265_HOSTED_SCOPE_FAILURE,
  resolveAc265HostedStagingSelector,
} from './verify-ac265-hosted-staging-evidence.ts';

const run = async (): Promise<void> => {
  const outputPath = process.env['GITHUB_OUTPUT'];
  if (
    typeof outputPath !== 'string' ||
    outputPath.length === 0 ||
    outputPath.includes('\0')
  )
    throw new Error(AC265_HOSTED_SCOPE_FAILURE);
  const selector = await resolveAc265HostedStagingSelector({
    env: process.env,
  });
  appendFileSync(
    outputPath,
    [
      'report_artifact_id=' + String(selector.artifactId),
      'source_revision=' + selector.sourceRevision,
      'staging_deployment_id=' + selector.deploymentId,
      'report_archive_sha256=' + selector.archiveSha256,
      '',
    ].join('\n'),
    { encoding: 'utf8' },
  );
  console.log(
    JSON.stringify({
      event: 'ac265_hosted_staging_selector_resolved',
      sourceRevision: selector.sourceRevision,
      deploymentId: selector.deploymentId,
    }),
  );
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  return (
    typeof entrypoint === 'string' &&
    pathToFileURL(resolve(entrypoint)).href === import.meta.url
  );
};

if (isDirectExecution()) {
  try {
    await run();
  } catch {
    console.error(AC265_HOSTED_SCOPE_FAILURE);
    process.exitCode = 1;
  }
}
