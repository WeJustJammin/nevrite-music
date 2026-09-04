begin;

-- Slice 06 structural authority.  Profile content, derived facts, curation,
-- and reel state are kept in a dedicated schema behind forced RLS.  EPK
-- persistence is intentionally deferred to its own future slice.
create schema if not exists profiles;
create schema if not exists profile_private;
create schema if not exists profile_api;

create table if not exists profiles.profile_section_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  party_id uuid not null,
  section_code text not null,
  blocks jsonb not null,
  author_person_id uuid not null,
  acting_party_id uuid not null,
  state text not null,
  version bigint not null,
  client_reason text not null,
  created_at timestamptz not null default clock_timestamp(),
  activated_at timestamptz,
  archived_at timestamptz,
  constraint profile_section_code_check
    check (section_code in ('now', 'biography', 'services', 'availability')),
  constraint profile_section_blocks_check
    check (jsonb_typeof(blocks) = 'array'),
  constraint profile_section_state_check
    check (state in ('draft', 'active', 'archived')),
  constraint profile_section_version_check
    check (version > 0),
  constraint profile_section_reason_check
    check (char_length(client_reason) between 1 and 240),
  constraint profile_section_timestamps_check
    check (
      (state = 'archived' and activated_at is not null and archived_at is not null)
      or (state = 'active' and activated_at is not null and archived_at is null)
      or (state = 'draft' and activated_at is null and archived_at is null)
    ),
  constraint profile_section_revision_version_unique
    unique (party_id, section_code, version)
);

create unique index if not exists profile_section_one_active
  on profiles.profile_section_revisions (party_id, section_code)
  where state = 'active';
create index if not exists profile_section_history
  on profiles.profile_section_revisions (party_id, section_code, version desc);

create table if not exists profiles.profile_section_heads (
  party_id uuid not null,
  section_code text not null,
  active_revision_id uuid references profiles.profile_section_revisions(id),
  latest_revision_id uuid references profiles.profile_section_revisions(id),
  version bigint not null,
  updated_at timestamptz not null default clock_timestamp(),
  constraint profile_section_head_code_check
    check (section_code in ('now', 'biography', 'services', 'availability')),
  constraint profile_section_head_version_check
    check (version > 0),
  primary key (party_id, section_code)
);

create table if not exists profiles.profile_fact_projections (
  party_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null,
  producer text not null,
  provenance_state text not null,
  evidence_class text not null,
  evidence_count integer not null,
  visibility text not null,
  embargo_until timestamptz,
  listing_state text not null,
  dispute_state text not null,
  party_lifecycle text not null,
  occurred_on date,
  role_codes text[] not null default '{}',
  projection_payload jsonb not null,
  payload_schema_version integer not null,
  observed_at timestamptz not null default clock_timestamp(),
  applied_at timestamptz not null default clock_timestamp(),
  constraint profile_fact_identity_pkey primary key (party_id, source_type, source_id),
  constraint profile_fact_source_version_check check (source_version > 0),
  constraint profile_fact_producer_check
    check (producer in ('shard01', 'shard04', 'shard07', 'shard17', 'shard20')),
  constraint profile_fact_provenance_check
    check (provenance_state in ('asserted', 'attested', 'confirmed_assertion', 'creator_asserted', 'disputed')),
  constraint profile_fact_evidence_count_check
    check (evidence_count between 0 and 10000),
  constraint profile_fact_visibility_check
    check (visibility in ('public', 'protected', 'private')),
  constraint profile_fact_listing_check
    check (listing_state in ('listed', 'unlisted', 'ineligible')),
  constraint profile_fact_dispute_check
    check (dispute_state in ('clear', 'disputed', 'withheld')),
  constraint profile_fact_lifecycle_check
    check (party_lifecycle in ('active', 'restricted', 'closed', 'shadow_unclaimed')),
  constraint profile_fact_payload_check
    check (jsonb_typeof(projection_payload) = 'object'),
  constraint profile_fact_payload_version_check
    check (payload_schema_version > 0),
  constraint profile_fact_shadow_public_check
    check (
      party_lifecycle <> 'shadow_unclaimed'
      or visibility <> 'public'
      or listing_state <> 'listed'
      or dispute_state = 'withheld'
    )
);

create index if not exists profile_fact_public_record
  on profiles.profile_fact_projections (party_id, occurred_on desc, source_id)
  where visibility = 'public'
    and listing_state = 'listed'
    and dispute_state <> 'withheld';
create index if not exists profile_fact_source_version
  on profiles.profile_fact_projections (producer, source_type, source_id, source_version desc);

create table if not exists profiles.profile_projection_inbox (
  message_id uuid primary key,
  producer text not null,
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null,
  payload jsonb not null,
  payload_hash bytea not null,
  received_at timestamptz not null default clock_timestamp(),
  processed_at timestamptz,
  failure_code text,
  constraint profile_projection_inbox_producer_check
    check (producer in ('shard01', 'shard04', 'shard07', 'shard17', 'shard20')),
  constraint profile_projection_inbox_version_check
    check (source_version > 0),
  constraint profile_projection_inbox_payload_check
    check (jsonb_typeof(payload) = 'object'),
  constraint profile_projection_inbox_hash_check
    check (octet_length(payload_hash) = 32),
  constraint profile_projection_inbox_source_unique
    unique (producer, source_type, source_id, source_version)
);

create table if not exists profiles.profile_emphases (
  party_id uuid not null,
  surface text not null,
  default_filter jsonb,
  ordered_refs jsonb not null,
  actor_person_id uuid not null,
  acting_party_id uuid not null,
  version bigint not null,
  updated_at timestamptz not null default clock_timestamp(),
  constraint profile_emphasis_surface_check check (surface in ('public', 'epk')),
  constraint profile_emphasis_filter_check
    check (default_filter is null or jsonb_typeof(default_filter) = 'object'),
  constraint profile_emphasis_refs_check check (jsonb_typeof(ordered_refs) = 'array'),
  constraint profile_emphasis_version_check check (version > 0),
  primary key (party_id, surface)
);

create table if not exists profiles.reel_items (
  id uuid primary key default extensions.gen_random_uuid(),
  party_id uuid not null,
  credit_source_type text not null,
  credit_id uuid not null,
  credit_version bigint not null,
  media_source_type text not null,
  media_id uuid not null,
  media_version bigint not null,
  role_code text not null,
  rights_basis text not null,
  rights_source_type text not null,
  rights_id uuid not null,
  rights_version bigint not null,
  display_order integer not null,
  state text not null,
  state_reason text,
  actor_person_id uuid not null,
  acting_party_id uuid not null,
  version bigint not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint reel_credit_source_type_check check (credit_source_type = 'credit'),
  constraint reel_media_source_type_check check (media_source_type = 'media'),
  constraint reel_rights_basis_check
    check (rights_basis in ('ownership', 'licence', 'provider_publication')),
  constraint reel_rights_source_type_check
    check (rights_source_type in ('media', 'consent')),
  constraint reel_credit_version_check check (credit_version > 0),
  constraint reel_media_version_check check (media_version > 0),
  constraint reel_rights_version_check check (rights_version > 0),
  constraint reel_display_order_check check (display_order between 0 and 999),
  constraint reel_state_check
    check (state in ('draft', 'verifying_rights', 'active', 'rejected', 'takedown')),
  constraint reel_version_check check (version > 0),
  constraint reel_source_unique unique (party_id, credit_id, media_id)
);

create index if not exists reel_public_order
  on profiles.reel_items (party_id, display_order, id)
  where state = 'active';
create index if not exists reel_rights_lookup
  on profiles.reel_items (rights_source_type, rights_id)
  where state in ('verifying_rights', 'active');

-- The only public-facing relation is a narrow, security-invoker view.  It
-- contains no reel, consent, contact, or evidence identity fields.
create or replace view profiles.public_profile_facts
with (security_invoker = true)
as
  select party_id,
         source_type,
         source_id,
         source_version,
         provenance_state,
         evidence_class,
         evidence_count,
         occurred_on,
         role_codes,
         projection_payload
    from profiles.profile_fact_projections
   where visibility = 'public'
     and listing_state = 'listed'
     and dispute_state <> 'withheld'
     and party_lifecycle = 'active'
     and (embargo_until is null or embargo_until <= transaction_timestamp());

-- Every base relation is a forced RLS boundary.  The profile worker policy is
-- intentionally gated by a server-set transaction marker; producer values
-- are never read from an untrusted request claim.
alter table profiles.profile_section_revisions enable row level security;
alter table profiles.profile_section_revisions force row level security;
alter table profiles.profile_section_heads enable row level security;
alter table profiles.profile_section_heads force row level security;
alter table profiles.profile_fact_projections enable row level security;
alter table profiles.profile_fact_projections force row level security;
alter table profiles.profile_projection_inbox enable row level security;
alter table profiles.profile_projection_inbox force row level security;
alter table profiles.profile_emphases enable row level security;
alter table profiles.profile_emphases force row level security;
alter table profiles.reel_items enable row level security;
alter table profiles.reel_items force row level security;

create policy profile_section_revision_actor_policy
  on profiles.profile_section_revisions
  for all to authenticated
  using (
    (select auth.uid()) = author_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  )
  with check (
    (select auth.uid()) = author_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  );
create policy profile_section_head_actor_policy
  on profiles.profile_section_heads
  for all to authenticated
  using (
    party_id::text = nullif(current_setting('app.acting_party_id', true), '')
    or party_id::text = (select auth.uid())::text
  )
  with check (
    party_id::text = nullif(current_setting('app.acting_party_id', true), '')
    or party_id::text = (select auth.uid())::text
  );
create policy profile_fact_projection_worker_policy
  on profiles.profile_fact_projections
  for all to service_role
  using (current_setting('app.profile_worker', true) = 'true')
  with check (current_setting('app.profile_worker', true) = 'true');
create policy profile_projection_inbox_worker_policy
  on profiles.profile_projection_inbox
  for all to service_role
  using (current_setting('app.profile_worker', true) = 'true')
  with check (current_setting('app.profile_worker', true) = 'true');
create policy profile_emphasis_actor_policy
  on profiles.profile_emphases
  for all to authenticated
  using (
    (select auth.uid()) = actor_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  )
  with check (
    (select auth.uid()) = actor_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  );
create policy reel_item_actor_policy
  on profiles.reel_items
  for all to authenticated
  using (
    (select auth.uid()) = actor_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  )
  with check (
    (select auth.uid()) = actor_person_id
    or party_id::text = nullif(current_setting('app.acting_party_id', true), '')
  );

-- The browser and service roles use named RPCs, never direct table access.
revoke all on schema profiles from public, anon, authenticated, service_role;
revoke all on all tables in schema profiles from public, anon, authenticated, service_role;
revoke all on table profiles.public_profile_facts
  from public, anon, authenticated, service_role;

commit;

-- Rollback policy: forward-only compensating migration. Profile revisions,
-- derived observations, and rights history are never dropped automatically.
