import { useEffect, useRef } from 'react';

import type { UploadCompletionProjection } from './upload-completion-state';

export const focusUploadCompletionResultHeading = (
  heading: Pick<HTMLHeadingElement, 'focus'> | null,
): void => {
  heading?.focus({ preventScroll: true });
};

export function UploadCompletionResult({
  completion,
  announce = false,
}: {
  readonly completion: UploadCompletionProjection;
  readonly announce?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultIdentity = announce
    ? `${completion.job.id}:${completion.etag}`
    : null;
  useEffect(() => {
    if (announce) focusUploadCompletionResultHeading(headingRef.current);
  }, [announce, resultIdentity]);

  return (
    <section
      className="upload-completion-result"
      aria-labelledby="upload-completion-result-heading"
      {...(announce
        ? {
            role: 'status' as const,
            'aria-live': 'polite' as const,
            'aria-atomic': true,
          }
        : {})}
    >
      <h3
        id="upload-completion-result-heading"
        ref={announce ? headingRef : undefined}
        {...(announce ? { tabIndex: -1 } : {})}
      >
        Verification job
      </h3>
      <dl>
        <dt>Job ID</dt>
        <dd>
          <code>{completion.job.id}</code>
        </dd>
        <dt>Job state</dt>
        <dd>{completion.job.state}</dd>
        <dt>Object ID</dt>
        <dd>
          <code>{completion.objectId}</code>
        </dd>
        <dt>Object version</dt>
        <dd>
          <code>{completion.etag}</code>
        </dd>
        <dt>Dispatch</dt>
        <dd>{completion.dispatch === 'sent' ? 'Queued' : 'Deferred safely'}</dd>
      </dl>
      <p>
        <a href={completion.location}>Check verification status</a>
      </p>
    </section>
  );
}

export default UploadCompletionResult;
