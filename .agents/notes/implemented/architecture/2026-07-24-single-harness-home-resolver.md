# Agent Note: One harness home resolver

Status: implemented

## Problem

The harness had two inconsistent conventions for "where does NoHarness user data live":

- `@noharness/home` resolved `configured ?? $NHS_HOME ?? ~/.nhs`.
- `@noharness/home-paths` shipped a **second** `resolveDshHome` with the same precedence plus tilde expansion — a near-duplicate of `nhs-home` that no gate flagged because the two lived in different packages and had already drifted (only one expanded tildes).

Two resolvers for the same cross-cutting fact meant there was no single home policy.

## Decision

One resolver owns the harness home, in `@noharness/home-paths`, single-root:

```
explicit configured path  >  $NHS_HOME  >  ~/.nhs
```

An empty or whitespace-only `$NHS_HOME` is treated as unset; otherwise `resolve('')` would silently place the home at the current working directory. The harness keeps all user data under one root; there is no split into separate XDG roots. `nhsHomePath(...segments)` joins deployment-owned children onto that root, and `nhs-app-boot` exposes it to Loader `!!js` config expressions before mounting entries, so shipped compositions derive `sessions` and `storages` without copying the resolver. `nhsHomeDisplay()` names a resolved root symbolically for user-facing paths — `~/.nhs` for the default home, `$NHS_HOME` for any configured home — so the user-global `AGENTS.md` label never leaks an absolute machine path. It replaces agent-instructions's bespoke default-vs-`$NHS_HOME` check. Home is process policy rather than row configuration: `nhs-agent-instructions` accepts no home override, so a composition cannot point instruction loading at a root that sessions, skills, and storage would not read. `resolveAgentsHome()` and `agentsHomeDisplay()` apply the same precedence, tilde expansion, and symbolic labelling to the shared agent configuration root (`$NHS_AGENTS_HOME` or `~/.agents`), which stays outside the harness home because other agent tools share it ([shared agents root](2026-10-05-shared-agents-root-instructions.md)); `nhs-skill-filesystem` still accepts its own `nhsHome` and `agentsHome` fields, which select its own skill roots and resolve through the shared resolver in the instruction-loading change.

`nhsPath(category, ...segments)` derives paths below a `config`, `data`, `state`, `cache`, or `backup` directory of that one root, and app-boot exposes it to Loader `!!js` expressions beside `nhsHomePath`; the [home path categories proposal](../../proposed/architecture/2026-11-04-nhs-home-path-categories.md) owns the categories and which existing entries keep their top-level locations. `nhsCachePath(...segments)` is `nhsPath('cache', ...segments)`. An initial `{ nhsHome }` option preserves a provider's explicit home override. It resolves paths without creating directories; callers own directory creation. `attachment-local` uses this helper for regenerable request-image variants while retaining durable attachment objects in their versioned storage tree, so clearing the cache cannot remove Session attachments. Existing request-image cache entries are left in place and are not read or copied; a cache miss regenerates the variant from its durable attachment.

`@noharness/home` is deleted. Home-owning providers and boot packages import `resolveDshHome` from `nhs-home-paths`; composition bundles contain only the resolved configuration rows.

`nhs-telemetry` and its separate home policy are absent under the [SDK project toolchain removal](../../archived/simplification/2026-08-11-remove-sdk-project-toolchain.md), leaving this resolver as the sole home policy.

## Alternatives considered

**Leave the two `resolveDshHome` copies in place.** They had already drifted (one expands tildes, one didn't) and encode the same cross-cutting fact twice. Consolidation is the point of the `util/` layer; a duplicate resolver is a latent divergence bug.

**Adopt XDG (honor `$XDG_CONFIG_HOME`, or split config/data/cache into separate trees).** Considered and dropped in favor of one obvious root. A single `$NHS_HOME || ~/.nhs` ground truth matches `~/.claude` / `~/.aws`, needs no per-kind reclassification of every `~/.nhs` consumer, and leaves no resolver asymmetry to reconcile.

## Consequences

- One home fact, one resolver. `nhs-home-paths` is the sole owner; the `util/` group loses the `home` package.
