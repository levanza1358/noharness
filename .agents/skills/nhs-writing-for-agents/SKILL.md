---
name: nhs-writing-for-agents
description: Use when creating or editing an agent skill, AGENTS.md, CLAUDE.md, or any doc an agent reaches by a pointer. Covers context pointers, the information hierarchy, leading words, pruning, and skill mechanics.
---

# Writing for agents

Reference for any document an agent consumes: a skill, an `AGENTS.md` / `CLAUDE.md`, or a doc reached by a pointer. The packaging differs; the writing does not, because the agent takes the same process every run rather than producing the same output.

When the document is a skill, read [SKILL-MECHANICS.md](SKILL-MECHANICS.md) for frontmatter, invocation choice, and router skills. NoHarness also enforces [docs/AGENTS.md](../../../docs/AGENTS.md): current-state prose, one physical line per paragraph, one home per fact, and word budgets.

## Context pointers

A **context pointer** names out-of-context material and encodes the condition for reaching it. A skill's description is one; a line in `AGENTS.md` naming a doc is the same object. The pointer's wording, not its target, decides when the agent reaches it and how reliably. A must-have target behind weak wording is a variance bug: sharpen the wording first, inline the material only if that fails.

A pointer does two jobs: state what the material is, and list the branches that should trigger reaching it. Every word of an always-loaded pointer costs on every turn, so it earns harder pruning than the body:

- **Front-load the leading word**: the pointer does its triggering work there.
- **One trigger per branch.** Synonyms naming one branch are one branch written twice.
- **Cut identity the body already carries.**

## The two loads

**Context load** is the cost of always-loaded material on the agent's window: an `AGENTS.md` line, a skill description, anything present every turn whether or not it fires.

**Cognitive load** is the cost on the human: which documents exist and when to reach for each. The human is the index. It is not a cost to minimise; it is the price of human agency. Spend it where human judgement matters.

Material reached only through a pointer escapes context load at the price of the pointer's line. Material with no pointer rides entirely on cognitive load.

## Information hierarchy

A document is built from **steps** (ordered actions) and **reference** (definitions, rules, facts consulted on demand). The core decision is where each piece sits on a ladder ranked by how immediately it is needed:

1. **In-file step**: what the agent does, in order.
2. **In-file reference**: consulted on demand. Often a legitimately flat peer-set, such as every rule of a review; that is fine, not a smell.
3. **Disclosed reference**: pushed to a separate file behind a context pointer, loaded only when the pointer fires.

Push too little down and the top bloats; push too much and you hide what the agent needs. That tension is the decision.

**Progressive disclosure** is the move down the ladder so the top stays legible. It is not mainly a token optimisation; it is how the hierarchy is protected. Branching is the cleanest test: inline what every branch needs, disclose what only some branches reach. When a document has steps, in-file reference that should be disclosed buries them and makes attending to them a coin-flip.

**Co-location** is the within-file companion: keep a concept's definition, rules, and caveats under one heading rather than scattered. The test is that the document reads like documentation written for the agent.

**Sprawl** is the failure mode: a document too long even when every line is live and unique. Attention thins across the excess. The cure is the ladder: disclose reference, split by branch or sequence.

## Steps and completion criteria

Every step ends on a **completion criterion**, the condition that says the work is done. Two properties make it a lever:

- **Clarity**: can the agent tell done from not-done? A vague bound invites **premature completion**, where attention slips to being done. Defend by sharpening the bound first; only if it is irreducibly fuzzy and you observe the rush, hide later steps by splitting across a real context boundary.
- **Demand**: how much it requires. "Every modified model accounted for" forces work where "produce a change list" does not. Demand drives the digging the agent does inside the work, and it binds flat reference too: "every rule applied" sets the exhaustion bar for an all-reference document.

The strongest criteria are both checkable and exhaustive.

## When to split

Splitting spends one of the two loads, so split only when the cut earns it.

- **By sequence**: split a run of steps where later steps tempt the agent to rush the one in front. Beware merging, which exposes each step's successors and invites premature completion.
- **By invocation**: skill-specific; see [SKILL-MECHANICS.md](SKILL-MECHANICS.md).

## Leading words

A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the document: _seam_, _red_, _tight loop_, _tracer bullet_. Repeated as a token, never as a sentence, it accumulates a distributed definition and anchors a region of behaviour in the fewest tokens, recruiting priors the model already holds. Coining your own works if you define it clearly, but a made-up word pays in definition tokens what a pretrained word gives free; reach for an existing word first.

It anchors twice: in the body it shapes execution, and inside flat reference it focuses attention on a class of thing to look for. In a pointer it triggers invocation, because the word lives in the prompts, the docs, and the codebase.

Hunt for opportunities to refactor with leading words: a triad spelled out at three sites, or a pointer spending a sentence to gesture at one idea, is a passage begging to collapse into a token. "fast, deterministic, low-overhead" becomes _tight_. "a loop you believe in" becomes _red_, which turns a fuzzy gate into a binary observable state.

**Negation is the failure mode beside this lever.** Steering by prohibition drags the forbidden behaviour into context and makes it more available. Prompt the positive: "write one-line comments" rather than "do not write essays". A prohibition earns its place only as a hard guardrail that cannot be phrased positively, and even then it is paired with the positive target.

## Pruning

- **One source of truth per meaning.** Duplication costs maintenance and tokens and inflates a meaning's prominence on the ladder past its real rank.
- **The environment is a source of truth too**: `package.json` scripts, config files, directory layout, `--help` output. A document restating it is a cache, and a cache earns its load only when the lookup is expensive. Cache the unwritten convention, the reason behind a choice, the gotcha no config confesses.
- **Check relevance line by line.** A line loses relevance by never bearing on the task or by going stale. Shorter documents stay relevant longer. Without pruning the default fate is **sediment**: stale layers that settle because adding feels safe and removing feels risky.
- **Hunt no-ops.** An instruction the model already obeys by default pays load to say nothing. The test is whether it changes behaviour versus the default, which is model-relative: settle it by running the document, not by debate. When a sentence fails, delete the whole sentence rather than trimming words. The test also grades leading words: a word too weak to beat the default (_be thorough_) is a no-op, and the fix is a stronger word (_relentless_).
