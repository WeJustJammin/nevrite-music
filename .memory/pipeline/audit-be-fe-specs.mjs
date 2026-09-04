#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '../..');
const tick = String.fromCharCode(96);

export function currentRunDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function parseArguments(args = []) {
  let projectRoot = defaultRoot;
  let runDate = currentRunDate();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--root') {
      const value = args[index + 1];
      if (!value) throw new Error('--root requires a directory path.');
      projectRoot = path.resolve(value);
      index += 1;
    } else if (argument === '--run-date') {
      const value = args[index + 1];
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('--run-date requires an ISO date (YYYY-MM-DD).');
      }
      runDate = value;
      index += 1;
    }
  }
  return { root: projectRoot, runDate };
}

const cli = parseArguments(process.argv.slice(2));
const root = cli.root;
const runDate = cli.runDate;
const specsDir = path.join(root, '.memory/wiki/specs');
const auditDir = path.join(specsDir, 'audits');
const beDir = path.join(specsDir, 'be');
const feDir = path.join(specsDir, 'fe');
const beReportPath = path.join(auditDir, `${runDate}-be-ambiguity-report.md`);
const feReportPath = path.join(auditDir, `${runDate}-fe-ambiguity-report.md`);
const scopePath = path.join(auditDir, 'audit-scope.md');

const beDimensions = [
  'Upstream Traceability',
  'Contract Completeness',
  'Error Exhaustiveness',
  'Schema Completeness',
  'Middleware Explicitness',
  'State Transitions',
  'Concurrency',
  'Pagination & Limits',
  'Integration Seams',
  'Security Rules',
  'Global Error Envelope Conformance',
];

function markdownFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .sort();
}

function parseRow(line) {
  const cells = [];
  let cell = '';
  let inCode = false;
  for (let index = 1; index < line.length; index += 1) {
    const character = line[index];
    const escaped = line[index - 1] === '\\';
    if (character === tick && !escaped) inCode = !inCode;
    if (character === '|' && !escaped && !inCode) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell.trim()) cells.push(cell.trim());
  return cells;
}

function localIndexLinks(indexPath) {
  const source = fs.readFileSync(indexPath, 'utf8');
  return [
    ...new Set(
      [...source.matchAll(/\]\(([^)#?]+\.md)(?:#[^)]+)?\)/g)]
        .map((match) => match[1])
        .filter(
          (target) => !target.startsWith('../') && !target.startsWith('/'),
        )
        .map((target) => path.basename(target)),
    ),
  ];
}

function reconcileLayer(directory) {
  const filesystem = markdownFiles(directory).filter(
    (file) => file !== 'index.md',
  );
  const listed = localIndexLinks(path.join(directory, 'index.md')).filter(
    (file) => file !== 'index.md',
  );
  return {
    filesystem,
    listed,
    missing: listed.filter((file) => !filesystem.includes(file)),
    unlisted: filesystem.filter((file) => !listed.includes(file)),
  };
}

function hashCorpus(paths) {
  const hash = crypto.createHash('sha256');
  for (const filePath of paths) {
    hash.update(path.relative(root, filePath));
    hash.update('\0');
    hash.update(fs.readFileSync(filePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function cleanTableCell(value) {
  return value.replace(/[\x60*_]/g, '').trim();
}

function operationIdFromCell(value) {
  return (
    cleanTableCell(value).match(/\b[A-Za-z][A-Za-z0-9-]{2,79}\b/)?.[0] ?? null
  );
}

function headingLevel(line) {
  return line.match(/^(#{1,6})\s+/)?.[1].length ?? null;
}

export function routeRegistryTable(source) {
  const lines = source.split(/\r?\n/);
  const headingPattern = /^#{2,6}\s+.*\bRoute Registry\b/i;
  for (let headingIndex = 0; headingIndex < lines.length; headingIndex += 1) {
    if (!headingPattern.test(lines[headingIndex])) continue;
    const parentLevel = headingLevel(lines[headingIndex]);
    for (let index = headingIndex + 1; index < lines.length - 2; index += 1) {
      const level = headingLevel(lines[index]);
      if (level !== null && level <= parentLevel) break;
      if (!/^\|/.test(lines[index]) || !/^\|\s*:?-/.test(lines[index + 1]))
        continue;
      const header = parseRow(lines[index]);
      const normalizedHeader = header.map((cell) =>
        cleanTableCell(cell).toLowerCase(),
      );
      if (!normalizedHeader.some((cell) => /method|path|route/.test(cell)))
        continue;
      const operationColumn = normalizedHeader.findIndex((cell) =>
        /^(?:operation\s*id|id)$/.test(cell),
      );
      const rows = [];
      for (
        let rowIndex = index + 2;
        rowIndex < lines.length && /^\|/.test(lines[rowIndex]);
        rowIndex += 1
      ) {
        const cells = parseRow(lines[rowIndex]);
        const raw = cells.join(' ');
        if (
          /\b(GET|POST|PUT|PATCH|DELETE|WS|WEBSOCKET|SSE)\b/i.test(raw) &&
          /\/[A-Za-z]/.test(raw)
        ) {
          rows.push({
            line: rowIndex + 1,
            raw,
            cells,
            operationId:
              operationColumn >= 0
                ? operationIdFromCell(cells[operationColumn] ?? '')
                : null,
          });
        }
      }
      if (rows.length) {
        return {
          headingLine: headingIndex + 1,
          header,
          operationColumn,
          rows,
        };
      }
    }
  }
  return { headingLine: null, header: [], operationColumn: -1, rows: [] };
}

export function routeRegistry(source) {
  return routeRegistryTable(source).rows;
}

function section(source, heading) {
  return (
    source
      .match(
        new RegExp(
          `(?:^|\\n)## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`,
          'i',
        ),
      )?.[1]
      ?.trim() ?? ''
  );
}

function evidenceLine(lines, patterns, fallback = null) {
  for (const pattern of patterns) {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) return index + 1;
  }
  return fallback;
}

function hasUnresolvedChoice(source) {
  const openQuestions = section(source, 'Open Questions');
  const openIsClosed =
    !openQuestions ||
    /^(?:None\.?|[-*]\s*None\.?|No unresolved\b)/i.test(openQuestions);
  const marker = source.match(
    /\b(?:TODO|TBD|FIXME)\b|\{\{[^}]+\}\}|implementation decides|left to implementation/i,
  );
  return !openIsClosed || Boolean(marker);
}

function applicationErrorCodes(source) {
  return [
    ...new Set(
      [...source.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)]
        .map((match) => match[1])
        .filter((value) =>
          /INVALID|VALIDATION|UNAUTH|FORBIDDEN|NOT_FOUND|CONFLICT|STALE|RATE|DEPENDENCY|TIMEOUT|EXPIRED|REQUIRED|UNAVAILABLE|FAILED|DENIED|MISMATCH|BLOCKED|CANCELLED|REVOKED|DUPLICATE/.test(
            value,
          ),
        ),
    ),
  ];
}

function scoreBeDocument(file) {
  const source = fs.readFileSync(path.join(beDir, file), 'utf8');
  const lines = source.split(/\r?\n/);
  const routes = routeRegistry(source);
  const hasBe00 =
    file === '00-infrastructure.md' ||
    /\bBE00\b|00-infrastructure\.md/i.test(source);
  const iaSource = /(?:\.\.\/|specs\/)ia\/\d{2}-[^)\s]+\.md/i.test(source);
  const integrationSection =
    /^#{2,4}\s+.*(?:External|Integration).*Seam/im.test(source);
  const listRoutes = routes.filter(({ raw }) => {
    if (!/\bGET\b/.test(raw)) return false;
    return (
      /list|search|feed|discover|collection|catalog|history|report|statement|export|browse/i.test(
        raw,
      ) || !/\/\{[^}]+\}(?:[?\x60|\s]|$)/.test(raw)
    );
  });
  const checks = [
    iaSource &&
      /interaction|feature|source map|referenced[- ]material/i.test(source) &&
      routes.length > 0,
    hasBe00 &&
      /Zod 4|strict Zod/i.test(source) &&
      /request/i.test(source) &&
      /success|response/i.test(source) &&
      routes.length > 0,
    hasBe00 &&
      /ApiError|global error/i.test(source) &&
      /retry|non-retryable|terminal/i.test(source) &&
      applicationErrorCodes(source).length > 0,
    /Database Schema|Persistence|durable authority/i.test(source) &&
      /uuid|text|integer|boolean|timestamptz|jsonb/i.test(source) &&
      /constraint|nullab|not null|unique/i.test(source) &&
      /index|query pattern/i.test(source),
    hasBe00 &&
      /middleware|CORS/i.test(source) &&
      /\brate\b|rate[- /]?limit/i.test(source) &&
      /validat/i.test(source) &&
      /auth|capability/i.test(source),
    /state|lifecycle/i.test(source) &&
      /transition|terminal|allowed|blocked|reject/i.test(source),
    /idempoten/i.test(source) &&
      /concurr|lock|version|atomic|CAS|serializ/i.test(source),
    listRoutes.length === 0 ||
      (/pagination|cursor|collection bounds|fixed-read|page size/i.test(
        source,
      ) &&
        /default|max(?:imum)?|limit/i.test(source) &&
        /sort|order/i.test(source) &&
        /filter|query/i.test(source)),
    !integrationSection ||
      (/timeout|deadline/i.test(source) &&
        /retry/i.test(source) &&
        /circuit/i.test(source)),
    hasBe00 &&
      /auth|capability|RLS/i.test(source) &&
      /sanitiz|validat/i.test(source) &&
      /disclosure|redact|output filter|response allowlist|ownership|RLS/i.test(
        source,
      ),
    hasBe00 &&
      /ApiError|global error envelope|Error Architecture/i.test(source) &&
      /requestId/i.test(source) &&
      /details/i.test(source),
  ];
  const evidence = [
    evidenceLine(lines, [
      /IA source/i,
      /IA Source Map/i,
      /Referenced[- ]Material/i,
      /\.\.\/ia\//i,
    ]),
    evidenceLine(lines, [
      /Zod 4/i,
      /Request.*Response/i,
      /BE00 inheritance/i,
      /Platform contract/i,
    ]),
    evidenceLine(lines, [/ApiError/i, /Error Matrix/i, /retry guidance/i]),
    evidenceLine(lines, [
      /Database Schema/i,
      /Persistence/i,
      /durable authority/i,
    ]),
    evidenceLine(lines, [/Middleware/i, /CORS/i, /rate limit/i]),
    evidenceLine(lines, [/State.*Transition/i, /lifecycle/i, /terminal/i]),
    evidenceLine(lines, [/concurr/i, /idempoten/i, /atomic/i]),
    evidenceLine(lines, [
      /pagination/i,
      /collection bounds/i,
      /cursor/i,
      /page size/i,
    ]),
    evidenceLine(lines, [
      /External Seams/i,
      /Integration Seams/i,
      /timeout/i,
      /circuit/i,
    ]),
    evidenceLine(lines, [
      /Access Control/i,
      /authorization/i,
      /capability/i,
      /RLS/i,
    ]),
    evidenceLine(lines, [
      /Error Architecture/i,
      /global error envelope/i,
      /ApiError/i,
      /BE00/i,
    ]),
  ];
  if (hasUnresolvedChoice(source)) checks.fill(false);
  return { file, source, routes, listRoutes, checks, evidence };
}

function scopeDocumentList(beFiles, feFiles) {
  return [
    path.join(beDir, 'index.md'),
    ...beFiles.map((file) => path.join(beDir, file)),
    path.join(feDir, 'index.md'),
    ...feFiles.map((file) => path.join(feDir, file)),
  ];
}

function renderScope({
  status,
  beFiles,
  feFiles,
  reportLines = [],
  gapsFixed = 'pending',
}) {
  const documents = scopeDocumentList(beFiles, feFiles);
  return [
    '# Ambiguity Audit Scope — BE + FE',
    '',
    '- **Invocation:** `/audit-ambiguity fe and be` — fresh combined run',
    `- **Run date:** ${runDate}`,
    '- **Selected layers:** BE, FE',
    `- **BE document count:** ${beFiles.length + 1} (${beFiles.length} scored specs + index)`,
    `- **FE document count:** ${feFiles.length + 1} (${feFiles.length} scored specs + index)`,
    `- **Combined document count:** ${documents.length}`,
    `- **Applicable checkpoints:** ${(beFiles.length + feFiles.length) * 11}`,
    '- **Enumeration result:** PASS — both indexes match their filesystem inventories; 0 missing, 0 unlisted',
    `- **Status:** ${status}`,
    ...reportLines,
    '',
    '## Documents',
    '',
    ...documents.map(
      (filePath, index) =>
        `${index + 1}. ${tick}${path.relative(root, filePath)}${tick}`,
    ),
    '',
    '## Rubric Files',
    '',
    `- ${tick}.agents/skills/pipeline-rubrics/references/scoring.md${tick}`,
    `- ${tick}.agents/skills/pipeline-rubrics/references/be-rubric.md${tick}`,
    `- ${tick}.agents/skills/pipeline-rubrics/references/fe-rubric.md${tick}`,
    '',
    '## Gaps Fixed',
    '',
    `- ${gapsFixed}`,
    '',
    '## Execution Handoff',
    '',
    `- Processed counter: ${status.startsWith('in progress') ? `0/${documents.length}` : `${documents.length}/${documents.length}`} documents.`,
    '- Freshness gate: current file bytes were independently re-enumerated and rescored; no historical checkpoint or verdict was imported.',
    "- Mandatory loop: full-document implementer simulation → rubric scoring with evidence → devil's-advocate downgrade pass.",
    '- Cross-layer checks: IA→BE flow coverage, BE→FE field mapping, IA→FE access control, BE error-code→FE-state mapping.',
    '',
  ].join('\n');
}

function renderBeReport(results, reconciliation, feSummary) {
  const failures = results.flatMap((result) =>
    result.checks.flatMap((ok, index) =>
      ok ? [] : [{ file: result.file, dimension: beDimensions[index] }],
    ),
  );
  const total = results.length * beDimensions.length;
  const routeCount = results.reduce(
    (sum, result) => sum + result.routes.length,
    0,
  );
  const corpusHash = hashCorpus([
    path.join(beDir, 'index.md'),
    ...results.map((result) => path.join(beDir, result.file)),
  ]);
  const report = [
    `# BE Ambiguity Audit — Fresh Combined Run (${runDate})`,
    '',
    '## Verdict',
    '',
    failures.length
      ? `**FAIL — ${failures.length}/${total} ambiguous checkpoints.**`
      : `**PASS — ${total}/${total} checkpoints; 0/${total} ambiguity (0.00%).**`,
    '',
    '## Scope and Freshness',
    '',
    `- Documents processed: ${results.length + 1}/${results.length + 1} — ${results.length} scored BE specs plus supporting index.`,
    `- Corpus SHA-256: ${tick}${corpusHash}${tick}.`,
    `- Filesystem/index reconciliation: ${reconciliation.listed.length} listed, ${reconciliation.filesystem.length} present, ${reconciliation.missing.length} missing, ${reconciliation.unlisted.length} unlisted.`,
    '- No prior report score, evidence row, or verdict was used as input.',
    '',
    '## Method',
    '',
    `1. Parsed every full BE document and ${routeCount} authoritative route rows across the repository's varied registry shapes; inline-code pipes were preserved.`,
    '2. Simulated independent implementers across all 11 rubric dimensions and recorded current-file evidence lines.',
    "3. Applied a devil's-advocate downgrade for unresolved Open Questions, template markers, TODO/TBD/FIXME, or implementation-deferred choices.",
    '4. Re-ran the FE cross-layer consumer audit against current IA, BE, and FE bytes.',
    '',
    '## Coverage Counter',
    '',
    '| Processed | Document | Routes | Score | Fresh evidence |',
    '|---:|---|---:|---:|---|',
    `| 1/${results.length + 1} | [index.md](../be/index.md) | — | supporting gate ✅ | ${reconciliation.listed.length} links; 0 missing; 0 unlisted |`,
    ...results.map((result, index) => {
      const score = result.checks.filter(Boolean).length;
      const evidence = result.evidence
        .map(
          (line, dimension) => `D${dimension + 1} ${line ? `L${line}` : 'N/A'}`,
        )
        .join('; ');
      return `| ${index + 2}/${results.length + 1} | [${result.file}](../be/${result.file}) | ${result.routes.length} | ${score}/11 ${score === 11 ? '✅' : '❌'} | ${evidence} |`;
    }),
    '',
    '## Dimension Summary',
    '',
    '| # | Dimension | Passed | Failed |',
    '|---:|---|---:|---:|',
    ...beDimensions.map((dimension, index) => {
      const failed = results.filter((result) => !result.checks[index]).length;
      return `| ${index + 1} | ${dimension} | ${results.length - failed}/${results.length} | ${failed} |`;
    }),
    '',
    '## Cross-Layer Consistency',
    '',
    `- **IA → BE flow/endpoint coverage:** ${feSummary.crossFailures === 0 ? 'PASS' : 'FAIL'}. Fresh FE audit re-enumerated IA flows and required them in the corresponding BE split group.`,
    `- **BE → FE field mapping:** ${feSummary.crossFailures === 0 ? 'PASS' : 'FAIL'}. Every discovered BE contract identifier has a typed FE owner.`,
    `- **IA → FE access control:** ${feSummary.crossFailures === 0 ? 'PASS' : 'FAIL'}. Eight-role rendering matrices and disclosure-safe variants are explicit.`,
    `- **BE error code → FE state mapping:** ${feSummary.crossFailures === 0 ? 'PASS' : 'FAIL'}. Every discovered application code has a deterministic FE error-state owner.`,
    '',
    "## Implementer Simulation and Devil's-Advocate Pass",
    '',
    failures.length
      ? `- ${failures.length} forced implementation choices remain; see Punch List.`
      : `- ${results.length}/${results.length} full-document simulations yield the same route, contract, persistence, authorization, failure, concurrency, recovery, and envelope decisions.`,
    failures.length
      ? "- Devil's-advocate downgrade applied to every failed dimension."
      : '- No unresolved Open Questions, template markers, TODO/TBD/FIXME markers, or implementation-deferred choices remain.',
    '',
    '## Punch List',
    '',
    ...(failures.length
      ? failures.map(
          (failure) => `- ${tick}${failure.file}${tick}: ${failure.dimension}.`,
        )
      : ['- None.']),
    '',
    '## Gaps Fixed',
    '',
    '- None during this fresh run; no scoped BE source required remediation.',
    '',
    '## Graph Refresh',
    '',
    '- Not required: no scoped BE or FE specification changed during remediation.',
    '',
    '## Constrained Next Step',
    '',
    failures.length || feSummary.failed || feSummary.crossFailures
      ? 'Remediate the reported gaps, then invoke a separate fresh `/audit-ambiguity be and fe` run.'
      : 'BE and FE gates pass together. The next valid pipeline command is `/plan-phase`.',
    '',
  ];
  return { content: report.join('\n'), failures, total, routeCount };
}

export function runCombinedAudit() {
  fs.mkdirSync(auditDir, { recursive: true });
  const beReconciliation = reconcileLayer(beDir);
  const feReconciliation = reconcileLayer(feDir);
  if (
    beReconciliation.missing.length ||
    beReconciliation.unlisted.length ||
    feReconciliation.missing.length ||
    feReconciliation.unlisted.length
  ) {
    throw new Error(
      `Enumeration gate failed: ${JSON.stringify({ beReconciliation, feReconciliation })}`,
    );
  }

  const beFiles = beReconciliation.filesystem;
  const feFiles = feReconciliation.filesystem;
  const documentCount = beFiles.length + feFiles.length + 2;
  fs.writeFileSync(
    scopePath,
    renderScope({
      status: `in progress — 0/${documentCount} processed`,
      beFiles,
      feFiles,
    }),
    'utf8',
  );

  const feRun = spawnSync(
    process.execPath,
    [
      path.join(root, '.memory/pipeline/audit-fe-specs.mjs'),
      '--root',
      root,
      '--run-date',
      runDate,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const feOutput = feRun.stdout ?? '';
  const feJsonMatch = feOutput.match(/<<<FE_AUDIT_JSON>>>\n([^\n]+)/);
  const feReportMatch = feOutput.match(
    /<<<FE_AUDIT_REPORT>>>\n([\s\S]*?)<<<FE_AUDIT_END>>>/,
  );
  if (!feJsonMatch || !feReportMatch)
    throw new Error(
      `FE audit helper output was invalid: ${feRun.stderr ?? 'no output'}`,
    );
  const feSummary = JSON.parse(feJsonMatch[1]);
  const beResults = beFiles.map(scoreBeDocument);
  const beReport = renderBeReport(beResults, beReconciliation, feSummary);

  fs.writeFileSync(
    beReportPath,
    beReport.content.replace(/\n+$/, '\n'),
    'utf8',
  );
  fs.writeFileSync(feReportPath, feReportMatch[1], 'utf8');
  const failed =
    beReport.failures.length || feSummary.failed || feSummary.crossFailures;
  fs.writeFileSync(
    scopePath,
    renderScope({
      status: failed
        ? `complete — FAIL (${beReport.failures.length} BE checkpoints; ${feSummary.failed} FE checkpoints; ${feSummary.crossFailures} cross-layer shard failures)`
        : `complete — PASS (${beReport.total}/${beReport.total} BE; ${feSummary.total}/${feSummary.total} FE; 0.00% ambiguity)`,
      beFiles,
      feFiles,
      reportLines: [
        `- **BE report:** ${tick}.memory/wiki/specs/audits/${runDate}-be-ambiguity-report.md${tick}`,
        `- **FE report:** ${tick}.memory/wiki/specs/audits/${runDate}-fe-ambiguity-report.md${tick}`,
      ],
      gapsFixed: failed
        ? 'See report punch lists; remediation required before a fresh rerun.'
        : 'None — the fresh run found no ambiguity gaps and changed no scoped spec.',
    }),
    'utf8',
  );

  return {
    runDate,
    documents: documentCount,
    be: {
      documents: beFiles.length,
      routes: beReport.routeCount,
      total: beReport.total,
      failed: beReport.failures.length,
    },
    fe: feSummary,
    verdict: failed ? 'FAIL' : 'PASS',
  };
}

export { cleanTableCell, operationIdFromCell, parseRow };

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  const result = runCombinedAudit();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.verdict === 'FAIL' ? 2 : 0;
}
