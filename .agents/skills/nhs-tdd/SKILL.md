---
name: nhs-tdd
description: Use when building a feature, fixing a bug, or changing behavior test-first, when red-green-refactor applies, or when adding tests to a NoHarness package. Adapts TDD to NHS seams, per-file coverage, and snapshots.
---

# Test-driven development

Red → green loop, adapted to NoHarness. Read [docs/testing.md](../../../docs/testing.md) for the repo's test surface.

## Seams

A **seam** is the public boundary you test at: the interface where behaviour is observable without reaching inside. NHS seams:

- a Capability Seam's Service Definition (`packages/<group>/<pkg>/src/*.ts`),
- a plugin's `apply()` effect and its declared `Config`,
- a tool's typed result and its persisted result metadata,
- a session event in the session log.

Tests live at seams, never against internals. Test only at pre-agreed seams: name the seams and what each catches and misses before writing a test.

## What a good test is

- Reads like a specification: "settings page replaces the conversation column", not "calls selectPanel".
- Survives refactors: it fails only when behaviour changes.
- Expected values are independent literals, never recomputed the way the implementation computes them.

## NoHarness rules

- Per-file coverage is 100% on `packages/*/*/src`; a red test that cannot reach a line means the seam is wrong, not that coverage can be skipped.
- Model-visible ⟺ logged: a change to model-visible input needs a session event and a snapshot.
- A non-trivial model- or product-user-visible change updates a keyless recorded-session snapshot in the same change.
- Tests describe behaviour, not correctness: change obsolete behaviour together with its test and say why in the PR.

## Test the change, once

Write the smallest test at the seam that proves the new behaviour, run the owning test file unfiltered, and fix a red result before moving on. One pass. Do not add probing assertions, do not split one behaviour into several cases with the same setup, and do not run the file again to confirm a run that already passed.

## Anti-patterns

- **Implementation-coupled**: mocking internal collaborators, asserting call counts, or verifying through a side channel.
- **Tautological**: the assertion recomputes the expected value the way the code does.
- **Horizontal slicing**: all tests first, then all implementation. Bulk tests verify imagined behaviour and lock in structure before the implementation teaches you anything.

## Rules of the loop

- **Red before green.** Failing test first, then only enough code to pass it.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle. In a fast-lane task the slice is the whole feature: one test file, one implementation pass.
- **Refactoring belongs to review**, not the red → green cycle.
