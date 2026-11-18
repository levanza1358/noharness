# Agent Note: Remove the web preview notice

Status: implemented

## Problem

Every first browser visit to the Web UI opened a full-viewport **Preview Notice** modal restating that "NoHarness 0.2 is still in preview", describing the desktop app's audience, and claiming that product features and plugin APIs would keep evolving. Acknowledge required a click and a successful settings write before the shell became usable, and the modal covered the conversation until then. The copy is release marketing rather than a fact the user needs mid-task; it duplicates the developer-preview statement in the root README, and it is generic enough that it describes no capability the user is about to use.

## Decision

Delete the notice rather than reword or re-trigger it. `ui-settings-models` seats no `settings.onboarding` step; the component, its shared modal wrapper, the acknowledgement store, the copy module, the acknowledgement version constant, the seven locale dictionaries' four keys, and the tests that pinned them are gone. Nothing in the Web UI opens a first-run interstitial.

The `settings.onboarding` seam stays declared and documented: it is a public extension point that any settings feature may register into, and the shell's coordinator continues to mount one ordered step when something registers. With no shipped registrant it renders nothing, which the shell spec asserts.

The Host keeps `welcomeNoticeVersion` as a volatile field of the `ui-settings-general` entry Config. Profile patches written by earlier releases carry the acknowledgement, and removing the field would leave those stored documents describing a key the schema no longer trusts. Nothing reads the field now; it exists so stored patches keep loading, and the Host README states that.

The web e2e scaffold loses its pre-acknowledgement write and its mirrored Chinese copy along with the `welcomeNoticePending` option; the scenarios that used the dialog as a readiness signal wait for the workspace picker instead. The legacy `settings.yaml` import scenario keeps importing `ui-onboarding.welcomeNoticeVersion`, because that path is about the legacy key mapping into the successor entry, not about the notice.

## Alternatives considered

**Keep the notice and shorten the copy.** Rejected: the friction is the mandatory interstitial itself, and the remaining sentence would still restate the preview status the README already carries.

**Keep the component and register it only when a build flag is set.** Rejected: an unregistered component, its store, its copy module, and its locale keys are maintained code with no reader; the repository's rule is to tie each abstraction to a current consumer.

**Drop the Host config field too.** Rejected: existing profile patches contain `welcomeNoticeVersion`, and a schema that no longer declares it makes stored documents disagree with the running composition. Keeping one volatile declaration costs nothing and preserves them.

## Consequences

The Web UI opens directly on the conversation for every visitor, including first-run browsers with no acknowledgement record; the shell never sets `#root` inert for onboarding. The `settings.onboarding` slot has no shipped occupier, so a future onboarding step registers into a seam that already works but currently renders nothing. Stored `welcomeNoticeVersion` values remain readable and loadable, and no code path writes or reads them. Web e2e coverage for the desktop-takeover path through the composer is unchanged; the dialog-specific assertions in the public-mount, remote-settings, and settings-import scenarios were removed or replaced with an equivalent readiness signal.
