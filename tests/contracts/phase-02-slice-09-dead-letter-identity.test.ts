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

describe('[P2-S09-P1] dead-letter event identity binding', () => {
  it('accepts only the bounded identity envelope and locks an existing row first', () => {
    const body = functionBody('cms_dead_letter_schema_migration_event');

    expect(body).toContain(
      "array['eventId', 'claimToken', 'reasonCode']::text[]",
    );
    for (const field of [
      'eventType',
      'schemaVersion',
      'aggregateType',
      'aggregateId',
      'aggregateVersion',
      'migrationPlanId',
      'claimToken',
    ]) {
      expect(body).toContain(`'${field}'`);
    }
    expect(body).toMatch(
      /from platform_private\.outbox_events event\s+where event\.id = event_id\s+for update/u,
    );
    expect(body).toContain('event_exists := found;');
  });

  it('checks every stable row and payload identity before the first mutation', () => {
    const body = functionBody('cms_dead_letter_schema_migration_event');
    const identityGuard = body.indexOf('event_row.event_type is distinct from');
    const firstMutation = body.indexOf('update platform_private.outbox_events');

    expect(identityGuard).toBeGreaterThan(-1);
    expect(firstMutation).toBeGreaterThan(identityGuard);
    expect(body).toContain('event_row.schema_version is distinct from');
    expect(body).toContain('event_row.aggregate_id is distinct from');
    expect(body).toContain('event_row.aggregate_version is distinct from');
    expect(body).toContain(
      "event_row.payload->'migrationPlanId' is distinct from",
    );
    expect(body).toContain('migration_plan_id is null');
    expect(body).toContain(
      "raise exception 'CONFLICT' using errcode = 'P0001'",
    );
  });
});
