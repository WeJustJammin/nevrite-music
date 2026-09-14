import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { writeAc265CandidateRefArtifact } from '../infra/workflows/write-ac265-candidate-ref-artifact.ts';

const CANDIDATE_REF =
  'ac265-candidate://staging/00000000-0000-4000-8000-000000000001';
const FAILURE = 'AC265 candidate reference artifact could not be prepared';
const runnerTemps: string[] = [];

const createRunnerTemp = (): string => {
  const path = mkdtempSync(join(tmpdir(), 'ac265-candidate-ref-'));
  runnerTemps.push(path);
  return path;
};

afterEach(() => {
  for (const path of runnerTemps.splice(0))
    rmSync(path, { recursive: true, force: true });
});

describe('AC265 candidate-reference artifact writer', () => {
  it('writes only the strict candidate reference under RUNNER_TEMP with private mode', () => {
    const runnerTemp = createRunnerTemp();
    const output = writeAc265CandidateRefArtifact({
      env: { RUNNER_TEMP: runnerTemp, AC265_CANDIDATE_REF: CANDIDATE_REF },
    });
    const artifactPath = join(runnerTemp, 'ac265-candidate-ref.txt');

    expect(output).toEqual({ path: artifactPath });
    expect(readFileSync(artifactPath, 'utf8')).toBe(`${CANDIDATE_REF}\n`);
    expect(lstatSync(artifactPath).mode & 0o777).toBe(0o600);
    expect(readdirSync(runnerTemp)).toEqual(['ac265-candidate-ref.txt']);
  });

  it.each([
    '',
    '00000000-0000-4000-8000-000000000001',
    'ac265-candidate://production/00000000-0000-4000-8000-000000000001',
    'ac265-candidate://staging/not-a-uuid',
    `${CANDIDATE_REF}\nidentity=forged`,
  ])(
    'rejects an invalid candidate reference without creating an artifact',
    (candidateRef) => {
      const runnerTemp = createRunnerTemp();

      expect(() =>
        writeAc265CandidateRefArtifact({
          env: { RUNNER_TEMP: runnerTemp, AC265_CANDIDATE_REF: candidateRef },
        }),
      ).toThrow(FAILURE);
      expect(readdirSync(runnerTemp)).toEqual([]);
    },
  );

  it('rejects non-canonical or missing temporary roots with a generic error', () => {
    const runnerTemp = createRunnerTemp();

    expect(() =>
      writeAc265CandidateRefArtifact({
        env: {
          RUNNER_TEMP: `${runnerTemp}/..`,
          AC265_CANDIDATE_REF: CANDIDATE_REF,
        },
      }),
    ).toThrow(FAILURE);
    expect(() =>
      writeAc265CandidateRefArtifact({
        env: { AC265_CANDIDATE_REF: CANDIDATE_REF },
      }),
    ).toThrow(FAILURE);
    expect(readdirSync(runnerTemp)).toEqual([]);
  });

  it('does not replace an existing file and hides filesystem error details', () => {
    const runnerTemp = createRunnerTemp();
    const artifactPath = join(runnerTemp, 'ac265-candidate-ref.txt');
    writeFileSync(artifactPath, 'preserve-this-file', 'utf8');

    expect(() =>
      writeAc265CandidateRefArtifact({
        env: { RUNNER_TEMP: runnerTemp, AC265_CANDIDATE_REF: CANDIDATE_REF },
      }),
    ).toThrow(FAILURE);
    expect(readFileSync(artifactPath, 'utf8')).toBe('preserve-this-file');
  });
});
