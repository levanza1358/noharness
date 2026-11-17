---
kind: upgrade-guide
description: "Deployments drop the removed credential-onboarding config key and the removed models sign-in slot."
---

# Remove `credentialOnboarding` and `settings.models.sign-in`

## Change

The Models client plugin no longer runs a first-run DeepSeek credential dialog. Its Host entry publishes nothing through `webserver/index-inject`, so a `cordis.yml` entry that still sets `credentialOnboarding` passes an unknown key to a plugin whose `Config` no longer declares it. The `settings.models.sign-in` Client slot is gone with the dialog: a registration into it now fails at load, and its `complete` and `useApiKey` owner props have no replacement. The versioned welcome notice, Providers and Models settings, and the explicit sign-in dialog opened from the account menu and the Account page are unchanged; the sign-in dialog's Add API key action opens the Providers settings page.

## Migration

1. Remove the `credentialOnboarding` key from every `cordis.yml` and overlay that configures `ui-settings-models`:

   ```yaml
   - id: ui-settings-models
     name: '@noharness/client-ui-settings-models'
   ```

2. Replace each `ctx.slots.inject('settings.models.sign-in', …)` registration with nothing: an external plugin that offered an account-or-API-key choice there can drop the registration, because the shipped account dialog already offers both actions.
3. Start `nhs web` with the edited composition and confirm the boot page reports no `settings.models.sign-in` declaration error, then open Settings → Providers to confirm the provider list and its Add custom provider button still render.
