import { jsonBytes } from './ac265-hosted-test-fixtures.ts';
import type {
  ReceiptEnvelope,
  ReceiptSlot,
  ReceiptSubject,
} from './ac265-hosted-receipt-test-types.ts';

export const reportReceipt = (
  report: Record<string, unknown>,
  slot: ReceiptSlot,
): { ref: string; sha256: string } => {
  if (slot.kind === 'candidate')
    return report['candidateIdentityReceipt'] as {
      ref: string;
      sha256: string;
    };
  if (slot.kind === 'cleanup')
    return (
      report['cleanup'] as { serverReceipt: { ref: string; sha256: string } }
    ).serverReceipt;
  const collection = report[
    slot.kind === 'role' ? 'roles' : 'scenarios'
  ] as Array<{
    serverReceipt: { ref: string; sha256: string };
  }>;
  return collection[slot.index]?.serverReceipt as {
    ref: string;
    sha256: string;
  };
};

export const withReceiptHash = (
  report: Record<string, unknown>,
  slot: ReceiptSlot,
  sha256Value: string,
): void => {
  const replacement = { ...reportReceipt(report, slot), sha256: sha256Value };
  if (slot.kind === 'candidate')
    report['candidateIdentityReceipt'] = replacement;
  else if (slot.kind === 'cleanup')
    report['cleanup'] = {
      ...(report['cleanup'] as Record<string, unknown>),
      serverReceipt: replacement,
    };
  else {
    const field = slot.kind === 'role' ? 'roles' : 'scenarios';
    const collection = [...(report[field] as Array<Record<string, unknown>>)];
    collection[slot.index] = {
      ...collection[slot.index],
      serverReceipt: replacement,
    };
    report[field] = collection;
  }
};

export const tamperEnvelope = (
  bytes: Uint8Array,
  target: 'subject' | 'result',
): Uint8Array => {
  const envelope = JSON.parse(
    Buffer.from(bytes).toString('utf8'),
  ) as ReceiptEnvelope;
  if (target === 'subject')
    envelope.subject = {
      ...envelope.subject,
      key: 'unbound',
    } as ReceiptSubject;
  else {
    const result = { ...envelope.result };
    switch (envelope.subject.kind) {
      case 'candidate_identity':
        result['deploymentId'] = 'deployment-unbound';
        break;
      case 'role':
        result['outcome'] = 'failed';
        break;
      case 'scenario':
        result['browserObservationSha256'] =
          result['browserObservationSha256'] === '0'.repeat(64)
            ? '1'.repeat(64)
            : '0'.repeat(64);
        break;
      case 'cleanup':
        result['sessionMaterialDestroyed'] = false;
        break;
    }
    envelope.result = result;
  }
  return jsonBytes(envelope);
};
