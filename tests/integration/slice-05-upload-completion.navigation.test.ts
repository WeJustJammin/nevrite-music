import { describe, expect, it, vi } from 'vitest';

import {
  createUploadCompletionInvalidationHandler,
  uploadCompletionHref,
} from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';
import { uploadCompletionBackHref } from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-navigation';

const INTENT_ID = '11111111-1111-4111-8111-111111111111';

describe('Slice 05 upload-completion navigation seam', () => {
  it('keeps Back links canonical and strips replay or external parameters', () => {
    const canonical = uploadCompletionHref(INTENT_ID);
    expect(uploadCompletionBackHref(undefined, INTENT_ID)).toBe(canonical);
    expect(
      uploadCompletionBackHref(
        `${canonical}&signedUrl=https%3A%2F%2Fsecret.invalid`,
        INTENT_ID,
      ),
    ).toBe(canonical);
    expect(
      uploadCompletionBackHref(
        `https://evil.invalid/app/infrastructure/upload-completion?uploadIntentId=${INTENT_ID}`,
        INTENT_ID,
      ),
    ).toBe(canonical);
  });

  it('refetches canonical state for multi-tab invalidation without resubmitting', async () => {
    const refetch = vi.fn(async () => undefined);
    const handler = createUploadCompletionInvalidationHandler(refetch);
    await handler('multi-tab');
    expect(refetch).toHaveBeenCalledOnce();
    expect(refetch).toHaveBeenCalledWith('multi-tab');
  });
});
