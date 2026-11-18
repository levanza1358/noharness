# Agent Note: One product version that advances with every shipped change

Status: implemented

## Problem

Desktop artifacts report a version the updater compares with `semver.gt` against the installed copy, and the repository declared `0.2.2-rc.3` while shipping changes that alter the product: the LAN proxy's address format, the removed Web preview notice, and a new Settings action all reached the same version string. Two builds of one declared version cannot be ordered, so a later build either reuses a version the updater treats as equal or has to invent a number nobody recorded.

## Decision

One tracked product version, `nhs` family-wide, advanced in the same change that alters the product, and one untracked build version per packaged artifact.

The product version is what a release publishes: the root manifest and every family member manifest carry it, `pnpm run release:nhs -- <version>` rewrites them together with the lockfile and commits. During the developer preview the release numbers hold and the prerelease identifier increments — `0.2.2-rc.3` → `0.2.2-rc.4` — because a preview line has not earned a patch number it would then have to keep. New product surface starts the next prerelease on new numbers, and `patch` belongs to corrective work on a released line.

The build version identifies one artifact — `0.2.2-rc.4.20261118.1` — and stays out of the manifests so the tracked version describes the product rather than a machine's output. `--build-version auto` derives its date and index from artifacts already recorded.

[development.md](../../../../docs/development.md#application-version) states the rule; [packaging](../../../../apps/desktop/packaging/README.md#release-versions) owns the build-version forms.

## Alternatives considered

**Bump the patch number for every change.** Rejected: `0.2.2-rc.4` → `0.2.3` while the preview line is still open would leave the `0.2.2` prerelease sequence trailing a version that ranks above it, and the updater would refuse to move an installed `0.2.3` build to a `0.2.3-rc.5` fix.

**Let CI derive the product version from commits.** Rejected on the same grounds the release sequences already record: a published version must be readable from the repository, and a derived version cannot be reviewed before it ships.

**Track the build version in the manifests too.** Rejected: it would rewrite every family manifest for each local package and leave the repository dirty after every build, which is the state the build-version input exists to avoid.

## Consequences

Every product change carries a visible version diff, so a built artifact can be traced to the tree that produced it and two artifacts are always orderable. A local package does not dirty the manifests. The cost is one extra command per shipped change, and a repository whose root manifest version no longer derives from any single commit message.

This change advanced the family to `0.2.2-rc.4` and documented the rule; the Desktop build packaged from it reports that product version with its own build-version suffix.
