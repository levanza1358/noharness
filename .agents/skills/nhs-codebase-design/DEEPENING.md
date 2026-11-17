# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Uses the vocabulary in [SKILL.md](SKILL.md): module, interface, seam, adapter.

## Dependency categories

Classify the candidate's dependencies; the category decides how the deepened module is tested across its seam.

### 1. In-process

Pure computation or in-memory state, no I/O. Always deepenable: merge the modules and test through the new interface. No adapter needed.

### 2. Local-substitutable

Dependencies with a local test stand-in (SQLite or PGLite for a database, an in-memory filesystem). Deepenable when the stand-in exists; the seam stays internal and no port appears at the module's external interface.

### 3. Remote but owned

Your own services across a network or process boundary: the remote BFF, the desktop host, an SSH provider. Define a **port** at the seam; the deep module owns the logic and injects the transport as an **adapter**. Tests use an in-memory adapter, production the real one.

Recommendation shape: *"Define a port at the seam, implement the real transport adapter for production and an in-memory adapter for tests, so the logic sits in one deep module even though it is deployed across a boundary."*

### 4. True external

Third-party services you do not control, including model providers. The deepened module takes the dependency as an injected port and tests supply a mock adapter. Keep the real-API e2e test as the separate evidence that the adapter is wired correctly.

## Seam discipline

- **One adapter means a hypothetical seam; two adapters mean a real one.** Do not introduce a port unless two adapters are justified.
- **Internal seams versus external seams.** A deep module may have internal seams its own tests use. Do not expose them through the interface just because a test wants them.
- **Registrations are effects.** A provider or consumer contributes through `ctx.effect()` or `ctx.on()`; that effect is the seam's lifecycle contract, not an implementation detail to hide.

## Replace, do not layer

- Old tests on the shallow modules become waste once tests at the deepened interface exist; delete them.
- Write new tests at the deepened interface: the interface is the test surface.
- Assert observable outcomes through the interface, not internal state. A test that must change when the implementation changes is testing past the interface.
- Per-file coverage stays at 100%; deleting a shallow module's test is correct only when its behaviour is covered at the new seam.
