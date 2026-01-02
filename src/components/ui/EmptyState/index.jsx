import React from "react";
import styles from "./EmptyState.module.scss";

export default function EmptyState({ title, message, action }) {
  return (
    <div className={styles.empty}>
      <div className={styles.illustration} aria-hidden />
      <h4>{title}</h4>
      <p>{message}</p>
      {action}
    </div>
  );
}
