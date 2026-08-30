begin;

create schema if not exists platform_private;
create schema if not exists audit_private;
create schema if not exists platform_api;
create schema if not exists public_api;

comment on schema platform_private is
  'Non-exposed canonical and operational records owned by migration-defined contracts.';
comment on schema audit_private is
  'Non-exposed immutable audit and evidence records.';
comment on schema platform_api is
  'Allowlisted authenticated API views and functions; every object requires an explicit grant.';
comment on schema public_api is
  'Allowlisted public publication projections; every object requires an explicit grant.';

revoke all on schema platform_private from public, anon, authenticated;
revoke all on schema audit_private from public, anon, authenticated;
revoke create on schema public from public, anon, authenticated;

revoke create on schema platform_api from public, anon, authenticated, service_role;
revoke create on schema public_api from public, anon, authenticated, service_role;
grant usage on schema platform_api, public_api to anon, authenticated, service_role;

alter default privileges for role postgres in schema platform_private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema platform_private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema platform_private
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema audit_private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema audit_private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema audit_private
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema platform_api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema platform_api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema platform_api
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public_api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public_api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public_api
  revoke execute on functions from public, anon, authenticated;

commit;

-- Rollback policy: forward-only compensating migration. Once shared, these
-- schema boundaries are never dropped by an automated rollback.
