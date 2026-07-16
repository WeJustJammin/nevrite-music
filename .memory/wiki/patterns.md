# Patterns

## Summary

- **Total patterns**: 3
- **Unique pattern titles**: 3
- **Best practices**: 2 | **Anti-patterns**: 1

## Full Log

### PAT-001: Verify a generated claim against the kit's own reference before propagating it (2026-07-16)
- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When a subagent, workflow, or generated artifact asserts a consequence that would change a locked pipeline decision.
- **Pattern**: A multi-agent sweep's synthesis asserted that adding a fan audience "changes the classification to multi-surface". Checking `prd-templates/references/surface-model.md` showed this was false — a **surface is a deployment target** (web/mobile/desktop/cli/api/extension), **not an audience**. Fans and professionals on one Astro web app remain `single-surface`; the fan is a *persona*, and the real consequence is an expanded Role Matrix, not a folder-layout change. Had this propagated, it would have restructured the entire ideation tree on a false premise. **Always verify a generated claim against the kit reference that owns the concept before acting on it.**
- **Source**: Sweep synthesis (`wf_253689b4-284`) conflating audience with surface; caught pre-seeding. Logged as D-12 in the ideation index.

### PAT-002: Check the actual blocker before answering with the policy reason (2026-07-16)
- **Type**: anti-pattern
- **Confidence**: 0.5
- **Context**: When a user asks "why haven't you done X?"
- **Pattern**: Asked why the repo wasn't initialized, the agent answered "because you hadn't asked me to" (true, and the standing rule). But the *actual* blocker was that **no git identity was configured at all** — `user.name`/`user.email` were unset globally and locally, so any commit would have failed regardless. The policy answer was correct but incomplete, and stating it first framed the situation as a permission question when it was a configuration question. **Check the mechanical state before reaching for the policy explanation** — the user is usually asking about the world, not about the rules.
- **Source**: User asked "why havent you initiated the repository"; correction self-identified after inspecting `git config`.

### PAT-003: A verification pass that refutes nothing is a signal, not a success (2026-07-16)
- **Type**: best-practice
- **Confidence**: 0.6
- **Context**: When running adversarial verification over generated candidates.
- **Pattern**: 24 of 24 candidate domains survived 3× adversarial verification with **zero majority-refutations**. A 100% survival rate is evidence about the *verifiers* as much as the candidates — it may mean the map was strong, or that the refute-prompts were too weak to bite. Mitigating evidence mattered: the adversaries *did* alter the map (21 demotions, boundary narrowing on domains 01/03/08), which shows they engaged rather than rubber-stamped. **Report the zero-refutation rate as a caution flag rather than as validation**, and hand the hypothesis forward (logged as D-17 for `/audit-ambiguity ideation` to treat domain-count inflation as live).
- **Source**: Workflow `wf_253689b4-284` — 88 agents, 1,545 concepts, 24/24 survived.
