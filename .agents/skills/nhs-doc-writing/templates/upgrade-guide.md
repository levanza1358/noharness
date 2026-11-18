# Template: upgrade-guide

Use this kind for `docs/upgrade-guide/v<version>/<item>/guide.md` and its Japanese sibling `guide.ja.md`, whose sections are `## 変更` and `## 移行`. The tree has no folder index. [nhs-create-upgrade-guide](../../nhs-create-upgrade-guide/SKILL.md) owns scope, placement, maintenance, and length rules; `pnpm run verify-upgrade-guides` enforces them.

## Frontmatter

```yaml
---
kind: upgrade-guide
description: "The externally perceptible surface that breaks and what replaces it."
---
```

## Skeleton

````markdown
# <Specific break, for example: `--profile` replaces `--preset`>

## Change

State the old and new behavior of the surface and who observes it.

## Migration

1. Name the exact file, key, command, or symbol to change, with a before/after snippet when it is shorter than prose.
2. State how to confirm the migration worked.
````
