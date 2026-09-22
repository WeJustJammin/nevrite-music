begin;

alter table platform_private.ac265_hosted_artifact_replay_ledger
  add constraint ac265_hosted_artifact_replay_millisecond_precision
  check (
    issued_at = date_trunc('milliseconds', issued_at)
    and expires_at = date_trunc('milliseconds', expires_at)
  );

alter table platform_private.ac265_hosted_artifact_manifest_sources
  add constraint ac265_hosted_artifact_sources_millisecond_precision
  check (
    issued_at = date_trunc('milliseconds', issued_at)
    and expires_at = date_trunc('milliseconds', expires_at)
  );

commit;
