import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const phasePlan = readFileSync(
  resolve(ROOT, '.memory/wiki/specs/phases/phase-2.md'),
  'utf8',
);
const slice09Tracker = readFileSync(
  resolve(ROOT, '.memory/pipeline/progress/slices/phase-02-slice-09.md'),
  'utf8',
);

const authoritativeDocuments = [
  ['canonical Phase 2 plan', phasePlan],
  ['current Slice 09 tracker', slice09Tracker],
] as const;

const expectedAuthoredIds = Array.from(
  { length: 283 },
  (_, index) => `P2-S09-AC-${String(index + 1).padStart(3, '0')}`,
);

const acceptanceIds = (source: string): string[] =>
  [...new Set(source.match(/\bP2-S09-AC-\d{3}\b/gu) ?? [])].sort();

const ac266PolicyWindows = (source: string): string[] =>
  [...source.matchAll(/P2-S09-AC-266|AC266/gu)].map(({ index }) => {
    const start = Math.max(0, (index ?? 0) - 600);
    return source.slice(start, (index ?? 0) + 2_000);
  });

const linesContaining = (source: string, pattern: RegExp): string[] =>
  source.split(/\r?\n/u).filter((line) => pattern.test(line));

describe('Phase 2 Slice 09 completion policy', () => {
  it('[P2-S09-AC-267] preserves 283 authored IDs with a separate 282-item Phase 2 completion denominator', () => {
    for (const [label, source] of authoritativeDocuments) {
      expect(acceptanceIds(source), label).toEqual(expectedAuthoredIds);
      expect(source, label).toMatch(
        /\*{0,2}Phase[ -]2 completion (?:denominator|criteria)\*{0,2}\s*:\s*282\b/iu,
      );
      expect(source, label).toMatch(
        /283 authored[^\n]*(?:AC266|post[ -]Phase[ -]2|production[ -]readiness)/iu,
      );
    }
  });

  it('[P2-S09-AC-266] keeps real-device accessibility evidence unchecked, deferred, and outside Phase 2 completion', () => {
    for (const [label, source] of authoritativeDocuments) {
      const ac266Row = source
        .split(/\r?\n/u)
        .find((line) => /^\s*-\s*\[ \].*P2-S09-AC-266/iu.test(line));
      expect(ac266Row, label).toBeDefined();
      expect(ac266Row, label).toMatch(/^\s*-\s*\[ \]/u);

      const policyWindow = ac266PolicyWindows(source).find((window) =>
        /deferred/iu.test(window),
      );
      expect(policyWindow, `${label} AC266 policy`).toBeDefined();
      expect(policyWindow, `${label} AC266 policy`).toMatch(
        /excluded from (?:the )?Phase[ -]2 completion (?:denominator|criteria)/iu,
      );
      expect(policyWindow, `${label} AC266 policy`).toMatch(
        /(?:not|never)[^\n]*(?:passed|accepted|waived|simulated|inferred)/iu,
      );
    }
  });

  it('[P2-S09-AC-209, P2-S09-AC-211, P2-S09-AC-265] limits Slice 10 implementation prerequisites to the three remaining phase gates', () => {
    for (const [label, source] of authoritativeDocuments) {
      const dependencyLines = linesContaining(source, /Slice\s*10/iu);
      const implementationPrerequisite = dependencyLines.find(
        (line) =>
          /AC209/iu.test(line) &&
          /AC211/iu.test(line) &&
          /AC265/iu.test(line) &&
          !/AC266/iu.test(line),
      );

      expect(
        implementationPrerequisite,
        `${label} Slice 10 dependency`,
      ).toBeDefined();
    }
  });

  it('[P2-S09-AC-266] retains AC266 as a mandatory post-Phase-2 production-readiness gate', () => {
    const combinedPolicy = `${phasePlan}\n${slice09Tracker}`;
    const readinessLines = linesContaining(combinedPolicy, /AC266/iu).filter(
      (line) =>
        /production[ -]readiness|release gate|production release/iu.test(line),
    );

    expect(readinessLines.length).toBeGreaterThan(0);
    expect(readinessLines.join('\n')).toMatch(/mandatory|required|gate/iu);
    expect(combinedPolicy).toMatch(
      /macOS[^\n]*Safari[^\n]*VoiceOver|VoiceOver[^\n]*Safari[^\n]*macOS/iu,
    );
    expect(combinedPolicy).toMatch(
      /Windows[^\n]*Firefox[^\n]*NVDA|NVDA[^\n]*Firefox[^\n]*Windows/iu,
    );
    expect(combinedPolicy).toMatch(
      /Linux[^\n]*(?:cannot|does not)[^\n]*(?:replace|substitute)/iu,
    );
  });
});
