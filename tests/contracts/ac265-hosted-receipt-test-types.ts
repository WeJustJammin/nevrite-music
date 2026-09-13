import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type {
  HostedRole,
  HostedScenario,
} from './ac265-hosted-test-fixtures.ts';

export type HostedIdentity =
  ContentSchemaRegistryHostedRunnerContract['identity'];
export type ReceiptSubject =
  | { kind: 'candidate_identity'; key: 'candidate' }
  | { kind: 'outage_lease'; key: 'dependency_outage' }
  | { kind: 'role'; key: HostedRole }
  | { kind: 'scenario'; key: HostedScenario }
  | { kind: 'cleanup'; key: 'cleanup' };
export type ReceiptEnvelope = {
  schemaVersion: 'ac265-hosted-e2e-receipt-v1';
  runId: string;
  identity: HostedIdentity;
  subject: ReceiptSubject;
  result: Record<string, unknown>;
  issuedAt?: string;
};
export type ReceiptSlot = {
  kind: 'candidate' | 'role' | 'scenario' | 'cleanup';
  index: number;
  ref: string;
};
export type HostedReceiptFixtureByteStores = Readonly<{
  receiptBytes: ReadonlyMap<string, Uint8Array>;
  evidenceBytes: ReadonlyMap<string, Uint8Array>;
}>;
