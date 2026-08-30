begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

select has_schema(
  'platform_private',
  'platform_private owns non-exposed canonical and operational records'
);
select has_schema(
  'audit_private',
  'audit_private owns non-exposed audit and evidence records'
);
select has_schema(
  'platform_api',
  'platform_api is the allowlisted authenticated API schema'
);
select has_schema(
  'public_api',
  'public_api is the allowlisted publication schema'
);

select ok(
  not has_schema_privilege('anon', 'platform_private', 'usage'),
  'anon cannot use platform_private'
);
select ok(
  not has_schema_privilege('authenticated', 'platform_private', 'usage'),
  'authenticated cannot use platform_private'
);
select ok(
  not has_schema_privilege('anon', 'audit_private', 'usage'),
  'anon cannot use audit_private'
);
select ok(
  not has_schema_privilege('authenticated', 'audit_private', 'usage'),
  'authenticated cannot use audit_private'
);

select ok(
  has_schema_privilege('anon', 'platform_api', 'usage'),
  'anon can resolve explicitly granted platform API objects'
);
select ok(
  has_schema_privilege('authenticated', 'platform_api', 'usage'),
  'authenticated can resolve explicitly granted platform API objects'
);
select ok(
  has_schema_privilege('anon', 'public_api', 'usage'),
  'anon can resolve explicitly granted public projections'
);
select ok(
  has_schema_privilege('authenticated', 'public_api', 'usage'),
  'authenticated can resolve explicitly granted public projections'
);

select ok(
  not has_schema_privilege('anon', 'public', 'create'),
  'anon cannot create objects in public'
);
select ok(
  not has_schema_privilege('authenticated', 'public', 'create'),
  'authenticated cannot create objects in public'
);

select * from finish();

rollback;
