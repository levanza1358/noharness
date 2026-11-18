# Skill mechanics

The skill-specific branch of [SKILL.md](SKILL.md): frontmatter, the invocation choice, and router skills.

## Invocation

Two choices, trading the two loads:

- A **model-invoked** skill keeps a `description`, so the agent can fire it autonomously and other skills can reach it. Typing its name still works: model invocation adds agent discovery and never removes human reach. The description is the skill's top-level context pointer, forced to stay loaded: permanent context load in exchange for discoverability. A model-invoked skill whose content is all reference is also one home for shared reference, since another skill can invoke it. Mechanics: omit `disable-model-invocation` and write a model-facing description carrying the trigger branches.
- A **user-invoked** skill strips the description from the agent's reach: only a human typing its name can invoke it, and no other skill can. Zero context load, but it spends cognitive load because the human is the index. Mechanics: set `disable-model-invocation: true`; the description becomes human-facing, a one-line summary with trigger lists stripped.

Pick model invocation only when the agent must reach the skill on its own, or another skill must. Shared reference that two user-invoked skills both need can live in neither: with no descriptions neither can fire the other, so push it to a plain file outside the skill system.

## Splitting by invocation

The sequence cut lives in [SKILL.md](SKILL.md). Split off a model-invoked skill when you have a distinct leading word that should trigger it on its own, or another skill must reach it. The new always-loaded description is a real cost; independent reach has to be worth it.

## Router skills

When user-invoked skills multiply past what a person can remember, the piled-up cognitive load is cured by a **router skill**: one user-invoked skill naming the others and when to reach for each. It can only hint, never fire them.

## NoHarness specifics

- Location: `.agents/skills/<id>/SKILL.md`, with the id matching the frontmatter `name` and the NHS `nhs-` prefix.
- Required frontmatter: `name` and `description`. The description is the pointer, so it carries the trigger branches.
- Relative links to repo docs (`../../../docs/...`) are preferred over restating a rule that lives there; one home per fact.
- A skill that restates a rule enforced by a gate is a cache of that gate: keep only the reason or the gotcha the gate does not confess.
