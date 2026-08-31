import { describe, expect, it } from 'vitest';

import {
  createUploadAdmissionNavigation,
  reconcileUploadAdmissionInvalidation,
} from '../../apps/web/src/components/infrastructure/upload-admission/upload-admission-navigation';

const TARGET_ID = '11111111-1111-4111-8111-111111111111';

describe('Slice 04 upload-admission navigation', () => {
  it('P1-S04-AC-072 P1-S04-AC-073 preserves safe deep links and never resubmits on Back', () => {
    const navigation = createUploadAdmissionNavigation({
      targetType: 'infrastructure.record',
      targetId: TARGET_ID,
      returnTo: '/app/infrastructure?filter=owned',
    });
    expect(navigation.href).toBe(
      `/app/infrastructure/${TARGET_ID}?uploadTarget=infrastructure.record&returnTo=%2Fapp%2Finfrastructure%3Ffilter%3Downed`,
    );
    expect(navigation.resubmitOnPopstate).toBe(false);
    expect(() =>
      createUploadAdmissionNavigation({
        targetType: 'infrastructure.record',
        targetId: TARGET_ID,
        returnTo: 'https://storage.example.test/signed',
      }),
    ).toThrow('Upload navigation input is invalid.');
  });

  it('P1-S04-AC-074 refetches matching canonical state while preserving only the local draft', () => {
    expect(
      reconcileUploadAdmissionInvalidation(
        { targetType: 'infrastructure.record', targetId: TARGET_ID },
        { targetType: 'infrastructure.record', targetId: TARGET_ID },
      ),
    ).toEqual({ preserveLocalDraft: true, refetchCanonical: true });
    expect(
      reconcileUploadAdmissionInvalidation(
        { targetType: 'infrastructure.record', targetId: TARGET_ID },
        {
          targetType: 'infrastructure.record',
          targetId: '33333333-3333-4333-8333-333333333333',
        },
      ),
    ).toEqual({ preserveLocalDraft: true, refetchCanonical: false });
  });
});
