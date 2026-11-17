---
name: nhs-diagnosing-bugs
description: Use when a bug, failing test, flaky run, or performance regression is hard to pin down, when asked to diagnose or debug, or when something is broken, throwing, or slow in a NoHarness package. Runs a gated loop from a red signal to a regression test.
---

# Diagnosing bugs

## Decide the depth first

Read the failing output and the code path once, then pick one and say which:

- **Obvious** (wrong constant, wrong prop, missing field, stale mock, typo): fix it and run the owning test. No loop, no hypotheses. This covers most failures; checking whether the failure falls in this category takes seconds and must not be turned into an investigation.
- **Not obvious** after one read: build the loop below, starting at Phase 1 and skipping nothing.

Stop escalating the moment an obvious cause appears. Instrumentation is for a bug you cannot explain, never for a bug you can.

## Hard bugs

A discipline for bugs that resist one read.

## Redact

Show commands, output, and artifacts with every credential replaced by `<REDACTED>`. Build loops against environment variables so the key stays in the environment. If redaction removes the signal, say so and ask.

## Phase 1: build a feedback loop

This is the whole skill. A **tight** loop is one that goes red only on this bug. Without it, reading code produces theories instead of answers.

Ways to build one, roughly in order:

1. Failing test at the seam that reaches the bug.
2. Recorded-session replay: `pnpm run test:snapshot -t <name>`.
3. Built-source reproduction: `pnpm nhs --profile headless "task"`.
4. Curl or HTTP script against a running server.
5. Headless browser script driving the Web client and asserting on DOM, console, and network.
6. Replay a captured payload or event log through the code path in isolation.
7. Throwaway harness exercising one function with the bug's inputs.
8. Property or fuzz loop when the symptom is "sometimes wrong".
9. Bisection harness so `git bisect run` can automate boot-at-state-X-check.
10. Human-in-the-loop script as a last resort; see [hitl-loop.template.sh](hitl-loop.template.sh).

### Tighten the loop

Treat it as a product: make it faster, sharper (assert the exact symptom, not "did not crash"), and deterministic (pin time, seed randomness, isolate the filesystem, freeze the network). A two-second deterministic loop is a debugging superpower; a thirty-second flaky one is barely better than none.

### Non-deterministic bugs

Aim for a higher reproduction rate, not a clean repro: loop the trigger a hundred times, add stress, narrow timing windows.

### When no loop is possible

Stop and say so. List what you tried, then ask for the environment that reproduces it, a redacted artifact, or permission for temporary instrumentation. Do not move on to hypotheses.

Phase 1 is done when you can name one command you already ran that is red-capable, deterministic, seconds long, and unattended.

## Phase 2: reproduce and minimise

Run the loop and watch it go red on the symptom the user described. Then shrink the repro one input, caller, config entry, or step at a time, re-running after each cut, until every remaining element is load-bearing. Do not proceed until reproduced and minimised.

## Phase 3: hypothesise

Write three to five ranked, falsifiable hypotheses before testing any. Format: "If X is the cause, then changing Y makes the bug disappear, and changing Z makes it worse." An unfalsifiable hypothesis is a vibe; discard or sharpen it. Show the list before testing it.

## Phase 4: instrument

Each probe maps to one prediction. Change one variable at a time. Prefer a debugger, then targeted logs at the boundaries that separate hypotheses. Tag every debug log with a unique prefix such as `[DEBUG-a4f2]` so cleanup is one grep. For performance regressions, measure a baseline first, then bisect.

## Phase 5: fix and lock it down

Write the regression test before the fix, at a seam that exercises the real bug pattern. If the only available seam is too shallow, that itself is the finding: the architecture prevented the bug from being locked down. Flag it.

Then: seen red, apply the fix, seen green, and re-run the Phase 1 loop against the original un-minimised scenario.

## Phase 6: cleanup

- Original repro no longer reproduces.
- Regression test passes, or missing seam documented.
- All `[DEBUG-...]` instrumentation gone.
- Throwaway prototypes deleted.
- The correct hypothesis stated in the commit or PR message.
