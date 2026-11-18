# Agent Note: Desktop runtime accepts vendor peer versions

Status: implemented

## Problem

A packaged Desktop runtime skipped `@noharness/base` and `@noharness/web-app` at boot with `Plugin @noharness/base@0.2.2-rc.3 is incompatible with nhs 0.2.2-rc.3: requirements {"@noharness/cordis":"~4.1.0"}`, so no `connection` service existed and the Host died with `Cannot read properties of undefined (reading 'authentication')` at `ctx.connection.authentication`. The runtime smoke failed on every unsigned Windows build.

The packed manifests are correct: `pnpm pack` rewrites the source `workspace:~` peer into the installed vendor version. The compatibility check compared every `@noharness/*` peer with the nhs runtime version, which only fits packages published on the nhs version line. It reported the requirement for every bundle that peers on a vendored Cordis package.

## Decision

`evaluatePluginCompatibility` takes an optional peer-version resolver. A peer without a `workspace:` range is compared with the version installed beside the plugin (`installedPeerVersions`), falling back to the nhs runtime version when the copy cannot be read. `workspace:^`, `workspace:~`, and `workspace:*` still name the running runtime, since a source checkout supplies those packages itself.

Both callers pass their own resolution base: `loadProfileDirectory` uses the bundle directory, and the profile preflight uses the row's module base. The result is that a vendored package is judged against the version Node will actually import, while an nhs-family package keeps the previous exact-version behaviour because its installed copy carries the runtime version.

## Alternatives considered

**Keeping `workspace:` specifiers in packed peer dependencies** would let the existing mapping resolve them to the runtime, but it would publish manifests that do not install outside a workspace, and the peer range would still be a version the plugin does not ship against.

**Granting exact-version exemptions in the packaged profile** suppresses the denial without fixing the comparison, and the smoke profile has no operator to grant them.

**Special-casing `@noharness/cordis` and its plugins by name** would encode the current vendor list in the boot package, which the workspace's vendor rescope can change without touching it.

**Dropping vendor packages from compatibility checks entirely** would also accept a genuinely incompatible Cordis version, which is the case the check exists to catch.

## Consequences

A packaged runtime boots its bundles again, and the unsigned Windows installer completes. A plugin whose installed peer is older or newer than its declared range is now refused on that copy's version rather than the runtime's, which is the version it would actually run against; a peer that cannot be resolved keeps the previous runtime-version comparison. The `@noharness/cordis` mismatch example in the compatibility tests still fails, so unrelated ranges keep their fail-closed behaviour.
