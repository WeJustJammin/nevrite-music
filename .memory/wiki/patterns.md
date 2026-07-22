# Patterns

## Summary

- **Total patterns**: 6
- **Unique pattern titles**: 6

## PAT-001: Verify a generated claim against the kit's own reference before propagating it (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When a subagent, workflow, or generated artifact asserts a consequence that would change a locked pipeline decision.
- **Pattern**: A multi-agent sweep's synthesis asserted that adding a fan audience "changes the classification to multi-surface". Checking `prd-templates/references/surface-model.md` showed this was false — a **surface is a deployment target** (web/mobile/desktop/cli/api/extension), **not an audience**. Fans and professionals on one Astro web app remain `single-surface`; the fan is a *persona*, and the real consequence is an expanded Role Matrix, not a folder-layout change. Had this propagated, it would have restructured the entire ideation tree on a false premise. **Always verify a generated claim against the kit reference that owns the concept before acting on it.**
- **Source**: Sweep synthesis (`wf_253689b4-284`) conflating audience with surface; caught pre-seeding. Logged as D-12 in the ideation index.

## PAT-002: Check the actual blocker before answering with the policy reason (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Type**: anti-pattern
- **Confidence**: 0.5
- **Context**: When a user asks "why haven't you done X?"
- **Pattern**: Asked why the repo wasn't initialized, the agent answered "because you hadn't asked me to" (true, and the standing rule). But the *actual* blocker was that **no git identity was configured at all** — `user.name`/`user.email` were unset globally and locally, so any commit would have failed regardless. The policy answer was correct but incomplete, and stating it first framed the situation as a permission question when it was a configuration question. **Check the mechanical state before reaching for the policy explanation** — the user is usually asking about the world, not about the rules.
- **Source**: User asked "why havent you initiated the repository"; correction self-identified after inspecting `git config`.

## PAT-003: A verification pass that refutes nothing is a signal, not a success (2026-07-16)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-16T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate
- **Index**: [[index]]

- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When running adversarial verification over generated candidates.
- **Pattern**: 24 of 24 candidate domains survived 3× adversarial verification with **zero majority-refutations**. A 100% survival rate is evidence about the *verifiers* as much as the candidates — it may mean the map was strong, or that the refute-prompts were too weak to bite. Mitigating evidence mattered: the adversaries *did* alter the map (21 demotions, boundary narrowing on domains 01/03/08), which shows they engaged rather than rubber-stamped. **Report the zero-refutation rate as a caution flag rather than as validation**, and hand the hypothesis forward (logged as D-17 for `/audit-ambiguity ideation` to treat domain-count inflation as live).
- **Source**: Workflow `wf_253689b4-284` — 88 agents, 1,545 concepts, 24/24 survived.

## PAT-004: Recover pipeline state from the tree before rerunning a staged workflow (2026-07-19)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-19T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Type**: best-practice
- **Confidence**: 0.5
- **Context**: After a workflow interruption, stale status report, or lost background-agent completion signal.
- **Pattern**: Before restarting a stage, inspect the canonical index, actual folder tree, counts, completed decision ledger, and session records. An interrupted WeJammin recovery appeared to need extract-shard seeding, but ground-truth inspection showed the authoritative tree already contained 24 domains, 165 sub-domains, 734 feature leaves, 1,120 ideation files, complete CX synthesis, and an 8/8 ideation rubric. **Recover and reconcile evidence; never reseed, replace, or cascade based only on a workflow's stale apparent state.**
- **Source**: Ideation recovery/reconciliation, 2026-07-19; documented in DEC-013 / D-35.

## PAT-005: Do not conflate a validation-gate decision with validation completion (2026-07-21)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-21T12:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Type**: anti-pattern
- **Confidence**: 0.6
- **Context**: A product owner selects a validation-first policy for a source contract whose required evidence has not yet been collected.
- **Pattern**: Record the gate, its evidence requirements, and immutable boundaries immediately, but retain the canonical finding as unresolved until required traces, mismatch dispositions, pass/fail result, and explicit approval exist — *unless* the finding's own text was about the policy rather than the evidence, in which case closing on the policy is correct and the evidence becomes tracked implementation work (see DEC-047, and the A-03/A-04 precedent). Do not advance counts, lifecycle contracts, enums, or downstream implementation from a candidate merely because the validation procedure was approved.
- **Source**: P-01 production-stage vocabulary reconciliation and independent re-audit: the owner selected Option B, and the packet's beatmaker/session-player trace register and approved enum version remain pending even after the finding closed on its policy.

## PAT-006: Never hand-author a derived file, and read a build script before running it (2026-07-22)

- **Occurrences**: 1
- **Latest timestamp**: 2026-07-22T16:00:00.000Z
- **Agents**: claude
- **Sources**: ideate-validate
- **Index**: [[index]]

- **Type**: anti-pattern
- **Confidence**: 0.7
- **Context**: Any repository where some files are generated from a source of truth — here, `.memory/wiki/{decisions,patterns,blockers}.md` are **derived** by `.memory/pipeline/compile.mjs` from `.memory/raw/{events,sessions}/*.jsonl`.
- **Pattern**: Two failures compounded into real data loss on 2026-07-22.
  (1) **Writing to the derived file instead of the source.** Thirty-nine decisions, two patterns and one blocker were hand-authored directly into `wiki/*.md` over several sessions. They looked durable and were not — nothing linked them to `raw/`, so they existed only until the next compile.
  (2) **Running a build command without reading it.** `node .memory/pipeline/compile.mjs` was run against 1,100+ uncommitted files on the assumption it *derived* a graph. It also **overwrites** all three wiki files from `raw/`, which was empty. The three files were regenerated as empty stubs and every hand-authored entry was gone.
  The rules: **write to the source, never the artifact** — use `flushEntry()` from `.memory/pipeline/flush.mjs`, then compile. And **read a script before running it**, especially before a command whose name suggests it only generates. "Derived" in a README is a *warning*, not a description. Commit first when a large working tree is uncommitted.
- **Source**: 2026-07-22 — self-inflicted, disclosed immediately, recovered by reconstructing DEC-009–047 / PAT-004–005 / BLOCKER-004 as raw records. Also drove the correction of `.claude/rules/memory-capture.md`, which had instructed exactly the failing write path.

## Full Log

### PAT-001: Verify a generated claim against the kit's own reference before propagating it (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: pattern, ideation, recovered

- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When a subagent, workflow, or generated artifact asserts a consequence that would change a locked pipeline decision.
- **Pattern**: A multi-agent sweep's synthesis asserted that adding a fan audience "changes the classification to multi-surface". Checking `prd-templates/references/surface-model.md` showed this was false — a **surface is a deployment target** (web/mobile/desktop/cli/api/extension), **not an audience**. Fans and professionals on one Astro web app remain `single-surface`; the fan is a *persona*, and the real consequence is an expanded Role Matrix, not a folder-layout change. Had this propagated, it would have restructured the entire ideation tree on a false premise. **Always verify a generated claim against the kit reference that owns the concept before acting on it.**
- **Source**: Sweep synthesis (`wf_253689b4-284`) conflating audience with surface; caught pre-seeding. Logged as D-12 in the ideation index.

### PAT-002: Check the actual blocker before answering with the policy reason (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: pattern, ideation, recovered

- **Type**: anti-pattern
- **Confidence**: 0.5
- **Context**: When a user asks "why haven't you done X?"
- **Pattern**: Asked why the repo wasn't initialized, the agent answered "because you hadn't asked me to" (true, and the standing rule). But the *actual* blocker was that **no git identity was configured at all** — `user.name`/`user.email` were unset globally and locally, so any commit would have failed regardless. The policy answer was correct but incomplete, and stating it first framed the situation as a permission question when it was a configuration question. **Check the mechanical state before reaching for the policy explanation** — the user is usually asking about the world, not about the rules.
- **Source**: User asked "why havent you initiated the repository"; correction self-identified after inspecting `git config`.

### PAT-003: A verification pass that refutes nothing is a signal, not a success (2026-07-16)

- **Timestamp**: 2026-07-16T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate
- **Tags**: pattern, ideation, recovered

- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When running adversarial verification over generated candidates.
- **Pattern**: 24 of 24 candidate domains survived 3× adversarial verification with **zero majority-refutations**. A 100% survival rate is evidence about the *verifiers* as much as the candidates — it may mean the map was strong, or that the refute-prompts were too weak to bite. Mitigating evidence mattered: the adversaries *did* alter the map (21 demotions, boundary narrowing on domains 01/03/08), which shows they engaged rather than rubber-stamped. **Report the zero-refutation rate as a caution flag rather than as validation**, and hand the hypothesis forward (logged as D-17 for `/audit-ambiguity ideation` to treat domain-count inflation as live).
- **Source**: Workflow `wf_253689b4-284` — 88 agents, 1,545 concepts, 24/24 survived.

### PAT-004: Recover pipeline state from the tree before rerunning a staged workflow (2026-07-19)

- **Timestamp**: 2026-07-19T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: pattern, ideation, recovered

- **Type**: best-practice
- **Confidence**: 0.5
- **Context**: After a workflow interruption, stale status report, or lost background-agent completion signal.
- **Pattern**: Before restarting a stage, inspect the canonical index, actual folder tree, counts, completed decision ledger, and session records. An interrupted WeJammin recovery appeared to need extract-shard seeding, but ground-truth inspection showed the authoritative tree already contained 24 domains, 165 sub-domains, 734 feature leaves, 1,120 ideation files, complete CX synthesis, and an 8/8 ideation rubric. **Recover and reconcile evidence; never reseed, replace, or cascade based only on a workflow's stale apparent state.**
- **Source**: Ideation recovery/reconciliation, 2026-07-19; documented in DEC-013 / D-35.

### PAT-005: Do not conflate a validation-gate decision with validation completion (2026-07-21)

- **Timestamp**: 2026-07-21T12:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: pattern, ideation, recovered

- **Type**: anti-pattern
- **Confidence**: 0.6
- **Context**: A product owner selects a validation-first policy for a source contract whose required evidence has not yet been collected.
- **Pattern**: Record the gate, its evidence requirements, and immutable boundaries immediately, but retain the canonical finding as unresolved until required traces, mismatch dispositions, pass/fail result, and explicit approval exist — *unless* the finding's own text was about the policy rather than the evidence, in which case closing on the policy is correct and the evidence becomes tracked implementation work (see DEC-047, and the A-03/A-04 precedent). Do not advance counts, lifecycle contracts, enums, or downstream implementation from a candidate merely because the validation procedure was approved.
- **Source**: P-01 production-stage vocabulary reconciliation and independent re-audit: the owner selected Option B, and the packet's beatmaker/session-player trace register and approved enum version remain pending even after the finding closed on its policy.

### PAT-006: Never hand-author a derived file, and read a build script before running it (2026-07-22)

- **Timestamp**: 2026-07-22T16:00:00.000Z
- **Agent**: claude
- **Source**: ideate-validate
- **Tags**: pattern, memory, tooling, anti-pattern

- **Type**: anti-pattern
- **Confidence**: 0.7
- **Context**: Any repository where some files are generated from a source of truth — here, `.memory/wiki/{decisions,patterns,blockers}.md` are **derived** by `.memory/pipeline/compile.mjs` from `.memory/raw/{events,sessions}/*.jsonl`.
- **Pattern**: Two failures compounded into real data loss on 2026-07-22.
  (1) **Writing to the derived file instead of the source.** Thirty-nine decisions, two patterns and one blocker were hand-authored directly into `wiki/*.md` over several sessions. They looked durable and were not — nothing linked them to `raw/`, so they existed only until the next compile.
  (2) **Running a build command without reading it.** `node .memory/pipeline/compile.mjs` was run against 1,100+ uncommitted files on the assumption it *derived* a graph. It also **overwrites** all three wiki files from `raw/`, which was empty. The three files were regenerated as empty stubs and every hand-authored entry was gone.
  The rules: **write to the source, never the artifact** — use `flushEntry()` from `.memory/pipeline/flush.mjs`, then compile. And **read a script before running it**, especially before a command whose name suggests it only generates. "Derived" in a README is a *warning*, not a description. Commit first when a large working tree is uncommitted.
- **Source**: 2026-07-22 — self-inflicted, disclosed immediately, recovered by reconstructing DEC-009–047 / PAT-004–005 / BLOCKER-004 as raw records. Also drove the correction of `.claude/rules/memory-capture.md`, which had instructed exactly the failing write path.
