begin;

-- Extend the canonical BE00 payload contract for the profile publication
-- invalidation topic.  Existing identity and operational topics retain their
-- exact validation rules; unknown topics remain forward-compatible.
create or replace function platform_private.valid_base_event_payload(
  event_type text,
  schema_version integer,
  payload jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  identifier text;
begin
  if event_type = 'profile.projection.invalidated.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['partyId','sourceType','sourceId','sourceVersion','reason']::text[]
      and payload - array['partyId','sourceType','sourceId','sourceVersion','reason']::text[] = '{}'::jsonb
      and (payload->>'partyId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'sourceId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'sourceType') ~ '^[a-z][a-z0-9_.-]{1,63}$'
      and pg_catalog.jsonb_typeof(payload->'sourceVersion') = 'number'
      and (payload->>'sourceVersion') ~ '^[1-9][0-9]{0,18}$'
      and (payload->>'reason') in (
        'source_changed', 'section_changed', 'emphasis_changed',
        'reel_changed', 'party_lifecycle_changed'
      );
  elsif event_type = 'identity.organization.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ? 'organizationId'
      and payload - array['organizationId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.relationship.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['relationshipType', 'relationshipId']::text[]
      and payload - array['relationshipType', 'relationshipId']::text[] = '{}'::jsonb
      and pg_catalog.jsonb_typeof(payload->'relationshipType') = 'string'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.acting-context.revoked.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['personId', 'partyId', 'relationshipId']::text[]
      and payload - array['personId', 'partyId', 'relationshipId']::text[] = '{}'::jsonb
      and (payload->>'personId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'partyId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.governance.activated.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['organizationId', 'termsVersionId']::text[]
      and payload - array['organizationId', 'termsVersionId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'termsVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  end if;

  if event_type not in ('job.requested', 'object.uploaded',
                        'provider.operation.requested', 'webhook.accepted')
     or schema_version <> 1 then
    return true;
  end if;
  if pg_catalog.jsonb_typeof(payload) <> 'object' then return false; end if;
  if event_type = 'job.requested' then
    if not (payload ?& array['jobType', 'jobId']::text[])
       or payload - array['jobType', 'jobId']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(payload->'jobType') <> 'string'
       or payload->>'jobType' !~ '^[a-z0-9][a-z0-9._-]{0,127}$' then
      return false;
    end if;
    identifier := payload->>'jobId';
  elsif event_type = 'object.uploaded' then
    if payload - array['objectId']::text[] <> '{}'::jsonb
       or not (payload ? 'objectId') then return false; end if;
    identifier := payload->>'objectId';
  elsif event_type = 'provider.operation.requested' then
    if payload - array['operationId']::text[] <> '{}'::jsonb
       or not (payload ? 'operationId') then return false; end if;
    identifier := payload->>'operationId';
  else
    if payload - array['receiptId']::text[] <> '{}'::jsonb
       or not (payload ? 'receiptId') then return false; end if;
    identifier := payload->>'receiptId';
  end if;
  return pg_catalog.jsonb_typeof(payload->(
      case when event_type = 'job.requested' then 'jobId'
           when event_type = 'object.uploaded' then 'objectId'
           when event_type = 'provider.operation.requested' then 'operationId'
           else 'receiptId' end
    )) = 'string'
    and identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
end;
$body$;

commit;
