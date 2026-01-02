import React from "react";
import { Spinner } from "../Spinner/Spinner";
import { Skeleton } from "../Skeleton";
import styles from "./SectionLoader.module.scss";

export function SectionLoader({ 
  message = "Loading...", 
  className = "",
  ...props 
}) {
  return (
    <div 
      className={`${styles.sectionLoader} ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Spinner size="md" />
      <span className={styles.message}>{message}</span>
    </div>
  );
}

export function CardGridLoader({ 
  count = 6, 
  className = "",
  ...props 
}) {
  return (
    <div 
      className={`${styles.cardGrid} ${className}`}
      role="status"
      aria-label="Loading content"
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.cardSkeleton}>
          <Skeleton h={160} style={{ borderRadius: 'var(--radius-md)' }} />
          <div className={styles.cardContent}>
            <Skeleton h={16} w="80%" />
            <Skeleton h={14} w="60%" />
            <div className={styles.cardMeta}>
              <Skeleton h={12} w="40%" />
              <Skeleton h={12} w="30%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListLoader({ 
  count = 5, 
  showAvatar = false,
  className = "",
  ...props 
}) {
  return (
    <div 
      className={`${styles.listLoader} ${className}`}
      role="status"
      aria-label="Loading list"
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          {showAvatar && (
            <Skeleton 
              w={40} 
              h={40} 
              style={{ borderRadius: '50%', flexShrink: 0 }} 
            />
          )}
          <div className={styles.listContent}>
            <Skeleton h={16} w="70%" />
            <Skeleton h={14} w="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableLoader({ 
  rows = 5, 
  columns = 3,
  className = "",
  ...props 
}) {
  return (
    <div 
      className={`${styles.tableLoader} ${className}`}
      role="status"
      aria-label="Loading table"
      {...props}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className={styles.tableCell}>
              <Skeleton h={14} w={j === 0 ? "80%" : "60%"} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}