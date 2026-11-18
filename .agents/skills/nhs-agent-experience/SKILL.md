---
name: nhs-agent-experience
description: Use when designing or reviewing anything a model reads or calls — tool names, tool descriptions, JSON schemas, error messages, prompt fragments, skill text, subagent briefs, and compaction input. Optimizes the agent experience (AX) the same way UX optimizes the human one.
---

# Agent experience

The model is the primary user of NoHarness. Every tool schema and error string is UI. Design AX with the same discipline as UX: what does the reader need, in what order, and what happens when they get it wrong.

## The three failure modes of an AX surface

1. **Under-specified** — the model guesses wrong and burns a turn. A tool that says `path: string` when it accepts a glob and a literal path teaches nothing.
2. **Over-specified** — the surface is so large that reading it costs the turn it was meant to save. Twelve boolean flags on one tool means twelve wrong combinations available.
3. **Dishonest** — the tool succeeds literally but not usefully, or fails without saying what would have worked.

All three are expensive. (1) and (3) cost turns; (2) costs every turn forever.

## Writing a tool

- **Name for the action the model wants**, not the implementation. `present` is a good name; `emit_turn_deliverables` is not.
- **The description answers three questions**: when to use it, when not to, and what comes back. If "when not to" is empty, the tool probably overlaps another one — fix the overlap, do not write a ban.
- **Schema carries the constraints, prose carries the judgment.** `enum` for fixed choices; description for "prefer this when…". Never describe in prose what the schema can enforce.
- **Required means required.** An optional field the implementation always needs is a lie that surfaces as a runtime error three layers down.
- **One obvious call shape.** If two parameter sets both work, the model will find the worse one under pressure.
- **Results lead with the outcome.** First line says what happened; detail follows. Errors say what was rejected, why, and the one thing to change.
- **Pin the model-visible text.** Stable tool text is asserted verbatim in a snapshot, and dynamic behavior through end-to-end coverage; a contract no test pins drifts silently.
- **Write from the model's perspective only.** No UI, transport, or implementation vocabulary in prompts, schemas, results, or diagnostics.

## Error messages the model can act on

```
Bad:   invalid input
Good:  `limit` must be 1-500; received 2000. Pass a smaller limit or omit it.
```

An error has three jobs: name the field, name the constraint violated, name the fix. Anything else is noise the model pays for in context.

Do not say "you may have meant" for a case you can resolve yourself. Do not blame the model for a constraint your schema failed to express.

## Prompt and skill text

- **Lead with the trigger.** First sentence says *when* this applies. A reader who cannot tell whether to read on has already paid for the file.
- **Imperative, second person, no hedging.** "Delete the field" beats "the field could potentially be removed". A hedge is an instruction the model may treat as optional.
- **State the negative.** "Do not add a migration note for a mechanical edit" prevents a class of error that a positive rule alone leaves open.
- **One rule per line.** Bundled rules get partially followed; the half that gets dropped is not the half you choose.
- **Point, do not restate.** If the fact lives in `AGENTS.md`, link it. Duplicated instructions drift, and the model then has two authorities.

## Subagent briefs

A brief is a tool call whose result is a turn. It must be self-contained (the child sees no history) and must state:

- The bounded task, in outcome terms.
- What is already known, so the child does not re-discover it.
- The acceptance evidence the child must return.
- The prohibition list, if partial work would be mistaken for complete.

Never delegate a task whose definition depends on a file the child is not told to read.

## Compaction and context pressure

Anything model-visible must be reconstructable from the session log. When designing a surface, ask what remains legible after compaction — a tool result whose meaning lives only in the call that produced it becomes noise once the call is compacted away.

## Review checklist

- [ ] Could the model pick the wrong tool here, and does anything stop it?
- [ ] Does any required field have a sane reason to be required?
- [ ] Does every error name a fix?
- [ ] Is any prose describing something the schema could enforce?
- [ ] Does the first line of the description tell a reader whether to keep reading?
