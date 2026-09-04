import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const migration = readFileSync(
  resolve(
    ROOT,
    'supabase/migrations/20260902080000_content_schema_registry_authority.sql',
  ),
  'utf8',
);

const functionBody = (name: string): string => {
  const start = migration.indexOf(`function platform_private.${name}(`);
  if (start < 0) return '';
  const end = migration.indexOf('$body$;', start);
  return migration.slice(start, end < 0 ? migration.length : end);
};

describe('[P2-S09-P0] migration source-row evidence boundary', () => {
  it('defines a fail-closed policy when S09 has no source-row transform contract', () => {
    const policy = functionBody('cms_migration_source_evidence_valid');

    expect(migration).toContain(
      '-- S09 owns the schema registry and migration metadata, but not the content',
    );
    expect(migration).toContain('per-row transformation evidence');
    expect(migration).toContain('zero-row policy');
    for (const field of [
      'source_count',
      'target_count',
      'row_error_count',
      'migrated_count',
      'failed_count',
      'cursor',
    ]) {
      expect(policy).toMatch(new RegExp(`p_plan\\.${field}\\s*=\\s*0`, 'u'));
    }
  });

  it('guards batch counter arithmetic before a nonempty plan can advance', () => {
    const batch = functionBody('cms_process_schema_migration_batch');
    const guard = batch.indexOf(
      'cms_migration_source_evidence_valid(plan_row)',
    );
    const arithmetic = batch.indexOf('processed := least(');

    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(arithmetic);
    expect(batch).toContain('MIGRATION_SOURCE_EVIDENCE_REQUIRED');
  });

  it('guards fingerprint-based verification and activation hand-offs', () => {
    const fingerprint = functionBody('cms_worker_validate_fingerprint');
    const ready = functionBody('cms_migration_plan_ready');
    const completion = functionBody('cms_complete_schema_migration');

    expect(fingerprint).toContain(
      'cms_migration_source_evidence_valid(p_plan)',
    );
    expect(fingerprint).toContain('MIGRATION_SOURCE_EVIDENCE_REQUIRED');
    expect(ready).toContain('cms_migration_source_evidence_valid(plan_row)');
    expect(completion).toContain(
      'cms_migration_source_evidence_valid(plan_row)',
    );

    for (const boundary of [
      'cms_finalize_schema_migration_dry_run',
      'cms_begin_schema_migration_verification',
      'cms_verify_schema_migration',
      'cms_worker_activate_schema',
    ]) {
      expect(functionBody(boundary)).toContain(
        'cms_worker_validate_fingerprint',
      );
    }
  });
});
