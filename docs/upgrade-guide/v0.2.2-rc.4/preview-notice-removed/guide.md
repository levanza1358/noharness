---
kind: upgrade-guide
description: "The Web UI opens on the conversation; the first-run preview notice and the acknowledgement settings key are gone."
---

# Drop the first-run preview notice

## Change

The Web UI no longer opens a full-viewport **Preview Notice** modal before the shell becomes usable. `ui-settings-models` registers no `settings.onboarding` step, so the shell mounts no step and never makes `#root` inert for one.

The `settings.onboarding` slot itself is unchanged: it is a declared public extension point, and a plugin that registers a step there still owns the modal chrome, its readiness, and its `complete()` call. Only the shipped registrant is gone.

`ui-settings-general` still declares `welcomeNoticeVersion` as a volatile Config field, so a profile patch that recorded an acknowledgement keeps loading. Nothing reads or writes it.

## Migration

1. Delete any automation or documentation that waits for the notice. A browser-scenario test that clicked **Continue** should wait for the workspace picker instead:

   ```ts
   await page.getByRole('textbox', { name: '选择工作区' }).waitFor({ timeout: 15_000 })
   ```

2. Stop setting the acknowledgement before a first launch. `settings.yaml` entries and profile patches that carry `ui-onboarding.welcomeNoticeVersion` or `ui-settings-general.welcomeNoticeVersion` remain importable and valid, and have no effect.
3. Drop a `settings.onboarding` registration only if it existed to suppress or order the shipped notice; an independent onboarding step keeps working unchanged.
4. Load the Web UI in a fresh browser profile and confirm the conversation appears with no modal and no acknowledgement write.
