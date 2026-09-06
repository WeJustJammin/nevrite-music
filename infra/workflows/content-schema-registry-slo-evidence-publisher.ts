import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

import {
  ContentSchemaRegistryAc211CollectorOutputSchema,
  type ContentSchemaRegistryAc211CollectorOutput,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  DATASET_PATH,
  MEASUREMENT_PATH,
  SLO_PATH,
  serializeContentSchemaRegistrySloReport,
  sha256,
  type ContentSchemaRegistrySloEvidencePaths,
} from './content-schema-registry-slo-evidence-shared.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertRetainedRoot = (reportRoot: string): string => {
  if (reportRoot.length === 0 || reportRoot.includes('\0'))
    throw new Error('AC211 retained report root is invalid.');
  const candidate = resolve(reportRoot);
  if (candidate === parse(candidate).root)
    throw new Error('AC211 retained report root is invalid.');
  mkdirSync(candidate, { mode: 0o700, recursive: true });
  const approved = realpathSync(candidate);
  if (!statSync(approved).isDirectory())
    throw new Error('AC211 retained report root is invalid.');
  return approved;
};

const retainedPath = (root: string, path: string): string => {
  const candidate = resolve(root, path);
  const rootRelative = relative(root, candidate);
  if (
    isAbsolute(rootRelative) ||
    rootRelative === '..' ||
    rootRelative.startsWith(`..${sep}`)
  )
    throw new Error('AC211 retained report path is invalid.');
  return candidate;
};

const writeExclusive = (path: string, value: unknown): void => {
  try {
    writeFileSync(path, serializeContentSchemaRegistrySloReport(value), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  } catch (error: unknown) {
    if (isRecord(error) && error.code === 'EEXIST')
      throw new Error('AC211 retained report already exists.', {
        cause: error,
      });
    throw new Error('AC211 retained report write failed.', { cause: error });
  }
};

export const writeContentSchemaRegistrySloEvidence = (
  output: ContentSchemaRegistryAc211CollectorOutput,
  reportRoot: string,
): ContentSchemaRegistrySloEvidencePaths => {
  const parsed =
    ContentSchemaRegistryAc211CollectorOutputSchema.safeParse(output);
  if (!parsed.success) throw new Error('AC211 collector output is invalid.');
  const datasetBody = serializeContentSchemaRegistrySloReport(
    parsed.data.dataset,
  );
  const measurementBody = serializeContentSchemaRegistrySloReport(
    parsed.data.measurement,
  );
  if (
    sha256(datasetBody) !== parsed.data.slo.datasetReport.sha256 ||
    sha256(measurementBody) !== parsed.data.slo.measurementReport.sha256 ||
    parsed.data.measurement.datasetDigest !==
      parsed.data.slo.datasetReport.sha256 ||
    parsed.data.slo.datasetReport.path !== DATASET_PATH ||
    parsed.data.slo.measurementReport.path !== MEASUREMENT_PATH
  )
    throw new Error('AC211 retained report digests are invalid.');

  const root = assertRetainedRoot(reportRoot);
  const lockDirectory = retainedPath(root, '.ac211-publish.lock');
  try {
    mkdirSync(lockDirectory, { mode: 0o700 });
  } catch (error: unknown) {
    throw new Error('AC211 retained report already exists.', { cause: error });
  }
  const sloDirectory = retainedPath(root, 'slo');
  try {
    if (existsSync(sloDirectory))
      throw new Error('AC211 retained report already exists.');
    const paths = {
      dataset: retainedPath(root, DATASET_PATH),
      measurement: retainedPath(root, MEASUREMENT_PATH),
      slo: retainedPath(root, SLO_PATH),
    };
    const stagingRoot = mkdtempSync(join(root, '.ac211-'));
    try {
      const stagingSloDirectory = join(stagingRoot, 'slo');
      mkdirSync(stagingSloDirectory, { mode: 0o700 });
      writeExclusive(
        join(stagingSloDirectory, 'dataset.json'),
        parsed.data.dataset,
      );
      writeExclusive(
        join(stagingSloDirectory, 'measurement.json'),
        parsed.data.measurement,
      );
      writeExclusive(
        join(stagingSloDirectory, 'ac211-slo.json'),
        parsed.data.slo,
      );
      renameSync(stagingSloDirectory, sloDirectory);
    } catch (error: unknown) {
      try {
        rmSync(stagingRoot, { force: true, recursive: true });
      } catch (cleanupError: unknown) {
        throw new AggregateError(
          [error, cleanupError],
          'AC211 retained report cleanup failed.',
          { cause: cleanupError },
        );
      }
      if (error instanceof Error && error.message.startsWith('AC211 retained'))
        throw error;
      throw new Error('AC211 retained report write failed.', { cause: error });
    }
    rmSync(stagingRoot, { force: true, recursive: true });
    return paths;
  } finally {
    rmSync(lockDirectory, { force: true, recursive: true });
  }
};
