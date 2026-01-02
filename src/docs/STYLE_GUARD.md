# STYLE GUARD

To keep the codebase clean and conflict‑free:

- Only `src/index.js` may import `./main.scss` (exactly once).
- **Do not** import `tokens.css` anywhere. Tokens are SCSS variables provided via the global entry.
- Prefer CSS Modules for all page/component styles. Avoid global class names (e.g., `.container`, `.card`) in global scope.
- Use the provided CSS variables for colors, spacing, radii and shadows.
- For card‑like UIs use the baseline in your module or extend `.surface` + padding utilities.
- Keep mobile parity in mind; use fluid `clamp()` paddings and font sizes.
