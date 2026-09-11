import { describe, expect, it } from 'vitest';

import { deriveAc209ExerciseMarker } from '../infra/workflows/ac209-exercise-marker.ts';

describe('AC209 recoverable exercise marker', () => {
  it('derives a stable UUIDv4 marker from the immutable repository and run IDs', () => {
    const marker = deriveAc209ExerciseMarker('123456789', '9876543210');

    expect(marker).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect(deriveAc209ExerciseMarker('123456789', '9876543210')).toBe(marker);
  });

  it('does not reuse a marker across repositories or workflow runs', () => {
    const marker = deriveAc209ExerciseMarker('123456789', '9876543210');

    expect(deriveAc209ExerciseMarker('123456788', '9876543210')).not.toBe(
      marker,
    );
    expect(deriveAc209ExerciseMarker('123456789', '9876543211')).not.toBe(
      marker,
    );
  });

  it.each([
    ['', '1'],
    ['1', ''],
    ['0', '1'],
    ['1', '0'],
    ['-1', '1'],
    ['1', 'not-a-run'],
    ['1'.repeat(33), '1'],
  ])(
    'rejects invalid recovery identity before derivation',
    (repositoryId, runId) => {
      expect(() => deriveAc209ExerciseMarker(repositoryId, runId)).toThrow(
        'AC209 exercise marker derivation failed',
      );
    },
  );
});
