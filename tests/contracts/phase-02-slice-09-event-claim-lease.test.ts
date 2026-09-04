import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260902080000_content_schema_registry_authority.sql',
    import.meta.url,
  ),
  'utf8',
);

const functionBody = (name: string): string =>
  migration.match(
    new RegExp(
      `create or replace function platform_private\\.${name}\\([\\s\\S]*?\\n\\$body\\$;`,
      'u',
    ),
  )?.[0] ?? '';

describe('P2-S09 durable event claim lease contract', () => {
  it('adds event-only paired token-hash and server lease fields', () => {
    expect(migration).toMatch(
      /alter table platform_private\.idempotency_records[\s\S]*?add column claim_token_hash bytea[\s\S]*?add column claim_lease_until timestamptz/u,
    );
    expect(migration).toContain('octet_length(claim_token_hash) = 32');
    expect(migration).toContain("operation = 'cms.schema.event.claim'");
    expect(migration).not.toMatch(
      /expires_at\s*=\s*pg_catalog\.clock_timestamp/u,
    );
  });

  it('claims under lock, fences live owners, and permits expiry takeover', () => {
    const body = functionBody('cms_claim_schema_migration_event');
    expect(body).toContain("p_request->>'claimToken'");
    expect(body).toContain('for update');
    expect(body).toContain('claim_token_hash');
    expect(body).toContain('claim_lease_until');
    expect(body).toMatch(/claim_lease_until\s*<=\s*claim_now/u);
    expect(body).toContain("interval '2 minutes'");
    expect(body).toContain("state = 'failed_retryable'");
  });

  it('provides explicit release and token-fenced ACK/DLQ boundaries', () => {
    const release = functionBody('cms_release_schema_migration_event');
    const acknowledge = functionBody('cms_acknowledge_schema_migration_event');
    const deadLetter = functionBody('cms_dead_letter_schema_migration_event');
    for (const body of [release, acknowledge, deadLetter]) {
      expect(body).toContain('claim_token_hash');
      expect(body).toContain('claim_lease_until');
      expect(body).toContain('EVENT_CLAIM_LOST');
    }
    expect(release).toContain("state = 'failed_retryable'");
    expect(acknowledge).toContain("state = 'completed'");
    expect(deadLetter).toContain("state = 'failed_retryable'");
    expect(migration).toContain(
      'platform_api.cms_release_schema_migration_event(jsonb)',
    );
    expect(migration).toContain(
      'grant execute on function platform_api.cms_release_schema_migration_event(jsonb) to service_role;',
    );
  });
});
