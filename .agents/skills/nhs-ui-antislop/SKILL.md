---
name: nhs-ui-antislop
description: Use before or during any NHS user-visible UI change, and when reviewing a UI diff for generic, machine-generated feel. Enforces the human-feel floor that no lint catches — real content, deliberate density, owned states, and interaction that respects the platform.
---

# UI anti-slop

Generic AI UI has a signature: centered everything, a gradient on the hero, three cards with an emoji, gray text with no hierarchy, empty states that say "Nothing here yet", and a hover effect that ignores touch. Each choice is defensible alone. Together they read as a page no one designed.

Load [nhs-client-ui-ux](../nhs-client-ui-ux/SKILL.md) for the design system rules. This skill is the judgment layer on top: what makes a surface feel owned.

## The tell list

| Tell | Why it reads as generated | Fix |
|---|---|---|
| Placeholder content | "Lorem", "Item 1", "example@example.com" in a shipped state | Real values or a real empty state that says what fills it. |
| Decorative gradients and glow | No information; the default no-decision background | Choose a surface from the system scale. |
| Three identical cards | A grid of equal things is a decision not made | Order by real priority; let one be bigger. |
| Emoji as icons | Inconsistent rendering, wrong weight beside real glyphs | Use the icon set; see the icons reference. |
| Symmetric padding everywhere | Comfortable but undefined; nothing groups | Adjacency means related; space means separation. |
| Every state styled the same | No affordance difference between clickable and static | Hover, active, focus-visible, disabled must differ visibly. |
| Hover-only affordance | Unusable on touch and keyboard | The action is visible, or reachable by focus. |
| Empty state that only says "empty" | Nothing to do next | Say what belongs here and the one action that adds it. |
| Loading spinner on everything | Hides what is known | Placeholder that resolves into the real layout. |
| Fake data density | Fills space, teaches nothing | Show fewer, real things. |
| Copy written by the component | Inconsistent with product voice | Route through the typed locale dictionary; `verify-client-ui-i18n` rejects hardcoded copy. |
| A dialog for one field | Costs a context switch | Inline where possible. |

## Judging density

Density is a decision, not a slider. Pick it from the task:

- **Scanning** (lists, logs, sessions) — dense, tight, aligned columns, truncation with access to the whole value.
- **Deciding** (settings, destructive actions) — comfortable, one decision per region, consequence stated next to the control.
- **Reading** (prose, results) — fixed measure, generous line height, no hard-wrapping of long tokens.

A dense list made comfortable wastes a screen. A decision made dense causes a mistake.

## States you must own

Every surface that fetches, submits, or depends on a selection owes four states — and a fifth for the ones that can fail:

1. **Initial / loading** — resolves into real layout, not a spinner over a blank pane.
2. **Empty** — what belongs here, why it is empty, and the action that fills it.
3. **Populated** — long content, many items, one very long item.
4. **Error** — what failed, whether the data is lost, and the retry.
5. **Narrow / wide** — both sides of the breakpoint, and the constrained container.

If you inspected three and wrote four, the fourth is the one the user will hit.

## Interaction honesty

- The control does what its label says. A button labeled "Save" that also closes, navigates, and syncs is three actions.
- Destructive actions state their consequence in the control, not in a tooltip.
- Nothing moves under the cursor after hover.
- Focus is visible and in document order; the keyboard path matches the visual one.
- Disabled controls say why, or are absent.

## Review questions

1. If this shipped with real data tomorrow, which part would look wrong first?
2. Which element here exists because the layout needed a fourth thing?
3. What does the user see for the first 300 ms, and does it lie?
4. Is any color, size, or radius a value not in the system?
5. Would this survive a screenshot comparison against a mature product's equivalent screen?

Answering these honestly replaces a design review. Claiming "looks good" without opening the page does not count — see the verification floor in [nhs-client-ui-ux](../nhs-client-ui-ux/SKILL.md).
