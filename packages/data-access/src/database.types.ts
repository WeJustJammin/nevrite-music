export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  audit_private: {
    Tables: {
      audit_events: {
        Row: {
          acting_party_id: string
          action: string
          actor_id: string | null
          correlation_id: string
          decision: Database["platform_private"]["Enums"]["audit_decision"]
          id: string
          occurred_at: string
          reason_code: string
          target_id: string
          target_type: string
        }
        Insert: {
          acting_party_id: string
          action: string
          actor_id?: string | null
          correlation_id: string
          decision: Database["platform_private"]["Enums"]["audit_decision"]
          id?: string
          occurred_at?: string
          reason_code: string
          target_id: string
          target_type: string
        }
        Update: {
          acting_party_id?: string
          action?: string
          actor_id?: string | null
          correlation_id?: string
          decision?: Database["platform_private"]["Enums"]["audit_decision"]
          id?: string
          occurred_at?: string
          reason_code?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  platform_api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      db_harness_fixture_read: {
        Row: {
          id: string | null
          label: string | null
          owner_id: string | null
        }
        Insert: {
          id?: string | null
          label?: string | null
          owner_id?: string | null
        }
        Update: {
          id?: string | null
          label?: string | null
          owner_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_job_with_outbox: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id?: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_job_id?: string
          p_job_type: string
          p_request_hash: string
        }
        Returns: {
          event_id: string
          job_id: string
          replayed: boolean
          version: number
        }[]
      }
      admin_audit_diagnostic: { Args: { p_request: Json }; Returns: Json }
      admin_capability_action: { Args: { p_request: Json }; Returns: Json }
      admin_context_capabilities: { Args: { p_request: Json }; Returns: Json }
      admin_inbox: { Args: { p_request: Json }; Returns: Json }
      apply_job_outcome:
        | {
            Args: {
              p_error_code: string
              p_expected_version: number
              p_job_id: string
              p_lease_token: string
              p_next_state: Database["platform_private"]["Enums"]["job_state"]
              p_result_ref: Json
              p_retryable: boolean
            }
            Returns: boolean
          }
        | {
            Args: {
              p_error_code: string
              p_expected_version: number
              p_job_id: string
              p_next_state: Database["platform_private"]["Enums"]["job_state"]
              p_result_ref: Json
              p_retryable: boolean
            }
            Returns: boolean
          }
      apply_object_verification: {
        Args: {
          p_correlation_id?: string
          p_error_code?: string
          p_expected_version: number
          p_job_id?: string
          p_next_state: Database["platform_private"]["Enums"]["object_state"]
          p_object_id: string
        }
        Returns: {
          applied: boolean
          job_id: string
          object_id: string
          state: Database["platform_private"]["Enums"]["object_state"]
          version: number
        }[]
      }
      apply_provider_operation_outcome: {
        Args: {
          p_attempt_ended_at?: string
          p_attempt_started_at?: string
          p_error_code?: string
          p_expected_version: number
          p_next_state: Database["platform_private"]["Enums"]["provider_operation_state"]
          p_operation_id: string
          p_provider_ref?: string
          p_retryable?: boolean
        }
        Returns: boolean
      }
      apply_provider_operation_outcome_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_attempt_ended_at?: string
          p_attempt_started_at?: string
          p_error_code?: string
          p_expected_version: number
          p_next_state: Database["platform_private"]["Enums"]["provider_operation_state"]
          p_operation_id: string
          p_provider_ref?: string
          p_retryable?: boolean
        }
        Returns: boolean
      }
      apply_webhook_receipt_outcome: {
        Args: {
          p_error_code?: string
          p_expected_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_next_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_operation_id?: string
          p_receipt_id: string
        }
        Returns: boolean
      }
      apply_webhook_receipt_outcome_authorized: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_error_code: string
          p_expected_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_next_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_operation_id: string
          p_receipt_id: string
        }
        Returns: boolean
      }
      auth_account_merge_confirm: {
        Args: {
          p_acknowledgements: Json
          p_auth_user_id: string
          p_conflict_plan_version: number
          p_correlation_id: string
          p_expected_version: number
          p_key_hash: string
          p_merge_id: string
          p_request_hash: string
          p_request_id: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_account_merge_create: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_key_hash: string
          p_request_hash: string
          p_request_id: string
          p_return_path: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_account_merge_proof_callback_complete: {
        Args: {
          p_callback_auth_user_id: string
          p_correlation_id: string
          p_provider: string
          p_provider_subject_digest: string
          p_request_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_account_merge_proof_create: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_expires_at: string
          p_key_hash: string
          p_merge_id: string
          p_nonce_digest: string
          p_pkce_verifier_digest: string
          p_provider: string
          p_request_hash: string
          p_request_id: string
          p_return_path: string
          p_session_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_account_merge_read: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_merge_id: string
          p_request_id: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_bootstrap: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_key_hash: string
          p_request_hash: string
          p_request_id: string
        }
        Returns: Json
      }
      auth_callback_complete: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_request_id: string
          p_session_expires_at: string
          p_session_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_callback_fail: {
        Args: {
          p_correlation_id: string
          p_reason: string
          p_request_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_intent_create: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_expires_at: string
          p_intent: string
          p_merge_id: string
          p_nonce_digest: string
          p_pkce_verifier_digest: string
          p_provider: string
          p_request_id: string
          p_return_path: string
          p_session_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_login_method_link_callback_complete: {
        Args: {
          p_callback_auth_user_id: string
          p_correlation_id: string
          p_provider: string
          p_provider_subject_digest: string
          p_request_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_login_method_link_intent_create: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_expires_at: string
          p_key_hash: string
          p_nonce_digest: string
          p_pkce_verifier_digest: string
          p_provider: string
          p_request_hash: string
          p_request_id: string
          p_return_path: string
          p_session_id: string
          p_state_digest: string
        }
        Returns: Json
      }
      auth_login_method_unlink: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_identity_id: string
          p_key_hash: string
          p_reason: string
          p_request_hash: string
          p_request_id: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_login_methods_read: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_request_id: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_logout: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_key_hash: string
          p_request_hash: string
          p_request_id: string
          p_scope: string
          p_session_id: string
        }
        Returns: Json
      }
      auth_provider_catalog: { Args: never; Returns: Json }
      auth_rate_limit: {
        Args: {
          p_bucket_digest: string
          p_limit: number
          p_operation_id: string
          p_window_seconds: number
        }
        Returns: Json
      }
      auth_session_read: {
        Args: { p_auth_user_id: string; p_session_id: string }
        Returns: Json
      }
      auth_session_register: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_issued_at: string
          p_request_id: string
          p_session_id: string
        }
        Returns: Json
      }
      begin_restore_fence: {
        Args: { p_reason: string; p_restore_epoch: number }
        Returns: boolean
      }
      cfg_change_action: { Args: { p_request: Json }; Returns: Json }
      cfg_propose_change: { Args: { p_request: Json }; Returns: Json }
      cfg_register_definition: { Args: { p_request: Json }; Returns: Json }
      cfg_resolve_effective_value: { Args: { p_request: Json }; Returns: Json }
      claim_job: {
        Args: {
          p_expected_version: number
          p_job_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          attempt_count: number
          job_id: string
          lease_until: string
          state: Database["platform_private"]["Enums"]["job_state"]
          version: number
        }[]
      }
      claim_outbox_batch: {
        Args: {
          p_batch_size: number
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          aggregate_version: number
          causation_id: string
          correlation_id: string
          dispatch_attempt_count: number
          event_id: string
          event_type: string
          lease_token: string
          schema_version: number
        }[]
      }
      claim_outbox_event: {
        Args: {
          p_event_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          aggregate_id: string
          aggregate_version: number
          dispatch_attempt_count: number
          event_id: string
          lease_token: string
        }[]
      }
      cms_acknowledge_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_activate_schema: { Args: { p_request: Json }; Returns: Json }
      cms_activate_schema_migration: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_add_field_definition: { Args: { p_request: Json }; Returns: Json }
      cms_advance_block_lifecycle: { Args: { p_request: Json }; Returns: Json }
      cms_begin_schema_migration_verification: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_bind_relation: { Args: { p_request: Json }; Returns: Json }
      cms_claim_operational_alert: { Args: { p_request: Json }; Returns: Json }
      cms_claim_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_claim_schema_migration_lease: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_complete_operational_alert: {
        Args: { p_request: Json }
        Returns: boolean
      }
      cms_complete_schema_migration: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_create_type_draft: { Args: { p_request: Json }; Returns: Json }
      cms_dead_letter_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_finalize_schema_migration_dry_run: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_get_content_type_version: { Args: { p_request: Json }; Returns: Json }
      cms_get_operational_state_snapshot: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_get_schema_migration_plan: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_heartbeat_schema_migration_lease: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_list_content_types: { Args: { p_request: Json }; Returns: Json }
      cms_process_schema_migration_batch: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_process_schema_migration_dry_run_batch: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_reconcile_schema_activation: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_register_block: { Args: { p_request: Json }; Returns: Json }
      cms_release_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_rollback_schema_migration: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_verify_schema_migration: { Args: { p_request: Json }; Returns: Json }
      complete_outbox_event: {
        Args: { p_event_id: string; p_lease_token: string }
        Returns: boolean
      }
      complete_restore_fence: {
        Args: { p_restore_epoch: number }
        Returns: boolean
      }
      complete_upload_intent: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id?: string
          p_expected_version: number
          p_idempotency_key_hash: string
          p_job_id?: string
          p_observed_byte_size: number
          p_observed_checksum: string
          p_observed_media_type: string
          p_request_hash: string
          p_storage_adapter: string
          p_upload_intent_id: string
        }
        Returns: {
          event_id: string
          job_id: string
          object_id: string
          object_version: number
          replayed: boolean
        }[]
      }
      complete_upload_intent_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id: string
          p_expected_object_version: number
          p_idempotency_key_hash: string
          p_job_id: string
          p_observed_byte_size: number
          p_observed_checksum: string
          p_observed_media_type: string
          p_request_hash: string
          p_storage_adapter: string
          p_target_id: string
          p_target_type: string
          p_target_version: number
          p_upload_intent_id: string
        }
        Returns: {
          event_id: string
          job_id: string
          object_id: string
          object_version: number
          replayed: boolean
          target_id: string
          target_type: string
          target_version: number
        }[]
      }
      consume_job_read_rate_limit: {
        Args: { p_acting_party_id: string; p_user_id: string }
        Returns: {
          allowed: boolean
          limit_value: number
          remaining: number
          reset_at: string
          scope: string
        }[]
      }
      create_provider_operation: {
        Args: {
          p_acting_party_id?: string
          p_actor_id: string
          p_causation_id?: string
          p_correlation_id: string
          p_intent_hash: string
          p_operation_id?: string
          p_operation_type: string
          p_provider: string
          p_provider_idempotency_key_hash: string
        }
        Returns: {
          operation_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_provider_operation_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_causation_id: string
          p_correlation_id: string
          p_governed_payload: Json
          p_intent_hash: string
          p_operation_id: string
          p_operation_type: string
          p_provider: string
          p_provider_idempotency_key_hash: string
        }
        Returns: {
          operation_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_upload_intent: {
        Args: {
          p_actor_id: string
          p_allowed_media_types: string[]
          p_bucket: string
          p_byte_size: number
          p_checksum: string
          p_correlation_id?: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_intent_id?: string
          p_max_bytes: number
          p_media_type: string
          p_object_id?: string
          p_object_key: string
          p_owner_party_id: string
          p_purpose: string
          p_request_hash: string
          p_retention_class: string
        }
        Returns: {
          expires_at: string
          intent_id: string
          object_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_upload_intent_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_allowed_media_types: string[]
          p_bucket: string
          p_byte_size: number
          p_checksum: string
          p_correlation_id: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_intent_id: string
          p_max_bytes: number
          p_media_type: string
          p_object_id: string
          p_object_key: string
          p_purpose: string
          p_request_hash: string
          p_retention_class: string
          p_target_id: string
          p_target_type: string
          p_target_version: number
        }
        Returns: {
          expires_at: string
          intent_id: string
          object_id: string
          replayed: boolean
          target_id: string
          target_type: string
          target_version: number
          version: number
        }[]
      }
      dead_letter_unknown_outbox_event: {
        Args: { p_event_id: string; p_lease_token: string }
        Returns: boolean
      }
      external_effects_allowed: { Args: never; Returns: boolean }
      get_public_party_projection: {
        Args: { p_party_id: string }
        Returns: Json
      }
      heartbeat_job_lease: {
        Args: {
          p_expected_version: number
          p_job_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: boolean
      }
      identity_alias_create: {
        Args: {
          p_display_name: string
          p_handle: string
          p_public_link_state: string
        }
        Returns: Json
      }
      identity_alias_patch: {
        Args: {
          p_alias_id: string
          p_display_name: string
          p_expected_version: number
          p_public_link_state: string
        }
        Returns: Json
      }
      identity_alias_retire: {
        Args: { p_alias_id: string; p_expected_version: number }
        Returns: Json
      }
      identity_context_bind: {
        Args: {
          p_client_binding_id: string
          p_context_id: string
          p_deliberate_confirmation: boolean
        }
        Returns: Json
      }
      identity_contexts_read: { Args: { p_cursor?: string }; Returns: Json }
      identity_create: { Args: never; Returns: Json }
      identity_facet_add: { Args: { p_facet_code: string }; Returns: Json }
      identity_facet_remove: {
        Args: { p_expected_version: number; p_facet_code: string }
        Returns: Json
      }
      identity_handle_change: {
        Args: {
          p_alias_id: string
          p_expected_version: number
          p_handle: string
        }
        Returns: Json
      }
      identity_memberships_read: {
        Args: { p_cursor?: string; p_limit?: number; p_organization_id: string }
        Returns: Json
      }
      identity_organization_read: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      identity_person_read: { Args: never; Returns: Json }
      identity_transfer_accept: {
        Args: { p_expected_version: number; p_offer_id: string }
        Returns: Json
      }
      identity_transfer_decline: {
        Args: { p_expected_version: number; p_offer_id: string }
        Returns: Json
      }
      identity_transfer_offer_create: {
        Args: { p_alias_id: string; p_recipient_person_id: string }
        Returns: Json
      }
      list_harness_fixtures: {
        Args: never
        Returns: {
          id: string
          label: string
          owner_id: string
        }[]
      }
      protected_writes_allowed: { Args: never; Returns: boolean }
      read_authorized_job: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_capability?: string
          p_job_id: string
          p_reason?: string
          p_step_up_verified?: boolean
        }
        Returns: {
          acting_party_id: string
          actor_id: string
          created_at: string
          error_code: string
          job_id: string
          job_type: string
          lease_until: string
          progress: Json
          result_ref: Json
          state: Database["platform_private"]["Enums"]["job_state"]
          updated_at: string
          version: number
        }[]
      }
      read_canonical_job: {
        Args: { p_job_id: string }
        Returns: {
          id: string
          lease_until: string
          state: Database["platform_private"]["Enums"]["job_state"]
          type: string
          version: number
        }[]
      }
      read_consumable_object: {
        Args: { p_object_id: string }
        Returns: {
          bucket: string
          byte_size: number
          checksum: string
          id: string
          media_type: string
          object_key: string
          version: number
        }[]
      }
      read_provider_operation_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_operation_id: string
        }
        Returns: {
          acting_party_id: string
          actor_id: string
          attempts: Json
          causation_id: string
          correlation_id: string
          governed_payload: Json
          intent_hash: string
          last_attempt_at: string
          operation_id: string
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
          provider_ref: string
          reconciliation_at: string
          state: Database["platform_private"]["Enums"]["provider_operation_state"]
          version: number
        }[]
      }
      read_recovery_provenance: {
        Args: never
        Returns: {
          artifact_digest: string
          artifact_id: string
          environment: string
          evidence_id: string
          promoted_at: string
          promotion_expires_at: string
          promotion_id: string
          provenance_kind: string
          provenance_valid: boolean
          source_revision: string
        }[]
      }
      read_recovery_verification: {
        Args: never
        Returns: {
          consumer_restore_epoch: number
          current_restore_epoch: number
          evidence_id: string
          evidence_present: boolean
          expires_at: string
          idempotency_outbox_job_verified: boolean
          integrity_verified: boolean
          measured_rpo_seconds: number
          measured_rto_seconds: number
          object_verified: boolean
          pitr_available: boolean
          pitr_status: string
          pitr_supported: boolean
          pitr_window_seconds: number
          protected_writes_allowed: boolean
          provider_webhook_verified: boolean
          public_projection_verified: boolean
          reason_code: string
          restore_epoch: number
          rls_verified: boolean
          rpc_verified: boolean
          verified_at: string
        }[]
      }
      read_restore_fence: {
        Args: never
        Returns: {
          consumer_epoch: number
          expected_epoch: number
          integrity_verified: boolean
          reconciliation_complete: boolean
        }[]
      }
      record_processed_event: {
        Args: {
          p_aggregate_id: string
          p_event_id: string
          p_event_type: string
          p_pending_manual_review: boolean
          p_schema_version: number
        }
        Returns: string
      }
      record_promoted_recovery_verification: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_artifact_digest: string
          p_artifact_id: string
          p_correlation_id?: string
          p_environment: string
          p_evidence_id?: string
          p_expires_at?: string
          p_idempotency_outbox_job_verified: boolean
          p_integrity_verified: boolean
          p_measured_rpo_seconds: number
          p_measured_rto_seconds: number
          p_object_verified: boolean
          p_pitr_supported: boolean
          p_pitr_window_seconds: number
          p_promotion_id: string
          p_provider_webhook_verified: boolean
          p_public_projection_verified: boolean
          p_restore_epoch: number
          p_rls_verified: boolean
          p_rpc_verified: boolean
          p_source_revision: string
          p_verified_at?: string
        }
        Returns: {
          evidence_id: string
          protected_writes_allowed: boolean
        }[]
      }
      record_webhook_receipt: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_correlation_id?: string
          p_external_event_id: string
          p_operation_id?: string
          p_payload_digest: string
          p_provider: string
          p_receipt_id?: string
          p_signature_verified_at: string
        }
        Returns: {
          accepted: boolean
          conflict: boolean
          duplicate: boolean
          operation_id: string
          receipt_id: string
          state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }[]
      }
      record_webhook_receipt_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_type: string
          p_external_event_id: string
          p_normalized_event: Json
          p_operation_id: string
          p_payload_digest: string
          p_provider: string
          p_receipt_id: string
          p_schema_version: number
          p_signature_verified_at: string
        }
        Returns: {
          accepted: boolean
          conflict: boolean
          duplicate: boolean
          event_type: string
          operation_id: string
          receipt_id: string
          schema_version: number
          state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }[]
      }
      rpc_accept_or_end_membership: {
        Args: {
          p_action: string
          p_counterpart_confirmation_id: string
          p_ends_on: string
          p_expected_version: number
          p_reason_code: string
          p_tenure_id: string
          p_terms_hash?: string
          p_terms_version_id: string
        }
        Returns: Json
      }
      rpc_add_capacity_period: {
        Args: {
          p_capacity: string
          p_ends_on: string
          p_expected_version: number
          p_starts_on: string
          p_tenure_id: string
        }
        Returns: Json
      }
      rpc_assert_membership: {
        Args: {
          p_ends_on: string
          p_evidence_ref: string
          p_expected_version?: number
          p_organization_id: string
          p_person_id: string
          p_starts_on: string
        }
        Returns: Json
      }
      rpc_cfg_change_action: { Args: { p_request: Json }; Returns: Json }
      rpc_cfg_propose_change: { Args: { p_request: Json }; Returns: Json }
      rpc_cfg_register_definition: { Args: { p_request: Json }; Returns: Json }
      rpc_cfg_resolve_effective_value: {
        Args: { p_request: Json }
        Returns: Json
      }
      rpc_change_organization_type: {
        Args: {
          p_action: string
          p_expected_version: number
          p_organization_id: string
          p_type_code: string
        }
        Returns: Json
      }
      rpc_convert_claim: { Args: { p_request: Json }; Returns: Json }
      rpc_create_organization: {
        Args: { p_mode: string; p_type_codes: string[] }
        Returns: Json
      }
      rpc_create_shadow_by_reference: {
        Args: { p_request: Json }
        Returns: Json
      }
      rpc_dispatch_invitation: { Args: { p_request: Json }; Returns: Json }
      rpc_invite_membership: {
        Args: {
          p_capacity: string
          p_expected_version?: number
          p_governance_mode?: string
          p_invite_expires_at: string
          p_organization_id: string
          p_person_id: string
          p_starts_on: string
          p_terms_version_id: string
        }
        Returns: Json
      }
      rpc_issue_claim_challenge: { Args: { p_request: Json }; Returns: Json }
      rpc_match_shadow: { Args: { p_request: Json }; Returns: Json }
      rpc_profile_emphasis: { Args: { p_request: Json }; Returns: Json }
      rpc_profile_observation_apply: {
        Args: { p_request: Json }
        Returns: Json
      }
      rpc_profile_public_facts: { Args: { p_party_id: string }; Returns: Json }
      rpc_profile_reel_create: { Args: { p_request: Json }; Returns: Json }
      rpc_profile_reel_patch: { Args: { p_request: Json }; Returns: Json }
      rpc_profile_reel_takedown: { Args: { p_request: Json }; Returns: Json }
      rpc_profile_section: { Args: { p_request: Json }; Returns: Json }
      rpc_read_claim: { Args: { p_request: Json }; Returns: Json }
      rpc_start_claim: { Args: { p_request: Json }; Returns: Json }
      rpc_submit_claim_proof: { Args: { p_request: Json }; Returns: Json }
      rpc_submit_remedy: { Args: { p_request: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  platform_private: {
    Tables: {
      acting_context_binding: {
        Row: {
          acting_party_id: string
          client_binding_id: string
          context_kind: string
          created_at: string
          expires_at: string
          id: string
          last_seen_at: string
          person_id: string
          projection_version: number
          selected_at: string
          source_relationship_id: string | null
          state: Database["platform_private"]["Enums"]["context_binding_state"]
          updated_at: string
          version: number
        }
        Insert: {
          acting_party_id: string
          client_binding_id: string
          context_kind: string
          created_at?: string
          expires_at: string
          id?: string
          last_seen_at?: string
          person_id: string
          projection_version?: number
          selected_at?: string
          source_relationship_id?: string | null
          state?: Database["platform_private"]["Enums"]["context_binding_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          acting_party_id?: string
          client_binding_id?: string
          context_kind?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_seen_at?: string
          person_id?: string
          projection_version?: number
          selected_at?: string
          source_relationship_id?: string | null
          state?: Database["platform_private"]["Enums"]["context_binding_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "acting_context_binding_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acting_context_binding_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "acting_context_binding_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "acting_context_binding_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      admin_audit_links: {
        Row: {
          audit_event_id: string | null
          change_id: string | null
          content_revision_id: string | null
          created_at: string
          financial_audit_id: string | null
          id: string
          safe_label: string
          security_event_id: string | null
          source_id: string
          source_type: string
          source_version: number
        }
        Insert: {
          audit_event_id?: string | null
          change_id?: string | null
          content_revision_id?: string | null
          created_at?: string
          financial_audit_id?: string | null
          id?: string
          safe_label: string
          security_event_id?: string | null
          source_id: string
          source_type: string
          source_version: number
        }
        Update: {
          audit_event_id?: string | null
          change_id?: string | null
          content_revision_id?: string | null
          created_at?: string
          financial_audit_id?: string | null
          id?: string
          safe_label?: string
          security_event_id?: string | null
          source_id?: string
          source_type?: string
          source_version?: number
        }
        Relationships: []
      }
      admin_bulk_item_results: {
        Row: {
          attempt_count: number
          completed_at: string | null
          expected_version: number
          id: string
          operation_id: string
          result_code: string | null
          result_summary: Json | null
          state: string
          target_id: string
          target_type: string
          version_no: number
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          expected_version: number
          id?: string
          operation_id: string
          result_code?: string | null
          result_summary?: Json | null
          state: string
          target_id: string
          target_type: string
          version_no?: number
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          expected_version?: number
          id?: string
          operation_id?: string
          result_code?: string | null
          result_summary?: Json | null
          state?: string
          target_id?: string
          target_type?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_bulk_item_results_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "admin_bulk_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_bulk_operations: {
        Row: {
          acting_party_id: string | null
          actor_person_id: string
          cancelled_at: string | null
          command_key: string
          command_version: number
          created_at: string
          cursor: number
          dry_run_report: Json | null
          failure_count: number
          id: string
          idempotency_key: string
          query_spec: Json | null
          skipped_count: number
          state: string
          success_count: number
          target_count: number
          target_manifest_hash: string
          target_manifest_object_id: string
          updated_at: string
          version_no: number
        }
        Insert: {
          acting_party_id?: string | null
          actor_person_id: string
          cancelled_at?: string | null
          command_key: string
          command_version: number
          created_at?: string
          cursor?: number
          dry_run_report?: Json | null
          failure_count?: number
          id?: string
          idempotency_key: string
          query_spec?: Json | null
          skipped_count?: number
          state: string
          success_count?: number
          target_count: number
          target_manifest_hash: string
          target_manifest_object_id: string
          updated_at?: string
          version_no?: number
        }
        Update: {
          acting_party_id?: string | null
          actor_person_id?: string
          cancelled_at?: string | null
          command_key?: string
          command_version?: number
          created_at?: string
          cursor?: number
          dry_run_report?: Json | null
          failure_count?: number
          id?: string
          idempotency_key?: string
          query_spec?: Json | null
          skipped_count?: number
          state?: string
          success_count?: number
          target_count?: number
          target_manifest_hash?: string
          target_manifest_object_id?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_bulk_operations_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_bulk_operations_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_bulk_operations_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_bulk_operations_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_bulk_operations_target_manifest_object_id_fkey"
            columns: ["target_manifest_object_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_capability_grants: {
        Row: {
          actions: string[]
          approver_person_id: string | null
          capability_key: string
          created_at: string
          ends_at: string
          grantor_person_id: string
          id: string
          purpose_grant: boolean
          reason: string
          resource_id: string
          resource_type: string
          revoked_at: string | null
          revoked_by: string | null
          scope: Json
          starts_at: string
          state: string
          subject_person_id: string
          version_no: number
        }
        Insert: {
          actions: string[]
          approver_person_id?: string | null
          capability_key: string
          created_at?: string
          ends_at: string
          grantor_person_id: string
          id?: string
          purpose_grant: boolean
          reason: string
          resource_id: string
          resource_type: string
          revoked_at?: string | null
          revoked_by?: string | null
          scope: Json
          starts_at: string
          state: string
          subject_person_id: string
          version_no: number
        }
        Update: {
          actions?: string[]
          approver_person_id?: string | null
          capability_key?: string
          created_at?: string
          ends_at?: string
          grantor_person_id?: string
          id?: string
          purpose_grant?: boolean
          reason?: string
          resource_id?: string
          resource_type?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scope?: Json
          starts_at?: string
          state?: string
          subject_person_id?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_capability_grants_approver_person_id_fkey"
            columns: ["approver_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_approver_person_id_fkey"
            columns: ["approver_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_approver_person_id_fkey"
            columns: ["approver_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_grantor_person_id_fkey"
            columns: ["grantor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_grantor_person_id_fkey"
            columns: ["grantor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_grantor_person_id_fkey"
            columns: ["grantor_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_capability_grants_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      admin_diagnostic_definition_versions: {
        Row: {
          created_at: string
          evidence_schema: Json
          freshness_seconds: number
          hash: string
          id: string
          input_schema: Json
          key: string
          lifecycle: string
          owner_capability: string
          runbook_ref: string
          severity_mapping: Json
          timeout_ms: number
          version_no: number
        }
        Insert: {
          created_at?: string
          evidence_schema: Json
          freshness_seconds: number
          hash: string
          id?: string
          input_schema: Json
          key: string
          lifecycle: string
          owner_capability: string
          runbook_ref: string
          severity_mapping: Json
          timeout_ms: number
          version_no: number
        }
        Update: {
          created_at?: string
          evidence_schema?: Json
          freshness_seconds?: number
          hash?: string
          id?: string
          input_schema?: Json
          key?: string
          lifecycle?: string
          owner_capability?: string
          runbook_ref?: string
          severity_mapping?: Json
          timeout_ms?: number
          version_no?: number
        }
        Relationships: []
      }
      admin_diagnostic_runs: {
        Row: {
          actor_person_id: string | null
          completed_at: string | null
          created_at: string
          definition_id: string
          definition_version: number
          evidence_ref: string | null
          freshness_at: string | null
          id: string
          job_id: string | null
          result_codes: string[]
          started_at: string
          state: string
          target_id: string
          target_type: string
          target_version: number | null
          version_no: number
        }
        Insert: {
          actor_person_id?: string | null
          completed_at?: string | null
          created_at?: string
          definition_id: string
          definition_version: number
          evidence_ref?: string | null
          freshness_at?: string | null
          id?: string
          job_id?: string | null
          result_codes?: string[]
          started_at?: string
          state: string
          target_id: string
          target_type: string
          target_version?: number | null
          version_no?: number
        }
        Update: {
          actor_person_id?: string | null
          completed_at?: string | null
          created_at?: string
          definition_id?: string
          definition_version?: number
          evidence_ref?: string | null
          freshness_at?: string | null
          id?: string
          job_id?: string | null
          result_codes?: string[]
          started_at?: string
          state?: string
          target_id?: string
          target_type?: string
          target_version?: number | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_diagnostic_runs_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_diagnostic_runs_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_diagnostic_runs_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_diagnostic_runs_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "admin_diagnostic_definition_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_diagnostic_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_task_projections: {
        Row: {
          assignee_person_id: string | null
          created_at: string
          due_at: string | null
          freshness_at: string
          freshness_state: string
          id: string
          last_error_code: string | null
          required_capability: string
          severity: string
          source_id: string
          source_status: string
          source_type: string
          source_version: number
          state: string
          task_class: string
          updated_at: string
        }
        Insert: {
          assignee_person_id?: string | null
          created_at?: string
          due_at?: string | null
          freshness_at: string
          freshness_state: string
          id?: string
          last_error_code?: string | null
          required_capability: string
          severity: string
          source_id: string
          source_status: string
          source_type: string
          source_version: number
          state: string
          task_class: string
          updated_at?: string
        }
        Update: {
          assignee_person_id?: string | null
          created_at?: string
          due_at?: string | null
          freshness_at?: string
          freshness_state?: string
          id?: string
          last_error_code?: string | null
          required_capability?: string
          severity?: string
          source_id?: string
          source_status?: string
          source_type?: string
          source_version?: number
          state?: string
          task_class?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_task_projections_assignee_person_id_fkey"
            columns: ["assignee_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "admin_task_projections_assignee_person_id_fkey"
            columns: ["assignee_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "admin_task_projections_assignee_person_id_fkey"
            columns: ["assignee_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      alias_ownership_period: {
        Row: {
          alias_id: string
          created_at: string
          ends_at: string | null
          id: string
          owner_person_id: string
          starts_at: string
          transfer_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          alias_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          owner_person_id: string
          starts_at: string
          transfer_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          alias_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          owner_person_id?: string
          starts_at?: string
          transfer_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "alias_ownership_period_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "alias_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_ownership_period_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "identity_public_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_ownership_period_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_ownership_period_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "alias_ownership_period_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_ownership_period_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "alias_transfer_offer"
            referencedColumns: ["id"]
          },
        ]
      }
      alias_party: {
        Row: {
          created_at: string
          current_handle_id: string
          display_name: string
          lifecycle: Database["platform_private"]["Enums"]["alias_lifecycle"]
          party_id: string
          public_link_state: Database["platform_private"]["Enums"]["public_link_state"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          current_handle_id: string
          display_name: string
          lifecycle?: Database["platform_private"]["Enums"]["alias_lifecycle"]
          party_id: string
          public_link_state?: Database["platform_private"]["Enums"]["public_link_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          current_handle_id?: string
          display_name?: string
          lifecycle?: Database["platform_private"]["Enums"]["alias_lifecycle"]
          party_id?: string
          public_link_state?: Database["platform_private"]["Enums"]["public_link_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "alias_party_current_handle_id_fkey"
            columns: ["current_handle_id"]
            isOneToOne: false
            referencedRelation: "handle_reservation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alias_party_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      alias_transfer_offer: {
        Row: {
          accepted_at: string | null
          alias_id: string
          closed_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string
          id: string
          offered_at: string
          offering_person_id: string
          recipient_person_id: string
          state: Database["platform_private"]["Enums"]["transfer_offer_state"]
          updated_at: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          alias_id: string
          closed_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at: string
          id?: string
          offered_at?: string
          offering_person_id: string
          recipient_person_id: string
          state?: Database["platform_private"]["Enums"]["transfer_offer_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          alias_id?: string
          closed_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          offered_at?: string
          offering_person_id?: string
          recipient_person_id?: string
          state?: Database["platform_private"]["Enums"]["transfer_offer_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "alias_transfer_offer_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "alias_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_alias_id_fkey"
            columns: ["alias_id"]
            isOneToOne: false
            referencedRelation: "identity_public_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_offering_person_id_fkey"
            columns: ["offering_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_offering_person_id_fkey"
            columns: ["offering_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_offering_person_id_fkey"
            columns: ["offering_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_recipient_person_id_fkey"
            columns: ["recipient_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_recipient_person_id_fkey"
            columns: ["recipient_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "alias_transfer_offer_recipient_person_id_fkey"
            columns: ["recipient_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      cfg_config_approvals: {
        Row: {
          acting_party_id: string | null
          capability: string
          decided_at: string
          decision: string
          reason: string
          review_id: string
          review_version: number
          reviewed_hash: string
          reviewer_person_id: string
        }
        Insert: {
          acting_party_id?: string | null
          capability: string
          decided_at?: string
          decision: string
          reason: string
          review_id: string
          review_version: number
          reviewed_hash: string
          reviewer_person_id: string
        }
        Update: {
          acting_party_id?: string | null
          capability?: string
          decided_at?: string
          decision?: string
          reason?: string
          review_id?: string
          review_version?: number
          reviewed_hash?: string
          reviewer_person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfg_config_approvals_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_config_approvals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "cfg_config_change_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      cfg_config_change_reviews: {
        Row: {
          candidate_id: string
          candidate_type: string
          candidate_version: number
          created_at: string
          effective_context_hash: string | null
          frozen_hash: string
          id: string
          impact_manifest: Json
          impact_manifest_hash: string
          required_approvals: number
          risk_class: string
          rollback_hash: string | null
          rollback_value: Json | null
          state: string
          submitted_at: string
          submitted_by: string
          updated_at: string
          version_no: number
        }
        Insert: {
          candidate_id: string
          candidate_type: string
          candidate_version: number
          created_at?: string
          effective_context_hash?: string | null
          frozen_hash: string
          id?: string
          impact_manifest: Json
          impact_manifest_hash: string
          required_approvals: number
          risk_class: string
          rollback_hash?: string | null
          rollback_value?: Json | null
          state: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
          version_no?: number
        }
        Update: {
          candidate_id?: string
          candidate_type?: string
          candidate_version?: number
          created_at?: string
          effective_context_hash?: string | null
          frozen_hash?: string
          id?: string
          impact_manifest?: Json
          impact_manifest_hash?: string
          required_approvals?: number
          risk_class?: string
          rollback_hash?: string | null
          rollback_value?: Json | null
          state?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: []
      }
      cfg_experiment_versions: {
        Row: {
          allocation: Json
          consent_ref: string | null
          created_at: string
          created_by: string
          eligibility_dimensions: string[]
          ends_at: string
          hypothesis: string
          id: string
          key: string
          metrics: string[]
          owner_person_id: string
          starts_at: string
          state: string
          stop_rule: Json
          variants: Json
          version_no: number
        }
        Insert: {
          allocation: Json
          consent_ref?: string | null
          created_at?: string
          created_by: string
          eligibility_dimensions: string[]
          ends_at: string
          hypothesis: string
          id?: string
          key: string
          metrics: string[]
          owner_person_id: string
          starts_at: string
          state: string
          stop_rule: Json
          variants: Json
          version_no: number
        }
        Update: {
          allocation?: Json
          consent_ref?: string | null
          created_at?: string
          created_by?: string
          eligibility_dimensions?: string[]
          ends_at?: string
          hypothesis?: string
          id?: string
          key?: string
          metrics?: string[]
          owner_person_id?: string
          starts_at?: string
          state?: string
          stop_rule?: Json
          variants?: Json
          version_no?: number
        }
        Relationships: []
      }
      cfg_feature_flag_versions: {
        Row: {
          allocation: Json
          created_at: string
          created_by: string
          dependencies: string[]
          eligibility_rule_key: string
          eligibility_rule_version: number
          ends_at: string
          environments: string[]
          expires_at: string
          fallback: Json
          id: string
          key: string
          owner_person_id: string
          purpose: string
          starts_at: string
          state: string
          version_no: number
        }
        Insert: {
          allocation: Json
          created_at?: string
          created_by: string
          dependencies?: string[]
          eligibility_rule_key: string
          eligibility_rule_version: number
          ends_at: string
          environments: string[]
          expires_at: string
          fallback: Json
          id?: string
          key: string
          owner_person_id: string
          purpose: string
          starts_at: string
          state: string
          version_no: number
        }
        Update: {
          allocation?: Json
          created_at?: string
          created_by?: string
          dependencies?: string[]
          eligibility_rule_key?: string
          eligibility_rule_version?: number
          ends_at?: string
          environments?: string[]
          expires_at?: string
          fallback?: Json
          id?: string
          key?: string
          owner_person_id?: string
          purpose?: string
          starts_at?: string
          state?: string
          version_no?: number
        }
        Relationships: []
      }
      cfg_kill_switch_activations: {
        Row: {
          acting_party_id: string | null
          actor_person_id: string
          canonical_state: string
          created_at: string
          ends_at: string | null
          id: string
          incident_ref: string
          reason: string
          resolved_at: string | null
          runtime_snapshot_hash: string
          scope_id: string | null
          scope_type: string
          started_at: string
          switch_id: string
          switch_version_id: string
          version_no: number
        }
        Insert: {
          acting_party_id?: string | null
          actor_person_id: string
          canonical_state: string
          created_at?: string
          ends_at?: string | null
          id?: string
          incident_ref: string
          reason: string
          resolved_at?: string | null
          runtime_snapshot_hash: string
          scope_id?: string | null
          scope_type: string
          started_at: string
          switch_id: string
          switch_version_id: string
          version_no: number
        }
        Update: {
          acting_party_id?: string | null
          actor_person_id?: string
          canonical_state?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          incident_ref?: string
          reason?: string
          resolved_at?: string | null
          runtime_snapshot_hash?: string
          scope_id?: string | null
          scope_type?: string
          started_at?: string
          switch_id?: string
          switch_version_id?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "cfg_kill_switch_activations_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_kill_switch_activations_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "cfg_kill_switch_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_kill_switch_activations_switch_version_id_fkey"
            columns: ["switch_version_id"]
            isOneToOne: false
            referencedRelation: "cfg_kill_switch_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cfg_kill_switch_versions: {
        Row: {
          allowed_scopes: Json
          created_at: string
          fallback_mode: string
          id: string
          key: string
          owner_person_id: string
          runtime_contract_version: number
          state: string
          version_no: number
        }
        Insert: {
          allowed_scopes: Json
          created_at?: string
          fallback_mode: string
          id?: string
          key: string
          owner_person_id: string
          runtime_contract_version: number
          state: string
          version_no: number
        }
        Update: {
          allowed_scopes?: Json
          created_at?: string
          fallback_mode?: string
          id?: string
          key?: string
          owner_person_id?: string
          runtime_contract_version?: number
          state?: string
          version_no?: number
        }
        Relationships: []
      }
      cfg_release_principals: {
        Row: {
          active: boolean
          created_at: string
          key_id: string
          principal_id: string
          public_key: string | null
          revoked_at: string | null
          scope: string
          valid_from: string | null
          valid_through: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          key_id: string
          principal_id: string
          public_key?: string | null
          revoked_at?: string | null
          scope?: string
          valid_from?: string | null
          valid_through?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          key_id?: string
          principal_id?: string
          public_key?: string | null
          revoked_at?: string | null
          scope?: string
          valid_from?: string | null
          valid_through?: string | null
        }
        Relationships: []
      }
      cfg_setting_definition_versions: {
        Row: {
          allowed_scopes: string[]
          approver_policy: Json
          consumer_keys: string[]
          contract_release: string
          created_at: string
          created_by: string
          default_source: string
          default_value: Json | null
          definition_id: string
          deprecated_at: string | null
          hash: string
          id: string
          key: string
          lifecycle: string
          merge_mode: string
          owner_capability: string
          precedence: string[]
          risk_class: string
          schema: Json
          sensitivity: string
          value_kind: string
          version_no: number
        }
        Insert: {
          allowed_scopes: string[]
          approver_policy: Json
          consumer_keys?: string[]
          contract_release: string
          created_at?: string
          created_by: string
          default_source: string
          default_value?: Json | null
          definition_id: string
          deprecated_at?: string | null
          hash: string
          id?: string
          key: string
          lifecycle?: string
          merge_mode: string
          owner_capability: string
          precedence: string[]
          risk_class: string
          schema: Json
          sensitivity: string
          value_kind: string
          version_no: number
        }
        Update: {
          allowed_scopes?: string[]
          approver_policy?: Json
          consumer_keys?: string[]
          contract_release?: string
          created_at?: string
          created_by?: string
          default_source?: string
          default_value?: Json | null
          definition_id?: string
          deprecated_at?: string | null
          hash?: string
          id?: string
          key?: string
          lifecycle?: string
          merge_mode?: string
          owner_capability?: string
          precedence?: string[]
          risk_class?: string
          schema?: Json
          sensitivity?: string
          value_kind?: string
          version_no?: number
        }
        Relationships: []
      }
      cfg_setting_value_versions: {
        Row: {
          acting_party_id: string | null
          author_person_id: string
          created_at: string
          definition_id: string
          definition_version_id: string
          effective_from: string
          effective_to: string | null
          environment: string | null
          id: string
          scope_id: string | null
          scope_type: string
          state: string
          supersedes_id: string | null
          typed_value: Json
          updated_at: string
          value_hash: string
          version_no: number
        }
        Insert: {
          acting_party_id?: string | null
          author_person_id: string
          created_at?: string
          definition_id: string
          definition_version_id: string
          effective_from: string
          effective_to?: string | null
          environment?: string | null
          id?: string
          scope_id?: string | null
          scope_type: string
          state: string
          supersedes_id?: string | null
          typed_value: Json
          updated_at?: string
          value_hash: string
          version_no: number
        }
        Update: {
          acting_party_id?: string | null
          author_person_id?: string
          created_at?: string
          definition_id?: string
          definition_version_id?: string
          effective_from?: string
          effective_to?: string | null
          environment?: string | null
          id?: string
          scope_id?: string | null
          scope_type?: string
          state?: string
          supersedes_id?: string | null
          typed_value?: Json
          updated_at?: string
          value_hash?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "cfg_setting_value_versions_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_setting_value_versions_definition_version_id_fkey"
            columns: ["definition_version_id"]
            isOneToOne: false
            referencedRelation: "cfg_setting_definition_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_setting_value_versions_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "cfg_setting_value_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cfg_snapshot_intents: {
        Row: {
          completed_at: string | null
          config_hash: string
          id: string
          requested_at: string
          requested_by: string
          review_id: string | null
          state: string
          value_version_id: string | null
        }
        Insert: {
          completed_at?: string | null
          config_hash: string
          id?: string
          requested_at?: string
          requested_by: string
          review_id?: string | null
          state?: string
          value_version_id?: string | null
        }
        Update: {
          completed_at?: string | null
          config_hash?: string
          id?: string
          requested_at?: string
          requested_by?: string
          review_id?: string | null
          state?: string
          value_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cfg_snapshot_intents_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "cfg_config_change_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfg_snapshot_intents_value_version_id_fkey"
            columns: ["value_version_id"]
            isOneToOne: false
            referencedRelation: "cfg_setting_value_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_block_definition_lifecycle_events: {
        Row: {
          block_definition_version_id: string
          block_key: string
          block_version: number
          created_at: string
          from_lifecycle: string
          id: string
          owner_id: string
          release_digest: string
          release_key_id: string
          release_nonce_hash: string
          release_principal_id: string
          release_raw_body_hash: string
          release_signature_hash: string
          release_verified_at: string
          state: string
          to_lifecycle: string
          updated_at: string
          version: number
        }
        Insert: {
          block_definition_version_id: string
          block_key: string
          block_version: number
          created_at?: string
          from_lifecycle: string
          id?: string
          owner_id: string
          release_digest: string
          release_key_id: string
          release_nonce_hash: string
          release_principal_id: string
          release_raw_body_hash: string
          release_signature_hash: string
          release_verified_at: string
          state?: string
          to_lifecycle: string
          updated_at?: string
          version?: number
        }
        Update: {
          block_definition_version_id?: string
          block_key?: string
          block_version?: number
          created_at?: string
          from_lifecycle?: string
          id?: string
          owner_id?: string
          release_digest?: string
          release_key_id?: string
          release_nonce_hash?: string
          release_principal_id?: string
          release_raw_body_hash?: string
          release_signature_hash?: string
          release_verified_at?: string
          state?: string
          to_lifecycle?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_block_definition_lifecycle_block_definition_version_id_fkey"
            columns: ["block_definition_version_id"]
            isOneToOne: false
            referencedRelation: "cms_block_definition_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_block_definition_versions: {
        Row: {
          accessibility_contract: Json
          allowed_children: Json
          block_key: string
          block_version: number
          compatibility_range: Json
          created_at: string
          data_source_permissions: Json
          id: string
          owner_id: string
          props_attestation_key_id: string
          props_attestation_signature_hash: string
          props_attestation_verified_at: string
          props_schema_hash: string
          props_schema_ref: string
          props_schema_snapshot: Json
          props_snapshot_attestation: Json
          props_snapshot_hash: string
          release_digest: string
          release_key_id: string
          release_nonce_hash: string
          release_principal_id: string
          release_raw_body_hash: string
          release_signature_hash: string
          release_verified_at: string
          renderer_ref: string
          slot_rules: Json
          state: string
          updated_at: string
          version: number
        }
        Insert: {
          accessibility_contract: Json
          allowed_children: Json
          block_key: string
          block_version: number
          compatibility_range: Json
          created_at?: string
          data_source_permissions: Json
          id?: string
          owner_id: string
          props_attestation_key_id: string
          props_attestation_signature_hash: string
          props_attestation_verified_at: string
          props_schema_hash: string
          props_schema_ref: string
          props_schema_snapshot: Json
          props_snapshot_attestation: Json
          props_snapshot_hash: string
          release_digest: string
          release_key_id: string
          release_nonce_hash: string
          release_principal_id: string
          release_raw_body_hash: string
          release_signature_hash: string
          release_verified_at: string
          renderer_ref: string
          slot_rules: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Update: {
          accessibility_contract?: Json
          allowed_children?: Json
          block_key?: string
          block_version?: number
          compatibility_range?: Json
          created_at?: string
          data_source_permissions?: Json
          id?: string
          owner_id?: string
          props_attestation_key_id?: string
          props_attestation_signature_hash?: string
          props_attestation_verified_at?: string
          props_schema_hash?: string
          props_schema_ref?: string
          props_schema_snapshot?: Json
          props_snapshot_attestation?: Json
          props_snapshot_hash?: string
          release_digest?: string
          release_key_id?: string
          release_nonce_hash?: string
          release_principal_id?: string
          release_raw_body_hash?: string
          release_signature_hash?: string
          release_verified_at?: string
          renderer_ref?: string
          slot_rules?: Json
          state?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      cms_content_type_capability_bindings: {
        Row: {
          capability_key: string
          capability_version: number
          content_type_version_id: string
          created_at: string
          id: string
          owner_id: string
          state: Database["platform_private"]["Enums"]["cms_definition_state"]
          updated_at: string
          version: number
        }
        Insert: {
          capability_key: string
          capability_version: number
          content_type_version_id: string
          created_at?: string
          id?: string
          owner_id: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          capability_key?: string
          capability_version?: number
          content_type_version_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_type_capability_bindin_content_type_version_id_fkey"
            columns: ["content_type_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_type_template_bindings: {
        Row: {
          content_type_version_id: string
          created_at: string
          id: string
          owner_id: string
          position: number
          state: Database["platform_private"]["Enums"]["cms_definition_state"]
          template_version_id: string
          updated_at: string
          version: number
        }
        Insert: {
          content_type_version_id: string
          created_at?: string
          id?: string
          owner_id: string
          position: number
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          template_version_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_type_version_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          position?: number
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          template_version_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_type_template_bindings_content_type_version_id_fkey"
            columns: ["content_type_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_type_versions: {
        Row: {
          activation_approval_evidence_hash: string | null
          activation_required_capabilities: Json | null
          activation_required_decision_count: number | null
          activation_workflow_policy_hash: string | null
          activation_workflow_policy_key: string | null
          activation_workflow_policy_version: number | null
          approved_at: string | null
          compatibility: string
          content_type_id: string
          created_at: string
          created_by: string
          default_locale: string
          default_template_version_id: string | null
          definition_hash: string
          dry_run_id: string | null
          id: string
          labels: Json
          owner_id: string
          schema_artifact_id: string
          source_locale: string
          state: Database["platform_private"]["Enums"]["cms_definition_state"]
          supersedes_id: string | null
          updated_at: string
          version: number
          version_no: number
          workflow_key: string
          workflow_version: number
        }
        Insert: {
          activation_approval_evidence_hash?: string | null
          activation_required_capabilities?: Json | null
          activation_required_decision_count?: number | null
          activation_workflow_policy_hash?: string | null
          activation_workflow_policy_key?: string | null
          activation_workflow_policy_version?: number | null
          approved_at?: string | null
          compatibility: string
          content_type_id: string
          created_at?: string
          created_by: string
          default_locale: string
          default_template_version_id?: string | null
          definition_hash: string
          dry_run_id?: string | null
          id?: string
          labels: Json
          owner_id: string
          schema_artifact_id: string
          source_locale: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          supersedes_id?: string | null
          updated_at?: string
          version?: number
          version_no: number
          workflow_key: string
          workflow_version: number
        }
        Update: {
          activation_approval_evidence_hash?: string | null
          activation_required_capabilities?: Json | null
          activation_required_decision_count?: number | null
          activation_workflow_policy_hash?: string | null
          activation_workflow_policy_key?: string | null
          activation_workflow_policy_version?: number | null
          approved_at?: string | null
          compatibility?: string
          content_type_id?: string
          created_at?: string
          created_by?: string
          default_locale?: string
          default_template_version_id?: string | null
          definition_hash?: string
          dry_run_id?: string | null
          id?: string
          labels?: Json
          owner_id?: string
          schema_artifact_id?: string
          source_locale?: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          supersedes_id?: string | null
          updated_at?: string
          version?: number
          version_no?: number
          workflow_key?: string
          workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_type_versions_artifact_pair_fkey"
            columns: ["schema_artifact_id", "id"]
            isOneToOne: false
            referencedRelation: "cms_schema_artifacts"
            referencedColumns: ["id", "content_type_version_id"]
          },
          {
            foreignKeyName: "cms_content_type_versions_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "cms_content_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_type_versions_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_types: {
        Row: {
          built_in: boolean
          created_at: string
          created_by: string
          id: string
          owner_capability: string
          owner_id: string
          state: string
          type_key: string
          updated_at: string
          version: number
        }
        Insert: {
          built_in?: boolean
          created_at?: string
          created_by: string
          id?: string
          owner_capability: string
          owner_id: string
          state?: string
          type_key: string
          updated_at?: string
          version?: number
        }
        Update: {
          built_in?: boolean
          created_at?: string
          created_by?: string
          id?: string
          owner_capability?: string
          owner_id?: string
          state?: string
          type_key?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      cms_field_definition_versions: {
        Row: {
          constraints: Json
          content_type_version_id: string
          created_at: string
          created_by: string
          default_mode: string
          default_value: Json | null
          editor_config: Json
          field_key: string
          id: string
          kind: string
          localization_mode: string
          owner_id: string
          required: boolean
          stable_field_id: string
          state: string
          updated_at: string
          validator_key: string | null
          validator_version: number | null
          version: number
        }
        Insert: {
          constraints?: Json
          content_type_version_id: string
          created_at?: string
          created_by: string
          default_mode?: string
          default_value?: Json | null
          editor_config?: Json
          field_key: string
          id?: string
          kind: string
          localization_mode?: string
          owner_id: string
          required?: boolean
          stable_field_id: string
          state?: string
          updated_at?: string
          validator_key?: string | null
          validator_version?: number | null
          version?: number
        }
        Update: {
          constraints?: Json
          content_type_version_id?: string
          created_at?: string
          created_by?: string
          default_mode?: string
          default_value?: Json | null
          editor_config?: Json
          field_key?: string
          id?: string
          kind?: string
          localization_mode?: string
          owner_id?: string
          required?: boolean
          stable_field_id?: string
          state?: string
          updated_at?: string
          validator_key?: string | null
          validator_version?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_field_definition_versions_content_type_version_id_fkey"
            columns: ["content_type_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_operational_alert_deliveries: {
        Row: {
          alert_code: string
          claim_token_hash: string
          claimed_at: string
          delivered_at: string | null
          id: string
          receipt_hash: string | null
          release: string
          state: string
        }
        Insert: {
          alert_code: string
          claim_token_hash: string
          claimed_at?: string
          delivered_at?: string | null
          id?: string
          receipt_hash?: string | null
          release: string
          state?: string
        }
        Update: {
          alert_code?: string
          claim_token_hash?: string
          claimed_at?: string
          delivered_at?: string | null
          id?: string
          receipt_hash?: string | null
          release?: string
          state?: string
        }
        Relationships: []
      }
      cms_relation_definitions: {
        Row: {
          cardinality: string
          created_at: string
          created_by: string
          field_definition_id: string
          id: string
          max_count: number
          min_count: number
          on_unavailable: string
          ordered: boolean
          owner_id: string
          projection_key: string
          state: Database["platform_private"]["Enums"]["cms_definition_state"]
          target_kind: string
          target_type: string
          updated_at: string
          version: number
        }
        Insert: {
          cardinality: string
          created_at?: string
          created_by: string
          field_definition_id: string
          id?: string
          max_count: number
          min_count: number
          on_unavailable: string
          ordered?: boolean
          owner_id: string
          projection_key: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          target_kind: string
          target_type: string
          updated_at?: string
          version?: number
        }
        Update: {
          cardinality?: string
          created_at?: string
          created_by?: string
          field_definition_id?: string
          id?: string
          max_count?: number
          min_count?: number
          on_unavailable?: string
          ordered?: boolean
          owner_id?: string
          projection_key?: string
          state?: Database["platform_private"]["Enums"]["cms_definition_state"]
          target_kind?: string
          target_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_relation_definitions_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: true
            referencedRelation: "cms_field_definition_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_release_nonce_receipts: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          nonce_hash: string
          operation_id: string
          outcome: string
          raw_body_hash: string
          release_key_id: string
          signature_hash: string
          updated_at: string
          verified_at: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          issued_at: string
          nonce_hash: string
          operation_id: string
          outcome?: string
          raw_body_hash: string
          release_key_id: string
          signature_hash: string
          updated_at?: string
          verified_at: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          nonce_hash?: string
          operation_id?: string
          outcome?: string
          raw_body_hash?: string
          release_key_id?: string
          signature_hash?: string
          updated_at?: string
          verified_at?: string
        }
        Relationships: []
      }
      cms_schema_artifacts: {
        Row: {
          artifact_hash: string
          compiled_at: string
          compiler_version: string
          content_type_version_id: string
          created_at: string
          editor_manifest: Json
          id: string
          owner_id: string
          renderer_manifest: Json
          state: string
          updated_at: string
          version: number
          zod_contract_ref: string
        }
        Insert: {
          artifact_hash: string
          compiled_at: string
          compiler_version: string
          content_type_version_id: string
          created_at?: string
          editor_manifest: Json
          id?: string
          owner_id: string
          renderer_manifest: Json
          state?: string
          updated_at?: string
          version?: number
          zod_contract_ref: string
        }
        Update: {
          artifact_hash?: string
          compiled_at?: string
          compiler_version?: string
          content_type_version_id?: string
          created_at?: string
          editor_manifest?: Json
          id?: string
          owner_id?: string
          renderer_manifest?: Json
          state?: string
          updated_at?: string
          version?: number
          zod_contract_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_schema_artifacts_content_type_version_id_fkey"
            columns: ["content_type_version_id"]
            isOneToOne: true
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schema_dry_run_reports: {
        Row: {
          classification: string
          compiler_hash: string
          compiler_version: string
          content_type_id: string
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          migrated_count: number
          owner_id: string
          report: Json
          result: string
          row_error_count: number
          source_count: number
          source_hash: string
          source_version_id: string | null
          target_count: number
          target_hash: string
          target_version_id: string
          transform_key: string | null
          transform_version: number | null
        }
        Insert: {
          classification: string
          compiler_hash: string
          compiler_version: string
          content_type_id: string
          created_at?: string
          created_by?: string | null
          failed_count: number
          id: string
          migrated_count: number
          owner_id: string
          report: Json
          result?: string
          row_error_count: number
          source_count: number
          source_hash: string
          source_version_id?: string | null
          target_count: number
          target_hash: string
          target_version_id: string
          transform_key?: string | null
          transform_version?: number | null
        }
        Update: {
          classification?: string
          compiler_hash?: string
          compiler_version?: string
          content_type_id?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          migrated_count?: number
          owner_id?: string
          report?: Json
          result?: string
          row_error_count?: number
          source_count?: number
          source_hash?: string
          source_version_id?: string | null
          target_count?: number
          target_hash?: string
          target_version_id?: string
          transform_key?: string | null
          transform_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_schema_dry_run_reports_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "cms_content_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_dry_run_reports_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_dry_run_reports_target_version_id_fkey"
            columns: ["target_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schema_migration_plans: {
        Row: {
          classification: string
          completed_at: string | null
          content_type_id: string
          created_at: string
          created_by: string | null
          cursor: number
          dry_run_report: Json
          failed_count: number
          from_version_id: string
          id: string
          migrated_count: number
          owner_id: string
          progress: number
          row_error_count: number
          source_count: number
          started_at: string | null
          state: string
          target_count: number
          to_version_id: string
          transform_key: string | null
          transform_version: number | null
          updated_at: string
          version: number
        }
        Insert: {
          classification: string
          completed_at?: string | null
          content_type_id: string
          created_at?: string
          created_by?: string | null
          cursor?: number
          dry_run_report?: Json
          failed_count?: number
          from_version_id: string
          id?: string
          migrated_count?: number
          owner_id: string
          progress?: number
          row_error_count?: number
          source_count?: number
          started_at?: string | null
          state?: string
          target_count?: number
          to_version_id: string
          transform_key?: string | null
          transform_version?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          classification?: string
          completed_at?: string | null
          content_type_id?: string
          created_at?: string
          created_by?: string | null
          cursor?: number
          dry_run_report?: Json
          failed_count?: number
          from_version_id?: string
          id?: string
          migrated_count?: number
          owner_id?: string
          progress?: number
          row_error_count?: number
          source_count?: number
          started_at?: string | null
          state?: string
          target_count?: number
          to_version_id?: string
          transform_key?: string | null
          transform_version?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_schema_migration_plans_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "cms_content_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_migration_plans_from_version_id_fkey"
            columns: ["from_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_migration_plans_to_version_id_fkey"
            columns: ["to_version_id"]
            isOneToOne: false
            referencedRelation: "cms_content_type_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      db_harness_fixture: {
        Row: {
          created_at: string
          id: string
          label: string
          owner_id: string
        }
        Insert: {
          created_at: string
          id: string
          label: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
        }
        Relationships: []
      }
      handle_reservation: {
        Row: {
          created_at: string
          display_handle: string
          first_used_at: string
          id: string
          last_used_at: string
          normalized_handle: string
          party_id: string
          retired_at: string | null
          state: Database["platform_private"]["Enums"]["handle_state"]
          successor_handle_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          display_handle: string
          first_used_at?: string
          id?: string
          last_used_at?: string
          normalized_handle: string
          party_id: string
          retired_at?: string | null
          state?: Database["platform_private"]["Enums"]["handle_state"]
          successor_handle_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          display_handle?: string
          first_used_at?: string
          id?: string
          last_used_at?: string
          normalized_handle?: string
          party_id?: string
          retired_at?: string | null
          state?: Database["platform_private"]["Enums"]["handle_state"]
          successor_handle_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "handle_reservation_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handle_reservation_successor_handle_id_fkey"
            columns: ["successor_handle_id"]
            isOneToOne: false
            referencedRelation: "handle_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_records: {
        Row: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        Insert: {
          actor_id: string
          claim_lease_until?: string | null
          claim_token_hash?: string | null
          created_at?: string
          expires_at: string
          id?: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref?: Json | null
          state?: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        Update: {
          actor_id?: string
          claim_lease_until?: string | null
          claim_token_hash?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          key_hash?: string
          operation?: string
          request_hash?: string
          response_ref?: Json | null
          state?: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        Relationships: []
      }
      job_read_rate_limits: {
        Row: {
          request_count: number
          scope: string
          scope_id: string
          window_started_at: string
        }
        Insert: {
          request_count?: number
          scope: string
          scope_id: string
          window_started_at: string
        }
        Update: {
          request_count?: number
          scope?: string
          scope_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      job_type_registry: {
        Row: {
          job_type: string
          registered_at: string
        }
        Insert: {
          job_type: string
          registered_at?: string
        }
        Update: {
          job_type?: string
          registered_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          acting_party_id: string
          actor_id: string
          attempt_count: number
          attempts: Json
          causation_id: string | null
          correlation_id: string
          created_at: string
          error_code: string | null
          id: string
          job_type: string
          lease_token: string | null
          lease_until: string | null
          originating_event_id: string
          progress: Json | null
          result_ref: Json | null
          state: Database["platform_private"]["Enums"]["job_state"]
          updated_at: string
          version: number
        }
        Insert: {
          acting_party_id: string
          actor_id: string
          attempt_count?: number
          attempts?: Json
          causation_id?: string | null
          correlation_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          job_type: string
          lease_token?: string | null
          lease_until?: string | null
          originating_event_id: string
          progress?: Json | null
          result_ref?: Json | null
          state?: Database["platform_private"]["Enums"]["job_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          acting_party_id?: string
          actor_id?: string
          attempt_count?: number
          attempts?: Json
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          job_type?: string
          lease_token?: string | null
          lease_until?: string | null
          originating_event_id?: string
          progress?: Json | null
          result_ref?: Json | null
          state?: Database["platform_private"]["Enums"]["job_state"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      legal_disclosure_event: {
        Row: {
          acting_party_id: string
          actor_person_id: string
          created_at: string
          field_codes: string[]
          id: string
          legal_identity_id: string
          legal_identity_version: number
          occurred_at: string
          purpose_code: string
          recipient_party_id: string
          request_id: string
          transaction_id: string
        }
        Insert: {
          acting_party_id: string
          actor_person_id: string
          created_at?: string
          field_codes: string[]
          id?: string
          legal_identity_id: string
          legal_identity_version: number
          occurred_at?: string
          purpose_code: string
          recipient_party_id: string
          request_id: string
          transaction_id: string
        }
        Update: {
          acting_party_id?: string
          actor_person_id?: string
          created_at?: string
          field_codes?: string[]
          id?: string
          legal_identity_id?: string
          legal_identity_version?: number
          occurred_at?: string
          purpose_code?: string
          recipient_party_id?: string
          request_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_disclosure_event_acting_party_id_fkey"
            columns: ["acting_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_disclosure_event_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "legal_disclosure_event_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "legal_disclosure_event_actor_person_id_fkey"
            columns: ["actor_person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "legal_disclosure_event_legal_identity_id_fkey"
            columns: ["legal_identity_id"]
            isOneToOne: false
            referencedRelation: "legal_identity_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_disclosure_event_recipient_party_id_fkey"
            columns: ["recipient_party_id"]
            isOneToOne: false
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_identity_record: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          person_id: string
          protected_field_refs: Json
          state: Database["platform_private"]["Enums"]["legal_identity_state"]
          updated_at: string
          verification_ref: string | null
          version: number
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          person_id: string
          protected_field_refs: Json
          state?: Database["platform_private"]["Enums"]["legal_identity_state"]
          updated_at?: string
          verification_ref?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          person_id?: string
          protected_field_refs?: Json
          state?: Database["platform_private"]["Enums"]["legal_identity_state"]
          updated_at?: string
          verification_ref?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_identity_record_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "legal_identity_record_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "legal_identity_record_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      object_records: {
        Row: {
          bucket: string
          byte_size: number
          checksum: string
          created_at: string
          id: string
          media_type: string
          object_key: string
          observed_byte_size: number | null
          observed_checksum: string | null
          observed_media_type: string | null
          owner_party_id: string
          purpose: string
          retention_class: string
          state: Database["platform_private"]["Enums"]["object_state"]
          version: number
        }
        Insert: {
          bucket: string
          byte_size: number
          checksum: string
          created_at?: string
          id?: string
          media_type: string
          object_key: string
          observed_byte_size?: number | null
          observed_checksum?: string | null
          observed_media_type?: string | null
          owner_party_id: string
          purpose: string
          retention_class: string
          state?: Database["platform_private"]["Enums"]["object_state"]
          version?: number
        }
        Update: {
          bucket?: string
          byte_size?: number
          checksum?: string
          created_at?: string
          id?: string
          media_type?: string
          object_key?: string
          observed_byte_size?: number | null
          observed_checksum?: string | null
          observed_media_type?: string | null
          owner_party_id?: string
          purpose?: string
          retention_class?: string
          state?: Database["platform_private"]["Enums"]["object_state"]
          version?: number
        }
        Relationships: []
      }
      outbox_events: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          aggregate_version: number
          causation_id: string | null
          correlation_id: string
          dead_letter_reason: string | null
          dead_lettered_at: string | null
          dispatch_attempt_count: number
          dispatch_lease_token: string | null
          dispatch_lease_until: string | null
          dispatched_at: string | null
          event_type: string
          id: string
          last_dispatch_error_code: string | null
          occurred_at: string
          payload: Json
          schema_version: number
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          aggregate_version: number
          causation_id?: string | null
          correlation_id: string
          dead_letter_reason?: string | null
          dead_lettered_at?: string | null
          dispatch_attempt_count?: number
          dispatch_lease_token?: string | null
          dispatch_lease_until?: string | null
          dispatched_at?: string | null
          event_type: string
          id?: string
          last_dispatch_error_code?: string | null
          occurred_at?: string
          payload: Json
          schema_version: number
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          aggregate_version?: number
          causation_id?: string | null
          correlation_id?: string
          dead_letter_reason?: string | null
          dead_lettered_at?: string | null
          dispatch_attempt_count?: number
          dispatch_lease_token?: string | null
          dispatch_lease_until?: string | null
          dispatched_at?: string | null
          event_type?: string
          id?: string
          last_dispatch_error_code?: string | null
          occurred_at?: string
          payload?: Json
          schema_version?: number
        }
        Relationships: []
      }
      party: {
        Row: {
          created_at: string
          id: string
          kind: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      person_party: {
        Row: {
          account_state: Database["platform_private"]["Enums"]["person_account_state"]
          auth_user_id: string | null
          created_at: string
          legal_identity_id: string | null
          party_id: string
          public_profile_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          account_state?: Database["platform_private"]["Enums"]["person_account_state"]
          auth_user_id?: string | null
          created_at?: string
          legal_identity_id?: string | null
          party_id: string
          public_profile_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          account_state?: Database["platform_private"]["Enums"]["person_account_state"]
          auth_user_id?: string | null
          created_at?: string
          legal_identity_id?: string | null
          party_id?: string
          public_profile_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "person_legal_identity_fk"
            columns: ["legal_identity_id"]
            isOneToOne: false
            referencedRelation: "legal_identity_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_party_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_events: {
        Row: {
          aggregate_id: string
          event_id: string
          event_type: string
          pending_manual_review: boolean
          processed_at: string
          schema_version: number
        }
        Insert: {
          aggregate_id: string
          event_id: string
          event_type: string
          pending_manual_review?: boolean
          processed_at?: string
          schema_version: number
        }
        Update: {
          aggregate_id?: string
          event_id?: string
          event_type?: string
          pending_manual_review?: boolean
          processed_at?: string
          schema_version?: number
        }
        Relationships: []
      }
      provider_operation_intents: {
        Row: {
          acting_party_id: string
          actor_id: string
          created_at: string
          governed_payload: Json
          intent_hash: string
          operation_id: string
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
        }
        Insert: {
          acting_party_id: string
          actor_id: string
          created_at?: string
          governed_payload: Json
          intent_hash: string
          operation_id: string
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
        }
        Update: {
          acting_party_id?: string
          actor_id?: string
          created_at?: string
          governed_payload?: Json
          intent_hash?: string
          operation_id?: string
          operation_type?: string
          provider?: string
          provider_idempotency_key_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_operation_intents_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: true
            referencedRelation: "provider_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_operations: {
        Row: {
          actor_id: string
          attempts: Json
          causation_id: string | null
          correlation_id: string
          created_at: string
          id: string
          intent_hash: string
          last_attempt_at: string | null
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
          provider_ref: string | null
          reconciliation_at: string | null
          state: Database["platform_private"]["Enums"]["provider_operation_state"]
          version: number
        }
        Insert: {
          actor_id: string
          attempts?: Json
          causation_id?: string | null
          correlation_id: string
          created_at?: string
          id?: string
          intent_hash: string
          last_attempt_at?: string | null
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
          provider_ref?: string | null
          reconciliation_at?: string | null
          state?: Database["platform_private"]["Enums"]["provider_operation_state"]
          version?: number
        }
        Update: {
          actor_id?: string
          attempts?: Json
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          intent_hash?: string
          last_attempt_at?: string | null
          operation_type?: string
          provider?: string
          provider_idempotency_key_hash?: string
          provider_ref?: string | null
          reconciliation_at?: string | null
          state?: Database["platform_private"]["Enums"]["provider_operation_state"]
          version?: number
        }
        Relationships: []
      }
      recovery_verification_evidence: {
        Row: {
          artifact_digest: string | null
          artifact_id: string | null
          created_at: string
          environment: string | null
          expires_at: string
          id: string
          idempotency_outbox_job_verified: boolean
          integrity_verified: boolean
          measured_rpo_seconds: number | null
          measured_rto_seconds: number | null
          object_verified: boolean
          pitr_supported: boolean
          pitr_window_seconds: number | null
          promotion_id: string | null
          provenance_kind: string
          provider_webhook_verified: boolean
          public_projection_verified: boolean
          restore_epoch: number
          rls_verified: boolean
          rpc_verified: boolean
          source_revision: string | null
          verified_at: string
        }
        Insert: {
          artifact_digest?: string | null
          artifact_id?: string | null
          created_at?: string
          environment?: string | null
          expires_at: string
          id?: string
          idempotency_outbox_job_verified: boolean
          integrity_verified: boolean
          measured_rpo_seconds?: number | null
          measured_rto_seconds?: number | null
          object_verified: boolean
          pitr_supported: boolean
          pitr_window_seconds?: number | null
          promotion_id?: string | null
          provenance_kind?: string
          provider_webhook_verified: boolean
          public_projection_verified: boolean
          restore_epoch: number
          rls_verified: boolean
          rpc_verified: boolean
          source_revision?: string | null
          verified_at?: string
        }
        Update: {
          artifact_digest?: string | null
          artifact_id?: string | null
          created_at?: string
          environment?: string | null
          expires_at?: string
          id?: string
          idempotency_outbox_job_verified?: boolean
          integrity_verified?: boolean
          measured_rpo_seconds?: number | null
          measured_rto_seconds?: number | null
          object_verified?: boolean
          pitr_supported?: boolean
          pitr_window_seconds?: number | null
          promotion_id?: string | null
          provenance_kind?: string
          provider_webhook_verified?: boolean
          public_projection_verified?: boolean
          restore_epoch?: number
          rls_verified?: boolean
          rpc_verified?: boolean
          source_revision?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_verification_evidence_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "recovery_verification_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_verification_promotions: {
        Row: {
          artifact_digest: string
          artifact_id: string
          created_at: string
          environment: string
          expires_at: string
          id: string
          promoted_at: string
          source_revision: string
        }
        Insert: {
          artifact_digest: string
          artifact_id: string
          created_at?: string
          environment: string
          expires_at: string
          id: string
          promoted_at: string
          source_revision: string
        }
        Update: {
          artifact_digest?: string
          artifact_id?: string
          created_at?: string
          environment?: string
          expires_at?: string
          id?: string
          promoted_at?: string
          source_revision?: string
        }
        Relationships: []
      }
      restore_fences: {
        Row: {
          created_at: string
          id: string
          reason: string
          released_at: string | null
          restore_epoch: number
          state: Database["platform_private"]["Enums"]["restore_fence_state"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          released_at?: string | null
          restore_epoch: number
          state?: Database["platform_private"]["Enums"]["restore_fence_state"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          released_at?: string | null
          restore_epoch?: number
          state?: Database["platform_private"]["Enums"]["restore_fence_state"]
        }
        Relationships: []
      }
      role_facet_assertion: {
        Row: {
          asserted_at: string
          created_at: string
          facet_code: string
          id: string
          person_id: string
          removed_at: string | null
          source: Database["platform_private"]["Enums"]["facet_source"]
          state: Database["platform_private"]["Enums"]["facet_state"]
          updated_at: string
          version: number
        }
        Insert: {
          asserted_at: string
          created_at?: string
          facet_code: string
          id?: string
          person_id: string
          removed_at?: string | null
          source: Database["platform_private"]["Enums"]["facet_source"]
          state: Database["platform_private"]["Enums"]["facet_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          asserted_at?: string
          created_at?: string
          facet_code?: string
          id?: string
          person_id?: string
          removed_at?: string | null
          source?: Database["platform_private"]["Enums"]["facet_source"]
          state?: Database["platform_private"]["Enums"]["facet_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_facet_assertion_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_public_person_projection"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "role_facet_assertion_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "identity_self_projection"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "role_facet_assertion_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_party"
            referencedColumns: ["party_id"]
          },
        ]
      }
      upload_intent_authority: {
        Row: {
          acting_party_id: string
          actor_id: string
          created_at: string
          intent_id: string
          target_id: string
          target_type: string
          target_version: number | null
        }
        Insert: {
          acting_party_id: string
          actor_id: string
          created_at?: string
          intent_id: string
          target_id: string
          target_type: string
          target_version?: number | null
        }
        Update: {
          acting_party_id?: string
          actor_id?: string
          created_at?: string
          intent_id?: string
          target_id?: string
          target_type?: string
          target_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_intent_authority_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: true
            referencedRelation: "upload_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_intents: {
        Row: {
          actor_id: string
          allowed_media_types: string[]
          created_at: string
          expires_at: string
          id: string
          max_bytes: number
          object_id: string
          state: Database["platform_private"]["Enums"]["upload_intent_state"]
        }
        Insert: {
          actor_id: string
          allowed_media_types: string[]
          created_at?: string
          expires_at: string
          id?: string
          max_bytes: number
          object_id: string
          state?: Database["platform_private"]["Enums"]["upload_intent_state"]
        }
        Update: {
          actor_id?: string
          allowed_media_types?: string[]
          created_at?: string
          expires_at?: string
          id?: string
          max_bytes?: number
          object_id?: string
          state?: Database["platform_private"]["Enums"]["upload_intent_state"]
        }
        Relationships: [
          {
            foreignKeyName: "upload_intents_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_event_records: {
        Row: {
          created_at: string
          event_type: string
          external_event_id: string
          normalized_event: Json
          payload_digest: string
          provider: string
          receipt_id: string
          schema_version: number
        }
        Insert: {
          created_at?: string
          event_type: string
          external_event_id: string
          normalized_event: Json
          payload_digest: string
          provider: string
          receipt_id: string
          schema_version: number
        }
        Update: {
          created_at?: string
          event_type?: string
          external_event_id?: string
          normalized_event?: Json
          payload_digest?: string
          provider?: string
          receipt_id?: string
          schema_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "webhook_event_records_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "webhook_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_receipts: {
        Row: {
          attempts: Json
          external_event_id: string
          id: string
          operation_id: string | null
          payload_digest: string
          provider: string
          received_at: string
          signature_verified_at: string | null
          state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }
        Insert: {
          attempts?: Json
          external_event_id: string
          id?: string
          operation_id?: string | null
          payload_digest: string
          provider: string
          received_at?: string
          signature_verified_at?: string | null
          state?: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }
        Update: {
          attempts?: Json
          external_event_id?: string
          id?: string
          operation_id?: string | null
          payload_digest?: string
          provider?: string
          received_at?: string
          signature_verified_at?: string | null
          state?: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }
        Relationships: [
          {
            foreignKeyName: "webhook_receipts_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "provider_operations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      identity_public_person_projection: {
        Row: {
          account_state:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          kind: string | null
          party_id: string | null
          public_profile_id: string | null
          version: number | null
        }
        Insert: {
          account_state?:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          kind?: never
          party_id?: string | null
          public_profile_id?: string | null
          version?: number | null
        }
        Update: {
          account_state?:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          kind?: never
          party_id?: string | null
          public_profile_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "person_party_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_public_projection: {
        Row: {
          display_name: string | null
          handle: string | null
          kind: string | null
          lifecycle:
            | Database["platform_private"]["Enums"]["alias_lifecycle"]
            | null
          party_id: string | null
          public_link_state:
            | Database["platform_private"]["Enums"]["public_link_state"]
            | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alias_party_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_self_projection: {
        Row: {
          account_state:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          legal_identity_id: string | null
          person_id: string | null
          public_profile_id: string | null
          version: number | null
        }
        Insert: {
          account_state?:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          legal_identity_id?: string | null
          person_id?: string | null
          public_profile_id?: string | null
          version?: number | null
        }
        Update: {
          account_state?:
            | Database["platform_private"]["Enums"]["person_account_state"]
            | null
          legal_identity_id?: string | null
          person_id?: string | null
          public_profile_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "person_legal_identity_fk"
            columns: ["legal_identity_id"]
            isOneToOne: false
            referencedRelation: "legal_identity_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_party_party_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "party"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_job_with_outbox: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id?: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_job_id?: string
          p_job_type: string
          p_request_hash: string
        }
        Returns: {
          event_id: string
          job_id: string
          replayed: boolean
          version: number
        }[]
      }
      admin_actions_valid: { Args: { p_actions: string[] }; Returns: boolean }
      admin_business_request: { Args: { p_request: Json }; Returns: Json }
      admin_capability_allows: {
        Args: {
          p_acting_party_id: string
          p_action: string
          p_actor_id: string
          p_capability_key: string
          p_resource_id: string
          p_resource_type: string
        }
        Returns: boolean
      }
      admin_grantor_can_delegate: {
        Args: {
          p_acting_party_id: string
          p_actions: string[]
          p_actor_person_id: string
          p_capability_key: string
          p_ends_at: string
          p_resource_id: string
          p_resource_type: string
          p_scope: Json
          p_starts_at: string
        }
        Returns: boolean
      }
      admin_inbox_cursor_encode: {
        Args: { p_due_at: string; p_task_id: string }
        Returns: string
      }
      admin_request_reserve: {
        Args: { p_acting_party_id: string; p_actor_id: string; p_request: Json }
        Returns: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        SetofOptions: {
          from: "*"
          to: "idempotency_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_result_codes_valid: {
        Args: { p_codes: string[] }
        Returns: boolean
      }
      admin_scope_valid: {
        Args: { p_acting_party_id?: string; p_scope: Json }
        Returns: boolean
      }
      apply_job_outcome:
        | {
            Args: {
              p_error_code: string
              p_expected_version: number
              p_job_id: string
              p_lease_token: string
              p_next_state: Database["platform_private"]["Enums"]["job_state"]
              p_result_ref: Json
              p_retryable: boolean
            }
            Returns: boolean
          }
        | {
            Args: {
              p_error_code: string
              p_expected_version: number
              p_job_id: string
              p_next_state: Database["platform_private"]["Enums"]["job_state"]
              p_result_ref: Json
              p_retryable: boolean
            }
            Returns: boolean
          }
      apply_object_verification: {
        Args: {
          p_correlation_id?: string
          p_error_code?: string
          p_expected_version: number
          p_job_id?: string
          p_next_state: Database["platform_private"]["Enums"]["object_state"]
          p_object_id: string
        }
        Returns: {
          applied: boolean
          job_id: string
          object_id: string
          state: Database["platform_private"]["Enums"]["object_state"]
          version: number
        }[]
      }
      apply_provider_operation_outcome: {
        Args: {
          p_attempt_ended_at?: string
          p_attempt_started_at?: string
          p_error_code?: string
          p_expected_version: number
          p_next_state: Database["platform_private"]["Enums"]["provider_operation_state"]
          p_operation_id: string
          p_provider_ref?: string
          p_retryable?: boolean
        }
        Returns: boolean
      }
      apply_provider_operation_outcome_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_attempt_ended_at?: string
          p_attempt_started_at?: string
          p_error_code?: string
          p_expected_version: number
          p_next_state: Database["platform_private"]["Enums"]["provider_operation_state"]
          p_operation_id: string
          p_provider_ref?: string
          p_retryable?: boolean
        }
        Returns: boolean
      }
      apply_webhook_receipt_outcome: {
        Args: {
          p_error_code?: string
          p_expected_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_next_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_operation_id?: string
          p_receipt_id: string
        }
        Returns: boolean
      }
      apply_webhook_receipt_outcome_authorized: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_error_code: string
          p_expected_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_next_state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
          p_operation_id: string
          p_receipt_id: string
        }
        Returns: boolean
      }
      auth_iso_time: { Args: { p_value: string }; Returns: string }
      auth_login_methods_projection: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      auth_merge_projection: { Args: { p_merge_id: string }; Returns: Json }
      auth_require_active_session: {
        Args: { p_auth_user_id: string; p_session_id: string }
        Returns: {
          binding_id: string
          binding_version: number
          person_id: string
        }[]
      }
      auth_reserve_idempotency: {
        Args: {
          p_actor_id: string
          p_expires_at: string
          p_key_hash: string
          p_operation: string
          p_request_hash: string
        }
        Returns: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        SetofOptions: {
          from: "*"
          to: "idempotency_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      begin_restore_fence: {
        Args: { p_reason: string; p_restore_epoch: number }
        Returns: boolean
      }
      bootstrap_auth_user: {
        Args: {
          p_auth_user_id: string
          p_correlation_id: string
          p_request_id: string
        }
        Returns: {
          account_state: string
          acting_party_id: string
          binding_version: number
          created: boolean
          person_id: string
        }[]
      }
      cfg_acting_party: {
        Args: { p_actor_id: string; p_request: Json }
        Returns: string
      }
      cfg_actor: { Args: { p_request: Json }; Returns: string }
      cfg_array_distinct: { Args: { p_values: string[] }; Returns: boolean }
      cfg_change_action: { Args: { p_request: Json }; Returns: Json }
      cfg_context_value: {
        Args: { p_name: string; p_request: Json }
        Returns: string
      }
      cfg_correlation: { Args: { p_request: Json }; Returns: string }
      cfg_definition_response: {
        Args: {
          p_definition: Database["platform_private"]["Tables"]["cfg_setting_definition_versions"]["Row"]
          p_definition_id: string
          p_synchronized?: boolean
        }
        Returns: Json
      }
      cfg_emit_effects: {
        Args: {
          p_acting_party_id: string
          p_action: string
          p_actor_id: string
          p_aggregate_id: string
          p_aggregate_type: string
          p_aggregate_version: number
          p_correlation_id: string
          p_event_type: string
          p_payload: Json
          p_reason_code: string
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      cfg_experiment_allocation_valid: {
        Args: { p_allocation: Json; p_variants: Json }
        Returns: boolean
      }
      cfg_experiment_dimensions_allowed: {
        Args: { p_dimensions: string[] }
        Returns: boolean
      }
      cfg_hash_json: { Args: { p_value: Json }; Returns: string }
      cfg_hash_text: { Args: { p_value: string }; Returns: string }
      cfg_json_bounded: {
        Args: { p_max_bytes?: number; p_max_depth?: number; p_value: Json }
        Returns: boolean
      }
      cfg_json_depth: { Args: { p_value: Json }; Returns: number }
      cfg_key_array_valid: { Args: { p_values: string[] }; Returns: boolean }
      cfg_kill_scope_declared: {
        Args: { p_scope_id: string; p_scope_type: string; p_scopes: Json }
        Returns: boolean
      }
      cfg_kill_scopes_valid: { Args: { p_scopes: Json }; Returns: boolean }
      cfg_parse_uuid: {
        Args: { p_code?: string; p_value: string }
        Returns: string
      }
      cfg_parse_version: {
        Args: { p_code?: string; p_value: string }
        Returns: number
      }
      cfg_propose_change: { Args: { p_request: Json }; Returns: Json }
      cfg_protected_key: { Args: { p_value: string }; Returns: boolean }
      cfg_register_definition: { Args: { p_request: Json }; Returns: Json }
      cfg_release_actor: { Args: { p_request: Json }; Returns: string }
      cfg_release_request_actor: {
        Args: { p_request: Json }
        Returns: {
          acting_party_id: string
          actor_id: string
        }[]
      }
      cfg_request_actor: {
        Args: { p_request: Json; p_require_context?: boolean }
        Returns: {
          acting_party_id: string
          actor_id: string
        }[]
      }
      cfg_request_complete: {
        Args: { p_id: string; p_response: Json; p_status: number }
        Returns: undefined
      }
      cfg_request_reserve: {
        Args: { p_actor_id: string; p_operation: string; p_request: Json }
        Returns: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        SetofOptions: {
          from: "*"
          to: "idempotency_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cfg_require_capability: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_capability: string
        }
        Returns: undefined
      }
      cfg_require_fresh_step_up: {
        Args: { p_max_age?: string; p_request: Json }
        Returns: undefined
      }
      cfg_require_keys: {
        Args: { p_allowed: string[]; p_required?: string[]; p_value: Json }
        Returns: undefined
      }
      cfg_resolve_effective_value: { Args: { p_request: Json }; Returns: Json }
      cfg_scope_is_valid: {
        Args: {
          p_environment: string
          p_scope_id: string
          p_scope_type: string
        }
        Returns: boolean
      }
      cfg_valid_key: { Args: { p_value: string }; Returns: boolean }
      cfg_valid_uuid: { Args: { p_value: string }; Returns: boolean }
      cfg_validate_value: {
        Args: { p_kind: string; p_schema: Json; p_value: Json }
        Returns: boolean
      }
      claim_job: {
        Args: {
          p_expected_version: number
          p_job_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          attempt_count: number
          job_id: string
          lease_until: string
          state: Database["platform_private"]["Enums"]["job_state"]
          version: number
        }[]
      }
      claim_outbox_batch: {
        Args: {
          p_batch_size: number
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          aggregate_version: number
          causation_id: string
          correlation_id: string
          dispatch_attempt_count: number
          event_id: string
          event_type: string
          lease_token: string
          schema_version: number
        }[]
      }
      claim_outbox_event: {
        Args: {
          p_event_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: {
          aggregate_id: string
          aggregate_version: number
          dispatch_attempt_count: number
          event_id: string
          lease_token: string
        }[]
      }
      cms_acknowledge_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_acting_party: {
        Args: { p_actor_id: string; p_request: Json }
        Returns: string
      }
      cms_activate_schema: { Args: { p_request: Json }; Returns: Json }
      cms_activation_references_valid: {
        Args: { p_version_id: string }
        Returns: boolean
      }
      cms_activation_risk_class: {
        Args: { p_workflow_key: string }
        Returns: string
      }
      cms_actor: { Args: { p_request: Json }; Returns: string }
      cms_add_field_definition: { Args: { p_request: Json }; Returns: Json }
      cms_advance_block_lifecycle: { Args: { p_request: Json }; Returns: Json }
      cms_begin_schema_migration_verification: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_bind_relation: { Args: { p_request: Json }; Returns: Json }
      cms_block_key_registry_valid: {
        Args: { p_current_key?: string; p_key: string }
        Returns: boolean
      }
      cms_block_reference_valid: {
        Args: { p_reference: Json }
        Returns: boolean
      }
      cms_canonical_type_definition: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_capability_registry_valid: {
        Args: { p_key: string; p_version?: number }
        Returns: boolean
      }
      cms_claim_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_claim_schema_migration_lease: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_compiled_editor_manifest: { Args: { p_request: Json }; Returns: Json }
      cms_compiled_manifest_bounded: {
        Args: { p_value: Json }
        Returns: boolean
      }
      cms_compiled_renderer_manifest: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_compiler_registry_valid: {
        Args: { p_version: string }
        Returns: boolean
      }
      cms_complete: {
        Args: {
          p_reservation_id: string
          p_resource_id: string
          p_response?: Json
          p_status: number
        }
        Returns: undefined
      }
      cms_complete_schema_migration: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_correlation: { Args: { p_request: Json }; Returns: string }
      cms_create_type_draft: { Args: { p_request: Json }; Returns: Json }
      cms_data_source_registry_valid: {
        Args: { p_key: string }
        Returns: boolean
      }
      cms_dead_letter_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_definition_artifact_hash: {
        Args: { p_request: Json }
        Returns: string
      }
      cms_dry_run_report_valid: {
        Args: {
          p_classification: string
          p_compiler_hash: string
          p_compiler_version: string
          p_dry_run_id: string
          p_report: Json
          p_source_hash: string
          p_target_hash: string
          p_transform_key: string
          p_transform_version: number
        }
        Returns: boolean
      }
      cms_emit_event: {
        Args: {
          p_acting_party_id: string
          p_action: string
          p_actor_id: string
          p_aggregate_id: string
          p_aggregate_type: string
          p_aggregate_version: number
          p_correlation_id: string
          p_event_type: string
          p_payload: Json
          p_reason_code: string
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      cms_exact_keys: {
        Args: { p_allowed: string[]; p_required: string[]; p_value: Json }
        Returns: boolean
      }
      cms_expected_version: { Args: { p_request: Json }; Returns: number }
      cms_finalize_schema_migration_dry_run: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_get_content_type_version: { Args: { p_request: Json }; Returns: Json }
      cms_get_schema_migration_plan: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_heartbeat_schema_migration_lease: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_invalidate_activation_reviews: {
        Args: { p_candidate_id: string }
        Returns: number
      }
      cms_invalidate_activation_reviews_for_owner: {
        Args: { p_owner_id: string }
        Returns: number
      }
      cms_jcs: { Args: { p_value: Json }; Returns: string }
      cms_jcs_number: { Args: { p_value: Json }; Returns: string }
      cms_jcs_sha256: { Args: { p_value: Json }; Returns: string }
      cms_json_bounded: {
        Args: {
          p_max_array?: number
          p_max_bytes?: number
          p_max_depth?: number
          p_max_keys?: number
          p_value: Json
        }
        Returns: boolean
      }
      cms_json_depth: { Args: { p_value: Json }; Returns: number }
      cms_key_hash: { Args: { p_key: string }; Returns: string }
      cms_list_content_types: { Args: { p_request: Json }; Returns: Json }
      cms_lock_activation_authority: {
        Args: {
          p_actor_id: string
          p_candidate_id: string
          p_context_id?: string
        }
        Returns: undefined
      }
      cms_lock_activation_graph: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      cms_migration_plan_ready: {
        Args: {
          p_content_type_id: string
          p_plan_id: string
          p_to_version_id: string
        }
        Returns: boolean
      }
      cms_migration_source_evidence_valid: {
        Args: {
          p_plan: Database["platform_private"]["Tables"]["cms_schema_migration_plans"]["Row"]
        }
        Returns: boolean
      }
      cms_migration_transform_hash: {
        Args: {
          p_classification: string
          p_compiler_hash: string
          p_compiler_version: string
          p_source_hash: string
          p_target_hash: string
          p_transform_key: string
          p_transform_version: number
        }
        Returns: string
      }
      cms_persisted_dry_run_report_valid: {
        Args: {
          p_classification: string
          p_compiler_hash: string
          p_compiler_version: string
          p_content_type_id: string
          p_owner_id: string
          p_report_id: string
          p_source_hash: string
          p_source_version_id: string
          p_target_hash: string
          p_target_version_id: string
          p_transform_key: string
          p_transform_version: number
        }
        Returns: boolean
      }
      cms_prepare_activation_migration: {
        Args: {
          p_candidate_id: string
          p_current_active_id: string
          p_dry_run_id: string
          p_dry_run_report?: Json
          p_requested_plan_id: string
          p_transform_key?: string
          p_transform_version?: number
        }
        Returns: string
      }
      cms_process_schema_migration_batch: {
        Args: { p_dry_run?: boolean; p_request: Json }
        Returns: Json
      }
      cms_process_schema_migration_dry_run_batch: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_projection_registry_valid: {
        Args: {
          p_projection_key: string
          p_target_kind: string
          p_target_type: string
        }
        Returns: boolean
      }
      cms_props_attestation_payload: {
        Args: { p_request: Json }
        Returns: string
      }
      cms_reconcile_schema_activation: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_record_audit: {
        Args: {
          p_acting_party_id: string
          p_action: string
          p_actor_id: string
          p_correlation_id: string
          p_reason_code: string
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      cms_record_dry_run_report: {
        Args: {
          p_classification: string
          p_compiler_hash: string
          p_compiler_version: string
          p_content_type_id: string
          p_created_by?: string
          p_owner_id: string
          p_report: Json
          p_report_id: string
          p_source_hash: string
          p_source_version_id: string
          p_target_hash: string
          p_target_version_id: string
          p_transform_key: string
          p_transform_version: number
        }
        Returns: undefined
      }
      cms_register_block: { Args: { p_request: Json }; Returns: Json }
      cms_register_block_at: {
        Args: { p_now_at: string; p_request: Json }
        Returns: Json
      }
      cms_release_actor: { Args: { p_request: Json }; Returns: string }
      cms_release_nonce_claim: {
        Args: { p_actor_id: string; p_operation_id: string; p_request: Json }
        Returns: string
      }
      cms_release_nonce_claim_at: {
        Args: {
          p_actor_id: string
          p_now_at: string
          p_operation_id: string
          p_request: Json
        }
        Returns: string
      }
      cms_release_schema_migration_event: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_release_signing_payload: {
        Args: { p_operation_id: string; p_request: Json }
        Returns: string
      }
      cms_renderer_registry_valid: { Args: { p_ref: string }; Returns: boolean }
      cms_request_hash: { Args: { p_request: Json }; Returns: string }
      cms_require_capability: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_capability: string
        }
        Returns: undefined
      }
      cms_require_read: {
        Args: { p_acting_party_id: string; p_actor_id: string }
        Returns: undefined
      }
      cms_require_release_worker: { Args: never; Returns: undefined }
      cms_reserve: {
        Args: { p_actor_id: string; p_operation: string; p_request: Json }
        Returns: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        SetofOptions: {
          from: "*"
          to: "idempotency_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cms_reserved_key: { Args: { p_key: string }; Returns: boolean }
      cms_rollback_schema_migration: {
        Args: { p_request: Json }
        Returns: Json
      }
      cms_rpc_context_valid: { Args: never; Returns: boolean }
      cms_schema_ref_registry_valid: {
        Args: { p_ref: string }
        Returns: boolean
      }
      cms_template_registry_valid: { Args: { p_id: string }; Returns: boolean }
      cms_type_version_resource: {
        Args: { p_version_id: string }
        Returns: Json
      }
      cms_valid_base64: { Args: { p_value: string }; Returns: boolean }
      cms_valid_block_request: { Args: { p_request: Json }; Returns: boolean }
      cms_valid_field_input: {
        Args: { p_require_stable_id?: boolean; p_value: Json }
        Returns: boolean
      }
      cms_valid_hash: { Args: { p_value: string }; Returns: boolean }
      cms_valid_relation_input: { Args: { p_value: Json }; Returns: boolean }
      cms_valid_uuid: { Args: { p_value: string }; Returns: boolean }
      cms_valid_version: { Args: { p_value: string }; Returns: boolean }
      cms_validator_registry_valid: {
        Args: { p_key: string; p_version: number }
        Returns: boolean
      }
      cms_verify_props_attestation: {
        Args: { p_actor_id: string; p_request: Json }
        Returns: Json
      }
      cms_verify_schema_migration: { Args: { p_request: Json }; Returns: Json }
      cms_worker_activate_schema: { Args: { p_request: Json }; Returns: Json }
      cms_worker_counter: {
        Args: { p_code?: string; p_value: string }
        Returns: number
      }
      cms_worker_hash: { Args: { p_value: string }; Returns: undefined }
      cms_worker_human_approval_valid: {
        Args: { p_candidate_id: string }
        Returns: boolean
      }
      cms_worker_lease_valid: {
        Args: {
          p_lease_token: string
          p_now?: string
          p_plan: Database["platform_private"]["Tables"]["cms_schema_migration_plans"]["Row"]
          p_worker_id?: string
        }
        Returns: boolean
      }
      cms_worker_plan_json: { Args: { p_plan_id: string }; Returns: Json }
      cms_worker_positive: {
        Args: { p_code?: string; p_value: string }
        Returns: number
      }
      cms_worker_require_request: {
        Args: { p_allowed: string[]; p_request: Json; p_required: string[] }
        Returns: undefined
      }
      cms_worker_set_report: {
        Args: {
          p_expires_at: string
          p_failed_count?: number
          p_lease_state: string
          p_migrated_count?: number
          p_owner: string
          p_report: Json
          p_row_error_count?: number
          p_source_count?: number
          p_target_count?: number
          p_token: string
        }
        Returns: Json
      }
      cms_worker_time: { Args: { p_value: string }; Returns: string }
      cms_worker_uuid: {
        Args: { p_code?: string; p_value: string }
        Returns: string
      }
      cms_worker_validate_fingerprint: {
        Args: {
          p_plan: Database["platform_private"]["Tables"]["cms_schema_migration_plans"]["Row"]
          p_request: Json
        }
        Returns: undefined
      }
      cms_workflow_registry_valid: {
        Args: { p_key: string; p_version: number }
        Returns: boolean
      }
      complete_outbox_event: {
        Args: { p_event_id: string; p_lease_token: string }
        Returns: boolean
      }
      complete_restore_fence: {
        Args: { p_restore_epoch: number }
        Returns: boolean
      }
      complete_upload_intent: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id?: string
          p_expected_version: number
          p_idempotency_key_hash: string
          p_job_id?: string
          p_observed_byte_size: number
          p_observed_checksum: string
          p_observed_media_type: string
          p_request_hash: string
          p_storage_adapter: string
          p_upload_intent_id: string
        }
        Returns: {
          event_id: string
          job_id: string
          object_id: string
          object_version: number
          replayed: boolean
        }[]
      }
      complete_upload_intent_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_id: string
          p_expected_object_version: number
          p_idempotency_key_hash: string
          p_job_id: string
          p_observed_byte_size: number
          p_observed_checksum: string
          p_observed_media_type: string
          p_request_hash: string
          p_storage_adapter: string
          p_target_id: string
          p_target_type: string
          p_target_version: number
          p_upload_intent_id: string
        }
        Returns: {
          event_id: string
          job_id: string
          object_id: string
          object_version: number
          replayed: boolean
          target_id: string
          target_type: string
          target_version: number
        }[]
      }
      consume_job_read_rate_limit: {
        Args: {
          p_acting_party_id: string
          p_now_at?: string
          p_party_limit?: number
          p_user_id: string
          p_user_limit?: number
        }
        Returns: {
          allowed: boolean
          limit_value: number
          remaining: number
          reset_at: string
          scope: string
        }[]
      }
      create_provider_operation: {
        Args: {
          p_acting_party_id?: string
          p_actor_id: string
          p_causation_id?: string
          p_correlation_id: string
          p_intent_hash: string
          p_operation_id?: string
          p_operation_type: string
          p_provider: string
          p_provider_idempotency_key_hash: string
        }
        Returns: {
          operation_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_provider_operation_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_causation_id: string
          p_correlation_id: string
          p_governed_payload: Json
          p_intent_hash: string
          p_operation_id: string
          p_operation_type: string
          p_provider: string
          p_provider_idempotency_key_hash: string
        }
        Returns: {
          operation_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_upload_intent: {
        Args: {
          p_actor_id: string
          p_allowed_media_types: string[]
          p_bucket: string
          p_byte_size: number
          p_checksum: string
          p_correlation_id?: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_intent_id?: string
          p_max_bytes: number
          p_media_type: string
          p_object_id?: string
          p_object_key: string
          p_owner_party_id: string
          p_purpose: string
          p_request_hash: string
          p_retention_class: string
        }
        Returns: {
          expires_at: string
          intent_id: string
          object_id: string
          replayed: boolean
          version: number
        }[]
      }
      create_upload_intent_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_allowed_media_types: string[]
          p_bucket: string
          p_byte_size: number
          p_checksum: string
          p_correlation_id: string
          p_expires_at: string
          p_idempotency_key_hash: string
          p_intent_id: string
          p_max_bytes: number
          p_media_type: string
          p_object_id: string
          p_object_key: string
          p_purpose: string
          p_request_hash: string
          p_retention_class: string
          p_target_id: string
          p_target_type: string
          p_target_version: number
        }
        Returns: {
          expires_at: string
          intent_id: string
          object_id: string
          replayed: boolean
          target_id: string
          target_type: string
          target_version: number
          version: number
        }[]
      }
      dead_letter_unknown_outbox_event: {
        Args: { p_event_id: string; p_lease_token: string }
        Returns: boolean
      }
      external_effects_allowed: { Args: never; Returns: boolean }
      heartbeat_job_lease: {
        Args: {
          p_expected_version: number
          p_job_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: boolean
      }
      identity_actor_person: {
        Args: { p_auth_user_id: string }
        Returns: string
      }
      identity_auth_user: { Args: never; Returns: string }
      identity_current_owner: { Args: { p_alias_id: string }; Returns: string }
      identity_hash_setting: { Args: { p_name: string }; Returns: string }
      identity_idempotency_reserve: {
        Args: {
          p_actor_id: string
          p_key_hash: string
          p_operation: string
          p_request_hash: string
        }
        Returns: {
          actor_id: string
          claim_lease_until: string | null
          claim_token_hash: string | null
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          operation: string
          request_hash: string
          response_ref: Json | null
          state: Database["platform_private"]["Enums"]["idempotency_state"]
        }
        SetofOptions: {
          from: "*"
          to: "idempotency_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      identity_normalized_handle: {
        Args: { p_handle: string }
        Returns: string
      }
      identity_record_effects: {
        Args: {
          p_acting_party_id: string
          p_action: string
          p_actor_id: string
          p_aggregate_id: string
          p_aggregate_type: string
          p_aggregate_version: number
          p_correlation_id: string
          p_event_type: string
          p_payload: Json
          p_reason_code: string
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      identity_uuid_setting: { Args: { p_name: string }; Returns: string }
      identity_validate_display_name: {
        Args: { p_display_name: string }
        Returns: undefined
      }
      normalize_identity_handle: { Args: { p_handle: string }; Returns: string }
      protected_writes_allowed: { Args: never; Returns: boolean }
      read_authorized_job: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_capability?: string
          p_job_id: string
          p_reason?: string
          p_step_up_verified?: boolean
        }
        Returns: {
          acting_party_id: string
          actor_id: string
          created_at: string
          error_code: string
          job_id: string
          job_type: string
          lease_until: string
          progress: Json
          result_ref: Json
          state: Database["platform_private"]["Enums"]["job_state"]
          updated_at: string
          version: number
        }[]
      }
      read_canonical_job: {
        Args: { p_job_id: string }
        Returns: {
          id: string
          lease_until: string
          state: Database["platform_private"]["Enums"]["job_state"]
          type: string
          version: number
        }[]
      }
      read_consumable_object: {
        Args: { p_object_id: string }
        Returns: {
          bucket: string
          byte_size: number
          checksum: string
          id: string
          media_type: string
          object_key: string
          version: number
        }[]
      }
      read_provider_operation_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_operation_id: string
        }
        Returns: {
          acting_party_id: string
          actor_id: string
          attempts: Json
          causation_id: string
          correlation_id: string
          governed_payload: Json
          intent_hash: string
          last_attempt_at: string
          operation_id: string
          operation_type: string
          provider: string
          provider_idempotency_key_hash: string
          provider_ref: string
          reconciliation_at: string
          state: Database["platform_private"]["Enums"]["provider_operation_state"]
          version: number
        }[]
      }
      read_recovery_provenance: {
        Args: never
        Returns: {
          artifact_digest: string
          artifact_id: string
          environment: string
          evidence_id: string
          promoted_at: string
          promotion_expires_at: string
          promotion_id: string
          provenance_kind: string
          provenance_valid: boolean
          source_revision: string
        }[]
      }
      read_recovery_verification: {
        Args: never
        Returns: {
          consumer_restore_epoch: number
          current_restore_epoch: number
          evidence_id: string
          evidence_present: boolean
          expires_at: string
          idempotency_outbox_job_verified: boolean
          integrity_verified: boolean
          measured_rpo_seconds: number
          measured_rto_seconds: number
          object_verified: boolean
          pitr_available: boolean
          pitr_status: string
          pitr_supported: boolean
          pitr_window_seconds: number
          protected_writes_allowed: boolean
          provider_webhook_verified: boolean
          public_projection_verified: boolean
          reason_code: string
          restore_epoch: number
          rls_verified: boolean
          rpc_verified: boolean
          verified_at: string
        }[]
      }
      read_restore_fence: {
        Args: never
        Returns: {
          consumer_epoch: number
          expected_epoch: number
          integrity_verified: boolean
          reconciliation_complete: boolean
        }[]
      }
      record_attempt_outcome: {
        Args: {
          attempts: Json
          ended_at: string
          error_code: string
          outcome: string
          retryable: boolean
        }
        Returns: Json
      }
      record_processed_event: {
        Args: {
          p_aggregate_id: string
          p_event_id: string
          p_event_type: string
          p_pending_manual_review: boolean
          p_schema_version: number
        }
        Returns: string
      }
      record_promoted_recovery_verification: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_artifact_digest: string
          p_artifact_id: string
          p_correlation_id?: string
          p_environment: string
          p_evidence_id?: string
          p_expires_at?: string
          p_idempotency_outbox_job_verified: boolean
          p_integrity_verified: boolean
          p_measured_rpo_seconds: number
          p_measured_rto_seconds: number
          p_object_verified: boolean
          p_pitr_supported: boolean
          p_pitr_window_seconds: number
          p_promotion_id: string
          p_provider_webhook_verified: boolean
          p_public_projection_verified: boolean
          p_restore_epoch: number
          p_rls_verified: boolean
          p_rpc_verified: boolean
          p_source_revision: string
          p_verified_at?: string
        }
        Returns: {
          evidence_id: string
          protected_writes_allowed: boolean
        }[]
      }
      record_recovery_verification: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_correlation_id?: string
          p_evidence_id?: string
          p_expires_at?: string
          p_idempotency_outbox_job_verified: boolean
          p_integrity_verified: boolean
          p_measured_rpo_seconds: number
          p_measured_rto_seconds: number
          p_object_verified: boolean
          p_pitr_supported: boolean
          p_pitr_window_seconds: number
          p_provider_webhook_verified: boolean
          p_public_projection_verified: boolean
          p_restore_epoch: number
          p_rls_verified: boolean
          p_rpc_verified: boolean
          p_verified_at?: string
        }
        Returns: {
          evidence_id: string
          protected_writes_allowed: boolean
        }[]
      }
      record_webhook_receipt: {
        Args: {
          p_acting_party_id?: string
          p_actor_id?: string
          p_correlation_id?: string
          p_external_event_id: string
          p_operation_id?: string
          p_payload_digest: string
          p_provider: string
          p_receipt_id?: string
          p_signature_verified_at: string
        }
        Returns: {
          accepted: boolean
          conflict: boolean
          duplicate: boolean
          operation_id: string
          receipt_id: string
          state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }[]
      }
      record_webhook_receipt_authorized: {
        Args: {
          p_acting_party_id: string
          p_actor_id: string
          p_correlation_id: string
          p_event_type: string
          p_external_event_id: string
          p_normalized_event: Json
          p_operation_id: string
          p_payload_digest: string
          p_provider: string
          p_receipt_id: string
          p_schema_version: number
          p_signature_verified_at: string
        }
        Returns: {
          accepted: boolean
          conflict: boolean
          duplicate: boolean
          event_type: string
          operation_id: string
          receipt_id: string
          schema_version: number
          state: Database["platform_private"]["Enums"]["webhook_receipt_state"]
        }[]
      }
      valid_attempts: { Args: { value: Json }; Returns: boolean }
      valid_base_event_payload: {
        Args: { event_type: string; payload: Json; schema_version: number }
        Returns: boolean
      }
      valid_governed_provider_payload: {
        Args: { value: Json }
        Returns: boolean
      }
      valid_governed_provider_payload_node: {
        Args: { depth: number; value: Json }
        Returns: boolean
      }
      valid_job_progress: { Args: { value: Json }; Returns: boolean }
      valid_media_type_list: { Args: { value: string[] }; Returns: boolean }
      valid_object_key: { Args: { value: string }; Returns: boolean }
      valid_response_ref: { Args: { value: Json }; Returns: boolean }
    }
    Enums: {
      alias_lifecycle: "active" | "transfer_pending" | "transferred" | "retired"
      audit_decision: "allowed" | "denied" | "completed" | "failed"
      cms_definition_state:
        | "draft"
        | "review"
        | "approved"
        | "scheduled"
        | "active"
        | "superseded"
        | "retired"
        | "blocked"
      context_binding_state: "active" | "revoked" | "expired"
      facet_source: "self_asserted" | "curation_approved"
      facet_state: "active" | "removed"
      handle_state: "active" | "redirect" | "retired"
      idempotency_state: "reserved" | "completed" | "failed_retryable"
      job_state: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      legal_identity_state: "active" | "superseded" | "withdrawn"
      object_state:
        | "pending_upload"
        | "uploaded"
        | "verifying"
        | "ready"
        | "rejected"
        | "quarantined"
      person_account_state:
        | "shadow"
        | "claimed"
        | "active"
        | "suspended"
        | "memorialised"
        | "erasure_processing"
      provider_operation_state:
        | "planned"
        | "pending"
        | "confirmed"
        | "failed"
        | "manual_review"
      public_link_state: "private" | "public"
      restore_fence_state: "reconciling" | "released"
      transfer_offer_state:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "cancelled"
      upload_intent_state: "issued" | "consumed" | "expired" | "cancelled"
      webhook_receipt_state:
        | "received"
        | "accepted"
        | "duplicate"
        | "rejected"
        | "processed"
        | "failed"
        | "manual_review"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public_api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  audit_private: {
    Enums: {},
  },
  platform_api: {
    Enums: {},
  },
  platform_private: {
    Enums: {
      alias_lifecycle: ["active", "transfer_pending", "transferred", "retired"],
      audit_decision: ["allowed", "denied", "completed", "failed"],
      cms_definition_state: [
        "draft",
        "review",
        "approved",
        "scheduled",
        "active",
        "superseded",
        "retired",
        "blocked",
      ],
      context_binding_state: ["active", "revoked", "expired"],
      facet_source: ["self_asserted", "curation_approved"],
      facet_state: ["active", "removed"],
      handle_state: ["active", "redirect", "retired"],
      idempotency_state: ["reserved", "completed", "failed_retryable"],
      job_state: ["queued", "running", "succeeded", "failed", "cancelled"],
      legal_identity_state: ["active", "superseded", "withdrawn"],
      object_state: [
        "pending_upload",
        "uploaded",
        "verifying",
        "ready",
        "rejected",
        "quarantined",
      ],
      person_account_state: [
        "shadow",
        "claimed",
        "active",
        "suspended",
        "memorialised",
        "erasure_processing",
      ],
      provider_operation_state: [
        "planned",
        "pending",
        "confirmed",
        "failed",
        "manual_review",
      ],
      public_link_state: ["private", "public"],
      restore_fence_state: ["reconciling", "released"],
      transfer_offer_state: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "cancelled",
      ],
      upload_intent_state: ["issued", "consumed", "expired", "cancelled"],
      webhook_receipt_state: [
        "received",
        "accepted",
        "duplicate",
        "rejected",
        "processed",
        "failed",
        "manual_review",
      ],
    },
  },
  public: {
    Enums: {},
  },
  public_api: {
    Enums: {},
  },
} as const
