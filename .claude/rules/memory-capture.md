---
description: Patterns, decisions, and blockers written to memory every conversation — empty memory files mean the pipeline never learns
trigger: always_on
---

# Memory Capture

> Every conversation that involves a decision, correction, surprise, or blocker MUST record it before the conversation ends. Empty memory files mean the pipeline never learns.

## The Problem

The pipeline needs shared memory that survives across runtimes. The canonical project memory lives in `.memory/`. This rule enforces writing to that shared memory instead of letting learning fragment across runtime-local silos.

## ⚠️ Write to the source, never the artifact

`.memory/wiki/patterns.md`, `.memory/wiki/decisions.md`, and `.memory/wiki/blockers.md` are **derived files**. `.memory/pipeline/compile.mjs` regenerates all three from scratch out of `.memory/raw/{events,sessions}/*.jsonl` — anything hand-written into them is silently destroyed on the next compile, and compile runs from the session-end hook.

**Never edit those three files directly.** Append a raw record instead:

```js
import { flushEntry } from "./.memory/pipeline/flush.mjs";

flushEntry({
  id: "dec-048",                                  // lowercase canonical id
  agent: "claude",
  source: "<workflow that produced it>",
  type: "decision",                               // decision | pattern | blocker
  title: "DEC-048: [summary] (YYYY-MM-DD)",       // heading text in the derived file
  text: "- **Problem**: …",                       // body, in the format below
  tags: ["decision"],
  metadata: { canonicalId: "DEC-048" },
});
```

Then run `node .memory/pipeline/compile.mjs` to regenerate the wiki files and the spec graph. See PAT-006 — a full session of hand-authored entries was lost this way.

## When to Write

| Trigger | What Happened | Record `type` | Format |
|---------|---------------|---------------|--------|
| User corrects me | "No, that's wrong" / "Don't do that" / "I told you to..." | `pattern` | Anti-pattern (PAT-NNN) |
| User says "remember this" | Explicit instruction to retain information | `decision` | Decision (DEC-NNN) |
| Non-trivial decision made | Choice with ripple effects (see Protocol 06 triage) | `decision` | Decision (DEC-NNN) |
| Something blocks progress | External dependency, missing spec, tooling failure | `blocker` | Blocker (BLOCKER-NNN) |
| Pattern emerges | Something works well or fails repeatedly | `pattern` | Pattern (PAT-NNN) |

## How to Write

Each format below is the `text` body of a raw record — not something you type into a wiki file.

### Patterns (`type: "pattern"`)

```markdown
### PAT-NNN: [Short description] (YYYY-MM-DD)
- **Type**: best-practice | anti-pattern
- **Confidence**: 0.5 (first occurrence) — increment by 0.1 on reuse, max 0.95
- **Context**: When/where this applies
- **Pattern**: What to do (or avoid)
- **Source**: What triggered this entry
```

### Decisions (`type: "decision"`)

```markdown
### DEC-NNN: [Decision summary] (YYYY-MM-DD)
- **Problem**: What needed deciding
- **Options considered**: At least 2
- **Decision**: What was chosen and why
- **Downstream**: What this affects
- **Reversibility**: High | Medium | Low
```

### Blockers (`type: "blocker"`)

```markdown
### BLOCKER-NNN: [Description] (YYYY-MM-DD)
- **Status**: active | resolved
- **Impact**: What this blocks
- **Resolution**: How it was resolved (if resolved)
```

## When NOT to Write

- Routine/trivial tasks with nothing new learned — skip
- Isolated implementation decisions (variable names, file paths) — skip
- Repeating an existing pattern already logged — update confidence instead

## Native Memory Sync (Claude Code)

When running in Claude Code, memory capture is dual-write:

1. Write the CFSA entry to the unified project memory as a **raw record** via `flushEntry()` (or through the shared memory MCP tools when available), then compile — never by editing the derived wiki files
2. Evaluate native-memory relevance and sync to Claude native memory store:
   - User correction/preference → `feedback`
   - User-specific preference/profile signal → `user`
   - Project decision/blocker context with downstream impact → `project`
   - External system pointer/where-to-look info → `reference`

If a trigger requires CFSA logging and native-memory relevance, both writes are required in the same conversation.

## Pre-Completion Check

Before calling `notify_user` to report completion of ANY workflow or substantial task:

1. **Scan this conversation** for triggers in the table above
2. **If triggers found** → flush raw records to `.memory/raw/*`, compile, and sync relevant items to native memory
3. **If no triggers** → explicitly confirm: "No new patterns, decisions, or blockers to log"

This check is **not skippable**. It applies to every pipeline stage, every conversation, every session.
