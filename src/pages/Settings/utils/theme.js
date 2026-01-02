// FILE: src/pages/Settings/utils/theme.js
// src/pages/Settings/utils/theme.js

// Keep a single listener for system dark-mode changes so we can cleanly rebind.
let _themeMql = null;

function setDataAttr(name, value) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;
  if (value == null) delete root.dataset[name];
  else root.dataset[name] = String(value);
}

export function clearSystemThemeListener() {
  if (_themeMql) {
    _themeMql.onchange = null;
    _themeMql = null;
  }
}

/**
 * Apply theme to <html data-theme="...">.
 * Supports LIGHT | DARK | SYSTEM | HIGH_CONTRAST.
 * When SYSTEM, it follows prefers-color-scheme and re-applies on change.
 */
export function applyTheme(theme) {
  if (typeof window === "undefined") return;
  const val = (theme || "SYSTEM").toUpperCase();
  clearSystemThemeListener();

  const setTheme = (t) => {
    // Apply attribute to <html>
    setDataAttr("theme", t);
    // Persist to localStorage for global toggles
    try {
      if (t === null || t === undefined) {
        localStorage.removeItem("ui.theme");
      } else {
        localStorage.setItem("ui.theme", t);
      }
    } catch (_) {
      /* ignore storage issues */
    }
  };

  if (val === "SYSTEM") {
    const mql =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    const dark = !!(mql && mql.matches);
    setTheme(dark ? "dark" : "light");

    if (mql && "onchange" in mql) {
      _themeMql = mql;
      mql.onchange = (e) => setTheme(e.matches ? "dark" : "light");
    }
  } else if (val === "HIGH_CONTRAST") {
    setTheme("high-contrast");
  } else if (val === "DARK" || val === "LIGHT") {
    setTheme(val.toLowerCase());
  } else {
    // Unknown value defaults to light
    setTheme("light");
  }
}

/** Apply density to <html data-density="comfortable|compact"> */
export function applyDensity(density) {
  const v = (density || "COMFORTABLE").toLowerCase();
  setDataAttr("density", v);
}

/** Toggle <html data-reducedMotion> for CSS fallbacks (still respects media query) */
export function applyReducedMotion(enabled) {
  if (enabled) setDataAttr("reducedMotion", "true");
  else setDataAttr("reducedMotion", null);
}

/** Apply font scale to <html data-fontScale="small|default|large"> */
export function applyFontScale(scale) {
  const v = (scale || "DEFAULT").toLowerCase();
  setDataAttr("fontScale", v);
}

/** Convenience: apply all knobs at once (safe for SSR) */
export function applyAll({ theme, density, reducedMotion, fontScale } = {}) {
  applyTheme(theme);
  applyDensity(density);
  applyReducedMotion(!!reducedMotion);
  applyFontScale(fontScale);
}
