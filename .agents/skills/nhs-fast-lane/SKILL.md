---
name: nhs-fast-lane
description: Use when starting any NoHarness task, feature, or bug fix, and whenever work stalls on exploration, probing, or repeated verification. Sets the operating loop — plan in a few lines, then implement and verify without wandering.
---

# The fast lane

Most time lost on a task is spent before the first edit: reading files that do not matter, probing behaviour that the code already states, and re-running checks to feel safe. This skill is the loop that replaces it. Correctness is never traded for speed: the speed comes from removing the wandering, not from skipping the work.

## The loop

1. **Plan in a few lines.** State the change in three to five lines: what changes, which files, which test proves it, what could break. Write it in the reply, not in a file. A plan longer than the change is the first sign of wandering.
2. **Read only what the change touches.** Locate the seam with one search, then read that file and its owning test. Reading a neighbouring package "to understand the style" is not planning; it is avoidance.
3. **Implement once, completely.** Whole change in one pass: source, test, and any owned doc. Do not write a probe, a temporary script, or a debug print to find out what the code does — read it, or run the existing test that already covers it.
4. **Verify with the fast lane.** The owning test file unfiltered, then `pnpm run typecheck`. See [nhs-pre-push-checks](../nhs-pre-push-checks/SKILL.md#fast-lane). That is the default evidence; it is not the start of a checklist.
5. **Report and stop.** What changed, what ran, what remains. No closing summary of the work already described.

## Probe discipline

A probe is a temporary script, debug log, or exploratory command written to discover behaviour. Each one costs a write, a run, and a cleanup. Admit one only when:

- the behaviour is not stated by any readable source (generated output, a vendor package, a runtime value), and
- an existing test cannot answer it in one run.

Tag every admitted probe `[DEBUG-<tag>]` and delete it before the reply. A probe that survives is a defect in the change.

Only an **unexpected failure** justifies more evidence (an unexpected failing test): escalate with [nhs-diagnosing-bugs](../nhs-diagnosing-bugs/SKILL.md), which starts from one read of the failing output.

## Quality floor

Speed never bends these. They are the reason the loop can stop after two checks:

- The change is complete: no TODO left behind, no half-migrated consumer, no unreachable branch.
- Every path the change adds runs at least once in the owning test, so per-file coverage stays whole.
- Contracts at the edges the change crosses are honoured: validation at parser, config, model/tool JSON, durable file, worker, process, and wire boundaries; typed values inside the process.
- Disposers, cancellation, and failure paths are present the first time. A rework loop caused by a half-written lifecycle costs more than writing it correctly.

## Stalls

When a task has run long, name the cause instead of continuing:

- **Unclear spec**: ask one question and stop.
- **Wrong seam**: the change keeps spreading; move up to the interface and re-plan in the few lines.
- **Hidden dependency**: one read of the actual file replaces any amount of guessing.
- **Unrelated failure**: report it and continue; it is not part of this task.

Re-planning is cheap and fast. Probing a second time is neither.
