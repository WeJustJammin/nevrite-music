import { describe, expect, it } from 'vitest';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  identity,
  resourceRefs,
  runnerContract,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

describe('AC265 hosted runner contract v1', () => {
  it('binds exactly to staging identity and nine role-matched external session references', () => {
    const contract = runnerContract();
    const parsed =
      ContentSchemaRegistryHostedRunnerContractSchema.parse(contract);

    expect(parsed.identity).toEqual(identity);
    expect(Object.keys(parsed.sessionHandles).sort()).toEqual(
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].sort(),
    );
    for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
      expect(parsed.sessionHandles[role]).toEqual({
        ref: expect.stringMatching(
          new RegExp(
            `^ac265-session://${role}/${uuidFor(1).slice(0, 24)}[0-9]{12}$`,
            'u',
          ),
        ),
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
      });
      expect(parsed.sessionHandles[role].ref).not.toContain('?');
      expect(parsed.sessionHandles[role].ref).not.toContain('#');
    }
    expect(parsed.resourceRefs).toEqual(resourceRefs);
  });

  it('rejects non-staging, identity drift, role-mismatched handles, and unsafe resource refs', () => {
    const contract = runnerContract();
    const wrongRole = {
      ...contract,
      sessionHandles: {
        ...contract.sessionHandles,
        entitled_read: {
          ...contract.sessionHandles.entitled_read,
          ref: `ac265-session://owner_full/${uuidFor(1)}`,
        },
      },
    };
    const unsafeResource = {
      ...contract,
      resourceRefs: contract.resourceRefs.map((resource, index) =>
        index === 0
          ? {
              ...resource,
              ref: `ac265-resource://content_schema/${uuidFor(20)}?token=secret`,
            }
          : resource,
      ),
    };

    for (const candidate of [
      { ...contract, identity: { ...identity, environment: 'production' } },
      {
        ...contract,
        identity: { ...identity, sourceRevision: 'not-a-git-sha' },
      },
      {
        ...contract,
        identity: {
          ...identity,
          supabaseOrigin: 'https://differentprojectref.supabase.co',
        },
      },
      {
        ...contract,
        identity: {
          ...identity,
          apiOrigin: 'https://STAGING.WEJAMM.IN:443',
        },
      },
      wrongRole,
      unsafeResource,
      {
        ...contract,
        resourceRefs: [
          { ...resourceRefs[0], ref: `ac265-resource://admin/${uuidFor(20)}` },
          ...resourceRefs.slice(1),
        ],
      },
    ])
      expect(
        ContentSchemaRegistryHostedRunnerContractSchema.safeParse(candidate)
          .success,
      ).toBe(false);
  });

  it('pins fresh Google sign-in and bounded staging control modes while rejecting unknown or sensitive fields', () => {
    const contract = runnerContract();
    for (const candidate of [
      {
        ...contract,
        controls: { ...contract.controls, googleMode: 'reuse_saved_session' },
      },
      {
        ...contract,
        controls: { ...contract.controls, logoutScope: 'all_sessions' },
      },
      {
        ...contract,
        controls: { ...contract.controls, faultControlMode: 'unbounded' },
      },
      {
        ...contract,
        controls: { ...contract.controls, subjectPolicy: 'create_test_minors' },
      },
      { ...contract, accessToken: 'credential-content' },
      {
        ...contract,
        sessionHandles: {
          ...contract.sessionHandles,
          owner_full: {
            ...contract.sessionHandles.owner_full,
            storageState: { cookies: [{ value: 'secret' }] },
          },
        },
      },
      {
        ...contract,
        sessionHandles: {
          ...contract.sessionHandles,
          entitled_read: {
            ...contract.sessionHandles.entitled_read,
            ref: `ac265-session://entitled_read/${uuidFor(1)}?email=operator@example.test`,
          },
        },
      },
      {
        ...contract,
        operator: { email: 'operator@example.test' },
      },
    ])
      expect(
        ContentSchemaRegistryHostedRunnerContractSchema.safeParse(candidate)
          .success,
      ).toBe(false);
  });
});
