# Agent Note: Keep the HarnessError base in a dependency-free package

Status: implemented

## Problem

The tool registry records a failed result's `error.name` and `error.code` only when the thrown value is `instanceof HarnessError`, so every expected failure must extend the one shared class; copying its `code` field is not enough. The [archived structured-error-taxonomy note](../../archived/architecture/2026-06-11-structured-error-taxonomy.md) placed the base in `nhs-llm` because `nhs-llm` was then a leaf that every package already imported, so the base added no dependency edge.

`nhs-llm` stopped being a leaf. `ImageBlock` references `ImageAttachmentRef` from `nhs-attachment`, and `nhs-llm` depends on `nhs-typert-protocol`. A class in either lower package cannot extend a base defined in `nhs-llm` without a TypeScript project-reference cycle, so `AttachmentError` and `RemoteError` re-implement the `code` field on plain `Error`, and tool failures that carry them persist without structured identity.

## Decision

`HarnessError` lives in `@noharness/error` (`packages/util/error`), a package with no dependencies that contains only the base class. `nhs-llm` depends on it and re-exports the same class from its entry, so existing `import { HarnessError } from '@noharness/llm'` statements keep working and both import paths name one constructor, which keeps `instanceof` checks consistent. LLM-specific failure codes and helpers such as `isHarnessError` stay in `nhs-llm`.

New code imports `HarnessError` from `nhs-error` when the importing package does not otherwise need `nhs-llm`, so a package that needs only the base takes no dependency on the LLM runtime. Packages below `nhs-llm`, such as `nhs-attachment`, can extend the base without a cycle.

## Alternatives considered

**Keep the base in `nhs-llm`.** Lower packages would keep re-implementing the field shape, and the registry would keep dropping their codes; recognizing those shapes structurally in the registry would make it trust any object with a string `code`, including Node errno values.

**Recognize specific classes in the registry.** Matching `RemoteError` or `AttachmentError` by marker would add a dependency from `nhs-tools` to each package and repeat for every new low-level error class.

**Move the base to an existing utility package.** `nhs-util-values` and `nhs-brand` have unrelated roles; a dedicated package names the role and keeps the base free of their dependencies and change history.

**Drop the `nhs-llm` re-export.** Every existing import would have to change in one step without a behavior benefit.

## Consequences

Any package can extend `HarnessError`, including packages that `nhs-llm` depends on, and the base no longer changes with the LLM runtime. The cost is one more published package and one more dependency edge for `nhs-llm`. Two import paths exist for one class; both are supported, and the error-handling rules name `nhs-error` as the home.
