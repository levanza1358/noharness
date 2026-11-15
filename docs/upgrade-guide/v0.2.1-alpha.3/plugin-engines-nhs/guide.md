---
kind: upgrade-guide
description: "Plugin compatibility checks read engines.nhs before NHS peerDependencies, and refusals report requirements instead of peers."
---

# Plugin compatibility reads `engines.nhs` first

## Change

In v0.2.1-alpha.3, installation and profile startup judged a plugin or bundle only by its `peerDependencies` on `@noharness/cli` and `@noharness/*`, and ignored `engines.nhs`. In the next release, an own `engines.nhs` range decides alone and those peers are ignored; the peer rule applies only when `engines.nhs` is absent. `workspace:` values are valid only in peers; in `engines.nhs` they are incompatible. A non-object `engines` or a non-string `engines.nhs` makes the manifest unreadable for compatibility, which refuses the package. Plugin authors whose package declares `engines.nhs`, or declares `engines` as something other than an object, are affected.

The `incompatible-version` refusal record that the plugin manager returns to clients, `IncompatiblePlugin`, and the app-boot `PluginCompatibility` result rename `peers` to `requirements`. Keys are `engines.nhs` for the engines rule or the peer package name for the fallback. Code that reads these records is affected.

## Migration

1. If your package declares `engines.nhs`, make that range cover every NHS release the package supports, because NHS peer ranges no longer widen or narrow it. Remove `engines.nhs` to keep peer-based checking.
2. Replace `workspace:` values in `engines.nhs` with a semantic version range.
3. Read `requirements` instead of `peers` from `IncompatiblePlugin` and `PluginCompatibility`.
4. Confirm by installing the package with `nhs plugin --profile <profile> add <package@version>` or the plugin manager: a mismatch names `engines.nhs` or the peer package in the refusal.
