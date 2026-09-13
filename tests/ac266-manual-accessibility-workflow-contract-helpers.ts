import { existsSync, readFileSync } from 'node:fs';

import { expect } from 'vitest';

const workflowPath = new URL(
  '../.github/workflows/collect-ac266-manual-accessibility.yml',
  import.meta.url,
);
const intakeWorkflowPath = new URL(
  '../.github/workflows/intake-ac266-manual-accessibility-reports.yml',
  import.meta.url,
);
const reportMaterializerPath = new URL(
  '../infra/workflows/materialize-ac266-manual-accessibility-reports.ts',
  import.meta.url,
);
const stagingWorkflowPath = new URL(
  '../.github/workflows/deploy-staging.yml',
  import.meta.url,
);
const stagingCandidateProducerPath = new URL(
  '../infra/workflows/prepare-staging-candidate.sh',
  import.meta.url,
);

const readOptional = (path: URL): string =>
  existsSync(path) ? readFileSync(path, 'utf8') : '';

const workflow = readOptional(workflowPath);
const intakeWorkflow = readOptional(intakeWorkflowPath);
const reportMaterializer = readOptional(reportMaterializerPath);
const stagingWorkflow = readOptional(stagingWorkflowPath);
const rawStagingCandidateProducer = readOptional(stagingCandidateProducerPath);

export const stripSourceComments = (source: string): string =>
  source
    .split('\n')
    .filter((line) => !/^\s*(?:#|\/\/)/u.test(line))
    .join('\n');

export const executableWorkflow = stripSourceComments(workflow);
export const executableIntakeWorkflow = stripSourceComments(intakeWorkflow);
export const executableReportMaterializer =
  stripSourceComments(reportMaterializer);
export const executableStagingWorkflow = stripSourceComments(stagingWorkflow);
export const stagingCandidateProducer = stripSourceComments(
  rawStagingCandidateProducer,
);

export const header = (source: string): string => {
  const jobsIndex = source.indexOf('\njobs:');
  return jobsIndex < 0 ? source : source.slice(0, jobsIndex);
};

export const requiredStringInput = (source: string, name: string): boolean => {
  const inputsIndex = source.indexOf('    inputs:');
  if (inputsIndex < 0) return false;

  const inputs = source.slice(inputsIndex + '    inputs:'.length);
  const inputHeader = new RegExp(`^ {6}${name}:\\s*$`, 'mu');
  const match = inputHeader.exec(inputs);
  if (!match || match.index === undefined) return false;

  const bodyStart = match.index + match[0].length;
  const rest = inputs.slice(bodyStart);
  const nextInputIndex = rest.search(/^ {6}[a-z0-9_-]+:\s*$/mu);
  const block = nextInputIndex < 0 ? rest : rest.slice(0, nextInputIndex);

  return (
    /^ {8}required:\s*true\s*$/mu.test(block) &&
    /^ {8}type:\s*string\s*$/mu.test(block)
  );
};

export const artifactDownload = (source: string, name: string): string => {
  const start = source.indexOf(`name: ${name}`);
  if (start < 0) return '';

  const downloadStart = source.lastIndexOf(
    'uses: actions/download-artifact@',
    start,
  );
  if (downloadStart < 0) return '';

  const nextStep = source.indexOf('\n      - ', start);
  return source.slice(downloadStart, nextStep < 0 ? source.length : nextStep);
};

export const uploadSteps = (source: string): string[] => {
  const stepStarts = [...source.matchAll(/^ {6}- /gmu)];
  const stepBlocks = stepStarts.map((match, index) => {
    const start = match.index ?? 0;
    const nextStart = stepStarts[index + 1]?.index;
    return source.slice(start, nextStart ?? source.length);
  });
  return stepBlocks.filter((step) =>
    /(?:^|\n)\s*uses:\s*actions\/upload-artifact@|^ {6}-\s*\{[^}\n]*\buses:\s*actions\/upload-artifact@/mu.test(
      step,
    ),
  );
};

export const jobConfigurationBeforeSteps = (source: string): string => {
  const start = source.indexOf('\njobs:');
  if (start < 0) return source;
  const end = source.indexOf('\n    steps:', start);
  return source.slice(start, end < 0 ? source.length : end);
};

export const namedStep = (source: string, name: string): string => {
  const start = source.indexOf(`      - name: ${name}`);
  if (start < 0) return '';
  const nextStep = source.indexOf('\n      - ', start + 1);
  return source.slice(start, nextStep < 0 ? source.length : nextStep);
};

export const retentionDays = (source: string): number[] =>
  [...source.matchAll(/^\s+retention-days:\s*(\d+)\s*$/gmu)].map((match) =>
    Number(match[1]),
  );

export const secretReferences = (source: string): string[] =>
  [...source.matchAll(/\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}/gu)]
    .map((match) => match[1])
    .sort();

export const unpinnedExternalActions = (source: string): string[] =>
  [...source.matchAll(/^\s*uses:\s*(?!\.\/)([^\s@]+)@([^\s#]+).*$/gmu)]
    .filter((match) => !/^[0-9a-f]{40}$/u.test(match[2] ?? ''))
    .map((match) => match[0].trim());

export const shellRunBlocks = (source: string): string[] => {
  const blocks: string[] = [];
  const lines = source.split('\n');
  let activeIndent = -1;
  let current: string[] = [];

  for (const line of lines) {
    const run = /^(\s*)run:\s*(.*)$/u.exec(line);
    if (run) {
      if (activeIndent >= 0) blocks.push(current.join('\n'));
      activeIndent = run[1]?.length ?? 0;
      current = [run[2] ?? ''];
      continue;
    }

    if (activeIndent < 0) continue;
    if (line.trim() && (line.match(/^\s*/u)?.[0].length ?? 0) <= activeIndent) {
      blocks.push(current.join('\n'));
      activeIndent = -1;
      current = [];
      continue;
    }
    current.push(line);
  }

  if (activeIndent >= 0) blocks.push(current.join('\n'));
  return blocks;
};

export const expectCleanupGuard = (
  source: string,
  cleanupIndex: number,
): void => {
  const guard = source.slice(Math.max(0, cleanupIndex - 1000), cleanupIndex);
  expect(guard).toMatch(/-n "\$\{RUNNER_TEMP:-\}"/u);
  expect(guard).toMatch(/-n "\$\{AC266_PRIVATE_EVIDENCE_DIR:-\}"/u);
  expect(guard).toMatch(/"\$GITHUB_RUN_ID" =~ \^\[0-9\]\+\$/u);
  expect(guard).toMatch(/"\$GITHUB_RUN_ATTEMPT" =~ \^\[0-9\]\+\$/u);
  expect(guard).toMatch(
    /"\$AC266_PRIVATE_EVIDENCE_DIR" == "\$RUNNER_TEMP\/ac266-private-evidence-\$GITHUB_RUN_ID-\$GITHUB_RUN_ATTEMPT"/u,
  );
};
