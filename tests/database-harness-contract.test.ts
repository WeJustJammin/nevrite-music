import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const repositoryRoot = new URL('../', import.meta.url);
const migrationsDirectory = new URL('supabase/migrations/', repositoryRoot);
const migrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith('_database_harness.sql'),
);

const readRepositoryFile = (relativePath: string): string => {
  const fileUrl = new URL(relativePath, repositoryRoot);
  return existsSync(fileUrl) ? readFileSync(fileUrl, 'utf8') : '';
};

const migration = migrationName
  ? readRepositoryFile(`supabase/migrations/${migrationName}`)
  : '';
const seed = readRepositoryFile('supabase/seed.sql');
const databaseTest = readRepositoryFile('supabase/tests/database_harness.sql');
const supabaseConfig = readRepositoryFile('supabase/config.toml');

describe('local database harness contract', () => {
  it('wires a reviewable migration, deterministic seed, and pgTAP suite', () => {
    expect(migrationName).toBe('20260830090000_database_harness.sql');
    expect(migration).toMatch(/\bbegin;[\s\S]*\bcommit;/i);
    expect(migration).toContain(
      'create table platform_private.db_harness_fixture',
    );
    expect(seed).toContain('delete from platform_private.db_harness_fixture');
    expect(seed).toContain("'00000000-0000-0000-0000-000000000001'");
    expect(seed).toContain("'00000000-0000-0000-0000-000000000002'");
    expect(seed).toContain('database harness synthetic fixture');
    expect(databaseTest).toContain('select plan(');
    expect(databaseTest).toContain('select * from finish()');
    expect(supabaseConfig).toContain('enabled = true');
    expect(supabaseConfig).toContain('sql_paths = ["./seed.sql"]');
  });

  it('forces row-level security and scopes rows to the authenticated user', () => {
    expect(migration).toContain(
      'alter table platform_private.db_harness_fixture enable row level security',
    );
    expect(migration).toContain(
      'alter table platform_private.db_harness_fixture force row level security',
    );
    expect(migration).toMatch(
      /create policy\s+db_harness_fixture_owner_select\s+on\s+platform_private\.db_harness_fixture[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?using\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*owner_id\s*\)/i,
    );
    expect(migration).toMatch(
      /revoke all on table\s+platform_private\.db_harness_fixture\s+from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
    expect(migration).toMatch(
      /create view\s+platform_api\.db_harness_fixture_read[\s\S]*?security_barrier[\s\S]*?where\s*\(select auth\.uid\(\)\)\s*=\s*owner_id/i,
    );
    expect(migration).toContain(
      'grant select on table platform_api.db_harness_fixture_read to authenticated',
    );
  });

  it('exposes one security-invoker, read-only RPC with named grants', () => {
    expect(migration).toMatch(
      /create or replace function\s+platform_api\.list_harness_fixtures\(\)/i,
    );
    expect(migration).toMatch(/returns table\s*\(/i);
    expect(migration).toMatch(
      /language sql[\s\S]*?stable[\s\S]*?security invoker/i,
    );
    expect(migration).toContain("set search_path = ''");
    expect(migration).not.toMatch(/security definer/i);
    expect(migration).toMatch(
      /revoke all on function\s+platform_api\.list_harness_fixtures\(\)\s+from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
    expect(migration).toContain(
      'grant execute on function platform_api.list_harness_fixtures() to authenticated',
    );
    expect(migration).toMatch(
      /select\s+id,\s*owner_id,\s*label\s+from\s+platform_api\.db_harness_fixture_read/i,
    );
    expect(migration).not.toMatch(
      /\b(insert|update|delete|truncate)\s+into?\s+platform_private\.db_harness_fixture/i,
    );
  });

  it('proves positive and negative auth behavior in the pgTAP harness', () => {
    expect(databaseTest).toContain('relrowsecurity');
    expect(databaseTest).toContain('relforcerowsecurity');
    expect(databaseTest).toContain('set local role authenticated');
    expect(databaseTest).toContain('results_eq(');
    expect(databaseTest).toContain('wrong valid user');
    expect(databaseTest).toContain('has_function_privilege');
    expect(databaseTest).toContain('throws_ok(');
    expect(databaseTest).toContain("'anon'");
    expect(databaseTest).toContain("'authenticated'");
  });

  it('contains no provider-side production mutation command or credential', () => {
    const localHarnessSources = `${migration}\n${seed}\n${databaseTest}`;
    expect(localHarnessSources).not.toMatch(
      /\bsupabase\s+(?:db\s+push|link|db\s+remote|migration\s+up)|--project-ref|SUPABASE_(?:ACCESS_TOKEN|DB_PASSWORD)/i,
    );
    expect(localHarnessSources).not.toMatch(/https?:\/\//i);
    expect(seed).toMatch(/synthetic|non-sensitive/i);
  });
});
