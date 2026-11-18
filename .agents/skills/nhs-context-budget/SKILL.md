---
name: nhs-context-budget
description: Use when reading files, exploring a package, or assembling a subagent brief in NoHarness, and whenever your context is filling with content you did not need. Keeps the working set small so the reasoning that matters stays affordable.
---

# Context budget

Context is the scarcest resource in a NoHarness task: the repository holds thousands of source files across hundreds of packages, and no single task needs more than a few thousand lines of them. The failure mode is not running out of window — it is filling the window with content that displaces the thing you were reasoning about.

## Read in this order

1. **The pointer.** The owning package README's Summary and Model Experience sections. Three paragraphs that say what the package is for and what the model sees.
2. **The seam.** The exported types and the service definition — not the implementation.
3. **The consumer.** The one call site that resembles your task.
4. **The test.** The owning spec shows the contract in executable form, often faster than the implementation.
5. **The implementation.** Only the function your task changes, with `offset`/`limit`.
6. **Broad reads.** Last resort. A whole-file read of a 1000-line module for a 10-line edit is five times the cost for none of the certainty.

## Read with a target

Before every read, state what fact you are looking for. If you cannot name it in one sentence, the read is exploration, and exploration belongs behind a `grep` that names a symbol.

```
Bad:   read packages/session/session/src/index.ts end to end
Good:  grep "export function .*Turn" in that file, then read the matched range
```

## What not to load

- **Vendored source** (`vendor/`) unless the task is about the vendor boundary itself.
- **Generated catalogs** (`docs/*-catalog.md`, `docs/module-graph.md`) — they are exhaustive by design. Search them; do not read them.
- **Archived Agent Notes** — frozen history, never current authority. A current note supersedes them.
- **The full gate list** — `package.json` scripts is a menu, not a checklist ([nhs-pre-push-checks](../nhs-pre-push-checks/SKILL.md) picks the two that matter).
- **Sibling packages "for style."** The convention is in `AGENTS.md` and `packages/AGENTS.md`. Reading a neighbour to infer it is slower and less reliable.

## Compressing what you keep

When a file matters beyond one use, keep the fact, not the text:

> `ctx.skills` merges provider catalogs into one ranked list; a duplicate skill name resolves to the lower `rank` value. (`packages/skill/skill/src/index.ts`)

One line that survives compaction beats twenty lines that do not.

## Delegation as a budget tool

A subagent has its own window. Delegate when:

- The subtask needs reading that you would not otherwise do (a survey across 40 packages).
- The subtask's output is a conclusion, not files (an audit, a search, a comparison).
- The work is self-contained enough to state a brief without re-explaining your whole context.

Do not delegate when the subtask needs your accumulated context to judge — the brief becomes longer than the work.

## Signs you are over budget

- Re-reading a file you already read this turn.
- Reading tests to discover behavior you could have asked the type about.
- Explaining the repository to yourself in prose.
- Carrying three candidate approaches because you never confirmed which seam owns the change.

Each one is a prompt to stop reading and write the three-line plan ([nhs-fast-lane](../nhs-fast-lane/SKILL.md)).
