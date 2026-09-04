import { describe, expect, it } from 'vitest';

import {
  activeProfileRoutePolicies,
  deferredProfileRoutePolicies,
  profileRoutePolicies,
} from '@wejammin/contracts';

const activeSurface = activeProfileRoutePolicies.map((policy) =>
  [policy.operationId, policy.path, policy.requestSchema, policy.responseSchema]
    .join(' ')
    .toLowerCase(),
);

describe('Phase 2 Slice 05 locked scope boundaries', () => {
  it('[P2-S05-AC-237..243] keeps PRF-API-10..16 typed and inactive until their originating slices activate them', () => {
    expect(
      deferredProfileRoutePolicies
        .filter(({ operationId }) => operationId !== 'PRF-API-09')
        .map(({ operationId, active }) => ({ operationId, active })),
    ).toEqual([
      { operationId: 'PRF-API-10', active: false },
      { operationId: 'PRF-API-11', active: false },
      { operationId: 'PRF-API-12', active: false },
      { operationId: 'PRF-API-13', active: false },
      { operationId: 'PRF-API-14', active: false },
      { operationId: 'PRF-API-15', active: false },
      { operationId: 'PRF-API-16', active: false },
    ]);
  });

  it('[P2-S05-AC-226, P2-S05-AC-244, P2-S05-AC-250] excludes portfolio and EPK schemas, routes, and workbenches from the active shadow-claim slice', () => {
    expect(
      activeSurface.some((value) =>
        /portfolio|epk|profile-section/u.test(value),
      ),
    ).toBe(false);
    expect(profileRoutePolicies).toHaveLength(16);
    expect(activeProfileRoutePolicies).toHaveLength(8);
  });

  it('[P2-S05-AC-146, P2-S05-AC-227, P2-S05-AC-245, P2-S05-AC-248, P2-S05-AC-251] excludes credential and Trader mismatch activation from the shadow-claim slice', () => {
    expect(
      activeSurface.some((value) =>
        /credential|trader|assessment|mismatch/u.test(value),
      ),
    ).toBe(false);
    expect(
      activeProfileRoutePolicies.map(({ operationId }) => operationId),
    ).toEqual([
      'PRF-API-01',
      'PRF-API-02',
      'PRF-API-03',
      'PRF-API-04',
      'PRF-API-05',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ]);
  });
});
