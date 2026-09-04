begin;

-- Revisions are immutable records.  Only the two lifecycle transitions needed
-- by activation/archive commands may change, and only after a command has
-- established the server-local writer marker.
create or replace function profile_private.profile_section_revision_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'profile section revision history is append-only'
      using errcode = 'P0001';
  end if;
  if pg_catalog.current_setting('app.profile_revision_writer', true) <> 'true' then
    raise exception 'profile section revisions are immutable'
      using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.party_id is distinct from old.party_id
     or new.section_code is distinct from old.section_code
     or new.blocks is distinct from old.blocks
     or new.author_person_id is distinct from old.author_person_id
     or new.acting_party_id is distinct from old.acting_party_id
     or new.version is distinct from old.version
     or new.client_reason is distinct from old.client_reason
     or new.created_at is distinct from old.created_at then
    raise exception 'profile section revision content and identity are immutable'
      using errcode = 'P0001';
  end if;
  if old.state = 'draft' and new.state = 'active' then
    if new.activated_at is null or new.archived_at is not null then
      raise exception 'invalid profile section revision activation'
        using errcode = 'P0001';
    end if;
  elsif old.state = 'active' and new.state = 'archived' then
    if old.activated_at is null or new.activated_at is distinct from old.activated_at
       or new.archived_at is null then
      raise exception 'invalid profile section revision archive'
        using errcode = 'P0001';
    end if;
  else
    raise exception 'invalid profile section revision state transition'
      using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger profile_section_revision_immutable_history_guard
before update or delete on profiles.profile_section_revisions
for each row execute function profile_private.profile_section_revision_guard();

-- A section head is the serialized CAS pointer for its revision chain.  It is
-- initialized once and advanced only by the command that owns the lock.
create or replace function profile_private.profile_section_head_cas_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'profile section heads cannot be deleted'
      using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then return new; end if;
  if pg_catalog.current_setting('app.profile_head_writer', true) <> 'true' then
    raise exception 'profile section head requires a server CAS command'
      using errcode = 'P0001';
  end if;
  if new.party_id is distinct from old.party_id
     or new.section_code is distinct from old.section_code
     or new.version <> old.version + 1 then
    raise exception 'profile section head CAS version conflict'
      using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger profile_section_head_cas_guard
before update or delete on profiles.profile_section_heads
for each row execute function profile_private.profile_section_head_cas_guard();

-- Derived projections accept inserts from the bounded ingress boundary, but
-- updates require a monotonic worker marker and deletes are never permitted.
create or replace function profile_private.profile_fact_projection_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'derived profile fact projections are append/update only'
      using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then return new; end if;
  if pg_catalog.current_setting('app.profile_projection_writer', true) <> 'true' then
    raise exception 'derived profile projections cannot be edited directly'
      using errcode = 'P0001';
  end if;
  if new.party_id is distinct from old.party_id
     or new.source_type is distinct from old.source_type
     or new.source_id is distinct from old.source_id
     or new.producer is distinct from old.producer
     or new.source_version <= old.source_version then
    raise exception 'profile projection source identity is immutable and source version must be newer'
      using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger profile_fact_projection_immutable_derived_guard
before update or delete on profiles.profile_fact_projections
for each row execute function profile_private.profile_fact_projection_guard();

-- Cosmetic emphasis is a versioned preference, never an authority record.
create or replace function profile_private.profile_emphasis_version_cas_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'profile emphasis history cannot be deleted'
      using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then return new; end if;
  if pg_catalog.current_setting('app.profile_emphasis_writer', true) <> 'true' then
    raise exception 'profile emphasis writes require a server command'
      using errcode = 'P0001';
  end if;
  if new.party_id is distinct from old.party_id
     or new.surface is distinct from old.surface
     or new.version <> old.version + 1 then
    raise exception 'profile emphasis CAS version conflict'
      using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger profile_emphasis_version_cas_guard
before update or delete on profiles.profile_emphases
for each row execute function profile_private.profile_emphasis_version_cas_guard();

-- Reel state changes are rights-gated and reversible.  Source identities are
-- immutable, source observations cannot move backward, and every update must
-- advance the item CAS version under a server command marker.
create or replace function profile_private.reel_item_rights_state_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'reel items are retained; use a takedown transition'
      using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then return new; end if;
  if pg_catalog.current_setting('app.reel_writer', true) <> 'true' then
    raise exception 'reel rights and state transitions require a server command'
      using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.party_id is distinct from old.party_id
     or new.credit_source_type is distinct from old.credit_source_type
     or new.credit_id is distinct from old.credit_id
     or new.media_source_type is distinct from old.media_source_type
     or new.media_id is distinct from old.media_id
     or new.role_code is distinct from old.role_code
     or new.version <> old.version + 1
     or new.credit_version < old.credit_version
     or new.media_version < old.media_version
     or new.rights_version < old.rights_version then
    raise exception 'reel source identity, rights ordering, or CAS version is invalid'
      using errcode = 'P0001';
  end if;
  if old.state = 'draft' and new.state not in ('draft', 'verifying_rights', 'rejected', 'takedown')
     or old.state = 'verifying_rights' and new.state not in ('verifying_rights', 'active', 'rejected', 'takedown')
     or old.state = 'active' and new.state not in ('active', 'takedown')
     or old.state = 'rejected' and new.state not in ('rejected', 'verifying_rights', 'takedown')
     or old.state = 'takedown' and new.state <> 'takedown' then
    raise exception 'invalid reel rights state transition'
      using errcode = 'P0001';
  end if;
  if new.state = 'active' and new.state_reason is not null
     and pg_catalog.btrim(new.state_reason) = '' then
    raise exception 'active reel state reason must be absent or non-empty'
      using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger reel_item_rights_state_guard
before update or delete on profiles.reel_items
for each row execute function profile_private.reel_item_rights_state_guard();

do $body$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'profiles.reel_items'::regclass
       and conname = 'reel_state_reason_check'
  ) then
    alter table profiles.reel_items
      add constraint reel_state_reason_check
      check (state not in ('rejected', 'takedown')
             or (state_reason is not null and pg_catalog.length(pg_catalog.btrim(state_reason)) between 1 and 240));
  end if;
end;
$body$;

revoke all on function profile_private.profile_section_revision_guard()
  from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_section_head_cas_guard()
  from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_fact_projection_guard()
  from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_emphasis_version_cas_guard()
  from public, anon, authenticated, service_role;
revoke all on function profile_private.reel_item_rights_state_guard()
  from public, anon, authenticated, service_role;

commit;
