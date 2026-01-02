// FILE: src/components/ThemeToggle.jsx
/*
 * This component previously implemented its own theme toggling logic.
 * To consolidate theme handling across the application, it now simply
 * re-exports the canonical ThemeToggle component from `ThemeToggle.js`.
 *
 * Any props passed through will be forwarded to the underlying
 * implementation.  Consumers of this file can continue importing
 * `ThemeToggle` without modification.
 */
import Toggle from "./ThemeToggle.js";

export default function ThemeToggle(props) {
  return <Toggle {...props} />;
}
