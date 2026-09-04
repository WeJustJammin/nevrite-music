import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const paths = {
  infrastructureReport:
    '.memory/pipeline/progress/verification/2026-09-02-auth-infrastructure.md',
  sliceProgress: '.memory/pipeline/progress/slices/phase-02-slice-08.md',
  phaseProgress: '.memory/pipeline/progress/phases/phase-02.md',
  runbook: '.memory/wiki/operations/runbooks/platform-configuration.md',
  featureLedger: '.memory/wiki/specs/feature-ledger.md',
  architectureMap: 'docs/ARCHITECTURE.md',
  specGraph: '.memory/schema/spec-graph.json',
  specGraphLint: '.memory/schema/spec-graph-lint.json',
} as const;

const readArtifact = (relativePath: string): string => {
  const absolutePath = resolve(ROOT, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const readJsonArtifact = (
  relativePath: string,
): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(readArtifact(relativePath)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const activeOperations = [
  'CFG-05B-01',
  'CFG-05B-04',
  'CFG-05B-05',
  'read_audit',
] as const;

const deferredOperations = [
  'CFG-05B-02',
  'CFG-05B-03',
  'run_diagnostic',
] as const;

describe('Phase 2 Slice 08 closeout evidence', () => {
  it('[P2-S08-AC-005] records the authentication and admin infrastructure checkpoint', () => {
    const reportPath = resolve(ROOT, paths.infrastructureReport);
    const report = readArtifact(paths.infrastructureReport);
    const evidence = [
      ['PASS verdict', /(?:\*\*Verdict\*\*|verdict)[^\n]*\bPASS\b/iu],
      ['authentication', /\bauth(?:entication)?\b/iu],
      ['admin capability', /admin[\s-]+capabilit|capabilit[\s-]+admin/iu],
      ['RLS', /\bRLS\b|row[\s-]+level[\s-]+security/iu],
      ['audit', /\baudit\b/iu],
      [
        'secret boundary',
        /secret[\s-]+boundar|server[\s-]+side[\s-]+secret|provider[\s-]+secret/iu,
      ],
    ] as const;
    const missing = [
      ...(existsSync(reportPath) ? [] : ['infrastructure report file']),
      ...evidence
        .filter(([, pattern]) => !pattern.test(report))
        .map(([name]) => name),
    ];

    expect(
      missing,
      `Missing P2-S08-AC-005 infrastructure evidence in ${paths.infrastructureReport}`,
    ).toEqual([]);
  });

  it('[P2-S08-AC-050] records the ordered TDD gate, exact RED counts, and canonical validation', () => {
    const sliceProgress = readArtifact(paths.sliceProgress);
    const stages = [
      /^- \[x\] Contract:/mu,
      /^- \[x\] `QA` RED:/mu,
      /^- \[x\] `BE` data, API, and policy implementation/mu,
      /^- \[x\] `FE` Astro SSR and bounded React-island implementation/mu,
      /^- \[x\] `QA` GREEN, adversarial verification, and canonical validation/mu,
    ];
    const stagePositions = stages.map((pattern) => {
      const match = pattern.exec(sliceProgress);
      return match?.index ?? -1;
    });
    const redEvidence = [
      /Contract RED:\s*\d+\s+files?\s*\/\s*\d+\s+tests?/iu,
      /Worker RED:\s*\d+\s+files?\s*\/\s*\d+\s+tests?/iu,
      /Database RED:\s*\d+\/\d+\s+schema/iu,
      /Web RED:\s*\d+\s+expected Vitest failures and\s*\d+\s+expected Playwright failures/iu,
      /Process(?:\/depth)? RED:\s*\d+\s+tests?\s+produced\s+\d+\s+expected failures/iu,
    ];
    const canonicalValidation = sliceProgress
      .split('\n')
      .some(
        (line) =>
          /canonical validation/iu.test(line) &&
          /pnpm validate/iu.test(line) &&
          /\b(?:PASS|passed|green)\b/iu.test(line),
      );
    const missing = [
      ...(stagePositions.every(
        (position, index) =>
          position >= 0 &&
          (index === 0 || position > stagePositions[index - 1]),
      )
        ? []
        : ['ordered Contract → QA RED → BE → FE → QA GREEN gate']),
      ...stagePositions
        .map((position, index) => (position < 0 ? `stage ${index + 1}` : ''))
        .filter(Boolean),
      ...redEvidence
        .map((pattern, index) =>
          pattern.test(sliceProgress) ? '' : `RED evidence ${index + 1}`,
        )
        .filter(Boolean),
      ...(canonicalValidation ? [] : ['canonical pnpm validate PASS evidence']),
    ];

    expect(
      missing,
      `Missing P2-S08-AC-050 evidence: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('[P2-S08-AC-051] aligns tracking, route posture, and the compiled specification graph', () => {
    const sliceProgress = readArtifact(paths.sliceProgress);
    const phaseProgress = readArtifact(paths.phaseProgress);
    const crossLayerArtifacts = [
      ['slice progress', sliceProgress],
      ['runbook', readArtifact(paths.runbook)],
      ['feature ledger', readArtifact(paths.featureLedger)],
      ['architecture map', readArtifact(paths.architectureMap)],
    ] as const;
    const missing = [
      ...((sliceProgress.match(/^- \[x\] \*\*P2-S08-AC-\d{3}\*\*/gmu) ?? [])
        .length === 51
        ? []
        : ['all 51 checked acceptance criteria']),
      ...(sliceProgress.match(/\*\*Status\*\*:\s*complete/iu)
        ? []
        : ['slice complete status']),
      ...(/Slice 08[\s\S]{0,180}(?:complete|51\/51)/iu.test(phaseProgress)
        ? []
        : ['phase Slice 08 completion']),
      ...crossLayerArtifacts.flatMap(([name, source]) => [
        ...activeOperations
          .filter((operation) => !source.includes(operation))
          .map((operation) => `${name}:${operation}`),
        ...deferredOperations
          .filter((operation) => !source.includes(operation))
          .map((operation) => `${name}:deferred ${operation}`),
      ]),
    ];

    const graph = readJsonArtifact(paths.specGraph);
    const graphLint = readJsonArtifact(paths.specGraphLint);
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph?.edges) ? graph.edges : [];
    const nodeIds = new Set(
      nodes.flatMap((node) =>
        node &&
        typeof node === 'object' &&
        'id' in node &&
        typeof node.id === 'string'
          ? [node.id]
          : [],
      ),
    );
    const requiredNodes = [
      'ia-spec:ia/05-platform-configuration-admin',
      'be-spec:be/05b-admin-workspace-operations',
      'fe-spec:fe/05-platform-configuration-admin',
    ];
    const graphHasFrontendDerivation = edges.some(
      (edge) =>
        edge &&
        typeof edge === 'object' &&
        edge.from === 'fe-spec:fe/05-platform-configuration-admin' &&
        edge.to === 'ia-spec:ia/05-platform-configuration-admin' &&
        edge.type === 'derives_from',
    );
    if (!graph || !graphLint)
      missing.push('compiled graph and graph-lint artifacts');
    if (!requiredNodes.every((nodeId) => nodeIds.has(nodeId))) {
      missing.push('compiled IA/BE/FE graph nodes');
    }
    if (!graphHasFrontendDerivation)
      missing.push('compiled FE → IA derivation edge');
    if (
      graph &&
      (graph.nodeCount !== nodes.length || graph.edgeCount !== edges.length)
    ) {
      missing.push('compiled graph counts');
    }

    expect(missing, `Slice 08 closeout drift: ${missing.join(', ')}`).toEqual(
      [],
    );
  });
});
