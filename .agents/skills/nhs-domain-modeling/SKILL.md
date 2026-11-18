---
name: nhs-domain-modeling
description: Use when adding a type, field, or state machine to NoHarness, when tempted to add an optional flag to make one caller work, or when a conceptual model is starting to leak across packages. Keeps the model honest — one name per concept, illegal states unrepresentable, and every field earning its existence.
---

# Domain modeling

Models rot by accretion: an optional field for one caller, a boolean beside a boolean, a string that means three things depending on who wrote it. Each addition was locally reasonable. The result is a type nobody can trust and a runtime full of checks that guess which meaning is in play.

This skill is the discipline that stops accretion.

## Make illegal states unrepresentable

Ask of every type: *which of its values are nonsense?* If nonsense is expressible, someone will express it and someone else will handle it wrongly.

```
Before                  After
{ ok: boolean,         | { status: 'ok', value: T }
  value?: T,           | { status: 'error', error: E }
  error?: E }
```

The union has no fourth state. The boolean pair has two that must never happen and no type that says so.

Apply to:
- **Load state** — idle, loading, loaded, failed: four states, four members, not three booleans.
- **Presence of a referent** — a value and its presence as one field, not `id?: string` plus `found: boolean`.
- **Mode** — a string union, not a `string` with documented values.
- **Progress** — `done | pending(reason)` rather than a nullable result plus an `inFlight` flag.

## One name per concept

The same concept under two names is two things in every future conversation. Before naming, search for the concept:

- Does it already exist as a type, field, event, or config key?
- Does the existing name mean exactly this, or something adjacent?
- Is there a synonym already in use (`cwd` vs `workingDirectory`, `source` vs `origin`, `config` vs `settings`)?

If an existing name is close but wrong, the choice is: rename the existing concept everywhere, or accept a distinction and document what separates them. Never introduce a near-synonym to avoid a rename.

**Wire, durable, and model-visible names are contracts.** Once a field is persisted or sent, renaming is a migration. Get the name right before the first write.

## Every field pays rent

For each field ask: *who reads this, and what breaks without it?*

- No reader today → not a field. It is speculation.
- Read only to be passed back unchanged → it is not part of this type; it belongs to whoever owns it.
- Readable from another field → derived; compute it, or it will go stale.
- Optional but required by the implementation → required field, validation at the boundary that supplies it.

Derived values are the highest-risk fields in a persisted model: they are correct at write time and wrong after the next change. Persist the inputs.

## Ownership before structure

A type usually crosses a package boundary because the concept does. Ask which package owns the concept — not which package first needed it.

- Owned by one consumer → keep it private; do not export it.
- Owned by a seam → the Service Definition owns the type; providers and consumers import it.
- Owned by nobody → the concept is not yet real; do not create a shared package for it ([capability seams](../../../docs/glossary.md#capability-seam)).

A model that lives in the wrong package is duplicated within a month.

## Branded identifiers

Two IDs of the same underlying type that can be swapped is a bug waiting for a refactor. If a `sessionId` and an `agentId` are both strings and both cross a boundary, brand them ([`Branded<B>`](../../../packages/util/brand/README.md)). At same-process typed boundaries an unbranded value is fine; at wire, durable, and model boundaries it is not.

## Change protocol

When a changed model is persisted, wire, or model-visible:

1. Decide whether the change is additive, reinterpreting, or removing.
2. Reinterpreting an existing field is the dangerous one — it silently changes meaning for old data. It needs a version boundary or a migration, never a reader that guesses.
3. Record the acknowledgement the repo requires ([persistence review](../../../docs/cookbook/reviewing-persistence-type-changes.md)).
4. Update the subsystem page in the same change; a type documented nowhere is a type nobody can model correctly later.

## Review questions

1. What are the illegal values of this type, and are they representable?
2. Does every field have a reader that would break without it?
3. Is any field derived from another and also stored?
4. Is there an existing name for this concept, and why is this one different?
5. Which package owns this, and does the import direction agree?
