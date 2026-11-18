# Agent Note: Set the deployment default model from Settings

Status: implemented

## Problem

The deployment default model — the selection a new Session starts from — could only be written as a side effect: selecting a model inside an open Session saved it in the background, and the account login flow saved the first account model once. A user who wanted a different starting model had to open a Session, pick the model there, and accept that the Session kept its own selection. The Settings → Models page edited provider catalogs but could not say what those models were the default *for*, and `agentDefaultModel.saveSelection()` had no caller that named the intent directly.

## Decision

`session-controller` gains `setDefaultModel(selection: ModelSelection): Promise<ModelSelection>`. It validates the pair against the live catalog with the same gate `selectModel` uses, resolves the call config once, and persists through `ctx.agentDefaultModel.saveSelection()`, so the profile write keeps its submission-order serialization. An unavailable model rejects with `session/model-unavailable` and leaves the stored default untouched; the method never substitutes another model.

The Settings → Models page renders **Set as default provider** above the provider picker: one select over every model the deployment can currently route, grouped by provider name, seeded from `ModelCatalog.default`. The page's snapshot already joined the settings mirror and provider directory; it now also stores the Host model catalog and its read failure, so the picker renders from the same load. A catalog read failure leaves the provider list usable and the picker absent rather than failing the page, matching how credential failures degrade there.

The new Remote is classified `owner-only` in the LiveShare viewer table, like every other settings mutation.

## Alternatives considered

**Write the `default-model` settings namespace from the Client.** Rejected: the namespace is a Loader entry id, so a composition that names the entry differently would silently write a namespace no agent reads, and the Client would own model-availability validation the Host already performs.

**Reuse `selectModel` with an implicit Session.** Rejected: it requires a Session the user is not asking for, and its contract is a Session-local selection that the default save merely echoes.

**Offer the picker only for providers declared on the Settings page.** Rejected: the deployment default applies to every route the deployment can route, including adapter defaults the pages deliberately keep off their provider lists.

## Consequences

Changing the model every new Session starts from is an explicit Settings action that names its outcome, and existing Sessions keep their own recorded selections. The picker reflects `ModelCatalog.groups`, so it lists exactly what the Host reports as routable and disappears when nothing is. `setDefaultModel` is a Host mutation over the same catalog gate as the Session-level selection; the two cannot disagree about what is available. The generated Cordis catalog records the new Remote, and `docs/subsystems/session.md` carries its signature.
