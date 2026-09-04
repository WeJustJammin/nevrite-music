export interface IdentityAuthorityOperationEntry {
  readonly source: string;
  readonly workbench: string;
  readonly operations: readonly string[];
  readonly fields: readonly string[];
  readonly errors: readonly string[];
}

const authOperations = [
  'AUTH-API-01',
  'AUTH-API-02',
  'AUTH-API-03',
  'AUTH-API-04',
  'AUTH-API-05',
  'AUTH-API-06',
  'AUTH-API-07',
  'AUTH-API-08',
  'AUTH-API-09',
  'AUTH-API-10',
  'AUTH-API-11',
  'AUTH-API-12',
  'AUTH-API-13',
  'AUTH-API-14',
  'AUTH-API-15',
] as const;

const legacyOperations = [
  'IDL-API-01',
  'IDL-API-06',
  'IDL-API-02',
  'IDL-API-03',
  'IDL-API-04',
  'IDL-API-05',
  'IDL-API-07',
  'IDL-API-08',
  'IDL-API-09',
  'IDL-API-10',
  'IDL-API-11',
  'IDL-API-12',
  'IDL-API-13',
  'IDL-API-14',
  'IDL-API-15',
] as const;

const authFields =
  'ApiError AuditEvent ETag EmailStartRequest FieldViolation JobStatus JsonValue LinkIntentRequest Location LogoutRequest MergeConfirmRequest MergeCreateRequest MergeProofRequest OAuthStartRequest OutboxEvent PersonBootstrapResource PersonParty PlatformEvent ProviderOperation RequestContext SessionResource UnlinkRequest acceptedAt account_binding_conflict account_not_eligible acknowledgement_unknown acknowledgements aggregateVersion all analyzing anon apple authUserId auth_user_bindings awaiting_confirmation awaiting_duplicate_proof bandlab claimed conflictPlanVersion current deliveryAttemptId deliveryState domain email email_invalid erasure_processing eventType expiresAt facebook final_login_method google idempotency_mismatch identity identityId intent intentId intent_invalid issued_at jobs last_seen_at link login_identity_conflict manual_review memorialised mergeId merge_already_active merge_conflicts_unresolved merge_id_invalid merge_plan_stale merge_state_conflict normalizedIdentity normalizedVersion not_survivor notificationId operationId outbox_events personId pkceVerifier prove_merge provider providerCodeHash providerIdentityRef providerIdentityState providerOperationId providerReference providerSubject provider_already_linked provider_not_available provider_operations reason reason_invalid recipientClass reconciling recovery redirectUri removable responseClass returnTo return_path return_target_invalid revokedAt safeTemplateCode same_account scope scope_invalid search_path sessionId sessionReceipt sessionState session_id sign_in soundcloud stateId support_bypass_denied suspended tiktok traceparent version_invalid'.split(
    ' ',
  ) as readonly string[];
const partyFields =
  'ApiError accepted aggregateId aggregateVersion audiencePartyId audienceState authSubjectRef authoritySnapshotVersion candidatePartyId capabilityClasses contextState contractVersion correlationId deliveryAttemptId effectiveUntil eligibilityState eventId eventType expectedPersonVersion expiresAt humanId idempotencyKey inboxState legalRecordVersion minimumFieldCodes personId personVersion policyVersion protectedRefIds purposeCode readinessState recipientPartyId referenceReceiptIds relationshipId relationshipVersion requestedFieldCodes requestedPartyId resolutionState retentionClass sourceVersion subjectPersonId transactionId'.split(
    ' ',
  ) as readonly string[];
const relationshipFields =
  'ApiError Resource ETag accepted acceptedAt actingPartyId actorHumanId aggregateId aggregateVersion assignmentId capacity completedAt correlationId counterpartConfirmationId decision dependencyClass detectorVersion endsOn etag eventId eventType evidenceRef expiresAt expectedOrganizationVersion ifMatch idempotencyKey inboxState inviteExpiresAt lifecycle mandateVersion matchReferenceHashes mode normalizedInputHash organizationId organizationVersion ownershipState periodId personId projectionVersion provenance purposeCode reasonCode registryVersion relationshipVersion requestId reviewState scope sourceVersion startsOn state targetOrganizationId tenureId termsHash termsVersionId typeCode typeCodes version revokedAt'.split(
    ' ',
  ) as readonly string[];
const legacyFields =
  'RepresentationEdge accepted attemptId authorityState capacityCode caseId claimId claimOrCaseId claimVersion decision delayed deliveryAttemptId digest effectiveAt estate_representation eventId eventType evidenceRefIds expectedAuthorityVersion expectedDigest expectedVersion identifier_collision inboxState legalHoldState lifecycleVersion namespace normalizedValueHash observedAt personId providerAttemptState purposeCode readinessState receiptIds registryReferenceHash relationshipId relationshipVersion representationId representationVersion retentionClass revokedAt scopeHash sourceCaseId sourceVersion subjectPartyId verificationState verifying'.split(
    ' ',
  ) as readonly string[];

const authErrors =
  'AUTH_CALLBACK_INVALID CONFLICT DEPENDENCY_UNAVAILABLE FORBIDDEN IDEMPOTENCY_MISMATCH INVALID_REQUEST INVALID_TRANSITION NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  ) as readonly string[];
const partyErrors =
  'ALIAS_NOT_FOUND CONFLICT CONTEXT_NOT_FOUND CONTEXT_RECONFIRM_REQUIRED CONTEXT_REVOKED DEPENDENCY_UNAVAILABLE DISCLOSURE_NOT_FOUND EFFECTIVE_PERIOD_CONFLICT FACET_NOT_FOUND FORBIDDEN HANDLE_INVALID IDEMPOTENCY_MISMATCH IF_MATCH_REQUIRED INVALID_REQUEST LEGAL_IDENTITY_NOT_FOUND LEGAL_REF_INVALID NOT_FOUND PERSON_NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED TRANSFER_EXPIRED TRANSFER_NOT_FOUND UNAUTHENTICATED VERSION_MISMATCH'.split(
    ' ',
  ) as readonly string[];
const relationshipErrors =
  'AUTHORITY_STALE CAPACITY_OVERLAP CEILING_INVALID COMMUNICATION_INVALID CONFLICT CURRENCY_REQUIRED DATE_INVALID DEPENDENCY_UNAVAILABLE DISPOSITION_INVALID DISPOSITION_REQUIRED EVIDENCE_REFERENCE_INVALID FORBIDDEN GOVERNANCE_CONFIRMATION_REQUIRED GOVERNANCE_CONFIRMATION_STALE GOVERNANCE_MEMBER_SET_STALE HASH_INVALID IDEMPOTENCY_MISMATCH INVALID_REQUEST MANDATE_STATE_INVALID MEMBERSHIP_ASSERTION_REJECTED MEMBERSHIP_STATE_INVALID MEMBERSHIP_VERSION_CONFLICT NAME_OWNERS_INVALID NAME_STATEMENT_INVALID NOT_FOUND OBLIGATION_DISPOSITION_REQUIRED ORGANIZATION_DISSOLUTION_VOTE_REQUIRED ORGANIZATION_MODE_REQUIRED ORGANIZATION_TERMINAL ORGANIZATION_TYPE_UNKNOWN ORGANIZATION_VERSION_CONFLICT PERIOD_INVALID RATE_LIMITED REPRESENTATION_CONFIRMATION_REQUIRED REPRESENTATION_CURRENCY_REQUIRED REPRESENTATION_SCOPE_INVALID REPRESENTATION_STATE_INVALID REPRESENTATION_TERM_INVALID RETROACTIVE_END_CONFIRMATION_REQUIRED SCOPE_INVALID SUCCESSOR_LINEAGE_REQUIRED TERMS_ACCEPTANCE_REQUIRED TERMS_HASH_MISMATCH TERM_INVALID TERRITORY_INVALID TREASURY_AMOUNT_INVALID TREASURY_CURRENCY_MISMATCH TREASURY_MANDATE_REQUIRED TREASURY_RESOURCE_UNAVAILABLE UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  ) as readonly string[];
const legacyErrors =
  'CONFLICT DEPENDENCY_UNAVAILABLE FORBIDDEN IDEMPOTENCY_MISMATCH INVALID_REQUEST NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  ) as readonly string[];

export const identityAuthorityOperationMap = {
  auth: {
    source: '01a-auth-account-linking.md',
    workbench: 'AuthAccountLinkingWorkbench',
    operations: authOperations,
    fields: authFields,
    errors: authErrors,
  },
  party: {
    source: '01b-party-identity-aliases.md',
    workbench: 'PartyIdentityAliasesWorkbench',
    operations: ['AUTH-API-07'] as const,
    fields: partyFields,
    errors: partyErrors,
  },
  relationships: {
    source: '01c-relationships-authority-governance.md',
    workbench: 'RelationshipsAuthorityGovernanceWorkbench',
    operations: [
      'ORG-01',
      'ORG-02',
      'TYPE-01',
      'TYPE-02',
      'MEM-01',
      'MEM-02',
      'MEM-03',
      'MEM-04',
      'MEM-05',
      'MEM-06',
    ] as const,
    fields: relationshipFields,
    errors: relationshipErrors,
  },
  legacy: {
    source: '01d-identifiers-legacy.md',
    workbench: 'IdentifiersLegacyWorkbench',
    operations: legacyOperations,
    fields: legacyFields,
    errors: legacyErrors,
  },
} as const satisfies Readonly<Record<string, IdentityAuthorityOperationEntry>>;
