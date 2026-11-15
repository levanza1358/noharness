---
kind: upgrade-guide
description: "The `agent-instructions` row no longer accepts `nhsHome`; instruction loading always resolves the harness home from `$NHS_HOME` or `~/.nhs`."
---

# Instruction loading resolves one harness home

## Change

`@noharness/agent-instructions` removed its `nhsHome` config field. The plugin resolves the harness home through `resolveDshHome()` from `@noharness/home-paths`, like every other harness consumer: the home is `$NHS_HOME` when it is set and non-blank, otherwise `~/.nhs`, with tilde expansion.

A `cordis.yml`, profile patch, or `--patch` overlay that still sets `nhsHome` on the `agent-instructions` row has no effect: the row keeps the stray key and the plugin ignores it, so instruction loading follows the process home. Other providers, such as `nhs-skill-filesystem` and `nhs-shell-env`, keep their own home fields; this removal covers the instruction loader only.

## Migration

1. Delete `nhsHome` from the `agent-instructions` row in `cordis.yml`, `$NHS_HOME/cordis.patch.yml`, `$NHS_HOME/profiles/<profile>/cordis.patch.yml`, and any `--patch` overlay.
2. Where the override pointed at a non-default home, export `NHS_HOME` for the process instead, so every harness consumer reads that home.
3. Confirm with `nhs --profile <profile> --dump-config` that the `agent-instructions` row lists only its remaining fields, and that a new session's first request shows `Instructions from: $NHS_HOME/AGENTS.md` (or `~/.nhs/AGENTS.md`) when that file exists.
