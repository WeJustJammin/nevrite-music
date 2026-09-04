import { describe, expect, it } from 'vitest';

import { identityAuthorityOperationMap } from './identity-authority-operation-map.ts';

type SchemaEntry = Readonly<{
  source: string;
  workbench: string;
  fields: readonly string[];
  errors: readonly string[];
}>;

const expectedAuthFields =
  'ApiError AuditEvent ETag EmailStartRequest FieldViolation JobStatus JsonValue LinkIntentRequest Location LogoutRequest MergeConfirmRequest MergeCreateRequest MergeProofRequest OAuthStartRequest OutboxEvent PersonBootstrapResource PersonParty PlatformEvent ProviderOperation RequestContext SessionResource UnlinkRequest acceptedAt account_binding_conflict account_not_eligible acknowledgement_unknown acknowledgements aggregateVersion all analyzing anon apple authUserId auth_user_bindings awaiting_confirmation awaiting_duplicate_proof bandlab claimed conflictPlanVersion current deliveryAttemptId deliveryState domain email email_invalid erasure_processing eventType expiresAt facebook final_login_method google idempotency_mismatch identity identityId intent intentId intent_invalid issued_at jobs last_seen_at link login_identity_conflict manual_review memorialised mergeId merge_already_active merge_conflicts_unresolved merge_id_invalid merge_plan_stale merge_state_conflict normalizedIdentity normalizedVersion not_survivor notificationId operationId outbox_events personId pkceVerifier prove_merge provider providerCodeHash providerIdentityRef providerIdentityState providerOperationId providerReference providerSubject provider_already_linked provider_not_available provider_operations reason reason_invalid recipientClass reconciling recovery redirectUri removable responseClass returnTo return_path return_target_invalid revokedAt safeTemplateCode same_account scope scope_invalid search_path sessionId sessionReceipt sessionState session_id sign_in soundcloud stateId support_bypass_denied suspended tiktok traceparent version_invalid'.split(
    ' ',
  );
const expectedPartyFields =
  'ApiError accepted aggregateId aggregateVersion audiencePartyId audienceState authSubjectRef authoritySnapshotVersion candidatePartyId capabilityClasses contextState contractVersion correlationId deliveryAttemptId effectiveUntil eligibilityState eventId eventType expectedPersonVersion expiresAt humanId idempotencyKey inboxState legalRecordVersion minimumFieldCodes personId personVersion policyVersion protectedRefIds purposeCode readinessState recipientPartyId referenceReceiptIds relationshipId relationshipVersion requestedFieldCodes requestedPartyId resolutionState retentionClass sourceVersion subjectPersonId transactionId'.split(
    ' ',
  );
const expectedRelationshipsFields =
  'ApiError Resource ETag accepted acceptedAt actingPartyId actorHumanId aggregateId aggregateVersion assignmentId capacity completedAt correlationId counterpartConfirmationId decision dependencyClass detectorVersion endsOn etag eventId eventType evidenceRef expiresAt expectedOrganizationVersion ifMatch idempotencyKey inboxState inviteExpiresAt lifecycle mandateVersion matchReferenceHashes mode normalizedInputHash organizationId organizationVersion ownershipState periodId personId projectionVersion provenance purposeCode reasonCode registryVersion relationshipVersion requestId reviewState scope sourceVersion startsOn state targetOrganizationId tenureId termsHash termsVersionId typeCode typeCodes version revokedAt'.split(
    ' ',
  );
const expectedLegacyFields =
  'RepresentationEdge accepted attemptId authorityState capacityCode caseId claimId claimOrCaseId claimVersion decision delayed deliveryAttemptId digest effectiveAt estate_representation eventId eventType evidenceRefIds expectedAuthorityVersion expectedDigest expectedVersion identifier_collision inboxState legalHoldState lifecycleVersion namespace normalizedValueHash observedAt personId providerAttemptState purposeCode readinessState receiptIds registryReferenceHash relationshipId relationshipVersion representationId representationVersion retentionClass revokedAt scopeHash sourceCaseId sourceVersion subjectPartyId verificationState verifying'.split(
    ' ',
  );

const expectedAuthErrors =
  'AUTH_CALLBACK_INVALID CONFLICT DEPENDENCY_UNAVAILABLE FORBIDDEN IDEMPOTENCY_MISMATCH INVALID_REQUEST INVALID_TRANSITION NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  );
const expectedPartyErrors =
  'ALIAS_NOT_FOUND CONFLICT CONTEXT_NOT_FOUND CONTEXT_RECONFIRM_REQUIRED CONTEXT_REVOKED DEPENDENCY_UNAVAILABLE DISCLOSURE_NOT_FOUND EFFECTIVE_PERIOD_CONFLICT FACET_NOT_FOUND FORBIDDEN HANDLE_INVALID IDEMPOTENCY_MISMATCH IF_MATCH_REQUIRED INVALID_REQUEST LEGAL_IDENTITY_NOT_FOUND LEGAL_REF_INVALID NOT_FOUND PERSON_NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED TRANSFER_EXPIRED TRANSFER_NOT_FOUND UNAUTHENTICATED VERSION_MISMATCH'.split(
    ' ',
  );
const expectedRelationshipsErrors =
  'AUTHORITY_STALE CAPACITY_OVERLAP CEILING_INVALID COMMUNICATION_INVALID CONFLICT CURRENCY_REQUIRED DATE_INVALID DEPENDENCY_UNAVAILABLE DISPOSITION_INVALID DISPOSITION_REQUIRED EVIDENCE_REFERENCE_INVALID FORBIDDEN GOVERNANCE_CONFIRMATION_REQUIRED GOVERNANCE_CONFIRMATION_STALE GOVERNANCE_MEMBER_SET_STALE HASH_INVALID IDEMPOTENCY_MISMATCH INVALID_REQUEST MANDATE_STATE_INVALID MEMBERSHIP_ASSERTION_REJECTED MEMBERSHIP_STATE_INVALID MEMBERSHIP_VERSION_CONFLICT NAME_OWNERS_INVALID NAME_STATEMENT_INVALID NOT_FOUND OBLIGATION_DISPOSITION_REQUIRED ORGANIZATION_DISSOLUTION_VOTE_REQUIRED ORGANIZATION_MODE_REQUIRED ORGANIZATION_TERMINAL ORGANIZATION_TYPE_UNKNOWN ORGANIZATION_VERSION_CONFLICT PERIOD_INVALID RATE_LIMITED REPRESENTATION_CONFIRMATION_REQUIRED REPRESENTATION_CURRENCY_REQUIRED REPRESENTATION_SCOPE_INVALID REPRESENTATION_STATE_INVALID REPRESENTATION_TERM_INVALID RETROACTIVE_END_CONFIRMATION_REQUIRED SCOPE_INVALID SUCCESSOR_LINEAGE_REQUIRED TERMS_ACCEPTANCE_REQUIRED TERMS_HASH_MISMATCH TERM_INVALID TERRITORY_INVALID TREASURY_AMOUNT_INVALID TREASURY_CURRENCY_MISMATCH TREASURY_MANDATE_REQUIRED TREASURY_RESOURCE_UNAVAILABLE UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  );
const expectedLegacyErrors =
  'CONFLICT DEPENDENCY_UNAVAILABLE FORBIDDEN IDEMPOTENCY_MISMATCH INVALID_REQUEST NOT_FOUND RATE_LIMITED STEP_UP_REQUIRED UNAUTHENTICATED VALIDATION_FAILED VERSION_MISMATCH'.split(
    ' ',
  );

const entries = Object.values(
  identityAuthorityOperationMap as unknown as Record<string, SchemaEntry>,
);

const entryFor = (source: string, label: string): SchemaEntry => {
  const entry = entries.find((candidate) => candidate.source === source);
  expect(entry, label).toBeDefined();
  return entry as SchemaEntry;
};

const expectFields = (
  source: string,
  workbench: string,
  fields: readonly string[],
): void => {
  const entry = entryFor(source, source + ' source field union');
  expect(entry.workbench).toBe(workbench);
  expect(entry.fields).toEqual(fields);
  expect(new Set(entry.fields).size).toBe(fields.length);
};

const expectErrors = (source: string, errors: readonly string[]): void => {
  const entry = entryFor(source, source + ' error union');
  expect(entry.errors).toEqual(errors);
  expect(new Set(entry.errors).size).toBe(errors.length);
};

describe('P2-S03 source field and error unions', () => {
  it('P2-S03-AC-287 maps every named 01a auth source schema field', () => {
    expectFields(
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthFields,
    );
  });

  it('P2-S03-AC-288 maps every named 01b party and alias source schema field', () => {
    expectFields(
      '01b-party-identity-aliases.md',
      'PartyIdentityAliasesWorkbench',
      expectedPartyFields,
    );
  });

  it('P2-S03-AC-289 maps every named 01c relationship governance source schema field', () => {
    expectFields(
      '01c-relationships-authority-governance.md',
      'RelationshipsAuthorityGovernanceWorkbench',
      expectedRelationshipsFields,
    );
  });

  it('P2-S03-AC-290 maps every named 01d legacy identifier source schema field', () => {
    expectFields(
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyFields,
    );
  });

  it('P2-S03-AC-291 maps the complete 01a auth application error union', () => {
    expectErrors('01a-auth-account-linking.md', expectedAuthErrors);
  });

  it('P2-S03-AC-292 maps the complete 01b party and alias application error union', () => {
    expectErrors('01b-party-identity-aliases.md', expectedPartyErrors);
  });

  it('P2-S03-AC-293 maps the complete 01c relationship governance application error union', () => {
    expectErrors(
      '01c-relationships-authority-governance.md',
      expectedRelationshipsErrors,
    );
  });

  it('P2-S03-AC-294 maps the complete 01d legacy identifier application error union', () => {
    expectErrors('01d-identifiers-legacy.md', expectedLegacyErrors);
  });
});
