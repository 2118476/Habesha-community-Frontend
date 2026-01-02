import React from "react";
import styles from "./Table.module.scss";

export default function Table({ columns = [], rows = [], dense }) {
  return (
    <div className={[styles.wrap, dense ? styles.dense : ""].join(" ")} role="region" aria-label="Data table">
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key || c.accessor}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}><em>No data</em></td></tr>
          ) : rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key || c.accessor}>{r[c.accessor]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
