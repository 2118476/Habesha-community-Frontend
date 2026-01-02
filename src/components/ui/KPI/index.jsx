import React from "react";
import styles from "./KPI.module.scss";

export default function KPI({ icon, label, value, delta, positive }) {
  return (
    <div className={styles.kpi} role="group" aria-label={label}>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden>{icon}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.label}>{label}</span>
        <span className={[styles.delta, positive ? styles.up : styles.down].join(" ")}>
          {positive ? "▲" : "▼"} {delta}
        </span>
      </div>
      <div className={styles.spark} aria-hidden />
    </div>
  );
}
