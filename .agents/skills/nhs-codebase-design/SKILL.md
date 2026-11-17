---
name: nhs-codebase-design
description: Use when designing or improving a module's interface, choosing where a seam goes, deciding what a package should expose, making code testable through one interface, or judging whether a module earns its keep. Supplies the deep-module vocabulary for NoHarness capability seams.
---

# Codebase design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. The aim is leverage for callers, locality for maintainers, and testability for everyone.

## Vocabulary

Use these terms exactly. Do not substitute "component", "service", "API", or "boundary".

**Module**: anything with an interface and an implementation: a function, class, package, or tier-spanning slice. _Avoid_: unit, component, service.

**Interface**: everything a caller must know to use the module correctly: the type signature, plus invariants, ordering constraints, error modes, required configuration, and performance characteristics. _Avoid_: API, signature.

**Implementation**: the code inside a module. Distinct from **adapter**: a thing can be a small adapter with a large implementation (a Postgres repository) or a large adapter with a small implementation (an in-memory fake). Say "adapter" when the seam is the topic.

**Depth**: leverage at the interface, meaning how much behaviour a caller or test can exercise per unit of interface they must learn. **Deep** means much behaviour behind a small interface; **shallow** means the interface is nearly as complex as the implementation.

**Seam** (Michael Feathers): a place where behaviour can change without editing there; the location at which a module's interface lives. Where the seam goes is a separate decision from what sits behind it. _Avoid_: boundary.

**Adapter**: a concrete thing that satisfies an interface at a seam. A role, not a substance.

**Leverage**: what callers get from depth. **Locality**: what maintainers get from depth: change, bugs, and verification concentrate in one place.

In NoHarness, a **capability seam** comprises a Service Definition, a Service Provider, and a Consumer role, and is complete only when all three exist. Read [docs/glossary.md](../../../docs/glossary.md#capability-seam) before naming one.

## Depth

Deep: small interface, large implementation. Shallow: large interface, thin implementation.

When designing an interface, ask: can I reduce the number of methods? simplify the parameters? hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module may be internally composed of small swappable parts; they simply are not part of the interface. Internal seams (private, used by the module's own tests) and the external seam at its interface are both legitimate.
- **The deletion test.** Delete the module in imagination: if complexity vanishes it was a pass-through; if it reappears across N callers it earned its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If a test must reach past the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam; two adapters mean a real one.** Do not introduce a seam unless something actually varies across it.
- **Explicit over implicit at package boundaries.** Defaulting is an explicit `resolve(request): Spec` step in the owning implementation, never a hidden `?? default` inside `run()`.

## Designing for testability

1. **Accept dependencies, do not create them.** Pass the collaborator in; do not construct a provider client inside.
2. **Return results, do not mutate.** A function returning a `Discard`-like value is testable; one that mutates a session through a side channel is not.
3. **Small surface.** Fewer methods and parameters mean fewer and simpler tests.

## Relationships

A **module** has exactly one **interface**. **Depth** is that module measured against its **interface**. A **seam** is where the interface lives. An **adapter** sits at a seam and satisfies the interface. **Depth** produces **leverage** for callers and **locality** for maintainers.

## Rejected framings

- **Depth as the ratio of implementation lines to interface lines** (Ousterhout): rewards padding. Use depth-as-leverage.
- **"Interface" as the TypeScript keyword or a class's public methods**: too narrow; the interface includes every fact a caller must know.
- **"Boundary"**: overloaded with DDD's bounded context. Say seam or interface.

## Going deeper

- [DEEPENING.md](DEEPENING.md): deepening a cluster given its dependencies, seam discipline, and replace-don't-layer testing.
- [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): parallel sub-agents designing one interface several radically different ways, then comparing.
