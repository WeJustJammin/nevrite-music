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
      begin_restore_fence: {
        Args: { p_reason: string; p_restore_epoch: number }
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
      heartbeat_job_lease: {
        Args: {
          p_expected_version: number
          p_job_id: string
          p_lease_seconds: number
          p_lease_token: string
        }
        Returns: boolean
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
      idempotency_records: {
        Row: {
          actor_id: string
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
      [_ in never]: never
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
      begin_restore_fence: {
        Args: { p_reason: string; p_restore_epoch: number }
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
      audit_decision: "allowed" | "denied" | "completed" | "failed"
      idempotency_state: "reserved" | "completed" | "failed_retryable"
      job_state: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      object_state:
        | "pending_upload"
        | "uploaded"
        | "verifying"
        | "ready"
        | "rejected"
        | "quarantined"
      provider_operation_state:
        | "planned"
        | "pending"
        | "confirmed"
        | "failed"
        | "manual_review"
      restore_fence_state: "reconciling" | "released"
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
      audit_decision: ["allowed", "denied", "completed", "failed"],
      idempotency_state: ["reserved", "completed", "failed_retryable"],
      job_state: ["queued", "running", "succeeded", "failed", "cancelled"],
      object_state: [
        "pending_upload",
        "uploaded",
        "verifying",
        "ready",
        "rejected",
        "quarantined",
      ],
      provider_operation_state: [
        "planned",
        "pending",
        "confirmed",
        "failed",
        "manual_review",
      ],
      restore_fence_state: ["reconciling", "released"],
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
