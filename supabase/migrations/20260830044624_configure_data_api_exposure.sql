-- Keep managed PostgREST exposure aligned with the committed local API allowlist.
-- This explicit role configuration intentionally replaces dashboard-managed defaults.
alter role authenticator set pgrst.db_schemas = 'platform_api, public_api';
alter role authenticator set pgrst.db_extra_search_path = 'extensions';

notify pgrst, 'reload config';
