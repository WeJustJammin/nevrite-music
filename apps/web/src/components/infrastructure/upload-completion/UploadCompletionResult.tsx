import type { UploadCompletionProjection } from './upload-completion-state';

export function UploadCompletionResult({
  completion,
}: {
  readonly completion: UploadCompletionProjection;
}) {
  return (
    <section
      className="upload-completion-result"
      aria-labelledby="upload-completion-result-heading"
    >
      <h3 id="upload-completion-result-heading">Verification job</h3>
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
