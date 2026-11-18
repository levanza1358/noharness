---
kind: upgrade-guide
description: "A model you declare yourself now sends its system prompt as `system` unless the route asks for `developer`."
---

# Hand-declared models default to the `system` role

## Change

pi-ai sends a reasoning model's system prompt as `role: "developer"` whenever it does not recognize the endpoint URL as being a non-OpenAI vendor — which covers every private gateway. Gateways that only accept `system` answered such a request with their own error, for example `{"code":11128,"msg":"Illegal API invocation from an unapproved channel"}`.

A model that the installed catalog does not describe now starts with `compat.supportsDeveloperRole: false`, so its request carries `system`. Catalog models keep the value pi-ai ships for them. Configuration still wins: a route or model that sets the switch to `true` gets `developer`.

Observable only for a hand-declared route whose endpoint does insist on `developer` and whose requests therefore start arriving with `system`.

## Migration

1. If your gateway rejects `system` and requires `developer`, set the switch on the route in `$NHS_HOME/profiles/<profile>/cordis.patch.yml`:

   ```yaml
   - id: llm-pi-ai
     config:
       providers:
         my-gateway:
           compat:
             supportsDeveloperRole: true
   ```

2. Confirm the role on the wire: a reasoning model on a hand-declared route now sends its first message with `role: "system"`, and one that sets the switch to `true` sends `role: "developer"`.
