---
name: nhs-routing
description: Use when a NoHarness task arrives and you must decide which skill, package, seam, or existing mechanism owns it — before exploring. Routes by the shape of the task so the first file you read is the right one.
---

# Routing

Most wasted turns happen before the first edit: exploring the wrong subtree because the task was classified by its words rather than its shape. Route first.

## Classify the task

| The task asks to… | Route |
|---|---|
| Add or change a model-visible capability | `docs/cookbook/adding-a-tool.md` → [nhs-agent-experience](../nhs-agent-experience/SKILL.md) |
| Add or change a runtime capability | `docs/cookbook/adding-a-package.md` → [nhs-codebase-design](../nhs-codebase-design/SKILL.md) |
| Change what the model sees in a session | [nhs-session-projection](../nhs-session-projection/SKILL.md) |
| Change user-visible UI | [nhs-client-ui-ux](../nhs-client-ui-ux/SKILL.md) → [nhs-ui-antislop](../nhs-ui-antislop/SKILL.md) → [nhs-responsive-ui](../nhs-responsive-ui/SKILL.md) |
| Change a type, field, event, or persisted record | [nhs-domain-modeling](../nhs-domain-modeling/SKILL.md) → `docs/cookbook/reviewing-persistence-type-changes.md` |
| Fix a bug or a flake | [nhs-diagnosing-bugs](../nhs-diagnosing-bugs/SKILL.md) → [nhs-tdd](../nhs-tdd/SKILL.md) |
| Speed something up | [nhs-speed-up-perf](../nhs-speed-up-perf/SKILL.md) |
| Remove something | [nhs-find-simplifications](../nhs-find-simplifications/SKILL.md) → [nhs-antislop](../nhs-antislop/SKILL.md) |
| Fix a failure path | [nhs-error-handling](../nhs-error-handling/SKILL.md) |
| Write or audit docs, comments, or JSDoc | [nhs-prose-standard](../nhs-prose-standard/SKILL.md) → [nhs-doc-writing](../nhs-doc-writing/SKILL.md) → [nhs-trim-cot-leakage](../nhs-trim-cot-leakage/SKILL.md) |
| Review a diff | [nhs-code-review](../nhs-code-review/SKILL.md) → [cordis-styling-nitpicking](../cordis-styling-nitpicking/SKILL.md) |
| Change a plugin's config surface | `docs/config-catalog.md` + `pnpm run verify-config-catalog` |
| Add a test | [nhs-tdd](../nhs-tdd/SKILL.md) → [nhs-ci-test-reliability](../nhs-ci-test-reliability/SKILL.md) if it touches processes, ports, clocks, or teardown |
| Add a Remote API method or settings card | `docs/cookbook/adding-a-remote-api.md` or `docs/cookbook/adding-a-settings-card.md` |
| Add or change an LLM provider | `docs/cookbook/adding-an-llm-adapter.md` |

Two rows apply → load both, in the order listed. Three or more → stop and split the task; a change crossing three surfaces is usually two changes.

## Then narrow with one search

Before reading any file, locate the seam:

```sh
# Which package owns this concept?
grep -rl "<concept>" packages/*/*/src

# Who imports it?
grep -rl "<exported-symbol>" packages apps

# Is it already documented?
grep -rl "<concept>" docs/subsystems
```

Use the repository's grep tooling; the equivalent commands above are the shell form. The owning package is where the concept is *defined*, not where it is *used*. Start there.

## Escalation

- The concept exists in three packages with three names → [nhs-domain-modeling](../nhs-domain-modeling/SKILL.md).
- The task keeps spreading files → the seam is wrong; re-plan at the interface.
- Nothing owns the concept → confirm no extension point already fits (`docs/architecture.md#where-new-behavior-goes`) before adding a package.
- "Where does this go?" unresolved after one search → ask one question rather than reading five files.

## Do not route by keyword

A task containing "UI" is not necessarily client work (a tool's result card is a presenter), and a task containing "session" is not necessarily persistence (a projection may suffice). Route by the artifact that changes.
