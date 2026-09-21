import { describe, expect, it } from 'vitest';

import {
  serializeAc265HostedSemanticSubject,
  sha256Ac265HostedSemanticSubject,
} from '../../infra/workflows/ac265-hosted-semantic-subject.ts';

describe('AC265 semantic subject canonicalization', () => {
  it('uses deterministic code-point key order independent of insertion order', () => {
    const first = { a: 'lowercase', Z: 'uppercase' };
    const reordered = { Z: 'uppercase', a: 'lowercase' };

    expect(serializeAc265HostedSemanticSubject(first)).toBe(
      '{"Z":"uppercase","a":"lowercase"}',
    );
    expect(serializeAc265HostedSemanticSubject(first)).toBe(
      serializeAc265HostedSemanticSubject(reordered),
    );
    expect(sha256Ac265HostedSemanticSubject(first)).toBe(
      sha256Ac265HostedSemanticSubject(reordered),
    );
  });

  it('preserves JSON escaping in the canonical semantic subject', () => {
    const subject = { kind: 'role', key: 'line\n"quote"\\slash🚀' };

    expect(serializeAc265HostedSemanticSubject(subject)).toBe(
      '{"key":"line\\n\\"quote\\"\\\\slash🚀","kind":"role"}',
    );
  });
});
