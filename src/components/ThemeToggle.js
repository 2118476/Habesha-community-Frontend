// FILE: src/components/ThemeToggle.js
import React, { useEffect, useState, useCallback } from "react";
import styles from "../stylus/components/ThemeToggle.module.scss";

const readTheme = () => {
  if (typeof window === "undefined") return "light";
  // Prefer the DOM attribute (set by applyTheme from Display settings)
  const dom = document.documentElement.dataset.theme;
  if (dom === "dark" || dom === "light") return dom;
  const saved = localStorage.getItem("ui.theme");
  return saved === "dark" || saved === "light" ? saved : "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  // Sync with external theme changes (e.g. Display settings page)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme;
      if (current === "dark" || current === "light") {
        setTheme((prev) => (prev !== current ? current : prev));
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // When toggled via this button, apply to DOM and persist
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("ui.theme", next); } catch (_) {}
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={styles.toggle}
      type="button"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
