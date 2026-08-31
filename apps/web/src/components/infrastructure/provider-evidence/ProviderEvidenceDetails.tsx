import type {
  ProviderEvidenceProjection,
  ProviderOperationState,
  WebhookReceiptState,
} from './provider-evidence-types';

const operationStateLabel = (state: ProviderOperationState): string => {
  switch (state) {
    case 'planned':
      return 'Planned';
    case 'pending':
      return 'Pending reconciliation';
    case 'confirmed':
      return 'Confirmed';
    case 'failed':
      return 'Failed';
    case 'manual_review':
      return 'Manual review required';
  }
};

const receiptStateLabel = (state: WebhookReceiptState): string => {
  switch (state) {
    case 'received':
      return 'Received';
    case 'accepted':
      return 'Accepted';
    case 'duplicate':
      return 'Duplicate acknowledged';
    case 'rejected':
      return 'Rejected';
    case 'processed':
      return 'Processed';
    case 'failed':
      return 'Failed';
    case 'manual_review':
      return 'Manual review required';
  }
};

export function ProviderEvidenceDetails({
  evidence,
}: {
  readonly evidence: ProviderEvidenceProjection;
}) {
  return (
    <section
      className="provider-evidence-details"
      aria-labelledby="provider-evidence-details-heading"
    >
      <h3 id="provider-evidence-details-heading">Canonical evidence</h3>
      <dl>
        <dt>Operation ID</dt>
        <dd>
          <code>{evidence.operation.id}</code>
        </dd>
        <dt>Provider</dt>
        <dd>{evidence.operation.provider}</dd>
        <dt>Operation state</dt>
        <dd>{operationStateLabel(evidence.operation.state)}</dd>
        <dt>Payload digest</dt>
        <dd>
          <code>{evidence.operation.payloadDigest}</code>
        </dd>
        <dt>Canonical version</dt>
        <dd>
          <code>{evidence.operation.version}</code>
        </dd>
        <dt>Provenance source</dt>
        <dd>{evidence.provenance.source}</dd>
        <dt>Observed at</dt>
        <dd>
          <time dateTime={evidence.provenance.observedAt}>
            {evidence.provenance.observedAt}
          </time>
        </dd>
        <dt>Last verified</dt>
        <dd>
          <time dateTime={evidence.provenance.lastVerifiedAt}>
            {evidence.provenance.lastVerifiedAt}
          </time>
        </dd>
      </dl>
      {evidence.receipt !== null && (
        <section
          className="provider-evidence-receipt"
          aria-labelledby="provider-evidence-receipt-heading"
        >
          <h4 id="provider-evidence-receipt-heading">Webhook receipt</h4>
          <dl>
            <dt>Receipt ID</dt>
            <dd>
              <code>{evidence.receipt.id}</code>
            </dd>
            <dt>Receipt state</dt>
            <dd>{receiptStateLabel(evidence.receipt.state)}</dd>
            <dt>Receipt digest</dt>
            <dd>
              <code>{evidence.receipt.payloadDigest}</code>
            </dd>
            <dt>Signature verified</dt>
            <dd>
              <time dateTime={evidence.receipt.signatureVerifiedAt}>
                {evidence.receipt.signatureVerifiedAt}
              </time>
            </dd>
            <dt>Received at</dt>
            <dd>
              <time dateTime={evidence.receipt.receivedAt}>
                {evidence.receipt.receivedAt}
              </time>
            </dd>
            <dt>External event reference</dt>
            <dd>
              {evidence.receipt.externalEventPresent
                ? 'Present'
                : 'Not present'}
            </dd>
          </dl>
        </section>
      )}
    </section>
  );
}

export { operationStateLabel };
export default ProviderEvidenceDetails;
