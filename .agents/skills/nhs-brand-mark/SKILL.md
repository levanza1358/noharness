---
name: nhs-brand-mark
description: Design, refine, and review the NoHarness product mark (the cat mascot) and its application icons — favicon, PWA tiles, desktop app icon, tray. Use when drawing or editing the NHS brand mark, when changing files under apps/web/public or apps/desktop/resources, and when reviewing a new mark variant before it lands.
---

# NoHarness brand mark

The product mark is a cat mascot drawn as flat SVG geometry. It replaces the inherited DeepSeek whale; it is a product mark, not a plugin icon, so [plugin artwork](../../../packages/preset/agent-preset/skills/nhs-doc/references/artwork.md) applies only for its drawing and export rules. Obtain designer approval before landing a new mark.

## Rules

- **One subject.** A sitting cat, front view: round head, two ears, chibi proportions, closed friendly face. The silhouette must read as a cat at 16 px without the face detail.
- **Own geometry.** Do not copy, trace, or recolor the DeepSeek whale, nor any third-party illustration (including stock icon references). Reuse only shapes we author.
- **Flat, restrained color.** Flat fills, one outline weight, no gradients, glows, drop shadows, or highlights. The palette lives in `BRAND_GUIDELINES.md` and the mark file; do not introduce a new accent hue per asset.
- **Adaptive tiles.** Tiles keep the mark inside the safe zone a platform mask may crop; the bare mark file (no tile) is the favicon source.
- **Both themes.** Verify the mark on light and dark grounds, on the tile, and at row size before landing.

## Assets

| File | Role |
|---|---|
| `apps/desktop/resources/icon.svg` | app tile; also the raster source |
| `apps/desktop/resources/icon-macos.svg`, `icon-windows.svg` | platform tiles |
| `apps/web/public/favicon.svg`, `favicon-dark.svg` | bare mark, light and dark browser chrome |
| `apps/web/public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | PWA raster set |
| `apps/desktop/resources/tray-windows.ico` | OS tray glyph |

Raster files are generated, never hand-edited: run `pnpm --filter @noharness/web render:app-icons` (see `apps/web/scripts/render-app-icons.ts`) after changing a source SVG, then re-check the PWA manifest sizes in `apps/web/public/manifest.webmanifest`.

## Review

1. Keep candidate variants in a gitignored scratch folder, numbered; keep the numbers through review.
2. Compare the variant against the current mark at 16, 32, 48, 128, and 512 px, on light and dark grounds and inside its tile.
3. Run `pnpm run verify-package-meta` when a package icon is also affected, then build and inspect the real page (`nhs web`) with both themes.
