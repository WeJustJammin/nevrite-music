import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { verifyAc265CandidateProvenance } from '../infra/workflows/ac265-candidate-provenance.ts';
import {
  candidateFileText,
  createCandidateFixture,
} from './ac265-candidate-artifact-fixture.ts';
import {
  createInputs,
  createMockGitHubApi,
} from './ac265-candidate-provenance.test-support.ts';

type CandidateFixture = ReturnType<typeof createCandidateFixture>;
type JsonRecord = Record<string, unknown>;

let fixture: CandidateFixture;

beforeEach(() => {
  fixture = createCandidateFixture();
});

afterEach(() => {
  fixture.close();
});

const verify = () => {
  const api = createMockGitHubApi();
  return verifyAc265CandidateProvenance(createInputs(fixture), api.fetchImpl);
};

describe('AC265 candidate artifact timestamp provenance', () => {
  it('requires candidate and provider evidence timestamps to follow the trusted staging deployment', async () => {
    fixture.writeCandidateJson('promotion-metadata.json', {
      ...JSON.parse(candidateFileText(fixture, 'promotion-metadata.json')),
      verifiedAt: '2026-09-08T13:30:01.000Z',
    });
    await expect(verify()).rejects.toThrow();

    fixture.close();
    fixture = createCandidateFixture();
    const providerEvidence = JSON.parse(
      candidateFileText(fixture, 'provider-release-evidence.json'),
    ) as JsonRecord;
    const workers = providerEvidence.workers as JsonRecord[];
    workers[0] = {
      ...workers[0],
      versionCreatedAt: '2026-09-08T13:06:00.000Z',
      deploymentCreatedAt: '2026-09-08T13:07:00.000Z',
    };
    fixture.writeCandidateJson('provider-release-evidence.json', {
      ...providerEvidence,
      workers,
    });
    await expect(verify()).rejects.toThrow();
  });
});
