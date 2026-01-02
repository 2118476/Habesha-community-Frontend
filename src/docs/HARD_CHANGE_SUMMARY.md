# HARD CHANGE SUMMARY

This pass applies an opinionated, professional baseline across the entire project.

## Highlights
- Unified design tokens (colors, spacing, radii, shadows, typography) in `stylus/base/_tokens.scss`.
- Strong global baseline in `stylus/base/_globals.scss` (links, inputs, utilities, .surface, spacing).
- Canonical `src/main.scss` rewritten to a single, minimal entry — import once in `src/index.js`.
- Normalized **34** CSS modules to use tokens; enforced a consistent card/box/panel baseline.
- Polished header/footer/page surfaces for a Facebook/Gumtree‑like feel: clean white surfaces, light borders, subtle shadows.
- Purged additional unreferenced styles.

## What to look for during review
- Cards/boxes now look consistent site‑wide (radius, shadow, borders, spacing).
- Backgrounds use `--bg` and surfaces use `--surface-0/1`.
- Inputs/buttons share consistent border radius and focus rings.
- Mobile spacing is more fluid via `clamp()` and utilities.

## If something looks off
- Point me to the page and component file. I will tighten the module styles around the new tokens without touching behavior/JS.
