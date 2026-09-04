import { describe, expect, it } from 'vitest';

import {
  getIdentityFormDefinition,
  serializeNamedForm,
  validateFormInteraction,
} from './identity-form-contracts';

const SOURCE = '01c-relationships-authority-governance.md';

const relationshipForm = () => getIdentityFormDefinition(SOURCE);

const fieldNames = (): readonly string[] =>
  relationshipForm().fields.map(({ name }) => name);

const expectFields = (names: readonly string[]): void => {
  expect(fieldNames()).toEqual(expect.arrayContaining([...names]));
};

describe('P2-S04 web form contracts for organizations and membership', () => {
  it('[P2-S04-AC-003, AC-015, AC-021, AC-027, AC-033, AC-039, AC-045, AC-051, AC-057] names every ORG, TYPE, and MEM request schema', () => {
    expect(relationshipForm().schemaNames).toEqual(
      expect.arrayContaining([
        'CreateOrganizationRequestSchema',
        'AddOrganizationTypeRequestSchema',
        'MembershipInvitationRequestSchema',
        'HistoricalMembershipAssertionRequestSchema',
        'AcceptMembershipRequestSchema',
        'EndMembershipRequestSchema',
        'CapacityPeriodRequestSchema',
      ]),
    );
  });

  it('[P2-S04-AC-063..069] exposes strict, labelled controls for every organization and tenure field', () => {
    expectFields([
      'mode',
      'typeCodes',
      'typeCode',
      'organizationId',
      'assignmentId',
      'personId',
      'startsOn',
      'endsOn',
      'termsVersionId',
      'termsHash',
      'capacity',
      'inviteExpiresAt',
      'provenance',
      'evidenceRef',
      'decision',
      'counterpartConfirmationId',
      'reasonCode',
      'periodId',
      'tenureId',
    ]);

    for (const field of relationshipForm().fields) {
      expect(field.name.trim()).not.toBe('');
      expect(field.label.trim()).not.toBe('');
      expect(typeof field.required).toBe('boolean');
      expect(['text', 'date']).toContain(field.inputType);
    }
  });

  it('[P2-S04-AC-004, AC-016, AC-028, AC-034, AC-040, AC-046, AC-052, AC-058] rejects unknown request keys and maps their JSON field paths', () => {
    const form = relationshipForm();
    const result = validateFormInteraction({
      form,
      values: {
        mode: 'self_member',
        typeCodes: ['band'],
        unexpectedAuthority: 'owner',
        idempotencyKey: 'must-be-a-header',
        ifMatch: 'must-be-a-header',
      },
      phase: 'submit',
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors).toHaveProperty('unexpectedAuthority');
    expect(result.fieldErrors).toHaveProperty('idempotencyKey');
    expect(result.fieldErrors).toHaveProperty('ifMatch');
  });

  it('[P2-S04-AC-065..069] validates safe fields on blur and all cross-field rules on submit', () => {
    const form = relationshipForm();
    const blur = validateFormInteraction({
      form,
      values: { startsOn: '', endsOn: '2026-01-01' },
      phase: 'blur',
      field: 'startsOn',
    });
    const submit = validateFormInteraction({
      form,
      values: {
        personId: 'not-a-uuid',
        startsOn: '2026-03-01',
        endsOn: '2026-02-01',
        provenance: 'historical_assertion',
        evidenceRef: 'not-a-uuid',
      },
      phase: 'submit',
    });

    expect(blur.valid).toBe(false);
    expect(blur.fieldErrors).toHaveProperty('startsOn');
    expect(Object.keys(blur.fieldErrors)).toEqual(['startsOn']);
    expect(submit.valid).toBe(false);
    expect(submit.fieldErrors).toHaveProperty('personId');
    expect(submit.fieldErrors).toHaveProperty('endsOn');
    expect(submit.fieldErrors).toHaveProperty('evidenceRef');
  });

  it('[P2-S04-AC-099..100] keeps mutation headers outside the strict body and serializes the exact INVALID_REQUEST copy', () => {
    const serialized = serializeNamedForm({
      schema: relationshipForm().schema,
      values: {
        mode: 'self_member',
        typeCodes: ['band'],
        idempotencyKey: 'header-only',
        ifMatch: '"1"',
      },
    });

    expect(serialized.ok).toBe(false);
    if (!serialized.ok) {
      expect(serialized.error.code).toBe('INVALID_REQUEST');
      expect(serialized.error.message).toBe(
        'This request could not be read. Review the form and try again.',
      );
      expect(serialized.error.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['idempotencyKey'] }),
          expect.objectContaining({ path: ['ifMatch'] }),
        ]),
      );
    }
  });
});
