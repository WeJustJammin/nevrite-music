import type { MigrationState } from './migration-worker-constants';

export type MigrationPlanRecord = Readonly<{
  id: string;
  contentTypeId: string;
  fromVersionId: string;
  toVersionId: string;
  state: MigrationState;
  version: string;
  cursor: string;
  progress: number;
  sourceCount: string;
  targetCount: string;
  rowErrorCount: string;
  migratedCount: string;
  failedCount: string;
  classification: 'additive' | 'conditional' | 'breaking';
  transformKey: string | null;
  transformVersion: string | null;
  compilerHash: string;
  sourceHash: string;
  targetHash: string;
  activeVersionId: string;
  leaseOwner: string | null;
  leaseToken: string | null;
  leaseExpiresAt: string | null;
}>;

export type SchemaMigrationBatchResult = Readonly<{
  done: boolean;
  cursor: string;
  progress: number;
  sourceCount: string;
  targetCount: string;
  rowErrorCount: string;
  migratedCount: string;
  failedCount: string;
}>;
