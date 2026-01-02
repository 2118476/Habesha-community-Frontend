// FILE: src/components/ThemeToggle.js
import React, { useEffect, useState, useCallback } from "react";
import styles from "../stylus/components/ThemeToggle.module.scss";

/*
 * A small button that toggles between light and dark themes.  The
 * current theme is stored in localStorage under the `ui.theme` key
 * and applied to the `<html>` element via the `data-theme` attribute.
 *
 * On mount the component reads the saved value; if none exists it
 * defaults to light.  Optionally, the caller can pass an `onToggle`
 * callback to synchronise their own state with the new theme.  This
 * allows the header to reflect theme changes without duplicating
 * theme logic.
 */
export default function ThemeToggle({ onToggle }) {
  // Keep internal theme state so we can reflect the current state on the button
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("ui.theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  // When the theme state changes, apply it to the document and persist it
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ui.theme", theme);
    } catch (_) {
      /* ignore storage errors */
    }
    if (typeof onToggle === "function") onToggle(theme);
  }, [theme, onToggle]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={styles.toggle}
      type="button"
    >
      {/* Use different emoji glyphs depending on current theme */}
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
