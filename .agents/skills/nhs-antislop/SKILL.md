---
name: nhs-antislop
description: Use when writing or reviewing code that an AI produced, when a diff feels plausible but hollow, or before reporting a change complete. Detects and removes AI slop in NoHarness: speculative abstraction, defensive padding, tests that assert nothing, comments that narrate, dead options, and fake completion.
---

# Anti-slop

Slop is plausible code that no one needs. It compiles, it has tests, it reads like the surrounding file — and it carries no behavior anyone asked for. It survives review because it looks thorough. Thoroughness is the disguise, so review the *necessity* of each hunk, not its style.

## The seven tells

| Tell | What it looks like in NHS | The test |
|---|---|---|
| **Speculative generality** | A `Config` field with one value, a `strategy` parameter with one implementation, a `kind` discriminator with one member. | Name the second caller. If you cannot, delete it. |
| **Defensive padding** | `?? default` inside `run()` for a value the type already requires; try/catch around a call that cannot throw; validation of a same-process typed value. | Which boundary is this? If it is not parser, config, queued, model/tool JSON, durable, worker, process, or wire — remove it. |
| **Narrating comments** | `// Initialize the counter`, `// Now we loop through items`, block headers that restate the function name. | Read the next line. If the comment repeats it, delete the comment. |
| **Hollow tests** | A test that constructs, calls, and asserts `toBeDefined`, or mocks the thing under test, or passes for the wrong reason. | Break the implementation. Does the test go red? If not, the test is theater. |
| **Dead surface** | An exported helper with no consumer, a re-export nobody imports, an option nobody sets. | `grep` every symbol you added. Zero consumers = delete. |
| **Fake completion** | "Done", "implemented", "tests pass" when nothing ran. | Report the command output verbatim. Ran nothing → say nothing about passing. |
| **Ceremony framing** | Restating the plan in code structure, numbered section comments, a README paragraph for a 20-line module. | Cut until the structure matches the actual difficulty of the problem. |

## The subtraction pass

Before reporting complete, walk your own diff and for each added line ask one of: _does removing this break a named requirement or a test I can point at?_ Lines with no answer are candidates. Delete until every remaining line has an answer.

This is not minimalism for its own sake. A line kept without justification is a line the next maintainer must read, the next refactor must preserve, and the coverage gate must cover. Delete it.

## What is never slop

Do not delete these while subtracting — they look like padding and are not:

- Validation at a real boundary, even when the type "guarantees" the value.
- Error handling on a path that can lose user data or leave unknown state.
- A disposer, cancellation path, or teardown step.
- Security checks, including ones that appear redundant with an earlier layer.
- Accessibility: labels, focus management, keyboard paths, ARIA only where native semantics cannot express it.
- An explicit requirement you find inconvenient.

Slop is unneeded work. Those are needed work that happens to be inconvenient.

## NoHarness-specific slop traps

- **`ctx.<service>` for an optional service.** Use `ctx.get(name)`; the proxy is topology-sensitive. Reach for the declaration first.
- **A module-level cache, `globalThis` handoff, or new `current` singleton** to avoid threading a parameter. Shared state needs an owner ([packages/AGENTS.md](../../../packages/AGENTS.md)).
- **An invalid `@ts-expect-error`, or a new `as unknown` cast**, where a typed value or validation belongs.
- **A package made to hold three functions** that could live in an existing owner.
- **A snapshot updated without reading it.** Updating the expected output to match broken behavior is the highest-cost slop in this repo.
- **A second helper next to an existing one** because the first took a parameter you did not want to thread.

## Tells that are authoritative elsewhere

Some patterns are enforced by a gate or owned by another skill. This skill only flags them; follow the owner rather than improvising a fix:

| Pattern | Owner |
|---|---|
| Empty `catch` without a named error | `pnpm run verify-empty-catch` |
| Hedge or change-narration prose in comments, JSDoc, notes | [nhs-trim-cot-leakage](../nhs-trim-cot-leakage/SKILL.md) |
| Overlong or restated prose | [nhs-prose-standard](../nhs-prose-standard/SKILL.md) |
| Dead or duplicated surface at package scale | [nhs-find-simplifications](../nhs-find-simplifications/SKILL.md) |


## Reporting

State what you removed and what you kept *with its reason*. A subtraction pass with no removals means either the diff was already tight or the pass did not happen; say which.
