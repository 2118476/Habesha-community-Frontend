import React from "react";
import styles from "./Skeleton.module.scss";

export function Skeleton({ w="100%", h=12, style }) {
  return <div className={styles.skeleton} style={{ width: w, height: h, ...style }} />;
}

export function SkeletonText({ lines=3 }) {
  return (
    <div className={styles.stack}>
      {Array.from({length: lines}).map((_,i)=>(
        <div className={styles.skeleton} key={i} style={{ width: `${90 - i*10}%`, height: 12 }} />
      ))}
    </div>
  );
}
