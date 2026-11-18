---
name: nhs-code-review
description: Use when reviewing a diff, a branch, or a PR in NoHarness, before merging, or when asked for a code review. Reviews two axes in parallel sub-agents: Standards (AGENTS.md and repo gates) and Spec (does it implement the originating issue or plan).
---

Build both axes from judgment, not from a second opinion. A review's job is to find the defect that would reach a user; two sub-agents reading the same diff spend minutes to duplicate what one careful pass finds. Spawn them only when the user asks for a deep audit or the diff is genuinely cross-cutting.

# Code review

Two-axis review of the diff between `HEAD` and a fixed point:

- **Standards**: does the code follow the repo's documented rules?
- **Spec**: does it implement the originating issue, plan, or request?

Run both axes as parallel sub-agents with fresh context so neither pollutes the other, then aggregate. Deep audits only; a routine review runs the two axes sequentially against the diff without spawning anything. Do not merge or rerank their findings.

## 1. Pin the fixed point

Take the ref the user named. If none, ask. Record `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`.

## 2. Find the spec source

In order: issue references in commit messages (`#123`, `Closes #45`); a path the user passed; a plan in the project knowledge panel or a note under `.agents/notes/`; the conversation itself. If there is none, the Spec axis reports "no spec available".

## 3. Standards sources

Always include:

- `AGENTS.md`, `packages/AGENTS.md`, `packages/client/AGENTS.md`, `docs/AGENTS.md`.
- `docs/defensive-patterns/README.md` for surface, lifecycle, concurrency, and teardown changes.
- `docs/architecture.md` for loop and extension-point changes.
- The skill for the area: `nhs-error-handling`, `nhs-session-projection`, `nhs-client-ui-ux`, `nhs-prose-standard`, `nhs-pr-description`.

Then the smell baseline below, which applies even where the repo documents nothing. **The repo overrides**: a documented standard wins over a baseline smell. Every smell is a labelled heuristic ("possible Feature Envy"), never a hard violation and never reporting what a gate already enforces.

- **Mysterious Name**: a name that does not reveal what a function, variable, or type does. → rename; if no honest name comes, the design is murky.
- **Duplicated Code**: the same logic shape in more than one hunk or file. → extract it and call it from both.
- **Feature Envy**: a method reaching into another object's data more than its own. → move it onto the data it envies.
- **Data Clumps**: the same few fields or parameters always travelling together. → bundle them into one type.
- **Primitive Obsession**: a primitive standing in for a domain concept; NHS requires branded ids across boundaries. → give the concept its own type.
- **Repeated Switches**: the same switch or if-cascade on the same type recurs. → polymorphism, or one shared map. Closed unions end in `assertNever`.
- **Shotgun Surgery**: one logical change forcing scattered edits. → gather what changes together.
- **Divergent Change**: one module edited for several unrelated reasons. → split by reason.
- **Speculative Generality**: abstraction or hooks for needs the spec does not have. → delete it.
- **Message Chains**: long `a.b().c().d()` navigation the caller should not depend on. → hide the walk behind one method.
- **Middle Man**: a module that mostly delegates. → cut it; apply the deletion test.
- **Refused Bequest**: a subclass or implementer overriding most of what it inherits. → composition instead.

## 4. Run both axes

Deep audit: run the two sub-agents in one message so they execute in parallel. Routine review: run the same two briefs yourself, Standards before Spec, and keep the findings separate.

**Standards review**: apply the standards sources and the smell baseline. For each file and hunk, report (a) every place the diff violates a documented standard, citing the standard's file and rule, and (b) any baseline smell, naming it and quoting the hunk. Distinguish hard violations from judgement calls; a documented standard overrides the baseline. Skip what tooling enforces.

**Spec review**: report (a) requirements the spec asked for that are missing or partial, (b) behaviour in the diff the spec did not ask for, (c) requirements that look implemented but are wrong. Quote the spec line for each finding.

Skip the Spec axis and note it when there is no spec. Keep each axis under 400 words.

## 5. Aggregate

Present the reports under `## Standards` and `## Spec`, lightly cleaned. End with one line: findings per axis, and the worst issue within each axis. Never pick a single winner across axes.

## Why two axes

Code can follow every standard and implement the wrong thing (Standards pass, Spec fail), or do exactly what was asked and break conventions (Spec pass, Standards fail). Reporting separately stops one axis masking the other.
