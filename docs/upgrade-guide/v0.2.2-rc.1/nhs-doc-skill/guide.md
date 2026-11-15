---
kind: upgrade-guide
description: "Creator mode replaces its four skills with one `nhs-doc` skill, and the repository documentation skill becomes `nhs-doc-writing`."
---

# `nhs-doc` replaces the Creator mode skills

English | [中文](guide.zh.md)

## Change

Creator mode offered four skills from `@noharness/agent-preset`: `cordis-plugin-development`, `editing-cordis-compositions`, `cordis-composition-reference`, and `agent-experience`. It now offers one skill, `nhs-doc`. Its former content is in files that `nhs-doc` reads on demand, under `skills/nhs-doc/references/` and `skills/nhs-doc/templates/` of that package. The old skill names no longer appear in the skill catalog, and loading one by name fails.

In a NHS source checkout, the documentation-writing skill `.agents/skills/nhs-doc` is now `.agents/skills/nhs-doc-writing`, named `nhs-doc-writing`.

This affects Creator mode users whose prompts, saved instructions, or own skills name an old skill, and compositions or scripts that read files at the old paths.

## Migration

1. Replace each old skill name in prompts, instructions, and skills with `nhs-doc`; for the source checkout documentation skill, use `nhs-doc-writing`.
2. Replace file paths under `@noharness/agent-preset/skills/` as follows:

   | Old path | New path |
   |---|---|
   | `cordis-plugin-development/SKILL.md` | `nhs-doc/references/plugin-development.md` |
   | `cordis-plugin-development/references/<file>` | `nhs-doc/references/<file>` |
   | `cordis-plugin-development/templates/<name>/` | `nhs-doc/templates/<name>/` |
   | `editing-cordis-compositions/SKILL.md` | `nhs-doc/references/compositions.md` |
   | `cordis-composition-reference/SKILL.md` | `nhs-doc/references/composition-reference.md` |
   | `cordis-composition-reference/references/packages.md` | `nhs-doc/references/packages.md` |
   | `agent-experience/SKILL.md` | `nhs-doc/references/tool-design.md` |

3. A composition that sets `customSkillDirs` to the package's `skills` directory needs no change.
4. Rename or remove a skill named `nhs-doc` in a project's `.nhs/skills/` or `.agents/skills/`: project skills take precedence and would hide the packaged one. In a NHS source checkout, update the checkout to a revision that contains this change, which renames the repository skill.
5. Start a new Creator mode session with an installation or revision that contains this change, and confirm that the skill catalog lists `nhs-doc` and none of the four skills this package shipped before.
