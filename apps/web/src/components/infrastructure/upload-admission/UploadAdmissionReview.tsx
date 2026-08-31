import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

import type {
  UploadAdmissionDraft,
  UploadAdmissionPolicy,
} from './upload-admission-state';

export interface UploadAdmissionReviewProps {
  readonly access: AccessVariant;
  readonly policy: UploadAdmissionPolicy;
  readonly draft: UploadAdmissionDraft;
  readonly capabilityReason: string;
}

export function UploadAdmissionReview({
  access,
  policy,
  draft,
  capabilityReason,
}: UploadAdmissionReviewProps) {
  return (
    <>
      {access === 'disabled' && (
        <p className="upload-admission-disabled" role="status">
          Action unavailable: {capabilityReason}
        </p>
      )}
      {policy.highRisk === true && (
        <section
          className="upload-admission-review"
          aria-labelledby="upload-admission-review-heading"
        >
          <h3 id="upload-admission-review-heading">Review before commit</h3>
          <dl>
            <dt>Consequence</dt>
            <dd>Authorize a transfer for this target</dd>
            <dt>Scope</dt>
            <dd>
              {draft.targetType} / {draft.targetId}
            </dd>
            <dt>Expected version</dt>
            <dd>
              <code>{draft.ifMatch || 'Not supplied'}</code>
            </dd>
            <dt>Acting context</dt>
            <dd>{policy.actingContext ?? 'Server-selected acting context'}</dd>
            <dt>Step-up verification</dt>
            <dd>
              {policy.stepUpVerified === true
                ? 'Verified'
                : 'Required before commit'}
            </dd>
          </dl>
        </section>
      )}
    </>
  );
}

export default UploadAdmissionReview;
