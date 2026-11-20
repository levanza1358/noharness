---
kind: upgrade-guide
description: "Switching models compacts with the provider-reported prompt size, keeps the request when compaction cannot reach the target threshold, and no longer fails with MODEL_SWITCH_COMPACTION_FAILED."
---

# A model switch degrades instead of failing

## Change

`compaction-basic` now sizes a switch response with the provider-reported prompt size when that number is larger than the fixed estimate, so a switch into a smaller window compacts before the first request instead of after the provider rejects it. Pressure never reads below the provider's own count.

The `agent/request` handler no longer discards a request it cannot compact below the target threshold, and no longer throws `MODEL_SWITCH_COMPACTION_FAILED`. It sends the reduced history to the destination route and logs `model switch compaction incomplete: <reason>; sending to <provider>/<model> with the reduced surface`. A route whose capacity cannot be resolved at all is also routed, with a warning, and the provider's `CONTEXT_WINDOW_EXCEEDED` report remains the authority that triggers overflow recovery.

## Migration

1. Replace a `catch` on `MODEL_SWITCH_COMPACTION_FAILED` from `agent.model.select()`-adjacent code with nothing: the switch resolves. To observe an incomplete reduction, read the `compaction/summary` events or the `model switch compaction incomplete` warning in the log.
2. Expect a request to reach a smaller destination route after a partial reduction. Trim history before the switch, or lower `compaction-basic` `maxTokens`, if the destination must never receive a prompt above its threshold.
3. Re-run the profile with a model that declares no `context` capacity and confirm the turn completes rather than failing at the switch.
